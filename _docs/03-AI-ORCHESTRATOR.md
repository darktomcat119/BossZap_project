# BossZap — AI Orchestrator

## Overview
The AI Orchestrator is the "brain" of BossZap. It receives every message, classifies the intent, extracts structured data, and routes to the correct business module.

## Intent Classification Table
| Intent | Example (ES) | Example (EN) | Example (PT-BR) | Action |
|---|---|---|---|---|
| `SCHEDULE_CREATE` | "Tengo una pintura mañana a las 14h" | "I have a painting job tomorrow at 2pm" | "Tenho uma pintura amanhã às 14h" | Create event |
| `SCHEDULE_QUERY` | "¿Qué compromisos tengo mañana?" | "What appointments do I have tomorrow?" | "Quais compromissos tenho amanhã?" | Query agenda |
| `SCHEDULE_UPDATE` | "Cambia la pintura a las 16h" | "Move the painting to 4pm" | "Muda a pintura pra 16h" | Update event |
| `SCHEDULE_CANCEL` | "Cancela el compromiso de mañana" | "Cancel tomorrow's appointment" | "Cancela o compromisso de amanhã" | Cancel event |
| `FINANCE_INCOME` | "Recibí $500 del servicio" | "I received $500 from the job" | "Recebi R$500 do serviço" | Register income |
| `FINANCE_EXPENSE` | "Gasté $50 en lija" | "I spent $50 on sandpaper" | "Gastei R$50 com lixa" | Register expense |
| `FINANCE_QUERY` | "¿Cuánto gané esta semana?" | "How much did I earn this week?" | "Quanto ganhei essa semana?" | Query finances |
| `BUDGET_CREATE` | "Haz un presupuesto para pintura" | "Create a quote for painting" | "Faz um orçamento pra pintura" | Start budget flow |
| `BUDGET_QUERY` | "Muéstrame el último presupuesto" | "Show me the last quote" | "Me mostra o último orçamento" | Retrieve budget |
| `SERVICE_ORDER_CREATE` | "Genera una orden de servicio" | "Generate a service order" | "Gera uma ordem de serviço" | Create service order |
| `PROFILE_UPDATE` | "Quiero actualizar mi logo" | "I want to update my logo" | "Quero atualizar minha logo" | Update profile |
| `LANGUAGE_CHANGE` | "Cambiar a inglés" | "Change to Spanish" | "Mudar para espanhol" | Change language pref |
| `GENERAL_QUERY` | "¿Cómo funciona el sistema?" | "How does the system work?" | "Como funciona o sistema?" | Help/info |
| `ONBOARDING` | (first-time user) | (first-time user) | (first-time user) | Onboarding flow |

## Context Memory
- Store last 20 messages per subscriber in `conversation_history`.
- Load context before every AI call.
- Multi-turn support: AI remembers partial info and asks follow-up questions.
- Example: "Agenda tomorrow" → "What time?" → "2pm" → creates event.
- Context expires after 30 minutes of inactivity (start fresh session).

## AI Prompt Engineering
System prompt must instruct the AI to:
- Respond in the subscriber's preferred language.
- Be friendly, professional, concise.
- Extract structured data: dates, amounts, names, descriptions.
- Ask clarifying questions when ambiguous.
- NEVER hallucinate data. Only use real database records.
- For financial queries, calculate from actual records.
- When unsure of intent, ask the user to clarify.
- Format currency according to locale ($ for ES/EN, R$ for PT-BR).

## Orchestration Flow
```
1. Message arrives from queue
2. Identify subscriber by phone number
3. Check subscriber status (active? suspended? onboarding?)
4. If new user → onboarding flow
5. If suspended → respond with payment link
6. Load subscriber context + last 20 messages
7. Send to GPT-4: system prompt + context + history + new message
8. GPT-4 returns: { intent, extracted_data, response_text }
9. Check usage limits (is subscriber within plan limits?)
10. Route to correct service module
11. Execute action (create event, register finance, etc.)
12. Format response
13. Send via WhatsApp (check window status first)
14. Update Dashboard via WebSocket
15. Save message to conversation_history
16. Update usage_tracking counters
```

## Onboarding Flow (First Conversation)
1. Detect new phone number (not in database).
2. Create subscriber record with status `onboarding`.
3. AI greets and asks for preferred language.
4. AI collects: business name, owner name, phone, email (optional), address (optional).
5. AI asks for business logo (send image via WhatsApp).
6. Process logo: download → validate (PNG/JPG/WEBP) → resize (max 500x500, <200KB) → store in S3.
7. If subscriber skips logo: use default placeholder.
8. Confirm all data with subscriber.
9. Mark status = `active`, set `onboarding_completed_at`.
10. Subscriber can update profile later via WhatsApp (intent: `PROFILE_UPDATE`).

## Error Handling
- If GPT-4 API fails: retry once, if still fails respond with "I'm having trouble, try again in a moment."
- If intent is unclear after 2 clarification attempts: respond with general help menu.
- If Whisper fails on audio: respond with "I couldn't understand the audio, could you type it or try again?"
- Log all AI errors with full context for debugging.
