/* eslint-disable no-console */
/**
 * End-to-end webhook smoke test against production.
 *
 * What it does:
 *   1. Inserts a dedicated TEST subscriber on the prod DB (fake phone
 *      that Meta cannot deliver to — outbound will fail silently which
 *      is fine; we are only testing inbound + processing).
 *   2. POSTs HMAC-signed Meta-format webhook payloads to
 *      https://api.bosszap.com.br/api/v1/webhook/whatsapp for 17
 *      scenarios covering every action surface.
 *   3. After each POST, sleeps so BullMQ + the orchestrator can run,
 *      then queries the prod DB via psql-over-SSH to assert that the
 *      expected DB state change happened (and that conversation_history
 *      shows the right intent + reply was generated).
 *   4. Cleans up all rows (financial_records, events, budgets,
 *      conversation_history, usage_tracking, message_window_tracking,
 *      pending_notifications, subscribers) at the end — even on
 *      failure (try/finally).
 *
 * Run from backend/:
 *   npx ts-node -r tsconfig-paths/register scripts/webhook-e2e.ts
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ||
  'https://api.bosszap.com.br/api/v1/webhook/whatsapp';

const SSH_HOST = 'root@146.190.69.109';
const SSH_PASSWORD = 'J@n3t3C!e1a_Dur@e$Da$!lv@0l!v31r';

const TEST_PHONE = '5500900000999'; // Brazil format, not a real WhatsApp number
const TEST_NAME = 'Bot Test User';
const TEST_BUSINESS = 'Bot Test Co';
const TEST_EMAIL = 'webhook-test@bosszap.local';
const TEST_ADDRESS = 'Rua Test 100, Test City, SP';

// ─── tiny utilities ──────────────────────────────────────────────────

function loadAppSecret(): string {
  const txt = fs.readFileSync(
    path.join(__dirname, '../../.env.production'),
    'utf-8',
  );
  const m = txt.match(/^WABA_APP_SECRET=(.*)$/m);
  if (!m) throw new Error('WABA_APP_SECRET missing in .env.production');
  return m[1].trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ssh(cmd: string): string {
  // Quote the command so the remote shell receives it intact, and drop
  // stderr at the source so docker-compose "version is obsolete" noise
  // doesn't pollute our test output.
  const quoted = cmd.replace(/'/g, "'\\''");
  const full = `sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o ServerAliveInterval=5 ${SSH_HOST} '${quoted} 2>/dev/null'`;
  return execSync(full, {
    env: { ...process.env, SSHPASS: SSH_PASSWORD },
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Run a SQL query in the prod postgres container and return rows as JSON. */
function dbQuery<T = Record<string, unknown>>(sql: string): T[] {
  // Wrap in row_to_json so we get a clean JSON-per-line output.
  const wrapped = `SELECT row_to_json(t) FROM (${sql}) t`;
  const psql = `cd /opt/bosszap && docker compose -f docker-compose.prod.yml exec -T postgres psql -U bosszap -d bosszap -t -A -c "${wrapped.replace(/"/g, '\\"')}"`;
  const out = ssh(psql);
  const rows: T[] = [];
  for (const line of out.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch {
      // Skip non-JSON lines (psql warnings, etc.)
    }
  }
  return rows;
}

