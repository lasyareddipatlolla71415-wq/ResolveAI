import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 text-white shadow-md shadow-teal-500/20">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      </div>
      <div className="relative rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">ResolveAI is thinking</span>
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
