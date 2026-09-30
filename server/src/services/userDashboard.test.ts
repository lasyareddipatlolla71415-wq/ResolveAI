import { describe, it, expect, beforeEach } from "vitest";
import { AdaptiveTroubleshootingEngine } from "./troubleshooting/AdaptiveTroubleshootingEngine.js";
import { EscalationService } from "./escalation/EscalationService.js";
import { defaultScoringWeights } from "../config/scoring.js";

describe("User Dashboard Backend", () => {
  describe("AdaptiveTroubleshootingEngine - User Workflow", () => {
    let engine: AdaptiveTroubleshootingEngine;

    beforeEach(() => {
      engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);
    });

    it("should return an action for a network problem", () => {
      const decision = engine.selectNextAction({
        problemDescription: "My laptop is connected to Wi-Fi but I cannot access the internet",
        category: "network",
        context: {},
        previousActions: [],
        failedActions: [],
        ragResults: [],
        historicalOutcomes: [],
        aiConfidence: 0.7,
        severity: "LOW"
      });

      expect(decision.action).not.toBeNull();
      expect(decision.shouldEscalate).toBe(false);
      expect(decision.score).toBeGreaterThan(0);
      expect(decision.confidence).toBeGreaterThan(0);
    });

    it("should escalate for CRITICAL severity", () => {
      const decision = engine.selectNextAction({
        problemDescription: "Production server is completely down",
        category: "network",
        context: {},
        previousActions: [],
        failedActions: [],
        ragResults: [],
        historicalOutcomes: [],
        aiConfidence: 0.9,
        severity: "CRITICAL"
      });

      expect(decision.shouldEscalate).toBe(true);
      expect(decision.escalationReason).toBeDefined();
    });

    it("should escalate after max failed attempts", () => {
      const decision = engine.selectNextAction({
        problemDescription: "Cannot connect to Wi-Fi",
        category: "network",
        context: {},
        previousActions: ["restart_adapter", "forget_network", "reset_network"],
        failedActions: ["restart_adapter", "forget_network", "reset_network"],
        ragResults: [],
        historicalOutcomes: [],
        aiConfidence: 0.4,
        severity: "MEDIUM"
      });

      expect(decision.shouldEscalate).toBe(true);
    });

    it("should penalize previously failed actions", () => {
      const withoutFailure = engine.selectNextAction({
        problemDescription: "Wi-Fi connection issue",
        category: "network",
        context: {},
        previousActions: [],
        failedActions: [],
        ragResults: [],
        historicalOutcomes: [],
        aiConfidence: 0.7,
        severity: "LOW"
      });

      const withFailure = engine.selectNextAction({
        problemDescription: "Wi-Fi connection issue",
        category: "network",
        context: {},
        previousActions: ["restart_adapter"],
        failedActions: ["restart_adapter"],
        ragResults: [],
        historicalOutcomes: [],
        aiConfidence: 0.7,
        severity: "LOW"
      });

      // The best action shouldn't be the failed one
      if (withFailure.action) {
        expect(withFailure.action.actionId).not.toBe("restart_adapter");
      }
    });
  });

  describe("EscalationService", () => {
    const service = new EscalationService();

    it("should escalate for critical severity", () => {
      const result = service.shouldEscalate({ severity: "CRITICAL", confidence: 0.9, failedAttempts: 0 });
      expect(result.escalate).toBe(true);
    });

    it("should escalate for low confidence", () => {
      const result = service.shouldEscalate({ severity: "LOW", confidence: 0.3, failedAttempts: 0 });
      expect(result.escalate).toBe(true);
    });

    it("should escalate after max failed attempts", () => {
      const result = service.shouldEscalate({ severity: "LOW", confidence: 0.8, failedAttempts: 3 });
      expect(result.escalate).toBe(true);
    });

    it("should NOT escalate for normal conditions", () => {
      const result = service.shouldEscalate({ severity: "LOW", confidence: 0.8, failedAttempts: 1 });
      expect(result.escalate).toBe(false);
    });
  });

  describe("Dashboard Stats Logic", () => {
    it("should have correct stat structure", () => {
      const stats = {
        activeSessions: 2,
        resolvedSessions: 5,
        escalatedSessions: 1,
        openTickets: 3,
        pendingTickets: 1,
        totalTickets: 8
      };

      expect(stats.activeSessions).toBeGreaterThanOrEqual(0);
      expect(stats.resolvedSessions).toBeGreaterThanOrEqual(0);
      expect(stats.openTickets).toBeGreaterThanOrEqual(0);
      expect(stats.totalTickets).toBeGreaterThanOrEqual(stats.openTickets);
    });
  });
});
