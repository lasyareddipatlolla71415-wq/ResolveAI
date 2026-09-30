import { describe, it, expect } from "vitest";
import { IncidentDetectionService } from "./IncidentDetectionService.js";
import { getDevStaffTicketsMap } from "../staffService.js";

describe("IncidentDetectionService (Phase 16)", () => {
  const service = new IncidentDetectionService();

  it("tokenizes and cleans technical text correctly", () => {
    const tokens = service.tokenize("Help! My GlobalProtect VPN is disconnecting with handshake error.");
    expect(tokens).toContain("globalprotect");
    expect(tokens).toContain("vpn");
    expect(tokens).toContain("disconnecting");
    expect(tokens).toContain("handshake");
    expect(tokens).not.toContain("help");
    expect(tokens).not.toContain("my");
    expect(tokens).not.toContain("is");
  });

  it("calculates high similarity for closely paraphrased issues in the same category", () => {
    const tokensA = service.tokenize("Production VPN gateway disconnects repeatedly during conference calls");
    const tokensB = service.tokenize("VPN gateway disconnection timeout during video calls");

    const jaccard = service.jaccardSimilarity(tokensA, tokensB);
    const cosine = service.cosineSimilarity(tokensA, tokensB);

    expect(jaccard).toBeGreaterThanOrEqual(0.3);
    expect(cosine).toBeGreaterThanOrEqual(0.45);
  });

  it("detects candidate duplicates from existing ticket repository", async () => {
    const result = await service.detectPotentialDuplicate({
      title: "VPN gateway drops connection after 1 minute",
      description: "My GlobalProtect VPN tunnel drops connection during video calls with handshake error",
      category: "vpn"
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    const topMatch = result.candidates[0];
    expect(topMatch.similarity).toBeGreaterThan(0.45);
    expect(topMatch.matchedKeywords.length).toBeGreaterThan(0);
    expect(topMatch.recommendation).toBeDefined();
  });

  it("returns low similarity when problem is completely distinct", async () => {
    const result = await service.detectPotentialDuplicate({
      title: "Office cafeteria badge printer jammed",
      description: "Plastic badge stuck inside physical card feeder mechanism",
      category: "facilities"
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.highestSimilarity).toBeLessThan(0.45);
  });

  it("identifies incident clusters and potential outages", async () => {
    const clusters = await service.getIncidentClusters();
    expect(Array.isArray(clusters)).toBe(true);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it("links a ticket as duplicate successfully", async () => {
    const devMap = getDevStaffTicketsMap();
    const fakeTicketId = `ticket-test-dup-${Date.now()}`;
    devMap.set(fakeTicketId, {
      id: fakeTicketId,
      title: "Duplicate VPN drop report",
      description: "Same VPN drop",
      category: "vpn",
      severity: "MEDIUM",
      priority: "P3",
      status: "OPEN",
      userId: "user-test",
      userName: "Test User",
      userEmail: "test@resolveai.com",
      aiConfidence: 0.5,
      attemptedActions: [],
      failedActions: [],
      ragSources: [],
      escalationReason: "Escalated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      technicianActions: [],
      replies: []
    });

    const linkResult = await service.linkDuplicate(
      fakeTicketId,
      "ticket-dev-1",
      {
        id: "staff-sam-id",
        name: "Sam Staff",
        email: "staff@resolveai.com",
        role: "STAFF",
        active: true
      },
      "Identified as exact duplicate of ongoing VPN incident"
    );

    expect(linkResult.success).toBe(true);
    const updated = devMap.get(fakeTicketId);
    expect(updated?.status).toBe("RESOLVED");
    expect(updated?.resolution?.rootCause).toContain("Duplicate Incident");
  });
});
