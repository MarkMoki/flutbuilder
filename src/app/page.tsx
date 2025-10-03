import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold">Flutbuilder</h1>
        <p className="text-white/80">AI Flutter app builder. Start your journey.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/splash" className="rounded-full bg-foreground text-background px-6 py-3 font-semibold">Launch</Link>
          <Link href="/welcome" className="rounded-full border border-white/20 px-6 py-3 font-semibold">Learn more</Link>
        </div>
      </div>
    </main>
  );
}
