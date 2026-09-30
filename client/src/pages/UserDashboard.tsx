import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Ticket,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  getDashboardStats,
  listTicketsApi,
  listTroubleshootingSessions,
  type TicketResponseItem,
  type TroubleshootingSessionItem
} from "../services/api";
import { cn } from "../utils/cn";

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSessions: 0,
    resolvedSessions: 0,
    escalatedSessions: 0,
    openTickets: 0,
    pendingTickets: 0,
    totalTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState<TicketResponseItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<TroubleshootingSessionItem[]>([]);
  const [recentResolved, setRecentResolved] = useState<TroubleshootingSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, ticketsData, sessionsData, resolvedData] = await Promise.allSettled([
        getDashboardStats(),
        listTicketsApi({ limit: 5 }),
        listTroubleshootingSessions("ACTIVE"),
        listTroubleshootingSessions("RESOLVED")
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (ticketsData.status === "fulfilled") setRecentTickets(ticketsData.value.tickets || []);
      if (sessionsData.status === "fulfilled") setActiveSessions(sessionsData.value || []);
      if (resolvedData.status === "fulfilled") setRecentResolved((resolvedData.value || []).slice(0, 5));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = [
    {
      label: "Active Sessions",
      value: stats.activeSessions.toString(),
      delta: "Currently troubleshooting",
      icon: Bot,
      tone: stats.activeSessions > 0 ? "warn" : "good",
      color: "from-violet-500 to-purple-600"
    },
    {
      label: "Open Tickets",
      value: stats.openTickets.toString(),
      delta: `${stats.pendingTickets} pending confirmation`,
      icon: Ticket,
      tone: stats.openTickets > 0 ? "warn" : "good",
      color: "from-amber-500 to-orange-600"
    },
    {
      label: "Resolved Issues",
      value: stats.resolvedSessions.toString(),
      delta: "Solved via AI support",
      icon: CheckCircle2,
      tone: "good",
      color: "from-emerald-500 to-teal-600"
    },
    {
      label: "Total Interactions",
      value: (stats.resolvedSessions + stats.escalatedSessions + stats.activeSessions).toString(),
      delta: `${stats.escalatedSessions} escalated`,
      icon: TrendingUp,
      tone: "neutral",
      color: "from-blue-500 to-indigo-600"
    }
  ] as const;

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={`User Workspace · Welcome back, ${user?.name || "User"}`}
        title="Describe the problem first, escalate only when needed"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs disabled:opacity-50 transition-all"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 transition-all active:scale-[0.97]"
              to="/support"
            >
              <Sparkles className="h-4 w-4" />
              Start AI Support
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        }
      />
      <main className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>{error} — Showing cached data.</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950 tabular-nums">
                    {isLoading ? (
                      <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-slate-200" />
                    ) : (
                      metric.value
                    )}
                  </p>
                </div>
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                  metric.color
                )}>
                  <metric.icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className={cn(
                "mt-3 text-xs font-medium",
                metric.tone === "good" && "text-emerald-600",
                metric.tone === "warn" && "text-amber-600",
                metric.tone === "neutral" && "text-slate-500"
              )}>
                {metric.delta}
              </p>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                metric.color
              )} />
            </article>
          ))}
        </div>

        {/* Main Content */}
        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Left: Active Sessions + Recent Tickets */}
          <div className="space-y-6">
            {/* Active Troubleshooting Sessions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-700">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Active Troubleshooting</h2>
                  {activeSessions.length > 0 && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {activeSessions.length}
                    </span>
                  )}
                </div>
                <Link to="/sessions" className="text-xs font-semibold text-teal-600 hover:text-teal-800">
                  View all
                </Link>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <Bot className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-500">No active troubleshooting sessions</p>
                    <Link
                      to="/support"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800"
                    >
                      <Sparkles className="h-3 w-3" />
                      Start a new session
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.slice(0, 3).map((session) => (
                      <Link
                        key={session.id}
                        to={`/sessions/${session.id}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 hover:bg-teal-50/30 hover:border-teal-200 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold">
                            {session.currentStepNumber}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{session.problemDescription}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Step {session.currentStepNumber} · {session.category} · {formatTimeAgo(session.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-700">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">My Tickets</h2>
                </div>
                <Link to="/tickets" className="text-xs font-semibold text-teal-600 hover:text-teal-800">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : recentTickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-500">No tickets yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try AI Support first — tickets are created only when needed.</p>
                  </div>
                ) : (
                  recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/70 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                          #{ticket.id.slice(-6).toUpperCase()}
                        </span>
                        <p className="text-xs font-medium text-slate-800 truncate">{ticket.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge value={ticket.status} />
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-600" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  to="/support"
                  className="flex items-center gap-3 rounded-xl border border-teal-200/60 bg-gradient-to-r from-teal-50 to-emerald-50 p-3.5 hover:from-teal-100 hover:to-emerald-100 transition-all group"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white shadow-sm">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">New Support Request</p>
                    <p className="text-[11px] text-slate-500">Describe your problem to AI</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-teal-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/tickets"
                  className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 hover:bg-slate-100/60 transition-all group"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200 text-slate-700">
                    <Ticket className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">View My Tickets</p>
                    <p className="text-[11px] text-slate-500">Track escalated issues</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 hover:bg-slate-100/60 transition-all group"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-200 text-slate-700">
                    <LifeBuoy className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Notifications</p>
                    <p className="text-[11px] text-slate-500">Updates & status changes</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Recently Resolved */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Recently Resolved</h2>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : recentResolved.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No resolved sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {recentResolved.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/60 p-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{session.problemDescription}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {session.totalStepsAttempted} step{session.totalStepsAttempted !== 1 ? "s" : ""} · {formatTimeAgo(session.resolvedAt || session.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4">How ResolveAI Works</h2>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Describe your problem", desc: "Tell the AI what's happening" },
                  { step: "2", title: "AI troubleshoots", desc: "Guided steps from approved knowledge" },
                  { step: "3", title: "Report outcome", desc: "Tell us if it worked" },
                  { step: "4", title: "Escalate if needed", desc: "Auto-ticket creation when required" }
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-50 border border-teal-200/60 text-xs font-bold text-teal-700">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
