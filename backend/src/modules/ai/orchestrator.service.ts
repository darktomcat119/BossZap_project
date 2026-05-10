import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GptService } from './gpt.service';
import { ConversationService } from './conversation.service';
import { IntentClassifierService, Intent } from './intent-classifier.service';
import { OnboardingService } from './onboarding.service';
import { ActionExecutorService } from './action-executor.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { UsageTracking } from '../../database/entities/usage-tracking.entity';
import { getSystemPrompt } from './prompts/system-prompt';
import {
  buildTodayContext,
  defaultTimezoneForLanguage,
} from '../../common/date-resolver';
import {
  errorMessage,
  ErrorCode,
  isTransient,
  categorize,
} from '../../common/ai-errors';

interface ProcessMessageInput {
  subscriberId: string;
  phone: string;
  text: string;
  messageType: string;
  mediaId?: string;
  contactName?: string;
}

interface ProcessMessageResult {
  intent: Intent;
  responseText: string;
  extractedData: Record<string, unknown>;
  actionTaken: string;
  mediaUrl?: string;
  documentUrl?: string;
  documentFilename?: string;
}

interface GptActionResponse {
  intent: string;
  extracted_data: Record<string, unknown>;
  response_text: string;
  action_required: boolean;
  action_type: string;
}

