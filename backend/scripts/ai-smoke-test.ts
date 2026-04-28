/* eslint-disable no-console */
/**
 * AI smoke test against the real OpenAI API.
 *
 * Purpose: verify the LLM-behavior part of our anti-hallucination work
 * — the part unit tests cannot cover. Builds the exact system prompt
 * the orchestrator uses (with TODAY context + CAPABILITIES + few-shot
 * examples) and runs each failure case from Kenta's transcript through
 * gpt-4. Asserts intent, action_required, and the absence of invented
 * specifics.
 *
 * Run from backend/:
 *   npx ts-node -r tsconfig-paths/register scripts/ai-smoke-test.ts
 */
import { getSystemPrompt } from '../src/modules/ai/prompts/system-prompt';
import {
  buildTodayContext,
  defaultTimezoneForLanguage,
} from '../src/common/date-resolver';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  id: string;
  description: string;
  userMessage: string;
  expect: {
    intent?: string | string[];
    actionRequired?: boolean;
    responseTextMustNotContain?: string[];
    responseTextMustContain?: string[];
    extractedDataHas?: string[];
    customCheck?: (parsed: GptResponse) => string | null; // returns null on pass, error string on fail
  };
}

interface GptResponse {
  intent: string;
  extracted_data?: Record<string, unknown>;
  response_text: string;
  action_required: boolean;
  action_type: string;
}

const SUBSCRIBER = {
  language: 'pt-BR',
  ownerName: 'Kenta',
  businessName: 'KT',
  timezone: 'America/Sao_Paulo',
};

