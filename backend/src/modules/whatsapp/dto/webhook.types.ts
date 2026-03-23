export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

interface WebhookChange {
  value: WebhookValue;
  field: string;
}

interface WebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WebhookContact[];
  messages?: RawMessage[];
  statuses?: MessageStatus[];
}

interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

interface RawMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string; caption?: string };
  document?: {
    id: string;
    mime_type: string;
    filename?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

interface MessageStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

export interface WebhookMessage {
  messageId: string;
  from: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'document' | 'location';
  text?: string;
  mediaId?: string;
  mediaMimeType?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contactName?: string;
}

export function parseWebhookPayload(
  payload: WebhookPayload,
): WebhookMessage[] {
  const messages: WebhookMessage[] = [];

  if (payload.object !== 'whatsapp_business_account') {
    return messages;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const rawMessages = value.messages || [];
      const contacts = value.contacts || [];

      for (const msg of rawMessages) {
        const contact = contacts.find(
          (c) => c.wa_id === msg.from,
        );

        const parsed: WebhookMessage = {
          messageId: msg.id,
          from: msg.from,
          timestamp: msg.timestamp,
          type: msg.type as WebhookMessage['type'],
          contactName: contact?.profile?.name,
        };

        switch (msg.type) {
          case 'text':
            parsed.text = msg.text?.body;
            break;
          case 'audio':
            parsed.mediaId = msg.audio?.id;
            parsed.mediaMimeType = msg.audio?.mime_type;
            break;
          case 'image':
            parsed.mediaId = msg.image?.id;
            parsed.mediaMimeType = msg.image?.mime_type;
            parsed.text = msg.image?.caption;
            break;
          case 'document':
            parsed.mediaId = msg.document?.id;
            parsed.mediaMimeType = msg.document?.mime_type;
            break;
          case 'location':
            parsed.location = msg.location;
            break;
        }

        messages.push(parsed);
      }
    }
  }

  return messages;
}
