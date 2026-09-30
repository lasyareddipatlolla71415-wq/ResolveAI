export type Role = "USER" | "STAFF" | "TECHNICIAN" | "ADMIN";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "USER_CONFIRMATION"
  | "CLOSED"
  | "REOPENED"
  | "ESCALATED";

export interface Ticket {
  id: string;
  title: string;
  user: string;
  category: string;
  severity: Severity;
  priority: "P1" | "P2" | "P3" | "P4";
  status: TicketStatus;
  technician: string;
  aiConfidence: number;
  createdAt: string;
  sla: string;
  attemptedActions: string[];
  failedActions: string[];
  ragSources: string[];
  escalationReason?: string;
}

export interface ActionCandidate {
  id: string;
  name: string;
  category: string;
  risk: "low" | "medium" | "high";
  score: number;
  expectedSuccess: number;
  reason: string;
  status: "recommended" | "failed" | "available" | "blocked";
}

export interface Incident {
  id: string;
  title: string;
  category: string;
  affectedUsers: number;
  status: "Investigating" | "Monitoring" | "Resolved";
  similarity: number;
}

export interface Technician {
  id: string;
  name: string;
  skills: string[];
  status: "Available" | "Busy" | "Offline";
  workload: number;
  capacity: number;
  averageResolutionHours: number;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  rating?: number;
  resolvedTickets?: number;
  location?: string;
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
  tone: "good" | "warn" | "neutral";
}