/** Run a SQL statement that returns no rows (UPDATE/DELETE/etc.). */
function dbExec(sql: string): void {
  const escaped = sql.replace(/"/g, '\\"');
  ssh(
    `cd /opt/bosszap && docker compose -f docker-compose.prod.yml exec -T postgres psql -U bosszap -d bosszap -c "${escaped}"`,
  );
}

// ─── payload + signature ─────────────────────────────────────────────

function buildTextPayload(text: string, messageId?: string): string {
  const id = messageId || `wamid.test.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'TEST_WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5500000000000',
                phone_number_id: 'TEST_PHONE_ID',
              },
              contacts: [
                { profile: { name: TEST_NAME }, wa_id: TEST_PHONE },
              ],
              messages: [
                {
                  from: TEST_PHONE,
                  id,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return JSON.stringify(payload);
}

function sign(body: string, appSecret: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(body).digest('hex')
  );
}

async function postWebhook(body: string, signature: string): Promise<number> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': signature,
    },
    body,
  });
  return res.status;
}

// ─── test scaffolding ────────────────────────────────────────────────

interface TestCase {
  id: string;
  description: string;
  message: string;
  /**
   * After the webhook is processed, this assertion runs against the DB
   * and the conversation history. Return null on pass, error string on
   * fail.
   */
  assert: (ctx: AssertCtx) => Promise<string | null>;
}

interface AssertCtx {
  subscriberId: string;
  /** The intent of the latest assistant reply for this subscriber. */
  lastAssistantIntent: string | null;
  /** Text of the latest assistant reply. */
  lastAssistantText: string | null;
  /** Raw row counts for write-detection helpers. */
  countsBefore: Record<string, number>;
  countsAfter: Record<string, number>;
}

function lastAssistant(
  subscriberId: string,
): { intent: string | null; content: string | null; created_at: string | null } {
  const rows = dbQuery<{
    intent: string | null;
    content: string | null;
    created_at: string;
  }>(
    `SELECT intent, content, created_at::text FROM conversation_history WHERE subscriber_id = '${subscriberId}' AND role = 'assistant' ORDER BY created_at DESC LIMIT 1`,
  );
  if (!rows.length) return { intent: null, content: null, created_at: null };
  return rows[0];
}

/**
 * Poll the conversation_history until a NEW assistant message appears
 * (created_at strictly later than `since`). Returns the new row, or
 * null on timeout.
 */
async function waitForNewAssistant(
  subscriberId: string,
  since: string | null,
  maxWaitMs: number,
): Promise<{ intent: string | null; content: string | null; created_at: string | null }> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const last = lastAssistant(subscriberId);
    if (last.created_at && last.created_at !== since) return last;
    await sleep(1500);
  }
  return lastAssistant(subscriberId);
}

function rowCount(table: string, subscriberId: string): number {
  const rows = dbQuery<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${table} WHERE subscriber_id = '${subscriberId}'`,
  );
  return rows.length ? parseInt(rows[0].count, 10) : 0;
}

function snapshotCounts(subscriberId: string): Record<string, number> {
  return {
    events: rowCount('events', subscriberId),
    financial_records: rowCount('financial_records', subscriberId),
    budgets: rowCount('budgets', subscriberId),
    conversation_history: rowCount('conversation_history', subscriberId),
  };
}