const TEST_CASES: TestCase[] = [
  {
    id: '1-hallucination-budget-count',
    description: 'Asking budget count must hit DB, not invent numbers',
    userMessage: 'quantos orçamentos eu gerei essa semana?',
    expect: {
      intent: ['BUDGET_QUERY'],
      actionRequired: true,
      responseTextMustNotContain: [
        'Maria Clara', 'Pedro Henrique', 'Ana Julia',
        'Carlos Eduardo', 'Laura Beatriz', 'Gabriel Lucas',
        'jardim', 'piscina', 'banheiro',
      ],
    },
  },
  {
    id: '2-hallucination-business-info',
    description: 'Asking business info must hit DB, not invent address/email',
    userMessage: 'informações do meu negócio',
    expect: {
      intent: ['PROFILE_QUERY'],
      actionRequired: true,
      responseTextMustNotContain: [
        'kt@exemplo.com', 'janete@kt.com.br',
        'Rua das Flores', 'São Paulo, SP',
        '(11) 1234-5678', '(67) 99999-9999',
        'Localização', // bot used this fake label before
      ],
    },
  },
  {
    id: '3-hallucination-schedule-tuesday',
    description: 'Asking Tuesday schedule must query, not invent meetings',
    userMessage: 'quais compromissos eu tenho na terça feira',
    expect: {
      intent: ['SCHEDULE_QUERY'],
      actionRequired: true,
      responseTextMustNotContain: [
        'equipe de vendas', 'almoço com cliente',
        'conferência online', 'Reunião com a',
      ],
    },
  },
  {
    id: '4-date-math-monday-meeting',
    description: 'Schedule for "segunda feira 9h" must extract date+time',
    userMessage: 'tenho uma reunião com investidores na segunda feira as 9h da manha',
    expect: {
      intent: ['SCHEDULE_CREATE'],
      actionRequired: true,
      extractedDataHas: ['date'],
      customCheck: (p) => {
        const d = p.extracted_data?.date as string | undefined;
        const t = p.extracted_data?.time as string | undefined;
        if (!d) return 'no date in extracted_data';
        // Either a weekday word (server resolves) or ISO date for next Monday (2026-04-27)
        const validDate =
          /segunda/i.test(d) ||
          /^2026-04-27/.test(d) ||
          /27[\/\-]04/.test(d);
        if (!validDate) return `date "${d}" is neither "segunda" nor 2026-04-27`;
        if (!t || !/^0?9/.test(t)) return `time "${t}" is not 09:00`;
        return null;
      },
    },
  },
  {
    id: '5-cannot-send-email',
    description: 'Asking to send by email must politely decline (no email feature)',
    userMessage: 'envie o orçamento para vendas.criativecg@gmail.com',
    expect: {
      responseTextMustNotContain: [
        'Vou enviar', 'enviando', 'enviado para',
        "I'll send", 'sending the', 'sent to',
      ],
      customCheck: (p) => {
        const t = p.response_text.toLowerCase();
        const declines = /ainda não|todavía no|can'?t (yet|do)|não consigo|don't have|no puedo|not (able|available)/i.test(
          t,
        );
        return declines ? null : 'response did not politely decline email feature';
      },
    },
  },
  {
    id: '6-cannot-bulk-delete',
    description: 'Bulk delete must decline (single-record operations only)',
    userMessage: 'exclua todos os orçamentos',
    expect: {
      responseTextMustNotContain: [
        'foram excluídos', 'were deleted', 'cancelando todos',
        'todos foram', 'apaguei todos', 'deleted them all',
      ],
      customCheck: (p) => {
        const t = p.response_text.toLowerCase();
        const declines = /ainda não|todavía no|um por um|one at a time|único|individualmente|um de cada vez|can'?t (do bulk|delete all|cancel all)|não consigo (apagar todos|excluir todos)/i.test(
          t,
        );
        return declines
          ? null
          : 'response did not decline bulk delete (or pretended it succeeded)';
      },
    },
  },
  {
    id: '7-logo-upload-request',
    description: 'User wanting to upload logo must use LOGO_UPLOAD_REQUEST',
    userMessage: 'quero cadastrar a minha logo',
    expect: {
      intent: ['LOGO_UPLOAD_REQUEST'],
    },
  },
  {
    id: '8-language-stickiness',
    description: 'Short "hello" from pt-BR subscriber must NOT switch to English',
    userMessage: 'hello',
    expect: {
      customCheck: (p) => {
        // Should NOT trigger LANGUAGE_CHANGE for a 1-word greeting
        if (p.intent === 'LANGUAGE_CHANGE') {
          return 'classified as LANGUAGE_CHANGE on a 1-word greeting';
        }
        // Response should be in pt-BR — check for common English-only words
        const t = p.response_text.toLowerCase();
        const looksEnglish = /^hello\b|^hi\b|how can i|i can help|what can i/i.test(
          t,
        );
        return looksEnglish ? `response looks English: "${p.response_text}"` : null;
      },
    },
  },
  {
    id: '9-expense-extraction',
    description: 'Expense register must extract amount + category',
    userMessage: 'gastei 150 reais de gasolina',
    expect: {
      intent: ['FINANCE_EXPENSE'],
      actionRequired: true,
      customCheck: (p) => {
        const amt = Number(p.extracted_data?.amount);
        if (amt !== 150) return `amount is ${amt}, expected 150`;
        const cat = String(p.extracted_data?.category ?? '').toLowerCase();
        if (!/(gasolina|combust|fuel|gas)/i.test(cat))
          return `category "${cat}" doesn't look like fuel`;
        return null;
      },
    },
  },
  {
    id: '10-calculator-allowed',
    description: 'Pure calculation question is OK (not hallucination)',
    userMessage: 'quanto fica 200 metros de piso a 24 reais',
    expect: {
      customCheck: (p) => {
        // 200 * 24 = 4800. Bot should compute and answer; intent likely GENERAL_QUERY.
        const t = p.response_text;
        return /4800|4\.800|R\$\s*4[.,]?800/.test(t)
          ? null
          : `response missing 4800: "${t}"`;
      },
    },
  },
  {
    id: '11-bulk-cancel-events',
    description: '"apaga todos os compromissos" must decline (bulk not supported)',
    userMessage: 'apaga todos os compromissos',
    expect: {
      responseTextMustNotContain: [
        'apaguei todos', 'cancelei todos', 'deleted all',
        'cancelando todos', 'foram cancelados',
      ],
      customCheck: (p) => {
        const t = p.response_text.toLowerCase();
        const declines = /ainda não|um por um|um de cada vez|one at a time|individualmente|único|posso cancelar um|não consigo cancelar todos|só consigo cancelar/i.test(
          t,
        );
        return declines
          ? null
          : 'response did not decline bulk cancel';
      },
    },
  },
  {
    id: '12-relative-amanha',
    description: '"amanhã às 13h - consulta médica" must extract date+time correctly',
    userMessage: 'gere uma agenda para amanha 13hs - tenho consulta medica',
    expect: {
      intent: ['SCHEDULE_CREATE'],
      actionRequired: true,
      customCheck: (p) => {
        const d = p.extracted_data?.date as string | undefined;
        const t = p.extracted_data?.time as string | undefined;
        if (!d) return 'no date';
        // Today is 2026-04-26 → tomorrow is 2026-04-27
        const valid =
          /amanh|tomorrow|^2026-04-27/.test(d) || /27[\/\-]04/.test(d);
        if (!valid) return `date "${d}" is neither "amanhã" nor 2026-04-27`;
        if (!t || !/^13/.test(t)) return `time "${t}" is not 13:00`;
        return null;
      },
    },
  },
];

function loadOpenAiKey(): string {
  const envPath = path.join(__dirname, '../../.env.production');
  const txt = fs.readFileSync(envPath, 'utf-8');
  const m = txt.match(/^OPENAI_API_KEY=(.*)$/m);
  if (!m) throw new Error('OPENAI_API_KEY not found in .env.production');
  return m[1].trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOpenAi(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
        max_tokens: 600,
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      return json.choices[0].message.content;
    }

    const txt = await res.text();
    if (res.status === 429) {
      // Parse "Please try again in 8.526s" hint from message; default 20s.
      const m = txt.match(/try again in ([0-9.]+)s/i);
      const waitS = m ? Math.ceil(parseFloat(m[1])) + 2 : 20;
      process.stdout.write(`(429, waiting ${waitS}s) `);
      await sleep(waitS * 1000);
      continue;
    }

    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 300)}`);
  }
  throw new Error('OpenAI 429: gave up after 4 attempts');
}

function parseGpt(raw: string): GptResponse {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in response: ${raw.slice(0, 200)}`);
  return JSON.parse(match[0]) as GptResponse;
}

