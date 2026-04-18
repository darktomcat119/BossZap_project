import { cn } from "@/lib/utils";
import { Mic, Paperclip } from "lucide-react";
import type { ReactNode } from "react";

const PHONE_BG =
  "linear-gradient(145deg, #2a2a2e 0%, #1a1a1e 50%, " + "#2a2a2e 100%)";

const PHONE_SHADOW =
  "0 25px 60px -12px rgba(0,0,0,0.5), " + "inset 0 1px 0 rgba(255,255,255,0.1)";

const INNER_BG = "linear-gradient(145deg, #3a3a3e 0%, #1a1a1e 100%)";

const CHAT_PATTERN_SVG =
  `url("data:image/svg+xml,%3Csvg width='60' ` +
  `height='60' viewBox='0 0 60 60' ` +
  `xmlns='http://www.w3.org/2000/svg'%3E%3Cg ` +
  `fill='none' fill-rule='evenodd'%3E%3Cg ` +
  `fill='%23c8c3b8' fill-opacity='0.12'%3E%3Cpath ` +
  `d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4` +
  `h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6` +
  `zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E` +
  `%3C/svg%3E")`;

const AVATAR_PATH =
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 " +
  "10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 " +
  "3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-" +
  "3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-" +
  "1.29 1.94-3.5 3.22-6 3.22z";

const PHONE_PATH =
  "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493" +
  "a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 " +
  "005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 " +
  "1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 " +
  "3 14.284 3 6V5z";

export function PhoneChrome({
  headerStatus,
  children,
}: {
  headerStatus: "online" | "typing";
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div
        className="relative rounded-[3rem] p-[3px]"
        style={{ background: PHONE_BG, boxShadow: PHONE_SHADOW }}
      >
        <div
          className="rounded-[2.75rem] p-[2px]"
          style={{ background: INNER_BG }}
        >
          <div
            className={
              "relative rounded-[2.6rem] overflow-hidden " + "bg-[#efeae2]"
            }
          >
            <div
              className={
                "absolute top-0 left-1/2 -translate-x-1/2 " +
                "z-30 w-[90px] h-[22px] bg-black " +
                "rounded-b-2xl flex items-center justify-center"
              }
            >
              <div className={"w-[50px] h-[5px] bg-gray-800 rounded-full"} />
            </div>

            <div
              className={
                "relative z-20 flex items-center " +
                "justify-between px-6 pt-1.5 pb-0 " +
                "h-[28px] bg-[#128C7E]"
              }
            >
              <span className={"text-[9px] text-white/90 font-medium"}>
                9:41
              </span>
              <div className="flex items-center gap-1">
                <div className="flex gap-[2px]">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={"w-[3px] rounded-sm bg-white/80"}
                      style={{ height: `${4 + i * 2}px` }}
                    />
                  ))}
                </div>
                <span className={"text-[8px] text-white/80 ml-0.5"}>5G</span>
                <div
                  className={
                    "w-[18px] h-[9px] rounded-[2px] " +
                    "border border-white/60 ml-0.5 p-[1px]"
                  }
                >
                  <div className={"h-full w-3/4 rounded-[1px] bg-white/80"} />
                </div>
              </div>
            </div>

            <div
              className={
                "relative z-10 flex items-center gap-2.5 " +
                "px-3 py-2 bg-[#128C7E]"
              }
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <div
                className={
                  "w-8 h-8 rounded-full bg-emerald-600 " +
                  "flex items-center justify-center " +
                  "ring-2 ring-emerald-500/30"
                }
              >
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d={AVATAR_PATH} />
                </svg>
              </div>
              <div className="flex-1">
                <p
                  className={
                    "text-white text-[12px] font-semibold " + "leading-tight"
                  }
                >
                  BossZap
                </p>
                <p
                  className={cn(
                    "text-[9px] transition-all duration-300",
                    headerStatus === "typing"
                      ? "text-white"
                      : "text-emerald-200",
                  )}
                >
                  {headerStatus === "typing" ? "digitando..." : "online"}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={PHONE_PATH}
                />
              </svg>
            </div>

            <div
              className={
                "relative min-h-[340px] px-2.5 py-3 " +
                "flex flex-col justify-end gap-1.5"
              }
              style={{ backgroundImage: CHAT_PATTERN_SVG }}
            >
              {children}
            </div>

            <div
              className={"flex items-center gap-2 px-2 py-2 " + "bg-[#f0ebe3]"}
            >
              <div
                className={
                  "flex-1 flex items-center gap-2 bg-white " +
                  "rounded-full px-3 py-1.5"
                }
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                <span className={"flex-1 text-[10px] text-gray-400"}>
                  Digite uma mensagem...
                </span>
                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div
                className={
                  "w-8 h-8 rounded-full bg-[#128C7E] " +
                  "flex items-center justify-center shadow-md"
                }
              >
                <Mic className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className={"flex justify-center py-1.5 bg-[#f0ebe3]"}>
              <div className={"w-24 h-1 rounded-full bg-gray-400/30"} />
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          "absolute left-[-2px] top-[100px] w-[3px] " +
          "h-[25px] rounded-l-sm bg-gray-700"
        }
      />
      <div
        className={
          "absolute left-[-2px] top-[140px] w-[3px] " +
          "h-[40px] rounded-l-sm bg-gray-700"
        }
      />
      <div
        className={
          "absolute left-[-2px] top-[190px] w-[3px] " +
          "h-[40px] rounded-l-sm bg-gray-700"
        }
      />
      <div
        className={
          "absolute right-[-2px] top-[130px] w-[3px] " +
          "h-[50px] rounded-r-sm bg-gray-700"
        }
      />
    </div>
  );
}
