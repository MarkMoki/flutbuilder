"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AlienBackground from "@/components/AlienBackground";
import BuilderTabs from "@/components/BuilderTabs";
import BottomChat from "@/components/BottomChat";
import PhonePreview from "@/components/PhonePreview";
import { workspaceStore } from "@/lib/workspace";
import ChatHistory, { type ChatMessage } from "@/components/ChatHistory";
import SignOutButton from "@/components/SignOutButton";
import TemplatesPicker from "@/components/TemplatesPicker";

type DraftSpec = {
  appName: string;
  category: string;
  description: string;
  pages: string;
};

async function enqueueApkBuild(spec: DraftSpec) {
  const res = await fetch("/api/build/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "android_apk", appSpecInline: spec }),
  });
  if (!res.ok) throw new Error("Failed to enqueue build");
  return res.json() as Promise<{ id: string; status: string }>;
}

async function pollStatus(id: string, onUpdate: (s: any) => void) {
  let active = true;
  while (active) {
    const res = await fetch(`/api/build/status?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      onUpdate(data);
      if (data.status === "succeeded" || data.status === "failed") break;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export default function Dashboard() {
  const [spec, setSpec] = useState<DraftSpec>({ appName: "", category: "", description: "", pages: "" });
  const [buildId, setBuildId] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<any>(null);
  const [selectedPath, setSelectedPath] = useState<string>("pubspec.yaml");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any | null>(null);

  const codeTree = useMemo(() => {
    const base: any[] = [
      { name: "pubspec.yaml", type: "file" },
      { name: "lib", type: "dir", children: [
        { name: "main.dart", type: "file" },
        { name: "screens", type: "dir", children: (spec.pages || "").split(",").map(p => ({ name: `${p.trim() || "home"}.dart`, type: "file" })) },
      ]},
      { name: "android", type: "dir" },
    ];
    return base;
  }, [spec.pages]);

  useEffect(() => {
    if (!buildId) return;
    pollStatus(buildId, setBuildStatus);
  }, [buildId]);

  async function initWorkspace() {
    const res = await fetch("/api/workspace/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: buildId ?? "draft", spec }),
    });
    const data = await res.json();
    setFiles(data.files || {});
  }

  useEffect(() => {
    initWorkspace();
  }, [spec.pages]);

  // Persist basic session state
  useEffect(() => {
    try {
      localStorage.setItem('flutbuilder_spec', JSON.stringify(spec));
      if (buildId) localStorage.setItem('flutbuilder_buildId', buildId);
      if (selectedPath) localStorage.setItem('flutbuilder_selectedPath', selectedPath);
    } catch {}
  }, [spec, buildId, selectedPath]);

  useEffect(() => {
    try {
      const rawSpec = localStorage.getItem('flutbuilder_spec');
      if (rawSpec) setSpec(JSON.parse(rawSpec));
      const bid = localStorage.getItem('flutbuilder_buildId');
      if (bid) setBuildId(bid);
      const sel = localStorage.getItem('flutbuilder_selectedPath');
      if (sel) setSelectedPath(sel);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AlienBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <SignOutButton />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-lg"><span className="font-bold">👽 Flutbud:</span> What app shall we create today?</p>
            </div>
            <form
              className="rounded-2xl p-4 bg-white/5 border border-white/10 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const { id } = await enqueueApkBuild(spec);
                setBuildId(id);
              }}
            >
              <div>
                <label className="text-sm">App name</label>
                <input className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" value={spec.appName} onChange={e => setSpec(s => ({ ...s, appName: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Category</label>
                <select className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" value={spec.category} onChange={e => setSpec(s => ({ ...s, category: e.target.value }))}>
                  <option value="">Select</option>
                  <option>Finance</option>
                  <option>Health & Fitness</option>
                  <option>Productivity</option>
                  <option>E-commerce</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Describe the app</label>
                <textarea className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" rows={4} value={spec.description} onChange={e => setSpec(s => ({ ...s, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Pages (comma separated)</label>
                <input className="w-full px-3 py-2 rounded bg-black/20 border border-white/10" placeholder="home, settings, profile" value={spec.pages} onChange={e => setSpec(s => ({ ...s, pages: e.target.value }))} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="rounded border border-white/20 px-3 py-2 text-sm"
                  onClick={async () => {
                    if (!spec.description) return;
                    const res = await fetch('/api/ai/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: spec.description, category: spec.category }) });
                    if (!res.ok) return;
                    const data = await res.json();
                    const plan = data.plan || {};
                    setSpec(s => ({ ...s, appName: plan.appName || s.appName, pages: Array.isArray(plan.pages) ? plan.pages.join(', ') : s.pages }));
                  }}
                >AI Plan</button>
                <button
                  type="button"
                  className="rounded border border-white/20 px-3 py-2 text-sm"
                  onClick={async () => {
                    setValidating(true);
                    setValidation(null);
                    try {
                      const res = await fetch(`/api/workspace/validate?sessionId=${buildId ?? 'draft'}`);
                      const data = await res.json();
                      setValidation(data);
                    } finally {
                      setValidating(false);
                    }
                  }}
                >{validating ? 'Validating…' : 'Validate'}</button>
                <a
                  className="rounded border border-white/20 px-3 py-2 text-sm"
                  href={`/api/workspace/zip?sessionId=${buildId ?? 'draft'}`}
                >Download Source</a>
              </div>
              <button className="w-full rounded bg-foreground text-background py-2 font-semibold">Start build</button>
              {buildId && <p className="text-sm">Build: {buildId} — {buildStatus?.status ?? "queued"}</p>}
            </form>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <TemplatesPicker onSelect={(t) => setSpec(s => ({ ...s, appName: t.name, pages: t.pages.join(', ') }))} />
            <BuilderTabs
              codeTree={codeTree as any}
              preview={<PhonePreview state={!buildId ? "idle" : buildStatus?.status === "succeeded" ? "ready" : "building"} running={isRunning} onRun={async () => {
                if (!buildId) return;
                setIsRunning(true);
                try {
                  // Use job id as session id for APK build
                  const res = await fetch(`/api/artifacts/apk?sessionId=${buildId}`);
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${buildId}.apk`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                } finally {
                  setIsRunning(false);
                }
              }} />}
              onSelectFile={(p) => setSelectedPath(p)}
              selectedPath={selectedPath}
              fileContent={files[selectedPath]}
              onChangeFile={async (content) => {
                setFiles((f) => ({ ...f, [selectedPath]: content }));
                await fetch("/api/workspace/update", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ sessionId: buildId ?? "draft", path: selectedPath, content }),
                });
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded border border-white/20 px-3 py-2 text-sm"
                onClick={async () => {
                  if (!selectedPath) return;
                  const res = await fetch('/api/ai/explain', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: buildId ?? 'draft', path: selectedPath }) });
                  const data = await res.json();
                  if (data.explanation) setMessages((msgs) => [...msgs, { role: 'assistant', text: `Explanation for ${selectedPath}:\n\n${data.explanation}` }]);
                }}
              >Explain file</button>
              <button
                className="rounded border border-white/20 px-3 py-2 text-sm"
                onClick={async () => {
                  if (!selectedPath) return;
                  const res = await fetch('/api/ai/tests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: buildId ?? 'draft', path: selectedPath }) });
                  const data = await res.json();
                  if (data.path && data.content) {
                    setFiles((f) => ({ ...f, [data.path]: data.content }));
                    setSelectedPath(data.path);
                  }
                }}
              >Generate test</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChatHistory messages={messages} />
              {buildStatus?.status === "succeeded" && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="text-sm">APK ready:</div>
                  <a className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold w-fit" href="/api/artifacts/apk">Download APK</a>
                  <a className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold w-fit" href={buildStatus.output?.artifactUrl}>Download source zip</a>
                </div>
              )}
            </div>
            {buildStatus?.output?.artifactUrl && (
              <a className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold w-fit" href={buildStatus.output.artifactUrl}>Download source zip</a>
            )}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-sm text-white/80">Suggestions: Try starting with 3-5 pages. Keep workflows concise. You can refine and regenerate the code anytime, then export APK.</p>
              {validation && (
                <div className="mt-3 text-xs space-y-2">
                  <div className="font-semibold">Validation</div>
                  {validation?.analyze?.issues?.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {validation.analyze.issues.map((i: any, idx: number) => (
                        <li key={idx} className={i.level === 'error' ? 'text-red-300' : i.level === 'warning' ? 'text-yellow-300' : 'text-white/80'}>
                          {i.file ? `${i.file}:${i.line}:${i.column} — ` : ''}{i.level?.toUpperCase?.()}: {i.message} {i.code ? `(${i.code})` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No analyzer issues.</div>
                  )}
                  <div className="pt-2">Tests: {validation?.test?.passed ? 'Passed' : 'Check output'}</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <BottomChat
          disabled={chatBusy}
          onSend={async (m) => {
            setMessages((msgs) => [...msgs, { role: "user", text: m }]);
            setChatBusy(true);
            try {
              const res = await fetch("/api/ai/assist", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ sessionId: buildId ?? "draft", prompt: m, selectedPath }),
              });
              const data = await res.json();
              const updates: { path: string; content: string }[] = data.updates || [];
              if (updates.length > 0) {
                setFiles((f) => {
                  const next = { ...f } as any;
                  for (const u of updates) next[u.path] = u.content;
                  return next;
                });
                // Focus the first updated file
                setSelectedPath(updates[0].path);
              }
              if (data.message) setMessages((msgs) => [...msgs, { role: "assistant", text: data.message }]);
            } finally {
              setChatBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}


