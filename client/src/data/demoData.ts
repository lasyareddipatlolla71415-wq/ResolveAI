import type { ActionCandidate, Incident, Metric, Technician, Ticket } from "../types/domain";

export const overviewMetrics: Metric[] = [
  { label: "AI resolution rate", value: "68%", delta: "+12% vs ticket-first", tone: "good" },
  { label: "Ticket reduction", value: "31%", delta: "synthetic baseline", tone: "good" },
  { label: "Avg attempts", value: "2.4", delta: "-0.8 from RAG-only", tone: "good" },
  { label: "Escalation rate", value: "24%", delta: "risk controlled", tone: "neutral" }
];

export const tickets: Ticket[] = [
  {
    id: "TCK-1048",
    title: "Laptop cannot connect to campus Wi-Fi",
    user: "Aarav Mehta",
    category: "Network",
    severity: "MEDIUM",
    priority: "P3",
    status: "IN_PROGRESS",
    technician: "Arjun Rao",
    aiConfidence: 0.84,
    createdAt: "28 Aug, 10:05",
    sla: "3h 20m",
    attemptedActions: ["Restart adapter", "Forget network"],
    failedActions: ["Restart adapter"],
    ragSources: ["Wi-Fi Authentication Runbook", "Windows Network Reset Guide"],
    escalationReason: "Second action requires technician approval"
  },
  {
    id: "TCK-1049",
    title: "Production server is completely down",
    user: "Nisha Kapoor",
    category: "Server",
    severity: "CRITICAL",
    priority: "P1",
    status: "ESCALATED",
    technician: "Rahul Iyer",
    aiConfidence: 0.92,
    createdAt: "28 Aug, 10:18",
    sla: "18m",
    attemptedActions: [],
    failedActions: [],
    ragSources: ["Critical Incident Policy"],
    escalationReason: "Critical issue bypass"
  },
  {
    id: "TCK-1050",
    title: "Email login fails after password reset",
    user: "Diya Shah",
    category: "Identity",
    severity: "LOW",
    priority: "P4",
    status: "USER_CONFIRMATION",
    technician: "Priya Nair",
    aiConfidence: 0.73,
    createdAt: "28 Aug, 09:41",
    sla: "5h 05m",
    attemptedActions: ["Verify account lock", "Clear cached credentials"],
    failedActions: ["Verify account lock"],
    ragSources: ["Identity Access FAQ"]
  }
];

export const actionCandidates: ActionCandidate[] = [
  {
    id: "forget_network",
    name: "Forget and reconnect Wi-Fi network",
    category: "Network",
    risk: "low",
    score: 0.84,
    expectedSuccess: 0.78,
    reason: "High historical success for similar authentication failures.",
    status: "recommended"
  },
  {
    id: "restart_adapter",
    name: "Restart network adapter",
    category: "Network",
    risk: "low",
    score: 0.29,
    expectedSuccess: 0.61,
    reason: "Penalized because it already failed in this troubleshooting path.",
    status: "failed"
  },
  {
    id: "reset_network",
    name: "Reset network settings",
    category: "Network",
    risk: "medium",
    score: 0.63,
    expectedSuccess: 0.43,
    reason: "Available after safer actions fail or technician approves.",
    status: "available"
  }
];

export const incidents: Incident[] = [
  {
    id: "INC-220",
    title: "College Wi-Fi unavailable in Block C",
    category: "Network",
    affectedUsers: 12,
    status: "Investigating",
    similarity: 0.91
  },
  {
    id: "INC-219",
    title: "Email MFA prompts repeating",
    category: "Identity",
    affectedUsers: 7,
    status: "Monitoring",
    similarity: 0.84
  }
];

export const technicians: Technician[] = [
  {
    id: "TECH-1",
    name: "Arjun Rao",
    title: "Lead Infrastructure & Network Engineer",
    department: "Network Operations",
    email: "arjun.rao@resolveai.com",
    phone: "+1 (555) 349-8821",
    location: "HQ · Building A, Fl 3",
    rating: 4.9,
    resolvedTickets: 184,
    skills: ["Network", "Server", "Cisco", "DNS", "Firewall"],
    status: "Available",
    workload: 2,
    capacity: 8,
    averageResolutionHours: 2.8
  },
  {
    id: "TECH-2",
    name: "Rahul Iyer",
    title: "Senior Security & Systems Architect",
    department: "InfoSec & Compliance",
    email: "rahul.iyer@resolveai.com",
    phone: "+1 (555) 782-9014",
    location: "Data Center · West Wing",
    rating: 4.8,
    resolvedTickets: 240,
    skills: ["Server", "Security", "Linux", "Kubernetes", "Incident Response"],
    status: "Busy",
    workload: 6,
    capacity: 7,
    averageResolutionHours: 2.4
  },
  {
    id: "TECH-3",
    name: "Priya Nair",
    title: "Identity & Endpoint Administrator",
    department: "Directory Services",
    email: "priya.nair@resolveai.com",
    phone: "+1 (555) 612-4091",
    location: "HQ · Building B, Fl 2",
    rating: 4.95,
    resolvedTickets: 156,
    skills: ["Identity", "Hardware", "Azure AD", "Okta", "MDM"],
    status: "Available",
    workload: 1,
    capacity: 6,
    averageResolutionHours: 3.5
  },
  {
    id: "TECH-4",
    name: "Meera Sen",
    title: "Database & Cloud Applications Specialist",
    department: "Cloud Platforms",
    email: "meera.sen@resolveai.com",
    phone: "+1 (555) 201-7783",
    location: "Remote · Central Region",
    rating: 4.7,
    resolvedTickets: 198,
    skills: ["Applications", "Database", "PostgreSQL", "MongoDB", "AWS"],
    status: "Available",
    workload: 3,
    capacity: 7,
    averageResolutionHours: 3.2
  },
  {
    id: "TECH-5",
    name: "David Chen",
    title: "L2 Technical Support Specialist",
    department: "User Operations",
    email: "david.chen@resolveai.com",
    phone: "+1 (555) 438-1920",
    location: "HQ · Ground Floor Helpdesk",
    rating: 4.85,
    resolvedTickets: 112,
    skills: ["Hardware", "macOS", "Windows", "Peripherals"],
    status: "Available",
    workload: 2,
    capacity: 6,
    averageResolutionHours: 1.9
  }
];

export const rootCauseData = [
  { name: "Authentication", value: 38 },
  { name: "Driver", value: 24 },
  { name: "Infrastructure", value: 21 },
  { name: "Credentials", value: 10 },
  { name: "Other", value: 7 }
];

export const experimentData = [
  { method: "Traditional", tickets: 100, attempts: 0, resolutionTime: 9.4 },
  { method: "RAG-only", tickets: 62, attempts: 3.1, resolutionTime: 6.7 },
  { method: "ResolveAI", tickets: 41, attempts: 2.2, resolutionTime: 4.8 }
];
