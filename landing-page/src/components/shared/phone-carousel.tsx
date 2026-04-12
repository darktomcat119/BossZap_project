"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Mic, Check, CheckCheck, Paperclip } from "lucide-react";

// ─── Types ────────────────────────────────────────────

interface ChatMessage {
  id: number;
  type: "sent" | "received";
  text: string;
  time: string;
  isVoice?: boolean;
  voiceDuration?: string;
}

interface FloatingBadge {
  position: "top-left" | "bottom-right";
  icon: "pdf" | "revenue";
  title: string;
  subtitle: string;
  appearsAfterMessage?: number;
}

interface ChatScreen {
  id: string;
  messages: ChatMessage[];
  badges: FloatingBadge[];
}

interface PhoneCarouselProps {
  screens: ChatScreen[];
  className?: string;
}

// ─── Typing Indicator ────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Voice Recording Bar ─────────────────────────────

function VoiceRecordingBar({ duration }: { duration: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 bg-[#d9fdd3] rounded-2xl rounded-tr-sm px-3 py-2">
        {/* Red pulsing dot */}
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          <div className="relative w-3 h-3 rounded-full bg-red-500" />
        </div>
        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-[2px] bg-emerald-600 rounded-full"
              style={{
                animation: `waveform 0.8s ease-in-out ${i * 0.04}s infinite alternate`,
                height: `${4 + Math.sin(i * 0.8) * 8 + Math.random() * 4}px`,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-gray-600 font-mono ml-1">{duration}</span>
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────

function MessageBubble({
  msg,
  showRead,
  isNew,
}: {
  msg: ChatMessage;
  showRead: boolean;
  isNew: boolean;
}) {
  const isSent = msg.type === "sent";

  return (
    <div
      className={cn(
        "flex transition-all duration-500",
        isSent ? "justify-end" : "justify-start",
        isNew
          ? isSent
            ? "animate-[slideInRight_0.4s_ease-out]"
            : "animate-[slideInLeft_0.4s_ease-out]"
          : "",
      )}
    >
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed",
          isSent
            ? "bg-[#d9fdd3] text-gray-800 rounded-tr-sm"
            : "bg-white text-gray-800 rounded-tl-sm shadow-sm",
        )}
      >
        {/* Voice message display */}
        {msg.isVoice ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-[1px] h-4">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[1.5px] bg-emerald-600/60 rounded-full"
                  style={{ height: `${2 + Math.sin(i * 0.7) * 6 + Math.random() * 3}px` }}
                />
              ))}
            </div>
            <span className="text-[9px] text-gray-500 ml-1">{msg.voiceDuration || "0:12"}</span>
          </div>
        ) : (
          <p className="whitespace-pre-line">{msg.text}</p>
        )}

        <div className="flex items-center gap-1 mt-0.5 justify-end">
          <span className="text-[9px] text-gray-500">{msg.time}</span>
          {isSent && (
            showRead
              ? <CheckCheck className="w-3 h-3 text-blue-500 transition-colors duration-300" />
              : <Check className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Floating Badge ──────────────────────────────────

function Badge({
  badge,
  visible,
}: {
  badge: FloatingBadge;
  visible: boolean;
}) {
  const isTopLeft = badge.position === "top-left";

  return (
    <div
      className={cn(
        "absolute z-20 flex items-center gap-2.5 rounded-xl px-3 py-2",
        "bg-white/95 backdrop-blur-md shadow-xl shadow-black/10",
        "border border-gray-100",
        "transition-all duration-500",
        isTopLeft
          ? "top-24 left-2 sm:-left-4"
          : "bottom-28 right-2 sm:-right-4",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-75 translate-y-4",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          badge.icon === "pdf" ? "bg-emerald-50" : "bg-blue-50",
        )}
      >
        {badge.icon === "pdf" ? (
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-900 leading-tight whitespace-nowrap">
          {badge.title}
        </p>
        <p className="text-[9px] text-gray-500 leading-tight whitespace-nowrap">
          {badge.subtitle}
        </p>
      </div>
    </div>
  );
}

// ─── Phone Component ─────────────────────────────────

export function PhoneCarousel({
  screens,
  className = "",
}: PhoneCarouselProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [readMessages, setReadMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [visibleBadges, setVisibleBadges] = useState<number[]>([]);
  const [headerStatus, setHeaderStatus] = useState<"online" | "typing">("online");
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const screen = screens[currentScreen];

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const addTimeout = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  };

  // Animate messages for current screen
  const animateScreen = useCallback(() => {
    clearAllTimeouts();
    setVisibleMessages([]);
    setReadMessages([]);
    setVisibleBadges([]);
    setShowTyping(false);
    setShowVoiceRecording(false);
    setHeaderStatus("online");

    const messages = screens[currentScreen].messages;
    const badges = screens[currentScreen].badges;
    let delay = 400;

    messages.forEach((msg, index) => {
      if (msg.type === "sent") {
        // Voice recording animation before voice messages
        if (msg.isVoice) {
          addTimeout(() => setShowVoiceRecording(true), delay);
          delay += 1800;
          addTimeout(() => {
            setShowVoiceRecording(false);
            setVisibleMessages((prev) => [...prev, msg.id]);
          }, delay);
        } else {
          // Sent message slides in
          addTimeout(() => {
            setVisibleMessages((prev) => [...prev, msg.id]);
          }, delay);
        }
        // Read receipt after 600ms
        addTimeout(() => {
          setReadMessages((prev) => [...prev, msg.id]);
        }, delay + 600);
        delay += 800;
      } else {
        // Show typing indicator before AI response
        addTimeout(() => {
          setShowTyping(true);
          setHeaderStatus("typing");
        }, delay);
        delay += 1500;

        // Hide typing, show message
        addTimeout(() => {
          setShowTyping(false);
          setHeaderStatus("online");
          setVisibleMessages((prev) => [...prev, msg.id]);
        }, delay);
        delay += 600;
      }

      // Check if any badge should appear after this message
      badges.forEach((badge, bi) => {
        if (badge.appearsAfterMessage === index || (!badge.appearsAfterMessage && index === messages.length - 1)) {
          addTimeout(() => {
            setVisibleBadges((prev) => [...prev, bi]);
          }, delay + 200);
        }
      });
    });

    // Auto-advance to next screen
    addTimeout(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, delay + 3000);
  }, [currentScreen, screens]);

  useEffect(() => {
    animateScreen();
    return () => clearAllTimeouts();
  }, [animateScreen]);

  return (
    <div className={cn("relative", className)}>
      {/* Floating badges */}
      {screen.badges.map((badge, i) => (
        <Badge
          key={`${currentScreen}-${i}`}
          badge={badge}
          visible={visibleBadges.includes(i)}
        />
      ))}

      {/* Phone body */}
      <div className="relative mx-auto w-[280px] sm:w-[300px]">
        {/* Phone frame */}
        <div
          className="relative rounded-[3rem] p-[3px]"
          style={{
            background: "linear-gradient(145deg, #2a2a2e 0%, #1a1a1e 50%, #2a2a2e 100%)",
            boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="rounded-[2.75rem] p-[2px]"
            style={{ background: "linear-gradient(145deg, #3a3a3e 0%, #1a1a1e 100%)" }}
          >
            <div className="relative rounded-[2.6rem] overflow-hidden bg-[#efeae2]">
              {/* Dynamic island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[90px] h-[22px] bg-black rounded-b-2xl flex items-center justify-center">
                <div className="w-[50px] h-[5px] bg-gray-800 rounded-full" />
              </div>

              {/* Status bar */}
              <div className="relative z-20 flex items-center justify-between px-6 pt-1.5 pb-0 h-[28px] bg-[#128C7E]">
                <span className="text-[9px] text-white/90 font-medium">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-[2px]">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-[3px] rounded-sm bg-white/80" style={{ height: `${4 + i * 2}px` }} />
                    ))}
                  </div>
                  <span className="text-[8px] text-white/80 ml-0.5">5G</span>
                  <div className="w-[18px] h-[9px] rounded-[2px] border border-white/60 ml-0.5 p-[1px]">
                    <div className="h-full w-3/4 rounded-[1px] bg-white/80" />
                  </div>
                </div>
              </div>

              {/* WhatsApp header */}
              <div className="relative z-10 flex items-center gap-2.5 px-3 py-2 bg-[#128C7E]">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center ring-2 ring-emerald-500/30">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-[12px] font-semibold leading-tight">BossZap</p>
                  <p className={cn(
                    "text-[9px] transition-all duration-300",
                    headerStatus === "typing" ? "text-white" : "text-emerald-200",
                  )}>
                    {headerStatus === "typing" ? "digitando..." : "online"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>

              {/* Chat area */}
              <div
                className="relative min-h-[340px] px-2.5 py-3 flex flex-col justify-end gap-1.5"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c3b8' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {/* Messages */}
                {screen.messages
                  .filter((msg) => visibleMessages.includes(msg.id))
                  .map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      showRead={readMessages.includes(msg.id)}
                      isNew={true}
                    />
                  ))}

                {/* Voice recording bar */}
                {showVoiceRecording && <VoiceRecordingBar duration="0:12" />}

                {/* Typing indicator */}
                {showTyping && <TypingIndicator />}
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 px-2 py-2 bg-[#f0ebe3]">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-3 py-1.5">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                  <span className="flex-1 text-[10px] text-gray-400">Digite uma mensagem...</span>
                  <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center shadow-md">
                  <Mic className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center py-1.5 bg-[#f0ebe3]">
                <div className="w-24 h-1 rounded-full bg-gray-400/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Side buttons */}
        <div className="absolute left-[-2px] top-[100px] w-[3px] h-[25px] rounded-l-sm bg-gray-700" />
        <div className="absolute left-[-2px] top-[140px] w-[3px] h-[40px] rounded-l-sm bg-gray-700" />
        <div className="absolute left-[-2px] top-[190px] w-[3px] h-[40px] rounded-l-sm bg-gray-700" />
        <div className="absolute right-[-2px] top-[130px] w-[3px] h-[50px] rounded-r-sm bg-gray-700" />
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {screens.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentScreen(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === currentScreen
                ? "w-6 bg-emerald-500"
                : "w-2 bg-gray-300 hover:bg-gray-400",
            )}
          />
        ))}
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes waveform {
          0% { height: 3px; }
          100% { height: 14px; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
