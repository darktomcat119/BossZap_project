/**
 * Error taxonomy for AI / orchestrator code paths.
 *
 * - UserInputError: the user said something we couldn't understand
 *   (bad date, missing required field, ambiguous intent). Recoverable
 *   by re-asking — show a friendly localized message that tells them
 *   how to fix the input.
 *
 * - BusinessRuleError: the request was understood but isn't allowed
 *   (record not found, action not supported by current plan, status
 *   conflict). Show a clear localized explanation.
 *
 * - SystemError: infrastructure failed (DB down, OpenAI 5xx, Meta
 *   timeout). Always log full stack, show generic friendly retry
 *   message.
 *
 * The orchestrator catches these and looks up the localized text via
 * `errorMessage()` below.
 */

export type ErrorCode =
  // user input
  | 'INVALID_DATE'
  | 'INVALID_TIME'
  | 'INVALID_AMOUNT'
  | 'MISSING_DESCRIPTION'
  | 'MISSING_REQUIRED_FIELD'
  // business rules
  | 'RECORD_NOT_FOUND'
  | 'NOT_SUPPORTED_YET'
  | 'PERMISSION_DENIED'
  // system
  | 'AI_TIMEOUT'
  | 'AI_PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export class UserInputError extends Error {
  readonly code: ErrorCode;
  readonly hint?: string;

  constructor(code: ErrorCode, message: string, hint?: string) {
    super(message);
    this.name = 'UserInputError';
    this.code = code;
    this.hint = hint;
  }
}

export class BusinessRuleError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = code;
  }
}

export class SystemError extends Error {
  readonly code: ErrorCode;
  readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.cause = cause;
  }
}

const MESSAGES: Record<ErrorCode, Record<string, string>> = {
  INVALID_DATE: {
    'pt-BR':
      'Não consegui entender a data. Pode escrever no formato 28/04/2026, ou dizer "amanhã", "segunda-feira"?',
    es: 'No pude entender la fecha. ¿Puedes escribirla como 28/04/2026 o decir "mañana", "lunes"?',
    en: 'I couldn\'t understand the date. Try a format like 28/04/2026, or say "tomorrow", "Monday".',
  },
  INVALID_TIME: {
    'pt-BR':
      'Não consegui entender o horário. Pode dizer no formato 14:30, "14h", ou "2 da tarde"?',
    es: 'No pude entender la hora. ¿Puedes decir 14:30, "14h" o "2 de la tarde"?',
    en: 'I couldn\'t understand the time. Try 14:30, "2pm", or "2 in the afternoon".',
  },
  INVALID_AMOUNT: {
    'pt-BR':
      'Não consegui entender o valor. Pode dizer quanto foi em reais? Ex: "R$ 150" ou "150 reais".',
    es: 'No pude entender el monto. ¿Cuánto fue? Ej: "$150" o "150 pesos".',
    en: 'I couldn\'t understand the amount. How much was it? E.g. "R$ 150" or "150 reais".',
  },
  MISSING_DESCRIPTION: {
    'pt-BR': 'Pode me dizer o que foi? Por exemplo: "gasolina", "almoço cliente".',
    es: '¿Puedes decirme qué fue? Por ejemplo: "gasolina", "almuerzo cliente".',
    en: 'Can you tell me what it was? E.g. "fuel", "client lunch".',
  },
  MISSING_REQUIRED_FIELD: {
    'pt-BR': 'Falta uma informação importante para completar isso. Pode me passar?',
    es: 'Falta información importante para completar esto. ¿Me la puedes dar?',
    en: 'Some required information is missing. Can you provide it?',
  },
  RECORD_NOT_FOUND: {
    'pt-BR': 'Não encontrei esse registro nos seus dados.',
    es: 'No encontré ese registro en tus datos.',
    en: "I couldn't find that record in your data.",
  },
  NOT_SUPPORTED_YET: {
    'pt-BR':
      'Ainda não consigo fazer isso, mas anotei seu pedido para uma próxima atualização. 🙏',
    es: 'Todavía no puedo hacer eso, pero tomé nota de tu pedido para una próxima actualización. 🙏',
    en: "I can't do that yet, but I've noted your request for a future update. 🙏",
  },
  PERMISSION_DENIED: {
    'pt-BR': 'Esse recurso não está disponível no seu plano atual.',
    es: 'Ese recurso no está disponible en tu plan actual.',
    en: "That feature isn't available on your current plan.",
  },
  AI_TIMEOUT: {
    'pt-BR':
      'Estou um pouco lento agora. Pode tentar de novo em alguns segundos?',
    es: 'Estoy un poco lento ahora. ¿Puedes intentar de nuevo en unos segundos?',
    en: "I'm running a bit slow right now. Can you try again in a few seconds?",
  },
  AI_PARSE_ERROR: {
    'pt-BR':
      'Não entendi muito bem. Pode reescrever de outra forma?',
    es: 'No entendí muy bien. ¿Puedes reescribirlo de otra forma?',
    en: "I didn't quite catch that. Can you rephrase?",
  },
  UNKNOWN_ERROR: {
    'pt-BR':
      'Algo deu errado por aqui. Já anotei e vou resolver. Pode tentar de novo em um instante?',
    es: 'Algo salió mal aquí. Ya lo anoté y lo voy a resolver. ¿Puedes intentar de nuevo?',
    en: "Something went wrong on my side. I've logged it. Can you try again in a moment?",
  },
};

export function errorMessage(code: ErrorCode, language: string): string {
  const lang = language in MESSAGES[code] ? language : 'pt-BR';
  return MESSAGES[code][lang];
}

/**
 * Categorize any caught error into one of our taxonomy types so the
 * orchestrator can decide what to show the user and what to log.
 */
export function categorize(err: unknown): {
  code: ErrorCode;
  type: 'user' | 'business' | 'system';
  hint?: string;
} {
  if (err instanceof UserInputError) {
    return { code: err.code, type: 'user', hint: err.hint };
  }
  if (err instanceof BusinessRuleError) {
    return { code: err.code, type: 'business' };
  }
  if (err instanceof SystemError) {
    return { code: err.code, type: 'system' };
  }
  // NotFound from TypeORM / Nest
  const msg = err instanceof Error ? err.message : String(err);
  if (/not found/i.test(msg)) {
    return { code: 'RECORD_NOT_FOUND', type: 'business' };
  }
  if (/timeout|ETIMEDOUT|ECONNRESET/i.test(msg)) {
    return { code: 'AI_TIMEOUT', type: 'system' };
  }
  return { code: 'UNKNOWN_ERROR', type: 'system' };
}

/**
 * True for transient errors worth one automatic retry before showing the
 * user a failure message (OpenAI 429/5xx, network blips).
 */
export function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /(429|500|502|503|504|timeout|ETIMEDOUT|ECONNRESET|EAI_AGAIN)/i.test(
    msg,
  );
}
