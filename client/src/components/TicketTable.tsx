import React from "react";
import { ArrowRight, Bot, Clock, ExternalLink, MessageSquare, ShieldAlert, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { TicketResponseItem } from "../services/api";
import { tickets as defaultTickets } from "../data/demoData";
import { StatusBadge } from "./StatusBadge";
import { cn } from "../utils/cn";

export interface TicketTableProps {
  tickets?: (TicketResponseItem | {
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    technician?: string;
    sla?: string;
    createdAt?: string;
    aiConfidence?: number;
  })[];
  isLoading?: boolean;
}

export function TicketTable({ tickets = defaultTickets, isLoading }: TicketTableProps) {
  const formatTime = (dateStr?: string) => {
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

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-teal-600 border-r-transparent mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">No tickets found</h4>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          No tickets match your active filter criteria or you haven't submitted any incidents yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Ticket ID & Subject</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Severity</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Assignment</th>
              <th className="px-4 py-3.5">Created</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const technicianName = "technician" in ticket && ticket.technician ? ticket.technician : ("technicianId" in ticket && ticket.technicianId ? "Assigned Staff" : "AI Triaged");
              const isEscalated = ticket.status === "ESCALATED" || ticket.severity === "CRITICAL";

              return (
                <tr
                  key={ticket.id}
                  className={cn(
                    "group hover:bg-slate-50/80 transition-colors",
                    isEscalated && "bg-rose-50/20"
                  )}
                >
                  {/* ID & Title */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {ticket.id.startsWith("TCK-") ? ticket.id : `#${ticket.id.slice(-6).toUpperCase()}`}
                      </span>
                      {isEscalated && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-rose-700">
                          <ShieldAlert className="h-3 w-3" />
                          Escalated
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-1 max-w-[320px] font-medium">
                      {ticket.title}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                      {ticket.category}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="px-4 py-4">
                    <StatusBadge value={ticket.severity} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge value={ticket.status} />
                  </td>

                  {/* Assignment */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                        technicianName === "AI Triaged"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-indigo-100 text-indigo-700"
                      )}>
                        {technicianName === "AI Triaged" ? <Bot className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[130px]">
                        {technicianName}
                      </span>
                    </div>
                  </td>

                  {/* Created / Relative SLA */}
                  <td className="px-4 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatTime("createdAt" in ticket ? ticket.createdAt : ("sla" in ticket ? ticket.sla : undefined))}</span>
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 shadow-2xs transition-all"
                      title="View ticket details"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
