export interface ChatMessage {
  id: number;
  type: "sent" | "received";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceDuration?: string;
}

export interface FloatingBadge {
  position: "top-left" | "bottom-right";
  icon: "pdf" | "revenue";
  title: string;
  subtitle: string;
  appearsAfterMessage?: number;
}

export interface ChatScreen {
  id: string;
  messages: ChatMessage[];
  badges: FloatingBadge[];
}

export interface PhoneCarouselProps {
  screens: ChatScreen[];
  className?: string;
}
