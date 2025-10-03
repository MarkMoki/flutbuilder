"use client";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import Link from "next/link";

export default function SignUp() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 p-6 rounded-xl border border-white/10 bg-white/5">
        <h1 className="text-2xl font-bold">Create your account</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full rounded bg-foreground text-background py-2 font-semibold">Sign up</button>
        <p className="text-sm text-white/70">Already have an account? <Link href="/signin" className="underline">Sign in</Link></p>
      </form>
    </div>
  );
}


