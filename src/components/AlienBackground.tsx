"use client";
import { motion } from "framer-motion";

export default function AlienBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(160,50,255,0.25),transparent),radial-gradient(900px_500px_at_80%_110%,rgba(0,255,200,0.18),transparent),radial-gradient(600px_300px_at_50%_50%,rgba(255,255,255,0.05),transparent)]" />
      <motion.div
        className="absolute -top-24 -left-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background:
          "conic-gradient(from 180deg at 50% 50%, rgba(0,255,200,0.25), rgba(160,50,255,0.25), rgba(0,180,255,0.25), rgba(0,255,140,0.25), rgba(0,255,200,0.25))"}}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[-20vmax] right-[-20vmax] h-[50vmax] w-[50vmax] rounded-full blur-3xl"
        style={{ background:
          "radial-gradient(closest-side, rgba(0,180,255,0.2), transparent)"}}
        animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[url('/window.svg')] opacity-[0.015] mix-blend-soft-light" />
    </div>
  );
}


