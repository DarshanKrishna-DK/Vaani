import { Mic } from "lucide-react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export function VoiceOrb({
  state,
  size = 160,
  onClick,
}: {
  state: OrbState;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={state === "listening" ? "Stop listening" : "Start talking to Vaani"}
      className="relative grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta rounded-full"
      style={{ width: size, height: size }}
    >
      {state === "listening" && (
        <>
          <span className="voice-ring" />
          <span className="voice-ring" style={{ animationDelay: "0.6s" }} />
          <span className="voice-ring" style={{ animationDelay: "1.2s" }} />
        </>
      )}
      <span
        className={`voice-orb voice-orb--${state} grid place-items-center`}
        style={{ width: size * 0.7, height: size * 0.7 }}
      >
        {state === "listening" ? (
          <span className="flex items-end gap-1 h-7">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
        ) : state === "thinking" ? (
          <span className="flex gap-1.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        ) : (
          <Mic size={size * 0.24} className="text-white/95" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}

export function orbLabel(state: OrbState): string {
  switch (state) {
    case "listening":
      return "Listening…";
    case "thinking":
      return "Thinking…";
    case "speaking":
      return "Speaking…";
    default:
      return "Tap to talk";
  }
}
