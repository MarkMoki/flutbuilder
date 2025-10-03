"use client";
import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/signin";
      }
    });
  }, []);
  return <>{children}</>;
}


