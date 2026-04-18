"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./phone-carousel/badge";
import { MessageBubble } from "./phone-carousel/message-bubble";
import { TypingIndicator } from "./phone-carousel/typing-indicator";
import { VoiceRecordingBar } from "./phone-carousel/voice-recording-bar";
import { PhoneChrome } from "./phone-carousel/phone-chrome";
import { PhoneCarouselKeyframes } from "./phone-carousel/keyframes";
import type { PhoneCarouselProps } from "./phone-carousel/types";

export function PhoneCarousel({ screens, className = "" }: PhoneCarouselProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [readMessages, setReadMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [visibleBadges, setVisibleBadges] = useState<number[]>([]);
  const [headerStatus, setHeaderStatus] = useState<"online" | "typing">(
    "online",
  );
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
        if (msg.isVoice) {
          addTimeout(() => setShowVoiceRecording(true), delay);
          delay += 1800;
          addTimeout(() => {
            setShowVoiceRecording(false);
            setVisibleMessages((prev) => [...prev, msg.id]);
          }, delay);
        } else {
          addTimeout(() => {
            setVisibleMessages((prev) => [...prev, msg.id]);
          }, delay);
        }
        addTimeout(() => {
          setReadMessages((prev) => [...prev, msg.id]);
        }, delay + 600);
        delay += 800;
      } else {
        addTimeout(() => {
          setShowTyping(true);
          setHeaderStatus("typing");
        }, delay);
        delay += 1500;

        addTimeout(() => {
          setShowTyping(false);
          setHeaderStatus("online");
          setVisibleMessages((prev) => [...prev, msg.id]);
        }, delay);
        delay += 600;
      }

      badges.forEach((badge, bi) => {
        if (
          badge.appearsAfterMessage === index ||
          (!badge.appearsAfterMessage && index === messages.length - 1)
        ) {
          addTimeout(() => {
            setVisibleBadges((prev) => [...prev, bi]);
          }, delay + 200);
        }
      });
    });

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
      {screen.badges.map((badge, i) => (
        <Badge
          key={`${currentScreen}-${i}`}
          badge={badge}
          visible={visibleBadges.includes(i)}
        />
      ))}

      <PhoneChrome headerStatus={headerStatus}>
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

        {showVoiceRecording && <VoiceRecordingBar duration="0:12" />}

        {showTyping && <TypingIndicator />}
      </PhoneChrome>

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

      <PhoneCarouselKeyframes />
    </div>
  );
}
