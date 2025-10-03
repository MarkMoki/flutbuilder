"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-white/70 text-sm mt-2">{error.message}</p>
            <button className="mt-4 rounded bg-foreground text-background px-4 py-2" onClick={() => reset()}>Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}


