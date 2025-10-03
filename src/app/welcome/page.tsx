"use client";
import { motion } from "framer-motion";
import AlienBackground from "@/components/AlienBackground";
import { Rocket, Sparkles, Braces, Download } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Rocket,
    title: "From Idea to App",
    desc: "Describe it. We structure data, routes, and state for you.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    desc: "Guided workflows and smart defaults to move fast.",
  },
  {
    icon: Braces,
    title: "Full Source",
    desc: "Download clean Flutter code you can ship and extend.",
  },
  {
    icon: Download,
    title: "APK Builds",
    desc: "Grab a signed Android APK for quick testing.",
  },
];

export default function Welcome() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AlienBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-6xl font-extrabold text-center"
        >
          Welcome, explorer
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-3 text-white/80"
        >
          Flutbuilder crafts Flutter apps from your vision with an alien-grade UX.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * i }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/10 transition relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="flex items-center gap-4">
                <f.icon className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="text-white/80">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link href="/signup" className="rounded-full bg-foreground text-background px-6 py-3 text-lg font-semibold hover:opacity-90 transition">
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}


