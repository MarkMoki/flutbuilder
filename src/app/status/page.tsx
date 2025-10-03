export default function StatusPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">System Status</h1>
      <ul className="mt-4 list-disc pl-6 text-white/80 text-sm">
        <li>Web: OK</li>
        <li>AI: Configurable via GEMINI_API_KEY</li>
        <li>APK Builds: Requires Docker and worker image</li>
      </ul>
    </div>
  );
}


