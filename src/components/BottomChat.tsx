"use client";
import { useState } from "react";

export default function BottomChat({ onSend, disabled }: { onSend: (msg: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  return (
    <div className="sticky bottom-0 left-0 right-0 mt-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onSend(text.trim());
              setText("");
            }
          }}
          className="flex-1 bg-transparent px-3 py-2 outline-none"
          placeholder="Describe the next step or ask for guidance..."
          disabled={disabled}
        />
        <button
          onClick={() => {
            if (text.trim()) {
              onSend(text.trim());
              setText("");
            }
          }}
          className="rounded-full bg-foreground text-background px-4 py-2 font-semibold disabled:opacity-50"
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </div>
  );
}


