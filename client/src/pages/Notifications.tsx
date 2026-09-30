import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Ticket,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import {
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type NotificationItem
} from "../services/api";
import { cn } from "../utils/cn";

const typeIcons: Record<string, any> = {
  TICKET_CREATED: Ticket,
  TECHNICIAN_ASSIGNED: User,
  TICKET_UPDATED: Bell,
  INFO_REQUESTED: ShieldAlert,
  TICKET_RESOLVED: Check,
  TICKET_CLOSED: CheckCheck,
  SESSION_ESCALATED: ShieldAlert,
  SESSION_RESOLVED: Check
};

const typeColors: Record<string, string> = {
  TICKET_CREATED: "bg-amber-100 text-amber-700",
  TECHNICIAN_ASSIGNED: "bg-indigo-100 text-indigo-700",
  TICKET_UPDATED: "bg-blue-100 text-blue-700",
  INFO_REQUESTED: "bg-rose-100 text-rose-700",
  TICKET_RESOLVED: "bg-emerald-100 text-emerald-700",
  TICKET_CLOSED: "bg-slate-100 text-slate-600",
  SESSION_ESCALATED: "bg-rose-100 text-rose-700",
  SESSION_RESOLVED: "bg-emerald-100 text-emerald-700"
};

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listNotificationsApi(showUnreadOnly);
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [showUnreadOnly]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markNotificationReadApi(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Support updates & alerts"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                showUnreadOnly
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <BellOff className="h-3.5 w-3.5" />
              {showUnreadOnly ? "Showing Unread" : "Show Unread Only"}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark All Read
              </button>
            )}
            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />
      <main className="p-6 space-y-4 max-w-4xl">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No notifications</h3>
            <p className="text-xs text-slate-500 mt-1">
              {showUnreadOnly ? "No unread notifications." : "You'll see updates about tickets and support sessions here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              const iconColor = typeColors[notif.type] || "bg-slate-100 text-slate-600";
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    notif.read
                      ? "border-slate-200/60 bg-white"
                      : "border-teal-200/60 bg-teal-50/20 shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-xs truncate",
                          notif.read ? "font-medium text-slate-700" : "font-bold text-slate-900"
                        )}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatTime(notif.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Mark read
                          </button>
                        )}
                        {notif.relatedTicketId && (
                          <Link
                            to={`/tickets/${notif.relatedTicketId}`}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View ticket
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-2" />
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
