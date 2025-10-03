"use client";
import { motion } from "framer-motion";

export type ChatMessage = { role: "user" | "assistant"; text: string };

export default function ChatHistory({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2 max-h-64 overflow-auto">
      {messages.length === 0 ? (
        <div className="text-sm text-white/70">No messages yet. Ask for suggestions to refine your app.</div>
      ) : (
        messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm">
            <span className="text-white/60">{m.role === "user" ? "You" : "Assistant"}:</span> {m.text}
          </motion.div>
        ))
      )}
    </div>
  );
}


