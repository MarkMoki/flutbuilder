"use client";
import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      if (!isAdminEmail(email)) {
        window.location.href = "/";
      }
    });
  }, []);
  return <>{children}</>;
}


