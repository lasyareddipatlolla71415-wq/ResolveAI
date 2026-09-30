import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone?: "good" | "warn" | "neutral";
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="rounded-md border border-slate-200 p-2 text-teal-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          "mt-4 text-sm",
          tone === "good" && "text-emerald-700",
          tone === "warn" && "text-amber-700",
          tone === "neutral" && "text-slate-500"
        )}
      >
        {delta}
      </p>
    </article>
  );
}
