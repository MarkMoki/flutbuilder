"use client";
const templates = [
  { id: "finance", name: "Finance Tracker", pages: ["home", "budgets", "transactions", "reports"] },
  { id: "fitness", name: "Fitness Coach", pages: ["home", "plans", "workouts", "progress"] },
  { id: "shop", name: "Shop", pages: ["home", "catalog", "cart", "checkout"] },
];

export default function TemplatesPicker({ onSelect }: { onSelect: (tpl: { id: string; name: string; pages: string[] }) => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm mb-2">Templates</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {templates.map(t => (
          <button key={t.id} onClick={() => onSelect(t)} className="rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/10">
            <div className="font-semibold text-sm">{t.name}</div>
            <div className="text-xs text-white/70">{t.pages.join(", ")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}


