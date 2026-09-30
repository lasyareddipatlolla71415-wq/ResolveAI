import { describe, expect, it } from "vitest";
import type { ActionOutcome } from "@resolveai/shared";
import { defaultScoringWeights } from "../../config/scoring.js";
import { AdaptiveTroubleshootingEngine } from "./AdaptiveTroubleshootingEngine.js";

const engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);

describe("AdaptiveTroubleshootingEngine", () => {
  it("immediately escalates critical problems", () => {
    const decision = engine.selectNextAction({
      problemDescription: "Production server is completely down",
      category: "server",
      context: {},
      previousActions: [],
      failedActions: [],
      ragResults: [],
      historicalOutcomes: [],
      aiConfidence: 0.9,
      severity: "CRITICAL"
    });

    expect(decision.shouldEscalate).toBe(true);
    expect(decision.action).toBeNull();
    expect(decision.escalationReason).toContain("Critical");
  });

  it("penalizes a failed action so a better historical action can be selected", () => {
    const outcomes: ActionOutcome[] = [
      outcome("restart_adapter", "FAILURE"),
      outcome("restart_adapter", "FAILURE"),
      outcome("forget_network", "SUCCESS"),
      outcome("forget_network", "SUCCESS"),
      outcome("forget_network", "FAILURE")
    ];

    const decision = engine.selectNextAction({
      problemDescription: "My laptop cannot connect to Wi-Fi",
      category: "wi-fi",
      context: { device: "Windows laptop" },
      previousActions: ["restart_adapter"],
      failedActions: ["restart_adapter"],
      ragResults: [{ actionId: "forget_network", relevance: 0.88 }],
      historicalOutcomes: outcomes,
      aiConfidence: 0.86,
      severity: "LOW"
    });

    expect(decision.action?.actionId).toBe("forget_network");
    expect(decision.explanation.previousFailurePenalty).toBe(0);
  });
});

function outcome(actionId: string, result: ActionOutcome["result"]): ActionOutcome {
  return {
    problemCategory: "network",
    problemType: "wifi_authentication",
    actionId,
    context: { device: "Windows laptop" },
    result,
    resolutionTimeSeconds: 120,
    aiConfidence: 0.8,
    timestamp: new Date(0).toISOString()
  };
}
