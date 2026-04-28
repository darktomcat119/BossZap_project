/* eslint-disable no-console */
/**
 * Tiny isolated test — one fresh subscriber per message, no shared
 * conversation context. Used to disprove that the multi-turn failures
 * are caused by something in the user message itself (vs. context
 * contamination from prior assistant replies).
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WEBHOOK_URL = 'https://api.bosszap.com.br/api/v1/webhook/whatsapp';
const SSH_HOST = 'root@146.190.69.109';
const SSH_PASSWORD = 'J@n3t3C!e1a_Dur@e$Da$!lv@0l!v31r';

const PROBES = [
  { msg: 'recebi 500 reais do cliente Pedro', expectIntent: 'FINANCE_INCOME' },
  { msg: 'agenda reunião com fornecedor amanha as 14h', expectIntent: 'SCHEDULE_CREATE' },
  { msg: 'cria orçamento para João Silva, 200 metros de piso a R$ 24', expectIntent: 'BUDGET_CREATE' },
  { msg: 'switch to english please', expectIntent: 'LANGUAGE_CHANGE' },
];

function loadAppSecret(): string {
  const txt = fs.readFileSync(path.join(__dirname, '../../.env.production'), 'utf-8');
  const m = txt.match(/^WABA_APP_SECRET=(.*)$/m);
  if (!m) throw new Error('WABA_APP_SECRET missing');
  return m[1].trim();
}

function ssh(cmd: string): string {
  const quoted = cmd.replace(/'/g, "'\\''");
  return execSync(
    `sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 ${SSH_HOST} '${quoted} 2>/dev/null'`,
    { env: { ...process.env, SSHPASS: SSH_PASSWORD }, encoding: 'utf-8', maxBuffer: 8 * 1024 * 1024 },
  );
}

function dbQuery<T = Record<string, unknown>>(sql: string): T[] {
  const wrapped = `SELECT row_to_json(t) FROM (${sql}) t`;
  const out = ssh(
    `cd /opt/bosszap && docker compose -f docker-compose.prod.yml exec -T postgres psql -U bosszap -d bosszap -t -A -c "${wrapped.replace(/"/g, '\\"')}"`,
  );
  return out
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l) as T; } catch { return null as unknown as T; }
    })
    .filter(Boolean);
}

function dbExec(sql: string): void {
  ssh(
    `cd /opt/bosszap && docker compose -f docker-compose.prod.yml exec -T postgres psql -U bosszap -d bosszap -c "${sql.replace(/"/g, '\\"')}"`,
  );
}

function buildPayload(text: string, phone: string): string {
  return JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      id: 'TEST',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '5500000000000', phone_number_id: 'X' },
          contacts: [{ profile: { name: 'Probe' }, wa_id: phone }],
          messages: [{
            from: phone,
            id: `wamid.probe.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
            timestamp: String(Math.floor(Date.now() / 1000)),
            type: 'text',
            text: { body: text },
          }],
        },
      }],
    }],
  });
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

async function probe(msg: string, idx: number, appSecret: string): Promise<{ intent: string | null; reply: string | null }> {
  const phone = `5500999000${String(idx).padStart(3, '0')}`;
  const planRows = dbQuery<{ id: string }>(`SELECT id FROM plans WHERE name='Pro' AND is_active=true LIMIT 1`);
  const planId = planRows[0]?.id;

  // Clean up any leftover then create fresh
  dbExec(`DELETE FROM conversation_history WHERE subscriber_id IN (SELECT id FROM subscribers WHERE phone='${phone}')`);
  dbExec(`DELETE FROM message_window_tracking WHERE subscriber_id IN (SELECT id FROM subscribers WHERE phone='${phone}')`);
  dbExec(`DELETE FROM usage_tracking WHERE subscriber_id IN (SELECT id FROM subscribers WHERE phone='${phone}')`);
  dbExec(`DELETE FROM subscribers WHERE phone='${phone}'`);
  dbExec(`INSERT INTO subscribers (phone, business_name, owner_name, email, address, preferred_language, status, plan_id, timezone) VALUES ('${phone}', 'Probe Co', 'Probe User', 'probe${idx}@test.local', 'Test Addr', 'pt-BR', 'active', '${planId}', 'America/Sao_Paulo')`);

  const body = buildPayload(msg, phone);
  const sig = 'sha256=' + crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hub-signature-256': sig },
    body,
  });
  if (res.status !== 200) throw new Error(`webhook returned ${res.status}`);

  await sleep(20000); // allow GPT call + processing

  const sub = dbQuery<{ id: string }>(`SELECT id FROM subscribers WHERE phone='${phone}'`)[0];
  const lastRows = dbQuery<{ intent: string | null; content: string | null }>(
    `SELECT intent, content FROM conversation_history WHERE subscriber_id='${sub.id}' AND role='assistant' ORDER BY created_at DESC LIMIT 1`,
  );
  const last = lastRows[0] ?? { intent: null, content: null };

  // cleanup
  dbExec(`DELETE FROM financial_records WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM events WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM budgets WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM conversation_history WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM message_window_tracking WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM usage_tracking WHERE subscriber_id='${sub.id}'`);
  dbExec(`DELETE FROM subscribers WHERE id='${sub.id}'`);

  return { intent: last.intent, reply: last.content };
}

async function main() {
  const appSecret = loadAppSecret();
  console.log(`isolated probes — fresh subscriber per message, no context contamination\n`);
  for (let i = 0; i < PROBES.length; i++) {
    const p = PROBES[i];
    process.stdout.write(`[${p.expectIntent.padEnd(20)}] msg="${p.msg}"\n`);
    try {
      const r = await probe(p.msg, i, appSecret);
      const ok = r.intent === p.expectIntent;
      console.log(`   → intent=${r.intent}  ${ok ? '✓ PASS' : '✗ FAIL (expected ' + p.expectIntent + ')'}`);
      console.log(`   → reply: ${(r.reply || '').replace(/\n/g, ' ⏎ ').slice(0, 200)}`);
    } catch (e) {
      console.log(`   → ERROR ${e instanceof Error ? e.message : String(e)}`);
    }
    await sleep(20000); // gap between probes for OpenAI rate limit
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
