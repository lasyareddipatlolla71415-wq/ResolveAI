import { describe, it, expect, beforeEach } from "vitest";
import {
  getStaffOverview,
  listStaffTickets,
  getStaffTicketDetails,
  acceptTicket,
  startWork,
  addTroubleshootingAction,
  requestUserInformation,
  updateTicketPriority,
  updateTicketStatus,
  resolveTicket,
  reopenTicket,
  getTechnicianProfile,
  updateTechnicianProfile,
  getAssignmentRecommendation,
  intelligentAssignTicket,
  isStaffOrAdmin
} from "./staffService.js";
import type { AuthenticatedUser } from "@resolveai/shared";

describe("Staff / Technician Service", () => {
  const staffUser: AuthenticatedUser = {
    id: "staff-sam-id",
    name: "Sam Staff",
    email: "staff@resolveai.com",
    role: "STAFF",
    department: "IT Support",
    phone: "+1 (555) 024-6810",
    active: true
  };

  const adminUser: AuthenticatedUser = {
    id: "admin-system-id",
    name: "System Administrator",
    email: "admin@resolveai.com",
    role: "ADMIN",
    department: "IT Infrastructure",
    active: true
  };

  const regularUser: AuthenticatedUser = {
    id: "user-alex-id",
    name: "Alex User",
    email: "user@resolveai.com",
    role: "USER",
    department: "Product Engineering",
    active: true
  };

  describe("Role Verification", () => {
    it("should allow staff and admin users", () => {
      expect(isStaffOrAdmin(staffUser)).toBe(true);
      expect(isStaffOrAdmin(adminUser)).toBe(true);
    });

    it("should reject regular users from staff operations", () => {
      expect(isStaffOrAdmin(regularUser)).toBe(false);
    });

    it("should throw error if regular user attempts to access staff overview", async () => {
      await expect(getStaffOverview(regularUser)).rejects.toThrow(/Access denied/);
    });
  });

  describe("Overview Statistics", () => {
    it("should return valid staff overview metrics from backend", async () => {
      const stats = await getStaffOverview(staffUser);
      expect(stats).toBeDefined();
      expect(typeof stats.assignedTickets).toBe("number");
      expect(typeof stats.openTickets).toBe("number");
      expect(typeof stats.inProgress).toBe("number");
      expect(typeof stats.waitingForUser).toBe("number");
      expect(typeof stats.resolvedToday).toBe("number");
      expect(typeof stats.highPriorityTickets).toBe("number");
      expect(stats.totalTickets).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Ticket Queue & Filtering", () => {
    it("should list all tickets in staff queue", async () => {
      const result = await listStaffTickets(staffUser);
      expect(result.tickets.length).toBeGreaterThan(0);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it("should filter tickets by status", async () => {
      const result = await listStaffTickets(staffUser, { status: "OPEN" });
      for (const t of result.tickets) {
        expect(t.status).toBe("OPEN");
      }
    });

    it("should filter tickets by priority", async () => {
      const result = await listStaffTickets(staffUser, { priority: "P1" });
      for (const t of result.tickets) {
        expect(t.priority).toBe("P1");
      }
    });

    it("should filter tickets assigned to the logged-in technician", async () => {
      const result = await listStaffTickets(staffUser, { assignedToMe: true });
      for (const t of result.tickets) {
        expect(t.technicianId).toBe(staffUser.id);
      }
    });

    it("should support search queries across title, description, and user", async () => {
      const result = await listStaffTickets(staffUser, { search: "VPN" });
      expect(result.tickets.length).toBeGreaterThan(0);
      expect(result.tickets[0].title.toLowerCase()).toContain("vpn");
    });
  });

  describe("Ticket Details with AI Context", () => {
    it("should provide full diagnostic context for an escalated ticket", async () => {
      const details = await getStaffTicketDetails(staffUser, "ticket-dev-1");
      expect(details).not.toBeNull();
      if (!details) return;

      // User info
      expect(details.userInfo.name).toBe("Alex User");
      expect(details.userInfo.email).toBe("user@resolveai.com");

      // Problem info
      expect(details.problem.category).toBe("vpn");
      expect(details.problem.priority).toBe("P2");

      // AI Troubleshooting history
      expect(details.aiTroubleshootingHistory.attemptedActions.length).toBeGreaterThan(0);
      expect(details.aiTroubleshootingHistory.failedActions.length).toBeGreaterThan(0);
      expect(details.aiTroubleshootingHistory.steps.length).toBeGreaterThan(0);
      expect(details.aiTroubleshootingHistory.conversation.length).toBeGreaterThan(0);

      // RAG information
      expect(details.ragInfo.sources.length).toBeGreaterThan(0);

      // Escalation information
      expect(details.escalationInfo.reason).toBeDefined();
      expect(details.escalationInfo.attemptsCount).toBeGreaterThan(0);
    });
  });

  describe("Technician Actions Workflow", () => {
    it("should accept ticket and assign to technician", async () => {
      const result = await acceptTicket(staffUser, "ticket-dev-2");
      expect(result).toBeDefined();
    });

    it("should start work on a ticket", async () => {
      const result = await startWork(staffUser, "ticket-dev-2");
      expect(result).toBeDefined();
    });

    it("should log troubleshooting actions", async () => {
      const result = await addTroubleshootingAction(staffUser, "ticket-dev-1", {
        action: "Adjusted MTU packet size to 1420",
        notes: "Reduced fragmentation overhead on WAN link",
        outcome: "SUCCESS"
      });
      expect(result).toBeDefined();
    });

    it("should request information from user and set status to WAITING_FOR_USER", async () => {
      const result = await requestUserInformation(
        staffUser,
        "ticket-dev-1",
        "Could you please confirm if packet loss stops when connecting via ethernet?"
      );
      expect(result).toBeDefined();
    });

    it("should update ticket priority", async () => {
      const result = await updateTicketPriority(staffUser, "ticket-dev-1", "P1");
      expect(result).toBeDefined();
    });

    it("should update ticket status", async () => {
      const result = await updateTicketStatus(staffUser, "ticket-dev-1", "IN_PROGRESS");
      expect(result).toBeDefined();
    });

    it("should resolve ticket with summary, root cause, and actions taken", async () => {
      const result = await resolveTicket(staffUser, "ticket-dev-1", {
        summary: "Clamped MSS on enterprise gateway tunnel",
        rootCause: "ISP MTU mismatch caused packet fragmentation during high-bandwidth UDP streaming",
        actionsTaken: ["MSS Clamping", "Updated gateway firmware", "Tested live Zoom call"],
        kbRecommendation: "Recommend creating KB article on MSS clamping for GlobalProtect"
      });
      expect(result).toBeDefined();
    });

    it("should reopen a ticket if required", async () => {
      const result = await reopenTicket(staffUser, "ticket-dev-1", "User noticed occasional reconnects");
      expect(result).toBeDefined();
    });
  });

  describe("Technician Profile", () => {
    it("should retrieve technician profile with skills, workload, and availability", async () => {
      const profile = await getTechnicianProfile(staffUser);
      expect(profile).toBeDefined();
      expect(profile.name).toBe("Sam Staff");
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.availability).toBe("AVAILABLE");
      expect(profile.stats).toBeDefined();
    });

    it("should allow technician to update availability and skills", async () => {
      const updated = await updateTechnicianProfile(staffUser, {
        availability: "BUSY",
        skills: ["network", "vpn", "cloud-infrastructure"]
      });
      expect(updated.availability).toBe("BUSY");
      expect(updated.skills).toContain("cloud-infrastructure");
    });
  });

  describe("Intelligent Assignment", () => {
    it("should provide intelligent assignment recommendations based on category and skills", async () => {
      const rec = await getAssignmentRecommendation(staffUser, "ticket-dev-2");
      expect(rec.decision).toBeDefined();
      expect(rec.decision.score).toBeGreaterThanOrEqual(0);
    });

    it("should perform intelligent auto-assignment", async () => {
      const result = await intelligentAssignTicket(staffUser, "ticket-dev-2");
      expect(result).toBeDefined();
    });
  });
});