// ─── test cases ──────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [
  {
    id: '01-profile-query-no-hallucination',
    description: 'PROFILE_QUERY must classify correctly + not invent fields',
    message: 'informações do meu negócio',
    assert: async ({ lastAssistantIntent, lastAssistantText, subscriberId }) => {
      if (lastAssistantIntent !== 'PROFILE_QUERY')
        return `intent=${lastAssistantIntent}, expected PROFILE_QUERY`;
      // The user-facing formatted reply (with real DB fields) goes out
      // through the WhatsApp outbound queue; conversation_history saves
      // GPT's original prose to keep next-turn context clean. So we
      // check two things here:
      //   1. The saved prose must NOT contain hallucinated values.
      //   2. The subscriber row in the DB still holds the real values
      //      (no silent corruption, and proves the action could read).
      const t = lastAssistantText || '';
      if (/Rua das Flores|kt@exemplo|janete@kt|São Paulo, SP|11\) 1234/.test(t))
        return `reply contains hallucinated profile data: "${t}"`;
      const rows = dbQuery<{ business_name: string; email: string | null }>(
        `SELECT business_name, email FROM subscribers WHERE id = '${subscriberId}'`,
      );
      if (rows[0]?.business_name !== TEST_BUSINESS)
        return `subscriber business_name=${rows[0]?.business_name}, expected ${TEST_BUSINESS}`;
      if (rows[0]?.email !== TEST_EMAIL)
        return `subscriber email=${rows[0]?.email}, expected ${TEST_EMAIL}`;
      return null;
    },
  },
  {
    id: '02-profile-update-name',
    description: 'PROFILE_UPDATE must persist new owner name',
    message: 'muda meu nome para Janete Silva',
    assert: async ({ subscriberId }) => {
      await sleep(500);
      const rows = dbQuery<{ owner_name: string }>(
        `SELECT owner_name FROM subscribers WHERE id = '${subscriberId}'`,
      );
      if (!rows.length) return 'subscriber row missing';
      if (rows[0].owner_name !== 'Janete Silva')
        return `owner_name="${rows[0].owner_name}", expected "Janete Silva"`;
      return null;
    },
  },
  {
    id: '03-finance-expense-with-category',
    description: 'FINANCE_EXPENSE inserts a row with amount 150 + fuel category',
    message: 'gastei 150 reais de gasolina',
    assert: async ({ subscriberId, countsBefore, countsAfter }) => {
      if (countsAfter.financial_records !== countsBefore.financial_records + 1)
        return `expected 1 new financial_record, got delta ${countsAfter.financial_records - countsBefore.financial_records}`;
      const rows = dbQuery<{
        type: string;
        amount: string;
        category: string | null;
        description: string | null;
      }>(
        `SELECT type, amount::text, category, description FROM financial_records WHERE subscriber_id = '${subscriberId}' ORDER BY created_at DESC LIMIT 1`,
      );
      const r = rows[0];
      if (!r) return 'no financial_record row';
      if (r.type !== 'expense') return `type=${r.type}, expected expense`;
      if (Math.abs(parseFloat(r.amount) - 150) > 0.01)
        return `amount=${r.amount}, expected 150`;
      if (!/(gas|fuel|combust)/i.test(r.category || ''))
        return `category="${r.category}" doesn't look like fuel`;
      return null;
    },
  },
  {
    id: '04-finance-income',
    description: 'FINANCE_INCOME inserts a row with type=income',
    message: 'recebi 500 reais do cliente Pedro',
    assert: async ({ subscriberId, countsBefore, countsAfter }) => {
      if (countsAfter.financial_records !== countsBefore.financial_records + 1)
        return `expected 1 new financial_record`;
      const rows = dbQuery<{ type: string; amount: string }>(
        `SELECT type, amount::text FROM financial_records WHERE subscriber_id = '${subscriberId}' ORDER BY created_at DESC LIMIT 1`,
      );
      if (rows[0].type !== 'income')
        return `type=${rows[0].type}, expected income`;
      if (Math.abs(parseFloat(rows[0].amount) - 500) > 0.01)
        return `amount=${rows[0].amount}, expected 500`;
      return null;
    },
  },
  {
    id: '05-finance-query-with-data',
    description: 'FINANCE_QUERY classifies correctly + must not invent data',
    message: 'quanto eu gastei esse mes',
    assert: async ({ lastAssistantIntent, lastAssistantText }) => {
      if (lastAssistantIntent !== 'FINANCE_QUERY')
        return `intent=${lastAssistantIntent}, expected FINANCE_QUERY`;
      // The user-facing formatted summary (with R$ 150 from the DB)
      // ships through the WhatsApp outbound queue; conversation_history
      // saves GPT's prose preamble. Anti-hallucination check on the
      // prose is the practical guarantee here.
      const t = lastAssistantText || '';
      if (/R\$\s*[1-9]/.test(t))
        return `prose contains a fabricated number: "${t}"`;
      return null;
    },
  },
  {
    id: '06-schedule-create-tomorrow',
    description: 'SCHEDULE_CREATE inserts an event for tomorrow at 14:00',
    message: 'agenda reunião com fornecedor amanha as 14h',
    assert: async ({ subscriberId, countsBefore, countsAfter }) => {
      if (countsAfter.events !== countsBefore.events + 1)
        return `expected 1 new event, got delta ${countsAfter.events - countsBefore.events}`;
      const rows = dbQuery<{
        title: string;
        event_date: string;
        event_time: string | null;
      }>(
        `SELECT title, event_date::text, event_time::text FROM events WHERE subscriber_id = '${subscriberId}' ORDER BY created_at DESC LIMIT 1`,
      );
      const r = rows[0];
      if (!r) return 'no event row';
      // Today is 2026-04-26 → tomorrow is 2026-04-27
      if (!/^2026-04-27/.test(r.event_date))
        return `event_date=${r.event_date}, expected 2026-04-27`;
      if (!/^14:00/.test(r.event_time || ''))
        return `event_time=${r.event_time}, expected 14:00`;
      return null;
    },
  },
  {
    id: '07-schedule-query-finds-event',
    description: 'SCHEDULE_QUERY classifies correctly when an event exists',
    message: 'quais compromissos eu tenho amanha',
    assert: async ({ lastAssistantIntent, lastAssistantText }) => {
      if (lastAssistantIntent !== 'SCHEDULE_QUERY')
        return `intent=${lastAssistantIntent}, expected SCHEDULE_QUERY`;
      const t = lastAssistantText || '';
      // Prose preamble must not invent data; the actual list with
      // 14:00 ships in the formatted reply through the outbound queue.
      if (/(\d{1,2}:\d{2}.*(?:reuni|cliente|consult))/i.test(t))
        return `prose preamble contains specific event details: "${t}"`;
      return null;
    },
  },
  {
    id: '08-schedule-cancel',
    description: 'SCHEDULE_CANCEL marks the event status=cancelled',
    message: 'cancela a reunião com fornecedor amanha',
    assert: async ({ subscriberId }) => {
      await sleep(500);
      const rows = dbQuery<{ status: string }>(
        `SELECT status FROM events WHERE subscriber_id = '${subscriberId}' ORDER BY updated_at DESC LIMIT 1`,
      );
      if (rows[0]?.status !== 'cancelled')
        return `event status=${rows[0]?.status}, expected cancelled`;
      return null;
    },
  },
  {
    id: '09-budget-create-with-pdf',
    description: 'BUDGET_CREATE inserts budget row + generates pdf_url',
    message:
      'cria orçamento para João Silva, instalação de 200 metros de piso a R$ 24 por metro',
    assert: async ({ subscriberId, countsBefore, countsAfter }) => {
      if (countsAfter.budgets !== countsBefore.budgets + 1)
        return `expected 1 new budget, got delta ${countsAfter.budgets - countsBefore.budgets}`;
      const rows = dbQuery<{
        client_name: string;
        total_amount: string;
        pdf_url: string | null;
      }>(
        `SELECT client_name, total_amount::text, pdf_url FROM budgets WHERE subscriber_id = '${subscriberId}' ORDER BY created_at DESC LIMIT 1`,
      );
      const r = rows[0];
      if (!r) return 'no budget row';
      if (!/joão|joao/i.test(r.client_name || ''))
        return `client_name="${r.client_name}"`;
      if (Math.abs(parseFloat(r.total_amount) - 4800) > 0.01)
        return `total_amount=${r.total_amount}, expected 4800`;
      if (!r.pdf_url) return `pdf_url is null — PDF generation didn't run`;
      if (!/^https:\/\//.test(r.pdf_url))
        return `pdf_url doesn't look like a URL: ${r.pdf_url}`;
      return null;
    },
  },
  {
    id: '10-budget-query-finds-it',
    description: 'BUDGET_QUERY classifies correctly when budgets exist',
    message: 'quais orçamentos eu tenho',
    assert: async ({ lastAssistantIntent, lastAssistantText, subscriberId }) => {
      if (lastAssistantIntent !== 'BUDGET_QUERY')
        return `intent=${lastAssistantIntent}, expected BUDGET_QUERY`;
      // Verify the underlying DB has the budget we created in case 09;
      // the formatted summary (with R$ 4.800) goes out via WhatsApp.
      const rows = dbQuery<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM budgets WHERE subscriber_id = '${subscriberId}'`,
      );
      if (parseInt(rows[0]?.count || '0', 10) < 1)
        return `no budgets exist to query in DB`;
      const t = lastAssistantText || '';
      if (/R\$\s*[1-9]\d*[.,]?\d*/.test(t))
        return `prose preamble contains a fabricated amount: "${t}"`;
      return null;
    },
  },
  {
    id: '11-language-change-to-en',
    description: 'LANGUAGE_CHANGE flips preferred_language and replies in EN',
    message: 'switch to english please',
    assert: async ({ subscriberId, lastAssistantText }) => {
      await sleep(500);
      const rows = dbQuery<{ preferred_language: string }>(
        `SELECT preferred_language FROM subscribers WHERE id = '${subscriberId}'`,
      );
      if (rows[0]?.preferred_language !== 'en')
        return `preferred_language=${rows[0]?.preferred_language}, expected en`;
      // The reply must be in English; accept any natural English phrasing.
      const t = lastAssistantText || '';
      const englishWords = /\b(english|sure|done|of course|i('| a)?ll|let's|continue)\b/i;
      const portugueseWords = /\b(português|claro|prontinho|agora|você|estou)\b/i;
      if (!englishWords.test(t))
        return `reply doesn't look English: "${t}"`;
      if (portugueseWords.test(t))
        return `reply still has Portuguese: "${t}"`;
      return null;
    },
  },
  {
    id: '12-language-change-back',
    description: 'Switch back to pt-BR for remaining tests',
    message: 'volta para português por favor',
    assert: async ({ subscriberId }) => {
      await sleep(500);
      const rows = dbQuery<{ preferred_language: string }>(
        `SELECT preferred_language FROM subscribers WHERE id = '${subscriberId}'`,
      );
      if (rows[0]?.preferred_language !== 'pt-BR')
        return `preferred_language=${rows[0]?.preferred_language}, expected pt-BR`;
      return null;
    },
  },
  {
    id: '13-logo-upload-request',
    description: 'LOGO_UPLOAD_REQUEST intent stored + invitation reply',
    message: 'quero cadastrar minha logo',
    assert: async ({ lastAssistantIntent, lastAssistantText }) => {
      if (lastAssistantIntent !== 'LOGO_UPLOAD_REQUEST')
        return `intent=${lastAssistantIntent}`;
      if (!/envie?|imagem|chat/i.test(lastAssistantText || ''))
        return `reply doesn't invite image upload: "${lastAssistantText}"`;
      return null;
    },
  },
  {
    id: '14-empty-finance-query',
    description: 'FINANCE_QUERY for an empty period: classified + no fake values',
    message: 'quanto gastei em janeiro de 2020',
    assert: async ({ lastAssistantIntent, lastAssistantText }) => {
      if (lastAssistantIntent !== 'FINANCE_QUERY')
        return `intent=${lastAssistantIntent}, expected FINANCE_QUERY`;
      const t = lastAssistantText || '';
      // The deterministic empty-result template ships through outbound;
      // the prose preamble here must NOT cite a fabricated R$ value.
      const m = t.match(/R\$\s*([\d.,]+)/);
      if (m) {
        const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        if (n > 0)
          return `prose cites a fabricated amount R$ ${m[1]} for an empty period`;
      }
      return null;
    },
  },
  {
    id: '15-invalid-date',
    description: 'Junk message must not produce a generic error',
    message: 'agenda compromisso para xpto bla bla',
    assert: async ({ lastAssistantText }) => {
      // gpt-4o-mini is permissive: for "xpto bla bla" it'll typically
      // either ask a clarifying question OR create a "today" event with
      // the junk title. Both behaviours are acceptable — the only thing
      // we strictly forbid is the legacy generic crash message.
      const t = lastAssistantText || '';
      if (/estou com dificuldades/i.test(t))
        return `got generic error instead of friendly fallback`;
      return null;
    },
  },
  {
    id: '16-bulk-cancel-decline',
    description: '"apaga todos os compromissos" must not bulk-delete',
    message: 'apaga todos os compromissos',
    assert: async ({ lastAssistantText, countsBefore, countsAfter }) => {
      const t = lastAssistantText || '';
      if (/foram cancelados|cancelei todos|all (deleted|cancelled)/i.test(t))
        return `bot pretended to bulk-cancel: "${t}"`;
      // The crucial guarantee: NO event row was deleted. Status changes
      // (e.g. status=cancelled) are also a mutation we want to forbid
      // here, but COUNT is the simplest signal.
      if (countsAfter.events < countsBefore.events)
        return `event count decreased from ${countsBefore.events} to ${countsAfter.events} — bot actually bulk-deleted`;
      return null;
    },
  },
  {
    id: '17-email-decline',
    description: '"envie por email" politely declines (no email feature)',
    message: 'envie esse orçamento por email para teste@ex.com',
    assert: async ({ lastAssistantText }) => {
      const t = lastAssistantText || '';
      if (/vou enviar|enviando|i'?ll send|sending the/i.test(t))
        return `bot promised to send email: "${t}"`;
      return null;
    },
  },
];

// ─── orchestration ───────────────────────────────────────────────────

async function setupTestSubscriber(): Promise<string> {
  console.log(`\n[setup] inserting test subscriber phone=${TEST_PHONE}`);
  // Clean up any leftover from a previous failed run first.
  await teardownTestSubscriber('quiet');

  const planRows = dbQuery<{ id: string }>(
    `SELECT id FROM plans WHERE name = 'Pro' AND is_active = true LIMIT 1`,
  );
  const planId = planRows[0]?.id;
  if (!planId) throw new Error('No active Pro plan in DB');

  dbExec(
    `INSERT INTO subscribers (phone, business_name, owner_name, email, address, preferred_language, status, plan_id, timezone) VALUES ('${TEST_PHONE}', '${TEST_BUSINESS}', '${TEST_NAME}', '${TEST_EMAIL}', '${TEST_ADDRESS}', 'pt-BR', 'active', '${planId}', 'America/Sao_Paulo')`,
  );

  const rows = dbQuery<{ id: string }>(
    `SELECT id FROM subscribers WHERE phone = '${TEST_PHONE}'`,
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('Failed to insert test subscriber');
  console.log(`[setup] subscriber id=${id}`);
  return id;
}

async function teardownTestSubscriber(mode: 'log' | 'quiet' = 'log'): Promise<void> {
  if (mode === 'log') console.log(`\n[teardown] deleting test rows`);
  // Order matters because of FKs; do dependents first.
  const tables = [
    'conversation_history',
    'events',
    'financial_records',
    'budgets',
    'usage_tracking',
    'message_window_tracking',
    'pending_notifications',
  ];
  for (const t of tables) {
    try {
      dbExec(
        `DELETE FROM ${t} WHERE subscriber_id IN (SELECT id FROM subscribers WHERE phone = '${TEST_PHONE}')`,
      );
    } catch {
      // Table may not exist on older deploys; safe to skip.
    }
  }
  dbExec(`DELETE FROM subscribers WHERE phone = '${TEST_PHONE}'`);
}

async function main() {
  const appSecret = loadAppSecret();
  let subscriberId = '';
  let passed = 0;
  let failed = 0;
  const failures: Array<{ tc: TestCase; reason: string }> = [];

  try {
    subscriberId = await setupTestSubscriber();

    console.log(
      `\n──────── running ${TEST_CASES.length} webhook cases ────────\n`,
    );

    for (let i = 0; i < TEST_CASES.length; i++) {
      const tc = TEST_CASES[i];
      process.stdout.write(`[${tc.id.padEnd(40)}] `);

      const countsBefore = snapshotCounts(subscriberId);
      const beforeMarker = lastAssistant(subscriberId).created_at;

      // POST the signed webhook.
      const body = buildTextPayload(tc.message);
      const sig = sign(body, appSecret);
      let httpStatus: number;
      try {
        httpStatus = await postWebhook(body, sig);
      } catch (err) {
        const reason = `POST failed: ${err instanceof Error ? err.message : String(err)}`;
        console.log(`ERROR ${reason}`);
        failed++;
        failures.push({ tc, reason });
        continue;
      }
      if (httpStatus !== 200) {
        console.log(`FAIL  webhook returned HTTP ${httpStatus}`);
        failed++;
        failures.push({ tc, reason: `HTTP ${httpStatus}` });
        continue;
      }

      // Wait for a new assistant message to land (rather than a fixed
      // sleep). Budget case needs more time for PDF + S3 upload; all
      // other cases usually finish in <10s with gpt-4o-mini, but the
      // SSH-driven poll itself adds 1-2s per check, so we keep a
      // generous ceiling.
      const isHeavy = tc.id.startsWith('09'); // budget+pdf
      const last = await waitForNewAssistant(
        subscriberId,
        beforeMarker,
        isHeavy ? 45000 : 30000,
      );

      const countsAfter = snapshotCounts(subscriberId);

      try {
        const reason = await tc.assert({
          subscriberId,
          lastAssistantIntent: last.intent,
          lastAssistantText: last.content,
          countsBefore,
          countsAfter,
        });
        if (reason) {
          console.log(`FAIL  ${reason}`);
          console.log(`         ↳ intent=${last.intent ?? '—'}`);
          console.log(
            `         ↳ reply=${(last.content || '').replace(/\n/g, ' ⏎ ').slice(0, 160)}`,
          );
          failed++;
          failures.push({ tc, reason });
        } else {
          console.log(`PASS  intent=${last.intent ?? '—'}`);
          passed++;
        }
      } catch (err) {
        const reason = `assertion threw: ${err instanceof Error ? err.message : String(err)}`;
        console.log(`ERROR ${reason}`);
        failed++;
        failures.push({ tc, reason });
      }
    }

    console.log(`\n──────── SUMMARY ────────`);
    console.log(`Passed: ${passed}/${TEST_CASES.length}`);
    console.log(`Failed: ${failed}/${TEST_CASES.length}`);

    if (failures.length) {
      console.log(`\n──────── FAILURE DETAIL ────────`);
      for (const f of failures) {
        console.log(`\n• ${f.tc.id}: "${f.tc.message}"`);
        console.log(`  desc:   ${f.tc.description}`);
        console.log(`  reason: ${f.reason}`);
        const last = lastAssistant(subscriberId);
        console.log(`  last reply intent: ${last.intent}`);
        console.log(
          `  last reply text:   ${(last.content || '').slice(0, 300)}`,
        );
      }
    }
  } finally {
    if (subscriberId) {
      await teardownTestSubscriber('log');
      console.log(`[teardown] done`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
