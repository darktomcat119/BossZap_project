export function VoiceRecordingBar({ duration }: { duration: string }) {
  return (
    <div className="flex justify-end">
      <div
        className={
          "flex items-center gap-2 bg-[#d9fdd3] " +
          "rounded-2xl rounded-tr-sm px-3 py-2"
        }
      >
        <div className="relative w-3 h-3">
          <div
            className={
              "absolute inset-0 rounded-full bg-red-500 " +
              "animate-ping opacity-75"
            }
          />
          <div className={"relative w-3 h-3 rounded-full bg-red-500"} />
        </div>
        <div className="flex items-center gap-[2px] h-5">
          {Array.from({ length: 20 }).map((_, i) => {
            const h = 4 + Math.sin(i * 0.8) * 8 + Math.random() * 4;
            const anim =
              `waveform 0.8s ease-in-out ${i * 0.04}s ` + `infinite alternate`;
            return (
              <div
                key={i}
                className="w-[2px] bg-emerald-600 rounded-full"
                style={{
                  animation: anim,
                  height: `${h}px`,
                }}
              />
            );
          })}
        </div>
        <span className={"text-[10px] text-gray-600 font-mono ml-1"}>
          {duration}
        </span>
      </div>
    </div>
  );
}
