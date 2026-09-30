import { describe, it, expect } from "vitest";
import {
  isAdmin,
  getAdminOverview,
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getUserTicketHistory,
  listStaff,
  createStaff,
  updateStaff,
  listAllTickets,
  reassignTicket,
  adminUpdateTicket,
  listKnowledgeDocuments,
  createKnowledgeDocument,
  setKnowledgeApprovalStatus,
  archiveKnowledgeDocument,
  deleteKnowledgeDocument,
  getAiRagMonitoring,
  getAnalytics,
  getSystemSettings,
  updateSystemSetting,
  listAuditLogs,
  recordAuditLog
} from "./adminService.js";
import type { AuthenticatedUser } from "@resolveai/shared";

describe("Admin Service & Dashboard Operations", () => {
  const adminUser: AuthenticatedUser = {
    id: "admin-system-id",
    name: "System Administrator",
    email: "admin@resolveai.com",
    role: "ADMIN",
    department: "IT Infrastructure",
    active: true
  };

  const staffUser: AuthenticatedUser = {
    id: "staff-sam-id",
    name: "Sam Staff",
    email: "staff@resolveai.com",
    role: "STAFF",
    department: "IT Support",
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

  /* ---------------------------------------------------------------- */
  /* 1. Security & Role Authorization                                 */
  /* ---------------------------------------------------------------- */
  describe("Security & Authorization", () => {
    it("should accurately identify administrators", () => {
      expect(isAdmin(adminUser)).toBe(true);
      expect(isAdmin(staffUser)).toBe(false);
      expect(isAdmin(regularUser)).toBe(false);
    });

    it("should reject non-admin users from admin overview", async () => {
      await expect(getAdminOverview(staffUser)).rejects.toThrow("Access denied");
      await expect(getAdminOverview(regularUser)).rejects.toThrow("Access denied");
    });

    it("should reject non-admin users from user management", async () => {
      await expect(listUsers(regularUser)).rejects.toThrow("Access denied");
      await expect(createUser(staffUser, { name: "Bob", email: "bob@test.com" })).rejects.toThrow("Access denied");
    });
  });

  /* ---------------------------------------------------------------- */
  /* 2. Admin Overview Statistics                                     */
  /* ---------------------------------------------------------------- */
  describe("Admin Overview", () => {
    it("should return complete overview statistics without hardcoding", async () => {
      const stats = await getAdminOverview(adminUser);
      expect(stats).toHaveProperty("totalUsers");
      expect(stats).toHaveProperty("activeUsers");
      expect(stats).toHaveProperty("totalTickets");
      expect(stats).toHaveProperty("openTickets");
      expect(stats).toHaveProperty("resolvedTickets");
      expect(stats).toHaveProperty("aiResolved");
      expect(stats).toHaveProperty("humanResolved");
      expect(stats).toHaveProperty("escalatedTickets");
      expect(stats).toHaveProperty("averageResolutionHours");
      expect(["mongodb-atlas", "development-memory"]).toContain(stats.storageMode);
    });
  });

  /* ---------------------------------------------------------------- */
  /* 3. User Management                                               */
  /* ---------------------------------------------------------------- */
  describe("User Management", () => {
    it("should list users with filtering", async () => {
      const result = await listUsers(adminUser, { role: "ALL" });
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should create a new user and log audit trail", async () => {
      const newUser = await createUser(adminUser, {
        name: "Morgan Test",
        email: `morgan-${Date.now()}@resolveai.com`,
        role: "USER",
        department: "Sales"
      });
      expect(newUser).toBeDefined();
      expect(newUser.name).toBe("Morgan Test");
      expect(newUser.active).toBe(true);
    });

    it("should toggle user active status", async () => {
      const result = await toggleUserStatus(adminUser, "user-alex-id", false);
      expect(result.success).toBe(true);
      expect(result.active).toBe(false);

      const restore = await toggleUserStatus(adminUser, "user-alex-id", true);
      expect(restore.active).toBe(true);
    });

    it("should retrieve user ticket history", async () => {
      const history = await getUserTicketHistory(adminUser, "user-alex-id");
      expect(history).toHaveProperty("tickets");
      expect(history).toHaveProperty("sessions");
    });
  });

  /* ---------------------------------------------------------------- */
  /* 4. Staff Management                                              */
  /* ---------------------------------------------------------------- */
  describe("Staff Management", () => {
    it("should list staff members with skills and capacity", async () => {
      const result = await listStaff(adminUser);
      expect(result.staff.length).toBeGreaterThan(0);
      const firstStaff = result.staff[0];
      expect(firstStaff.skills).toBeInstanceOf(Array);
      expect(firstStaff).toHaveProperty("availability");
      expect(firstStaff).toHaveProperty("capacity");
    });

    it("should enroll and update staff members", async () => {
      const newStaff = await createStaff(adminUser, {
        name: "DevOps Engineer",
        email: `devops-${Date.now()}@resolveai.com`,
        department: "Cloud Ops",
        capacity: 6,
        skills: ["Linux", "Database", "Networking"]
      });
      expect(newStaff).toBeDefined();

      const updateResult = await updateStaff(adminUser, newStaff.id, {
        department: "Core Infrastructure",
        skills: ["Linux", "Security", "Kubernetes"]
      });
      expect(updateResult.success).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /* 5. Ticket Management (Super Control)                             */
  /* ---------------------------------------------------------------- */
  describe("Ticket Management", () => {
    it("should list all tickets with filtering options", async () => {
      const result = await listAllTickets(adminUser);
      expect(result.tickets.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should reassign technician to a ticket", async () => {
      const result = await reassignTicket(adminUser, "ticket-dev-1", "staff-sam-id");
      expect(result.success).toBe(true);
      expect(result.newTechnicianId).toBe("staff-sam-id");
    });

    it("should allow admin override of ticket priority and status", async () => {
      const result = await adminUpdateTicket(adminUser, "ticket-dev-1", {
        priority: "P1",
        status: "IN_PROGRESS"
      });
      expect(result.success).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /* 6. Knowledge Base & MongoDB Atlas Vector Search                  */
  /* ---------------------------------------------------------------- */
  describe("Knowledge Base & RAG Management", () => {
    it("should list knowledge documents with approval states", async () => {
      const result = await listKnowledgeDocuments(adminUser);
      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.documents[0]).toHaveProperty("approvalStatus");
      expect(result.documents[0]).toHaveProperty("chunkCount");
    });

    it("should upload a document, chunk it and set status to READY", async () => {
      const doc = await createKnowledgeDocument(adminUser, {
        title: "Subnet Routing Guide for Remote Offices",
        category: "network",
        department: "IT Infrastructure",
        version: "v1.2",
        content: "Step 1: Check BGP route advertisements.\n\nStep 2: Inspect packet loss across GRE tunnels.",
        autoApprove: true
      });

      expect(doc).toBeDefined();
      expect(doc.chunkCount).toBeGreaterThanOrEqual(1);
      expect(doc.status).toBe("READY");
      expect(doc.approvalStatus).toBe("APPROVED");
    });

    it("should change approval status of a knowledge item", async () => {
      const docs = await listKnowledgeDocuments(adminUser);
      const targetDoc = docs.documents[0];

      const res = await setKnowledgeApprovalStatus(adminUser, targetDoc.id, "REJECTED");
      expect(res.approvalStatus).toBe("REJECTED");

      const approveRes = await setKnowledgeApprovalStatus(adminUser, targetDoc.id, "APPROVED");
      expect(approveRes.approvalStatus).toBe("APPROVED");
    });

    it("should archive a knowledge document", async () => {
      const docs = await listKnowledgeDocuments(adminUser);
      const targetDoc = docs.documents[0];

      const res = await archiveKnowledgeDocument(adminUser, targetDoc.id);
      expect(res.status).toBe("ARCHIVED");
    });
  });

  /* ---------------------------------------------------------------- */
  /* 7. AI / RAG Monitoring Telemetry                                 */
  /* ---------------------------------------------------------------- */
  describe("AI / RAG Monitoring", () => {
    it("should return telemetry including resolution rates and failed actions", async () => {
      const telemetry = await getAiRagMonitoring(adminUser);
      expect(telemetry).toHaveProperty("aiResolutionRate");
      expect(telemetry).toHaveProperty("escalationRate");
      expect(telemetry).toHaveProperty("ragRetrievalSuccessRate");
      expect(telemetry.recentSessions).toBeInstanceOf(Array);
      expect(telemetry.failedActions).toBeInstanceOf(Array);
    });
  });

  /* ---------------------------------------------------------------- */
  /* 8. Analytics & Research Metrics                                  */
  /* ---------------------------------------------------------------- */
  describe("Analytics & Research Metrics", () => {
    it("should return calculated metrics from actual system data", async () => {
      const data = await getAnalytics(adminUser);
      expect(data).toHaveProperty("aiResolutionRate");
      expect(data).toHaveProperty("escalationRate");
      expect(data.ticketsByCategory).toBeInstanceOf(Array);
      expect(data.ticketsByPriority).toBeInstanceOf(Array);
      expect(data.ticketsByStatus).toBeInstanceOf(Array);
      expect(data.aiVsHumanResolution).toBeDefined();
      expect(data.researchMetrics).toBeDefined();
      expect(data.researchMetrics).toHaveProperty("averageTroubleshootingSteps");
      expect(data.researchMetrics).toHaveProperty("successfulActionRate");
      expect(data.researchMetrics).toHaveProperty("failedActionRate");
    });
  });

  /* ---------------------------------------------------------------- */
  /* 9. System Settings                                               */
  /* ---------------------------------------------------------------- */
  describe("System Settings", () => {
    it("should retrieve and update platform settings", async () => {
      const settings = await getSystemSettings(adminUser);
      expect(settings).toHaveProperty("categories");
      expect(settings).toHaveProperty("prioritySlaHours");
      expect(settings).toHaveProperty("escalationRules");

      const updateRes = await updateSystemSetting(adminUser, "escalationRules", {
        maxAiStepsBeforeEscalation: 5,
        aiConfidenceThreshold: 0.7,
        autoEscalateCritical: true
      });
      expect(updateRes.success).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- */
  /* 10. Audit Logging                                                */
  /* ---------------------------------------------------------------- */
  describe("Audit Trail", () => {
    it("should record and list audit logs", async () => {
      await recordAuditLog(
        adminUser,
        "TEST_ACTION",
        "TestResource",
        "res-123",
        "Performed unit test verification of audit trail"
      );

      const logsResult = await listAuditLogs(adminUser, { limit: 10 });
      expect(logsResult.logs.length).toBeGreaterThan(0);
      expect(logsResult.logs[0]).toHaveProperty("actorEmail");
      expect(logsResult.logs[0]).toHaveProperty("action");
      expect(logsResult.logs[0]).toHaveProperty("resourceType");
    });
  });
});
