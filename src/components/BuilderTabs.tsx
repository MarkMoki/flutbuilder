"use client";
import { useState } from "react";
import { motion } from "framer-motion";

type CodeNode = {
  name: string;
  type: "file" | "dir";
  children?: CodeNode[];
};

function CodeTree({ node, depth = 0, onSelect, pathPrefix = "" }: { node: CodeNode; depth?: number; onSelect?: (path: string) => void; pathPrefix?: string }) {
  const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  return (
    <div style={{ paddingLeft: depth * 12 }} className="text-sm py-0.5 cursor-pointer" onClick={() => node.type === 'file' && onSelect?.(fullPath)}>
      <span className="opacity-80">{node.type === "dir" ? "📁" : "📄"}</span>{" "}{node.name}
      {node.children?.map((child) => (
        <CodeTree key={child.name} node={child} depth={depth + 1} onSelect={onSelect} pathPrefix={fullPath} />
      ))}
    </div>
  );
}

export default function BuilderTabs({
  codeTree,
  preview,
  onSelectFile,
  selectedPath,
  fileContent,
  onChangeFile,
}: {
  codeTree: CodeNode[];
  preview: React.ReactNode;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
  fileContent?: string;
  onChangeFile?: (content: string) => void;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [fileFilter, setFileFilter] = useState("");

  function filterNodes(nodes: CodeNode[], term: string): CodeNode[] {
    if (!term) return nodes;
    const t = term.toLowerCase();
    const walk = (list: CodeNode[]): CodeNode[] =>
      list
        .map((n) => {
          const name = n.name.toLowerCase();
          if (n.type === "dir") {
            const children = n.children ? walk(n.children) : [];
            if (children.length > 0 || name.includes(t)) {
              return { ...n, children } as CodeNode;
            }
            return null as any;
          } else {
            return name.includes(t) ? n : (null as any);
          }
        })
        .filter(Boolean) as CodeNode[];
    return walk(nodes);
  }
  const filteredTree = filterNodes(codeTree, fileFilter);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-3">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTab("preview")}
          className={`px-3 py-1.5 rounded ${tab === "preview" ? "bg-white/15" : "hover:bg-white/10"}`}
        >
          Preview
        </button>
        <button
          onClick={() => setTab("code")}
          className={`px-3 py-1.5 rounded ${tab === "code" ? "bg-white/15" : "hover:bg-white/10"}`}
        >
          Code
        </button>
      </div>
      <div className="min-h-[320px]">
        {tab === "preview" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {preview}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-h-[420px] overflow-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <input
                aria-label="Filter files"
                className="w-full mb-2 px-2 py-1 rounded bg-black/30 border border-white/10 text-sm"
                placeholder="Filter files..."
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
              />
              {filteredTree.length === 0 ? (
                <div className="text-xs opacity-60">No files match.</div>
              ) : (
                filteredTree.map((n) => (
                  <div key={n.name}>
                    <CodeTree node={n} onSelect={onSelectFile} />
                  </div>
                ))
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-2">
              <div className="text-xs opacity-70 mb-1">{selectedPath || "Select a file"}</div>
              <textarea
                className="w-full h-[360px] bg-transparent outline-none text-sm"
                value={fileContent || ""}
                onChange={(e) => onChangeFile?.(e.target.value)}
                placeholder="File content..."
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}


