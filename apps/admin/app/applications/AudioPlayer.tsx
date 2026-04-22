"use client";

import { useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25] as const;

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState<number>(1);

  function handleRate(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = parseFloat(e.target.value);
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        controls
        preload="none"
        src={src}
        style={{ height: 28, width: 220, maxWidth: 220 }}
      />
      <select
        value={rate}
        onChange={handleRate}
        style={{
          fontSize: 11,
          padding: "2px 4px",
          border: "1px solid var(--border)",
          borderRadius: 4,
          background: "#fff",
          color: "var(--text)",
        }}
        aria-label="재생 속도"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>
    </span>
  );
}
