export const QUEUE_NAMES = {
  WHATSAPP_INBOUND: 'whatsapp-inbound',
  WHATSAPP_OUTBOUND: 'whatsapp-outbound',
  MEDIA_PROCESSING: 'media-processing',
  NOTIFICATION: 'notification',
} as const;

export const MAX_RETRIES = 4;

export const RETRY_DELAYS = [1000, 5000, 15000, 60000] as const;
