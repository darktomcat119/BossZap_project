import { Mic, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

export function MessageBubble({
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
          "relative max-w-[82%] rounded-2xl px-3 py-2 " +
            "text-[11px] leading-relaxed",
          isSent
            ? "bg-[#d9fdd3] text-gray-800 rounded-tr-sm"
            : "bg-white text-gray-800 rounded-tl-sm shadow-sm",
        )}
      >
        {msg.isVoice ? (
          <div className="flex items-center gap-2">
            <div
              className={
                "w-7 h-7 rounded-full bg-emerald-600 " +
                "flex items-center justify-center flex-shrink-0"
              }
            >
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-[1px] h-4">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = 2 + Math.sin(i * 0.7) * 6 + Math.random() * 3;
                return (
                  <div
                    key={i}
                    className={"w-[1.5px] bg-emerald-600/60 " + "rounded-full"}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
            <span className="text-[9px] text-gray-500 ml-1">
              {msg.voiceDuration || "0:12"}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-line">{msg.text}</p>
        )}

        <div className={"flex items-center gap-1 mt-0.5 justify-end"}>
          <span className="text-[9px] text-gray-500">{msg.time}</span>
          {isSent &&
            (showRead ? (
              <CheckCheck
                className={
                  "w-3 h-3 text-blue-500 " + "transition-colors duration-300"
                }
              />
            ) : (
              <Check className="w-3 h-3 text-gray-400" />
            ))}
        </div>
      </div>
    </div>
  );
}
