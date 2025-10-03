"use client";
import { getSupabaseClient } from "@/lib/supabase";

export default function SignOutButton() {
  async function signOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return (
    <button onClick={signOut} className="rounded-full border border-white/20 px-3 py-1 text-sm hover:bg-white/10">Sign out</button>
  );
}


