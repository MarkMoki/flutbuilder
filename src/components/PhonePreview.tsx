"use client";
import { motion } from "framer-motion";

export default function PhonePreview({ state, onRun, running }: { state: "idle" | "building" | "ready"; onRun?: () => void; running?: boolean }) {
  if (state === "idle") {
    return (
      <div className="aspect-[9/16] w-full max-w-sm mx-auto rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-center">
          <div className="text-2xl">👽</div>
          <div className="text-sm text-white/70">Describe your app to begin</div>
        </motion.div>
      </div>
    );
  }
  if (state === "building") {
    return (
      <div className="aspect-[9/16] w-full max-w-sm mx-auto rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-center">
          <div className="text-2xl">🛠️</div>
          <div className="text-sm text-white/70">Building your APK...</div>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="aspect-[9/16] w-full max-w-sm mx-auto rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center relative">
      <button onClick={onRun} disabled={running} className="absolute top-3 right-3 rounded-full bg-foreground text-background px-3 py-1 text-xs font-semibold disabled:opacity-50">
        {running ? "Running..." : "Run"}
      </button>
      <div className="text-center text-sm text-white/80">Preview ready</div>
    </div>
  );
}


