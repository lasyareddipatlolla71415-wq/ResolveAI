import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Ticket as TicketIcon,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { listTroubleshootingSessions, type TroubleshootingSessionItem } from "../services/api";
import { cn } from "../utils/cn";

const statusFilters = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Escalated", value: "ESCALATED" }
];

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  ACTIVE: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Activity },
  RESOLVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  ESCALATED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: ShieldAlert },
  ABANDONED: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: XCircle }
};

export function TroubleshootingSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TroubleshootingSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("");

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTroubleshootingSessions(activeFilter || undefined);
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Troubleshooting · My Sessions"
        title="AI-guided troubleshooting history"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadSessions}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              New Session
            </Link>
          </div>
        }
      />
      <main className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-400" />
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all border",
                activeFilter === f.value
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
            <Bot className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No troubleshooting sessions</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start a new AI support session to begin troubleshooting your IT issues.
            </p>
            <Link
              to="/support"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start AI Support
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const style = statusStyles[session.status] || statusStyles.ACTIVE;
              const StatusIcon = style.icon;
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                        style.bg, style.border
                      )}>
                        <StatusIcon className={cn("h-5 w-5", style.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{session.problemDescription}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 capitalize">
                            {session.category}
                          </span>
                          <StatusBadge value={session.severity} />
                          <StatusBadge value={session.status} />
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(session.createdAt)}
                          </span>
                        </div>
                        {/* Steps summary */}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-[11px] text-slate-500">
                            <strong className="text-slate-700">{session.steps.length}</strong> step{session.steps.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Confidence: <strong className="text-slate-700">{Math.round(session.aiConfidence * 100)}%</strong>
                          </span>
                          {session.ticketId && (
                            <Link
                              to={`/tickets/${session.ticketId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800"
                            >
                              <TicketIcon className="h-3 w-3" />
                              View Ticket
                            </Link>
                          )}
                        </div>
                        {session.escalationReason && (
                          <p className="mt-2 text-[11px] text-rose-600 font-medium">
                            Escalation: {session.escalationReason}
                          </p>
                        )}
                        {session.resolutionSummary && (
                          <p className="mt-2 text-[11px] text-emerald-600 font-medium">
                            ✓ {session.resolutionSummary}
                          </p>
                        )}
                      </div>
                    </div>
                    {session.status === "ACTIVE" && (
                      <Link
                        to="/support"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-all"
                      >
                        Continue
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
