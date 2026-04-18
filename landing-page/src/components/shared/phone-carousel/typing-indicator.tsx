export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className={
          "bg-white rounded-2xl rounded-tl-sm " + "px-4 py-2.5 shadow-sm"
        }
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation:
                  `typingBounce 1.2s ease-in-out ${i * 0.15}s ` + `infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