function evaluate(tc: TestCase, parsed: GptResponse): string[] {
  const failures: string[] = [];

  if (tc.expect.intent !== undefined) {
    const allowed = Array.isArray(tc.expect.intent)
      ? tc.expect.intent
      : [tc.expect.intent];
    if (!allowed.includes(parsed.intent)) {
      failures.push(`intent="${parsed.intent}" not in [${allowed.join(', ')}]`);
    }
  }

  if (tc.expect.actionRequired !== undefined) {
    if (parsed.action_required !== tc.expect.actionRequired) {
      failures.push(
        `action_required=${parsed.action_required}, expected ${tc.expect.actionRequired}`,
      );
    }
  }

  if (tc.expect.responseTextMustNotContain) {
    for (const s of tc.expect.responseTextMustNotContain) {
      if (parsed.response_text.toLowerCase().includes(s.toLowerCase())) {
        failures.push(`response_text contains forbidden "${s}"`);
      }
    }
  }

  if (tc.expect.responseTextMustContain) {
    for (const s of tc.expect.responseTextMustContain) {
      if (!parsed.response_text.toLowerCase().includes(s.toLowerCase())) {
        failures.push(`response_text missing required "${s}"`);
      }
    }
  }

  if (tc.expect.extractedDataHas) {
    for (const k of tc.expect.extractedDataHas) {
      if (!parsed.extracted_data || parsed.extracted_data[k] === undefined) {
        failures.push(`extracted_data missing "${k}"`);
      }
    }
  }

  if (tc.expect.customCheck) {
    const err = tc.expect.customCheck(parsed);
    if (err) failures.push(err);
  }

  return failures;
}

async function main() {
  const apiKey = loadOpenAiKey();
  const today = buildTodayContext(SUBSCRIBER.language, SUBSCRIBER.timezone);
  const systemPrompt = getSystemPrompt({
    language: SUBSCRIBER.language,
    subscriberName: SUBSCRIBER.ownerName,
    businessName: SUBSCRIBER.businessName,
    todayIso: today.iso,
    todayWeekday: today.weekday,
    todayPretty: today.pretty,
    timezone: defaultTimezoneForLanguage(SUBSCRIBER.language),
  });

  console.log(`\nBossZap AI smoke test`);
  console.log(`  TODAY = ${today.iso} (${today.weekday}, ${today.pretty})`);
  console.log(`  TZ    = ${SUBSCRIBER.timezone}`);
  console.log(`  Lang  = ${SUBSCRIBER.language}`);
  console.log(`  Cases = ${TEST_CASES.length}`);
  console.log(`  Model = gpt-4 (production), temp=0\n`);

  let passed = 0;
  let failed = 0;
  const fails: Array<{ tc: TestCase; reasons: string[]; raw: string }> = [];

  for (const tc of TEST_CASES) {
    process.stdout.write(`[${tc.id.padEnd(35)}] `);
    // Tiny inter-call gap to stay under 10k TPM on gpt-4 with ~3k-token
    // prompts. Without this we burn the whole budget in ~3 calls.
    await sleep(15000);
    try {
      const raw = await callOpenAi(apiKey, systemPrompt, tc.userMessage);
      const parsed = parseGpt(raw);
      const failures = evaluate(tc, parsed);
      if (failures.length === 0) {
        console.log(`PASS  intent=${parsed.intent}`);
        passed++;
      } else {
        console.log(`FAIL`);
        for (const f of failures) console.log(`         ↳ ${f}`);
        fails.push({ tc, reasons: failures, raw });
        failed++;
      }
    } catch (err) {
      console.log(`ERROR ${err instanceof Error ? err.message : String(err)}`);
      failed++;
      fails.push({
        tc,
        reasons: [String(err)],
        raw: '',
      });
    }
  }

  console.log(`\n──────── SUMMARY ────────`);
  console.log(`Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`Failed: ${failed}/${TEST_CASES.length}`);

  if (fails.length) {
    console.log(`\n──────── FAILURE DETAIL ────────`);
    for (const f of fails) {
      console.log(`\n• ${f.tc.id}: "${f.tc.userMessage}"`);
      console.log(`  desc: ${f.tc.description}`);
      console.log(`  reasons:`);
      for (const r of f.reasons) console.log(`    - ${r}`);
      if (f.raw) console.log(`  raw: ${f.raw.slice(0, 400)}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