const SUSPENDED_MESSAGES: Record<string, string> = {
  es: 'Tu cuenta está suspendida. Por favor actualiza tu pago para continuar usando BossZap.',
  en: 'Your account is suspended. Please update your payment to continue using BossZap.',
  'pt-BR':
    'Sua conta está suspensa. Por favor atualize seu pagamento para continuar usando o BossZap.',
};

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly gpt: GptService,
    private readonly conversation: ConversationService,
    private readonly intentClassifier: IntentClassifierService,
    private readonly onboarding: OnboardingService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly subscribers: SubscribersService,
    @InjectRepository(UsageTracking)
    private readonly usageRepo: Repository<UsageTracking>,
  ) {}

  async processMessage(
    input: ProcessMessageInput,
  ): Promise<ProcessMessageResult> {
    const { subscriberId, phone, text, contactName } = input;

    try {
      const subscriber = await this.subscribers.findById(subscriberId);
      const language = subscriber.preferred_language || 'pt-BR';
      const timezone =
        (subscriber as unknown as { timezone?: string }).timezone ||
        defaultTimezoneForLanguage(language);

      if (subscriber.status === 'suspended') {
        return {
          intent: 'GENERAL_QUERY',
          responseText: SUSPENDED_MESSAGES[language] || SUSPENDED_MESSAGES.es,
          extractedData: {},
          actionTaken: 'none',
        };
      }

      if (subscriber.status === 'onboarding') {
        const result = await this.onboarding.processOnboarding(
          subscriberId,
          phone,
          text,
          contactName,
        );
        return {
          intent: 'ONBOARDING',
          responseText: result.responseText,
          extractedData: {},
          actionTaken: result.isComplete
            ? 'onboarding_complete'
            : 'onboarding_step',
        };
      }

      const withinLimits = await this.checkUsageLimits(subscriberId);
      if (!withinLimits) {
        return this.limitReachedResponse(language);
      }

      const context = await this.conversation.getContext(subscriberId);

      await this.conversation.saveMessage(subscriberId, 'user', text);

      const today = buildTodayContext(language, timezone);
      const systemPrompt = getSystemPrompt({
        language,
        subscriberName: subscriber.owner_name || '',
        businessName: subscriber.business_name || '',
        todayIso: today.iso,
        todayWeekday: today.weekday,
        todayPretty: today.pretty,
        timezone,
      });

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...context.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: text },
      ];

      const response = await this.callGptWithRetry(messages);
      const parsed = this.parseResponse(response.content);

      // Capture GPT's original natural-language reply BEFORE the
      // orchestrator overrides response_text with a styled emoji
      // template. We persist the original text to conversation_history
      // so the next turn sees prose in GPT's own voice — not an
      // emoji-heavy template (which empirically destabilizes the JSON
      // response on subsequent turns) and not a fabricated [ACTION]
      // marker (which GPT learns to imitate as its own output).
      const gptOriginalReply = parsed.response_text || '';

      // Hard guarantee: GPT must NEVER skip the action layer for an
      // intent that has a real DB side-effect or DB read. Without this,
      // gpt-4o-mini sometimes sets action_required=false on a clear
      // FINANCE_INCOME / SCHEDULE_CREATE / etc., and the user thinks
      // the bot did the thing while nothing landed in the DB.
      if (
        this.isActionableIntent(parsed.intent) &&
        (!parsed.action_required || parsed.action_type === 'none')
      ) {
        this.logger.warn(
          `Forcing action execution for ${parsed.intent} ` +
            `(GPT had set action_required=${parsed.action_required})`,
        );
        parsed.action_required = true;
        parsed.action_type = this.actionTypeFor(parsed.intent);
      }

      // LOGO_UPLOAD_REQUEST is a presentation-only intent — there's no
      // DB write to do, the orchestrator just rewrites the reply to
      // invite the user to send the image directly here. The next image
      // they send will be picked up by the inbound processor as a logo.
      if (parsed.intent === 'LOGO_UPLOAD_REQUEST') {
        parsed.response_text = this.logoUploadInvitation(language);
      }

      // BUDGET_PREVIEW — the user has provided all required budget info.
      // Instead of creating immediately, we store the extracted data as a
      // pending budget and show a server-computed summary asking for
      // confirmation. No DB write happens here; it happens on BUDGET_CREATE.
      if (parsed.intent === 'BUDGET_PREVIEW') {
        const pendingData = parsed.extracted_data || {};
        parsed.response_text = this.formatBudgetPreview(pendingData, language);
        // Persist the extracted data so we can retrieve it when the user
        // confirms. Store it in conversation history metadata with the
        // BUDGET_PREVIEW intent so getLastPendingBudget can find it.
        await this.conversation.saveMessage(
          subscriberId,
          'assistant',
          parsed.response_text,
          'BUDGET_PREVIEW',
          { pending_budget: pendingData },
        );
        await this.incrementUsage(subscriberId);
        return {
          intent: 'BUDGET_PREVIEW' as Intent,
          responseText: parsed.response_text,
          extractedData: pendingData,
          actionTaken: 'none',
        };
      }

      let documentUrl: string | undefined;
      let documentFilename: string | undefined;

      if (parsed.action_required && parsed.action_type !== 'none') {
        // BUDGET_CREATE — retrieve the pending extracted_data from the
        // last BUDGET_PREVIEW so the user's confirmation message ("Sim",
        // "pode", etc.) doesn't need to repeat all budget details.
        // If no pending budget is found (direct creation path), fall
        // through to use whatever GPT extracted from the current turn.
        if (parsed.intent === 'BUDGET_CREATE') {
          const pending = await this.conversation.getLastPendingBudget(
            subscriberId,
          );
          if (pending) {
            parsed.extracted_data = pending;
          }
        }

        const actionResult = await this.actionExecutor.execute(
          subscriberId,
          parsed.intent,
          parsed.extracted_data || {},
          language,
          timezone,
        );

        if (!actionResult.success) {
          // User-input / business errors: tell the user how to fix.
          // System errors: generic friendly retry message + log full stack
          // (already logged inside the executor).
          const code = (actionResult.errorCode as ErrorCode) || 'UNKNOWN_ERROR';
          parsed.response_text = errorMessage(code, language);
        } else if (
          parsed.intent === 'FINANCE_EXPENSE' ||
          parsed.intent === 'FINANCE_INCOME'
        ) {
          const record = (actionResult.data || {}) as Record<string, unknown>;
          parsed.response_text = this.formatFinanceReply(
            parsed.intent,
            record,
            language,
          );
        } else if (parsed.intent === 'BUDGET_CREATE') {
          const data = (actionResult.data || {}) as Record<string, unknown>;
          const url = data.pdf_url as string | undefined;
          if (url) {
            documentUrl = url;
            const docNum =
              (data.document_number as string | undefined) ??
              (data.id as string | undefined)?.substring(0, 8) ??
              'budget';
            documentFilename = `${docNum}.pdf`;
            parsed.response_text = this.budgetCaption(language);
          }
        } else if (parsed.intent === 'SCHEDULE_CREATE') {
          const event = (actionResult.data || {}) as Record<string, unknown>;
          parsed.response_text = this.formatScheduleReply(
            'create',
            event,
            language,
          );
        } else if (parsed.intent === 'SCHEDULE_UPDATE') {
          const event = (actionResult.data || {}) as Record<string, unknown>;
          parsed.response_text = this.formatScheduleReply(
            'update',
            event,
            language,
          );
        } else if (parsed.intent === 'SCHEDULE_CANCEL') {
          const event = (actionResult.data || {}) as Record<string, unknown>;
          parsed.response_text = this.formatScheduleReply(
            'cancel',
            event,
            language,
          );
        } else if (parsed.intent === 'PROFILE_UPDATE') {
          parsed.response_text = this.formatProfileUpdate(
            parsed.extracted_data || {},
            language,
          );
        } else if (parsed.intent === 'PROFILE_QUERY' && actionResult.data) {
          const field = (
            parsed.extracted_data as Record<string, unknown> | undefined
          )?.field as string | undefined;

          if (field === 'logo') {
            if (subscriber.logo_url) {
              (
                parsed as GptActionResponse & { media_url?: string }
              ).media_url = subscriber.logo_url;
              const captions: Record<string, string> = {
                en: 'Here is your logo 👇',
                es: 'Aquí está tu logo 👇',
                'pt-BR': 'Aqui está seu logo 👇',
              };
              parsed.response_text = captions[language] || captions['pt-BR'];
            } else {
              const noLogo: Record<string, string> = {
                en: "You haven't uploaded a logo yet. You can upload one from the app at app.bosszap.com.br.",
                es: 'Todavía no has subido un logo. Puedes subirlo en app.bosszap.com.br.',
                'pt-BR':
                  'Você ainda não enviou um logo. Envie um em app.bosszap.com.br.',
              };
              parsed.response_text = noLogo[language] || noLogo['pt-BR'];
            }
          } else {
            parsed.response_text = this.formatProfileQuery(
              actionResult.data as Record<string, unknown>,
              language,
            );
          }
        } else if (
          parsed.intent === 'PRODUCT_QUERY' &&
          actionResult.data
        ) {
          // Deterministic catalog reply — never hand a single product to
          // the LLM summarizer, because the cost of a hallucinated price
          // is much higher than for a list of records.
          parsed.response_text = this.formatProductQueryReply(
            actionResult.data as Record<string, unknown>,
            language,
          );
        } else if (
          parsed.intent === 'PRODUCT_QUERY' &&
          !actionResult.data
        ) {
          // Catalog miss (executor returned `null`).
          parsed.response_text = this.formatEmptyQueryReply(
            parsed.intent,
            language,
          );
        } else if (this.isQueryIntent(parsed.intent) && actionResult.data) {
          // Empty-result short-circuit: never let the LLM "summarize" an
          // empty row set, because it tends to invent rows to fill the
          // reply. Use a deterministic localized "no records" message.
          if (this.isEmptyQueryResult(actionResult.data)) {
            parsed.response_text = this.formatEmptyQueryReply(
              parsed.intent,
              language,
            );
          } else {
            parsed.response_text = await this.summarizeQueryResult(
              text,
              parsed.intent,
              actionResult.data,
              language,
            );
          }
        } else if (parsed.intent === 'LANGUAGE_CHANGE') {
          const newLang = (
            parsed.extracted_data as Record<string, unknown> | undefined
          )?.language as string | undefined;
          if (newLang && ['en', 'es', 'pt-BR'].includes(newLang)) {
            const confirmations: Record<string, string> = {
              en: "🌐 Done! I'll chat with you in English from now on. 😊",
              es: '🌐 ¡Listo! A partir de ahora hablaré contigo en español. 😊',
              'pt-BR':
                '🌐 Pronto! A partir de agora vou falar com você em português. 😊',
            };
            parsed.response_text = confirmations[newLang];
          }
        }
      }

      // Persist GPT's own original prose reply (captured before the
      // template override). This keeps next-turn context clean and in
      // GPT's natural voice. The user-facing reply goes out through
      // the WhatsApp outbound queue separately, so they still see the
      // styled emoji template.
      const contextText =
        gptOriginalReply.trim() ||
        // For purely server-generated replies (e.g. our deterministic
        // empty-result text or the language switch confirmation) GPT
        // wrote nothing — fall back to the user-facing reply, but
        // strip emojis and collapse whitespace so it stays compact.
        parsed.response_text
          .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240);
      await this.conversation.saveMessage(
        subscriberId,
        'assistant',
        contextText,
        parsed.intent,
      );

      await this.incrementUsage(subscriberId);

      return {
        intent: parsed.intent as Intent,
        responseText: parsed.response_text,
        extractedData: parsed.extracted_data || {},
        actionTaken: parsed.action_type || 'none',
        mediaUrl: (parsed as GptActionResponse & { media_url?: string })
          .media_url,
        documentUrl,
        documentFilename,
      };
    } catch (error) {
      const cat = categorize(error);
      this.logger.error(
        `Error processing message for ${subscriberId} ` +
          `[${cat.code}/${cat.type}]`,
        error instanceof Error ? error.stack : String(error),
      );

      const subscriber = await this.subscribers
        .findById(subscriberId)
        .catch(() => null);
      const lang = subscriber?.preferred_language || 'pt-BR';

      return {
        intent: 'UNKNOWN',
        responseText: errorMessage(cat.code, lang),
        extractedData: {},
        actionTaken: 'error',
      };
    }
  }

  private isQueryIntent(intent: string): boolean {
    return (
      intent === 'SCHEDULE_QUERY' ||
      intent === 'FINANCE_QUERY' ||
      intent === 'BUDGET_QUERY' ||
      intent === 'PRODUCT_QUERY' ||
      intent === 'PROFILE_QUERY'
    );
  }

  /**
   * Any intent that needs the server to actually do something — read
   * from the DB, write to the DB, or change subscriber state. We force
   * action_required=true for these so a lazy GPT response (e.g.
   * "Registrando..." with action_required=false) can't make the user
   * believe the bot did something it didn't.
   * BUDGET_PREVIEW is intentionally excluded: it has no DB write and its
   * flow is handled before the action executor is called.
   */
  private isActionableIntent(intent: string): boolean {
    return (
      this.isQueryIntent(intent) ||
      intent === 'SCHEDULE_CREATE' ||
      intent === 'SCHEDULE_UPDATE' ||
      intent === 'SCHEDULE_CANCEL' ||
      intent === 'FINANCE_INCOME' ||
      intent === 'FINANCE_EXPENSE' ||
      intent === 'BUDGET_CREATE' ||
      intent === 'PROFILE_UPDATE' ||
      intent === 'LANGUAGE_CHANGE'
    );
  }

  private actionTypeFor(intent: string): string {
    if (this.isQueryIntent(intent)) return 'query_data';
    if (intent === 'SCHEDULE_CREATE' || intent === 'SCHEDULE_UPDATE')
      return 'create_event';
    if (intent === 'SCHEDULE_CANCEL') return 'create_event';
    if (intent === 'FINANCE_INCOME') return 'register_income';
    if (intent === 'FINANCE_EXPENSE') return 'register_expense';
    if (intent === 'BUDGET_CREATE') return 'create_budget';
    if (intent === 'PROFILE_UPDATE') return 'update_profile';
    if (intent === 'LANGUAGE_CHANGE') return 'change_language';
    return 'none';
  }

  /**
   * Wrap GptService.chatWithRetry with one extra retry that only fires
   * for transient failures (429, 5xx, timeouts). Network blips at the
   * model provider should not surface as user-visible errors when a
   * second attempt succeeds.
   */
  private async callGptWithRetry(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<{ content: string }> {
    try {
      return await this.gpt.chatWithRetry(messages);
    } catch (err) {
      if (!isTransient(err)) throw err;
      this.logger.warn(
        `Transient GPT error, retrying once: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
      return this.gpt.chatWithRetry(messages);
    }
  }

  /**
   * Detect "no rows" across the various analytics result shapes so we
   * can short-circuit the LLM summarizer with a clean localized reply
   * instead of letting it hallucinate rows to fill space.
   */
  private isEmptyQueryResult(data: unknown): boolean {
    if (data === null || data === undefined) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;

    // analytics.handleQuery wraps results in { type, data, summary }
    const inner = (d.data ?? d) as Record<string, unknown> | unknown;
    if (Array.isArray(inner)) return inner.length === 0;
    if (inner && typeof inner === 'object') {
      const i = inner as Record<string, unknown>;
      if (Array.isArray(i.records)) return i.records.length === 0;
      if (Array.isArray(i.budgets)) return i.budgets.length === 0;
      if (Array.isArray(i.events)) return i.events.length === 0;
      if (typeof i.count === 'number' && i.count === 0) {
        // Finance summary with non-zero totals is still meaningful — only
        // bail out if every numeric field is zero.
        const numericFields = [
          'total_income',
          'total_expense',
          'net',
          'total',
        ];
        const allZero = numericFields.every(
          (k) => i[k] === undefined || Number(i[k]) === 0,
        );
        if (allZero) return true;
      }
    }
    return false;
  }

  private formatEmptyQueryReply(intent: string, language: string): string {
    const messages: Record<string, Record<string, string>> = {
      SCHEDULE_QUERY: {
        'pt-BR':
          '📅 Você não tem nenhum compromisso para esse período.\n\nQuer agendar algum agora? 😊',
        es: '📅 No tienes ninguna cita en ese período.\n\n¿Quieres agendar una ahora? 😊',
        en: "📅 You don't have any appointments for that period.\n\nWant to schedule one now? 😊",
      },
      FINANCE_QUERY: {
        'pt-BR':
          '💰 Não encontrei nenhum registro financeiro para esse período.\n\nQuer registrar uma entrada ou despesa agora? 😊',
        es: '💰 No encontré ningún registro financiero en ese período.\n\n¿Quieres registrar un ingreso o gasto? 😊',
        en: "💰 I didn't find any financial records for that period.\n\nWant to register an income or expense now? 😊",
      },
      BUDGET_QUERY: {
        'pt-BR':
          '📋 Você ainda não tem orçamentos cadastrados.\n\nÉ só me pedir e eu monto um pra você! 😊',
        es: '📋 Aún no tienes presupuestos registrados.\n\nSolo dime y te armo uno. 😊',
        en: "📋 You don't have any budgets yet.\n\nJust ask and I'll create one for you! 😊",
      },
      PRODUCT_QUERY: {
        'pt-BR':
          '🔎 Não encontrei esse item no seu catálogo.\n\nVocê pode cadastrar pelo painel em app.bosszap.com.br ou me dizer o preço que quer praticar. 😊',
        es: '🔎 No encontré ese ítem en tu catálogo.\n\nPuedes agregarlo desde app.bosszap.com.br o dime el precio que quieres usar. 😊',
        en: "🔎 I couldn't find that item in your catalog.\n\nYou can add it at app.bosszap.com.br or tell me the price you want to use. 😊",
      },
    };
    const byIntent = messages[intent] || messages.SCHEDULE_QUERY;
    return byIntent[language] || byIntent['pt-BR'];
  }

  /**
   * Server-rendered reply for a single catalog hit. We never pass the
   * product to the LLM summarizer because a hallucinated price is far
   * worse than for, say, a list of past records.
   */
  private formatProductQueryReply(
    product: Record<string, unknown>,
    language: string,
  ): string {
    const name = (product.name as string | undefined) ?? '—';
    const rawPrice = Number(product.price ?? 0);
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(isFinite(rawPrice) ? rawPrice : 0);
    const unit = (product.unit as string | undefined) ?? 'un';
    const stock = product.stock as number | null | undefined;
    const type = (product.type as string | undefined) ?? 'product';

    if (language === 'es') {
      const stockLine =
        type === 'product' && stock != null
          ? `\n📦 Stock: ${stock} ${unit}`
          : '';
      return (
        `🔎 ${name}\n\n` +
        `💰 Precio: ${price} / ${unit}` +
        stockLine +
        `\n\n¿Quieres agregarlo a un presupuesto? 😊`
      );
    }
    if (language === 'en') {
      const stockLine =
        type === 'product' && stock != null
          ? `\n📦 Stock: ${stock} ${unit}`
          : '';
      return (
        `🔎 ${name}\n\n` +
        `💰 Price: ${price} / ${unit}` +
        stockLine +
        `\n\nWant me to add it to a quote? 😊`
      );
    }

    const stockLine =
      type === 'product' && stock != null
        ? `\n📦 Estoque: ${stock} ${unit}`
        : '';
    return (
      `🔎 ${name}\n\n` +
      `💰 Preço: ${price} / ${unit}` +
      stockLine +
      `\n\nQuer que eu inclua em um orçamento? 😊`
    );
  }

  private formatFinanceReply(
    intent: 'FINANCE_INCOME' | 'FINANCE_EXPENSE',
    record: Record<string, unknown>,
    language: string,
  ): string {
    const isIncome = intent === 'FINANCE_INCOME';
    const description =
      (record.description as string | null | undefined) ?? '—';
    const category = this.categoryDisplayName(
      record.category as string | null | undefined,
      language,
    );
    const rawAmount = Number(record.amount ?? 0);
    const amount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(isFinite(rawAmount) ? rawAmount : 0);
    const date = this.formatDateBR(record.record_date as string | undefined);

    if (language === 'es') {
      return (
        `📝 Resumen del Registro:\n\n` +
        `🛍️ Descripción: ${description}\n` +
        `💰 Monto: ${amount}\n` +
        `📂 ${isIncome ? 'Ingresos' : 'Gastos'}: ${category}\n` +
        `🗓️ Fecha: ${date}\n\n` +
        `✅ Estado: ${isIncome ? 'Recibido' : 'Pagado'}\n\n` +
        `¡Si necesitas algo más, solo llámame! 😄📈`
      );
    }
    if (language === 'en') {
      return (
        `📝 Record Summary:\n\n` +
        `🛍️ Description: ${description}\n` +
        `💰 Amount: ${amount}\n` +
        `📂 ${isIncome ? 'Income' : 'Expenses'}: ${category}\n` +
        `🗓️ Date: ${date}\n\n` +
        `✅ Status: ${isIncome ? 'Received' : 'Paid'}\n\n` +
        `Just call me if you need anything else! 😄📈`
      );
    }
    // pt-BR (default)
    return (
      `📝 Resumo do Registro:\n\n` +
      `🛍️ Descrição: ${description}\n` +
      `💰 Valor: ${amount}\n` +
      `📂 ${isIncome ? 'Receitas' : 'Despesas'}: ${category}\n` +
      `🗓️ Data: ${date}\n\n` +
      `✅ Status: ${isIncome ? 'Recebido' : 'Pago'}\n\n` +
      `Se precisar de algo a mais é só me chamar! 😄📈`
    );
  }

  private budgetCaption(language: string): string {
    if (language === 'es') return 'Aquí está tu presupuesto 👇';
    if (language === 'en') return 'Here is your budget 👇';
    return 'Aqui está seu orçamento 👇';
  }

  private logoUploadInvitation(language: string): string {
    if (language === 'es') {
      return '🖼️ ¡Perfecto! Solo envíame la imagen de tu logo aquí mismo en el chat. 😊';
    }
    if (language === 'en') {
      return "🖼️ Great! Just send me the logo image right here in the chat. 😊";
    }
    return '🖼️ Beleza! É só me enviar a imagem da sua logo aqui mesmo no chat. 😊';
  }

  private formatDateBR(raw: string | undefined): string {
    if (!raw) return new Date().toLocaleDateString('pt-BR');
    const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return raw;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  private formatTime(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const m = String(raw).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return raw;
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  }

  private formatScheduleReply(
    kind: 'create' | 'update' | 'cancel',
    event: Record<string, unknown>,
    language: string,
  ): string {
    const title = (event.title as string | undefined) ?? '—';
    const date = this.formatDateBR(event.event_date as string | undefined);
    const time = this.formatTime(event.event_time as string | null | undefined);
    const location = event.location as string | null | undefined;
    const description = event.description as string | null | undefined;

    const labels: Record<string, Record<string, string>> = {
      'pt-BR': {
        createHeader: '📅 Compromisso Agendado!',
        updateHeader: '✏️ Compromisso Atualizado',
        cancelHeader: '❌ Compromisso Cancelado',
        title: 'Título',
        date: 'Data',
        time: 'Hora',
        location: 'Local',
        description: 'Descrição',
        status: 'Status',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        closingChange: 'Se precisar mudar algo, é só me avisar! 😊',
        closingReschedule: 'Se precisar reagendar, é só me chamar! 😊',
      },
      es: {
        createHeader: '📅 ¡Cita Agendada!',
        updateHeader: '✏️ Cita Actualizada',
        cancelHeader: '❌ Cita Cancelada',
        title: 'Título',
        date: 'Fecha',
        time: 'Hora',
        location: 'Lugar',
        description: 'Descripción',
        status: 'Estado',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        closingChange: 'Si necesitas cambiar algo, ¡avísame! 😊',
        closingReschedule: 'Si necesitas reagendar, ¡llámame! 😊',
      },
      en: {
        createHeader: '📅 Appointment Scheduled!',
        updateHeader: '✏️ Appointment Updated',
        cancelHeader: '❌ Appointment Cancelled',
        title: 'Title',
        date: 'Date',
        time: 'Time',
        location: 'Location',
        description: 'Description',
        status: 'Status',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        closingChange: 'Just let me know if you need to change anything! 😊',
        closingReschedule: 'Just let me know if you need to reschedule! 😊',
      },
    };
    const L = labels[language] || labels['pt-BR'];

    if (kind === 'cancel') {
      const dateLine = time ? `🗓️ ${date} ${time}` : `🗓️ ${date}`;
      return (
        `${L.cancelHeader}\n\n` +
        `🎯 ${title}\n` +
        `${dateLine}\n\n` +
        `${L.closingReschedule}`
      );
    }

    const header = kind === 'create' ? L.createHeader : L.updateHeader;
    const lines = [
      `${header}`,
      ``,
      `🎯 ${L.title}: ${title}`,
      `🗓️ ${L.date}: ${date}`,
    ];
    if (time) lines.push(`🕒 ${L.time}: ${time}`);
    if (location) lines.push(`📍 ${L.location}: ${location}`);
    if (description) lines.push(`📝 ${L.description}: ${description}`);
    lines.push(``, `✅ ${L.status}: ${L.confirmed}`, ``, L.closingChange);
    return lines.join('\n');
  }

  private formatProfileQuery(
    data: Record<string, unknown>,
    language: string,
  ): string {
    // queryProfile may return the full object or {field, value}.
    if ('field' in data && 'value' in data) {
      return this.formatProfileSingleField(
        data.field as string,
        data.value,
        language,
      );
    }

    const labels: Record<string, Record<string, string>> = {
      'pt-BR': {
        header: '👤 Seu Perfil',
        business_name: '🏢 Empresa',
        owner_name: '👤 Nome',
        email: '📧 E-mail',
        phone: '📱 Telefone',
        address: '📍 Endereço',
        preferred_language: '🌐 Idioma',
        plan: '💎 Plano',
        status: '🔄 Status',
        closing: 'Se precisar atualizar algo, é só me avisar! 😊',
      },
      es: {
        header: '👤 Tu Perfil',
        business_name: '🏢 Empresa',
        owner_name: '👤 Nombre',
        email: '📧 Correo',
        phone: '📱 Teléfono',
        address: '📍 Dirección',
        preferred_language: '🌐 Idioma',
        plan: '💎 Plan',
        status: '🔄 Estado',
        closing: 'Si necesitas actualizar algo, ¡avísame! 😊',
      },
      en: {
        header: '👤 Your Profile',
        business_name: '🏢 Business',
        owner_name: '👤 Name',
        email: '📧 Email',
        phone: '📱 Phone',
        address: '📍 Address',
        preferred_language: '🌐 Language',
        plan: '💎 Plan',
        status: '🔄 Status',
        closing: 'Just let me know if you need to update anything! 😊',
      },
    };
    const L = labels[language] || labels['pt-BR'];

    const order: Array<keyof typeof L> = [
      'business_name',
      'owner_name',
      'email',
      'phone',
      'address',
      'preferred_language',
      'plan',
      'status',
    ];
    const lines = [`${L.header}`, ``];
    for (const k of order) {
      const v = data[k as string];
      if (v === null || v === undefined || v === '') continue;
      const display =
        k === 'preferred_language'
          ? this.languageDisplayName(String(v), language)
          : k === 'status'
            ? this.statusDisplayName(String(v), language)
            : String(v);
      lines.push(`${L[k]}: ${display}`);
    }
    lines.push(``, L.closing);
    return lines.join('\n');
  }

  private formatProfileSingleField(
    field: string,
    value: unknown,
    language: string,
  ): string {
    const map: Record<string, Record<string, string>> = {
      'pt-BR': {
        business_name: '🏢 Sua empresa: ',
        owner_name: '👤 Seu nome: ',
        email: '📧 Seu e-mail: ',
        phone: '📱 Seu telefone: ',
        address: '📍 Seu endereço: ',
        plan: '💎 Seu plano: ',
        status: '🔄 Seu status: ',
        preferred_language: '🌐 Seu idioma: ',
      },
      es: {
        business_name: '🏢 Tu empresa: ',
        owner_name: '👤 Tu nombre: ',
        email: '📧 Tu correo: ',
        phone: '📱 Tu teléfono: ',
        address: '📍 Tu dirección: ',
        plan: '💎 Tu plan: ',
        status: '🔄 Tu estado: ',
        preferred_language: '🌐 Tu idioma: ',
      },
      en: {
        business_name: '🏢 Your business: ',
        owner_name: '👤 Your name: ',
        email: '📧 Your email: ',
        phone: '📱 Your phone: ',
        address: '📍 Your address: ',
        plan: '💎 Your plan: ',
        status: '🔄 Your status: ',
        preferred_language: '🌐 Your language: ',
      },
    };
    const labelMap = map[language] || map['pt-BR'];
    const prefix = labelMap[field] || `${field}: `;
    let display: string;
    if (value === null || value === undefined || value === '') {
      display =
        language === 'es' ? 'no definido' : language === 'en' ? 'not set' : 'não definido';
    } else if (field === 'preferred_language') {
      display = this.languageDisplayName(String(value), language);
    } else if (field === 'status') {
      display = this.statusDisplayName(String(value), language);
    } else {
      display = String(value);
    }
    return `${prefix}${display}`;
  }

  private formatProfileUpdate(
    extracted: Record<string, unknown>,
    language: string,
  ): string {
    const labels: Record<string, Record<string, string>> = {
      'pt-BR': {
        header: '✅ Pronto! Atualizei seu perfil:',
        business_name: '🏢 Empresa',
        owner_name: '👤 Nome',
        email: '📧 E-mail',
        address: '📍 Endereço',
        closing: 'Se precisar mudar mais alguma coisa, é só me avisar! 😊',
      },
      es: {
        header: '✅ ¡Listo! Actualicé tu perfil:',
        business_name: '🏢 Empresa',
        owner_name: '👤 Nombre',
        email: '📧 Correo',
        address: '📍 Dirección',
        closing: 'Si necesitas cambiar algo más, ¡avísame! 😊',
      },
      en: {
        header: '✅ Done! Your profile is updated:',
        business_name: '🏢 Business',
        owner_name: '👤 Name',
        email: '📧 Email',
        address: '📍 Address',
        closing: 'Just let me know if you want to change anything else! 😊',
      },
    };
    const L = labels[language] || labels['pt-BR'];
    const fields = ['business_name', 'owner_name', 'email', 'address'];
    const lines = [L.header, ``];
    let any = false;
    for (const f of fields) {
      const v = extracted[f];
      if (v === undefined || v === null || v === '') continue;
      lines.push(`${L[f]}: ${String(v)}`);
      any = true;
    }
    if (!any) return L.header + '\n\n' + L.closing;
    lines.push(``, L.closing);
    return lines.join('\n');
  }

  private languageDisplayName(code: string, viewerLang: string): string {
    const names: Record<string, Record<string, string>> = {
      'pt-BR': {
        'pt-BR': 'Português',
        es: 'Espanhol',
        en: 'Inglês',
      },
      es: {
        'pt-BR': 'Portugués',
        es: 'Español',
        en: 'Inglés',
      },
      en: {
        'pt-BR': 'Portuguese',
        es: 'Spanish',
        en: 'English',
      },
    };
    return names[viewerLang]?.[code] || code;
  }

  /**
   * Localize finance category names that the AI extracts in any of the
   * three languages (or just bare keywords like "other"/"fuel") into a
   * pretty label in the subscriber's language. Unknown categories fall
   * through to a Title-Case version of the input so we never show "other"
   * when the user reads pt-BR.
   */
  private categoryDisplayName(
    category: string | null | undefined,
    viewerLang: string,
  ): string {
    if (!category) {
      return viewerLang === 'es'
        ? 'Otros'
        : viewerLang === 'en'
          ? 'Other'
          : 'Outros';
    }

    // Map every input variant (en/es/pt + lower/no-accent) to a canonical
    // key. Then look up the localized display per viewer language.
    const key = category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();

    const normalize: Record<string, string> = {
      // other
      other: 'other', others: 'other', outros: 'other', outro: 'other',
      otros: 'other', otro: 'other',
      // fuel
      fuel: 'fuel', combustivel: 'fuel', combustible: 'fuel',
      gasolina: 'fuel', gas: 'fuel', diesel: 'fuel', etanol: 'fuel',
      // food
      food: 'food', alimentacao: 'food', alimentos: 'food',
      comida: 'food', refeicao: 'food', marmita: 'food',
      almoco: 'food', jantar: 'food', cafe: 'food',
      // office
      office: 'office', escritorio: 'office', oficina: 'office',
      papelaria: 'office', papeleria: 'office',
      // supplies / materials
      supplies: 'supplies', materiais: 'supplies', material: 'supplies',
      suministros: 'supplies', materiales: 'supplies',
      parafusos: 'supplies', ferramentas: 'supplies',
      // transport
      transport: 'transport', transporte: 'transport',
      uber: 'transport', taxi: 'transport', onibus: 'transport',
      // salary
      salary: 'salary', salario: 'salary', salarios: 'salary',
      sueldo: 'salary', sueldos: 'salary',
      pagamento: 'salary', folha: 'salary',
      // marketing
      marketing: 'marketing', publicidade: 'marketing',
      anuncio: 'marketing', publicidad: 'marketing',
      ads: 'marketing',
      // rent
      rent: 'rent', aluguel: 'rent', alquiler: 'rent',
      // utilities
      utilities: 'utilities', servicos: 'utilities',
      servicios: 'utilities', conta: 'utilities', contas: 'utilities',
      luz: 'utilities', agua: 'utilities', internet: 'utilities',
      telefone: 'utilities',
      // taxes
      tax: 'taxes', taxes: 'taxes', imposto: 'taxes', impostos: 'taxes',
      impuesto: 'taxes', impuestos: 'taxes',
      // sales / income
      sale: 'sale', sales: 'sale', venda: 'sale', vendas: 'sale',
      venta: 'sale', ventas: 'sale',
      service: 'service', services: 'service', servico: 'service',
    };

    const canonical = normalize[key];

    const labels: Record<string, Record<string, string>> = {
      'pt-BR': {
        other: 'Outros',
        fuel: 'Combustível',
        food: 'Alimentação',
        office: 'Escritório',
        supplies: 'Materiais',
        transport: 'Transporte',
        salary: 'Salários',
        marketing: 'Marketing',
        rent: 'Aluguel',
        utilities: 'Serviços',
        taxes: 'Impostos',
        sale: 'Vendas',
        service: 'Serviços',
      },
      es: {
        other: 'Otros',
        fuel: 'Combustible',
        food: 'Alimentos',
        office: 'Oficina',
        supplies: 'Suministros',
        transport: 'Transporte',
        salary: 'Sueldos',
        marketing: 'Marketing',
        rent: 'Alquiler',
        utilities: 'Servicios',
        taxes: 'Impuestos',
        sale: 'Ventas',
        service: 'Servicios',
      },
      en: {
        other: 'Other',
        fuel: 'Fuel',
        food: 'Food',
        office: 'Office',
        supplies: 'Supplies',
        transport: 'Transport',
        salary: 'Salaries',
        marketing: 'Marketing',
        rent: 'Rent',
        utilities: 'Utilities',
        taxes: 'Taxes',
        sale: 'Sales',
        service: 'Services',
      },
    };

    if (canonical) {
      const map = labels[viewerLang] || labels['pt-BR'];
      return map[canonical] || this.titleCase(category);
    }
    // Unknown category: show what the user wrote, but Title-Cased so it
    // never reads as raw GPT output ("comida rapida" → "Comida Rapida").
    return this.titleCase(category);
  }

  private titleCase(s: string): string {
    return s
      .trim()
      .split(/\s+/)
      .map((w) =>
        w.length === 0 ? w : w[0].toLocaleUpperCase() + w.slice(1).toLocaleLowerCase(),
      )
      .join(' ');
  }

  private statusDisplayName(status: string, viewerLang: string): string {
    const names: Record<string, Record<string, string>> = {
      'pt-BR': {
        active: 'Ativo',
        suspended: 'Suspenso',
        onboarding: 'Em integração',
        trial: 'Em teste',
      },
      es: {
        active: 'Activo',
        suspended: 'Suspendido',
        onboarding: 'En integración',
        trial: 'En prueba',
      },
      en: {
        active: 'Active',
        suspended: 'Suspended',
        onboarding: 'Onboarding',
        trial: 'Trial',
      },
    };
    return names[viewerLang]?.[status] || status;
  }

  /**
   * Second LLM turn: given the user's question and the tool result,
   * generate a concise natural-language WhatsApp reply in the right
   * language. Falls back to a simple summary if the LLM call fails.
   */
  private async summarizeQueryResult(
    userMessage: string,
    intent: string,
    data: unknown,
    language: string,
  ): Promise<string> {
    const langName =
      language === 'pt-BR'
        ? 'Brazilian Portuguese'
        : language === 'es'
          ? 'Spanish'
          : 'English';

    const systemPrompt =
      `You are BossZap, a WhatsApp business assistant. ` +
      `The user asked a question and you have the answer data below. ` +
      `Write ONE polished, friendly WhatsApp reply in ${langName}. ` +
      `Style rules (mandatory):\n` +
      `- Open with ONE fitting emoji header line (e.g. "📅 Sua agenda de hoje", "💰 Resumo financeiro", "📋 Seus orçamentos"), then a blank line.\n` +
      `- For each item or row, use a relevant leading emoji (📅 🕒 📍 💰 📂 🗓️ 🎯 ✅ ❌ 👤 🏢).\n` +
      `- Use clear short lines, not paragraphs. No markdown (**, _, #), no JSON.\n` +
      `- Money amounts use R$ format (e.g. R$ 1.234,56 for pt-BR).\n` +
      `- Dates use DD/MM/YYYY. Times use HH:MM.\n` +
      `- End with one short friendly closing line that includes an emoji ` +
      `(e.g. "Se precisar de mais algo, é só me avisar! 😊").\n` +
      `- No "here is", no "claro", no preamble before the emoji header.`;

    const userPrompt =
      `Intent: ${intent}\n` +
      `User asked: ${userMessage}\n` +
      `Data:\n${JSON.stringify(data, null, 2)}\n\n` +
      `Write the reply.`;

    try {
      const res = await this.gpt.chatWithRetry(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        // Free-form natural-language reply — opt out of JSON mode here.
        { json: false },
      );
      const text = res.content.trim();
      if (text) return text;
    } catch (err) {
      this.logger.warn(
        `summarizeQueryResult failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    // Fallback: stringify the data compactly
    return typeof data === 'string' ? data : JSON.stringify(data);
  }

  /**
   * Build a server-computed budget preview message that the user must
   * confirm before the PDF is generated. Math is done here (not by GPT)
   * so the summary the user reads matches the final PDF exactly.
   */
  private formatBudgetPreview(
    data: Record<string, unknown>,
    language: string,
  ): string {
    const items = Array.isArray(data.items)
      ? (
          data.items as Array<{
            description: string;
            quantity: number;
            unit_price: number;
          }>
        )
      : [];
    const clientName = (data.client_name as string | undefined) ?? '—';

    // Server-side math — never trust LLM-supplied totals.
    const subtotal = items.reduce(
      (sum, item) => sum + this.round2(item.quantity * item.unit_price),
      0,
    );
    const discountAmt =
      typeof data.discount_amount === 'number' && data.discount_amount > 0
        ? this.round2(data.discount_amount)
        : typeof data.discount_percentage === 'number' &&
            data.discount_percentage > 0
          ? this.round2((subtotal * data.discount_percentage) / 100)
          : 0;
    const total = this.round2(subtotal - discountAmt);

    const brl = (n: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(n);

    const labels =
      language === 'es'
        ? {
            header: '📋 Resumo do Presupuesto:',
            client: 'Cliente',
            subtotal: 'Subtotal',
            discount: 'Descuento',
            total: 'Total',
            validity: 'Validez',
            confirm: '¿Genero el PDF ahora? (Sí / No)',
          }
        : language === 'en'
          ? {
              header: '📋 Budget Preview:',
              client: 'Client',
              subtotal: 'Subtotal',
              discount: 'Discount',
              total: 'Total',
              validity: 'Valid until',
              confirm: 'Shall I generate the PDF now? (Yes / No)',
            }
          : {
              header: '📋 Resumo do Orçamento:',
              client: 'Cliente',
              subtotal: 'Valor total',
              discount: 'Desconto',
              total: 'Total Geral',
              validity: 'Válido até',
              confirm: 'Posso gerar o PDF agora? (Sim / Não)',
            };

    const lines: string[] = [labels.header, ''];
    lines.push(`👤 ${labels.client}: ${clientName}`, '');

    items.forEach((item, i) => {
      const lineTotal = this.round2(item.quantity * item.unit_price);
      lines.push(
        `${String(i + 1).padStart(2, '0')} ${item.description} — ${item.quantity}x ${brl(item.unit_price)} = ${brl(lineTotal)}`,
      );
    });

    lines.push('');
    lines.push(`💰 ${labels.subtotal}: ${brl(subtotal)}`);
    if (discountAmt > 0) {
      lines.push(`🏷️ ${labels.discount}: -${brl(discountAmt)}`);
    }
    lines.push(`✅ ${labels.total}: ${brl(total)}`);

    const validUntil = data.valid_until as string | undefined;
    if (validUntil) {
      const m = String(validUntil).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) lines.push(`📅 ${labels.validity}: ${m[3]}/${m[2]}/${m[1]}`);
    }

    lines.push('', labels.confirm);
    return lines.join('\n');
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private parseResponse(raw: string): GptActionResponse {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          intent: 'GENERAL_QUERY',
          extracted_data: {},
          response_text: raw,
          action_required: false,
          action_type: 'none',
        };
      }
      return JSON.parse(jsonMatch[0]) as GptActionResponse;
    } catch {
      return {
        intent: 'GENERAL_QUERY',
        extracted_data: {},
        response_text: raw,
        action_required: false,
        action_type: 'none',
      };
    }
  }

  private async checkUsageLimits(subscriberId: string): Promise<boolean> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStr = monthStart.toISOString().split('T')[0];

    const usage = await this.usageRepo.findOne({
      where: {
        subscriber_id: subscriberId,
        month: monthStr,
      },
    });

    if (!usage) return true;

    const subscriber = await this.subscribers.findById(subscriberId);
    if (!subscriber.plan) return true;

    const plan = subscriber.plan;
    if (usage.ai_calls_count >= plan.max_ai_calls_per_month) {
      return false;
    }
    if (usage.messages_count >= plan.max_messages_per_month) {
      return false;
    }

    return true;
  }

  private async incrementUsage(subscriberId: string): Promise<void> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStr = monthStart.toISOString().split('T')[0];

    await this.usageRepo.query(
      `INSERT INTO usage_tracking (subscriber_id, month, messages_count, ai_calls_count)
       VALUES ($1, $2, 1, 1)
       ON CONFLICT (subscriber_id, month)
       DO UPDATE SET messages_count = usage_tracking.messages_count + 1,
                     ai_calls_count = usage_tracking.ai_calls_count + 1,
                     updated_at = now()`,
      [subscriberId, monthStr],
    );
  }

  private limitReachedResponse(language: string): ProcessMessageResult {
    const messages: Record<string, string> = {
      es: 'Has alcanzado el límite de tu plan este mes. Actualiza tu plan para seguir usando BossZap sin interrupciones.',
      en: "You've reached your plan limit this month. Upgrade your plan to keep using BossZap without interruption.",
      'pt-BR':
        'Você atingiu o limite do seu plano este mês. Atualize seu plano para continuar usando o BossZap sem interrupções.',
    };

    return {
      intent: 'GENERAL_QUERY',
      responseText: messages[language] || messages.es,
      extractedData: {},
      actionTaken: 'limit_reached',
    };
  }
}
