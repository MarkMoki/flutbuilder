"use client";
import { motion } from "framer-motion";
import AlienBackground from "@/components/AlienBackground";
import Link from "next/link";

export default function Splash() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AlienBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-center"
        >
          Flutbuilder
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 text-center text-lg text-white/80 max-w-xl"
        >
          Build fully functional Flutter apps from ideas. Download source or APKs.
        </motion.p>
        <motion.div
          className="mt-10 flex gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/welcome" className="rounded-full bg-foreground text-background px-6 py-3 text-lg font-semibold hover:opacity-90 transition">
            Enter
          </Link>
          <Link href="/signin" className="rounded-full border border-white/20 px-6 py-3 text-lg font-semibold hover:bg-white/10 transition">
            Sign in
          </Link>
        </motion.div>
      </div>
    </div>
  );
}


