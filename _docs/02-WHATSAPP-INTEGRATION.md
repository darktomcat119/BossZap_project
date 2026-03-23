# BossZap — WhatsApp Integration (WABA)

## Overview
BossZap uses Meta's official WhatsApp Cloud API (WABA).
All subscribers share a SINGLE official WhatsApp number.
The backend identifies each subscriber by their phone number.

## Webhook Receiver
- Endpoint: `POST /api/v1/webhook/whatsapp`
- GET endpoint for Meta verification challenge.
- Verify Meta webhook signature (`X-Hub-Signature-256`) on EVERY request using `WABA_APP_SECRET`.
- Extract: message type, sender phone, timestamp, message content/media ID.
- IMMEDIATELY enqueue the message and return `200 OK`. Do NOT process synchronously.
- If signature verification fails, return `401` and log the attempt.

## Message Types
| Type | Handling |
|---|---|
| Text | Pass directly to AI Orchestrator via queue |
| Audio | Download media → Whisper transcription → pass text to AI |
| Image | Download media → store in S3 → used for onboarding (logo) |
| Document | Download and store if relevant |
| Location | Extract coordinates, pass to AI for context |

## Media Handling
- Meta provides a temporary media URL when audio/image is received.
- Download within 5 minutes (URL expires).
- Steps: Get media URL → Download binary → Process/Store.
- Audio: send to Whisper API, get transcription, then treat as text.
- Images: validate format (PNG/JPG/WEBP), resize, store in S3.

## Sending Messages
- Text responses: via Meta Messages API.
- Documents (PDFs): send as document message with download URL.
- Template messages (HSM): use when 24h window is closed. Must use Meta-approved templates.
- Interactive messages: buttons for quick actions (e.g., confirm/cancel).

## HSM Templates (Meta Approved)
- Templates must be pre-approved by Meta (takes 24-48h).
- Each template must exist in ALL 3 languages (es, en, pt-BR).
- Required templates:
  - `payment_recovery_reminder` — friendly payment reminder with link
  - `welcome_message` — sent when subscriber first activates
  - `agenda_reminder` — upcoming event reminder
  - `budget_ready` — budget/quote PDF is ready
- Template approval status tracked in `hsm_templates` database table.
- Only use approved templates. If template is pending/rejected, queue the message.

## Retry Logic
- On Meta API 429 (rate limit) or 5xx (server error):
  - Retry 1: wait 1 second
  - Retry 2: wait 5 seconds
  - Retry 3: wait 15 seconds
  - Retry 4: wait 60 seconds
  - After 4 retries: mark as failed, log error, add to retry queue for later.
- Log every failed delivery attempt with subscriber_id, message content, error details.

## Rate Limiting Per Subscriber
- Maximum 30 inbound messages per minute per subscriber.
- If exceeded: respond with a polite "please slow down" message.
- This prevents a single user from flooding the queue and affecting others.
- Implement using Redis rate limiter (sliding window).

## Webhook Events to Handle
- `messages` — incoming text/audio/image/document
- `statuses` — message delivery status (sent, delivered, read, failed)
- Log delivery statuses for monitoring and debugging.
