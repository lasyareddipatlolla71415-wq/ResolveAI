import type {
  ActionOutcome,
  AdaptiveDecision,
  ScoringWeights,
  Severity,
  TroubleshootingAction
} from "@resolveai/shared";
import { defaultAutonomyThresholds } from "../../config/scoring.js";

interface RagResult {
  actionId?: string;
  relevance: number;
}

interface SelectActionInput {
  problemDescription: string;
  category: string;
  context: Record<string, unknown>;
  previousActions: string[];
  failedActions: string[];
  ragResults: RagResult[];
  historicalOutcomes: ActionOutcome[];
  aiConfidence: number;
  severity: Severity;
}

const approvedDevelopmentActions: TroubleshootingAction[] = [
  {
    actionId: "restart_adapter",
    name: "Restart network adapter",
    description: "Disable and re-enable the device network adapter.",
    category: "network",
    riskLevel: "low",
    prerequisites: ["User has local device access"],
    expectedOutcome: "Network adapter reinitializes and reconnects.",
    allowedRoles: ["USER", "TECHNICIAN"],
    active: true
  },
  {
    actionId: "forget_network",
    name: "Forget and reconnect Wi-Fi network",
    description: "Remove the saved Wi-Fi profile, then reconnect with verified credentials.",
    category: "network",
    riskLevel: "low",
    prerequisites: ["User knows Wi-Fi credentials"],
    expectedOutcome: "Device creates a clean Wi-Fi profile.",
    allowedRoles: ["USER", "TECHNICIAN"],
    active: true
  },
  {
    actionId: "reset_network",
    name: "Reset network settings",
    description: "Reset local network configuration after lower-risk actions fail.",
    category: "network",
    riskLevel: "medium",
    prerequisites: ["User can restart the device afterward"],
    expectedOutcome: "Corrupt network configuration is cleared.",
    allowedRoles: ["TECHNICIAN"],
    active: true
  }
];

export class AdaptiveTroubleshootingEngine {
  constructor(private readonly weights: ScoringWeights) {}

  selectNextAction(input: SelectActionInput): AdaptiveDecision {
    if (input.severity === "CRITICAL") {
      return this.escalate("Critical severity bypasses automated troubleshooting.", input.aiConfidence);
    }

    const candidates = approvedDevelopmentActions.filter(
      (action) => action.active && action.category === this.normalizeCategory(input.category)
    );

    const scored = candidates.map((action) => this.scoreAction(action, input)).sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (!best) {
      return this.escalate("No approved troubleshooting action is available for this category.", input.aiConfidence);
    }

    if (input.failedActions.length >= defaultAutonomyThresholds.maxFailuresBeforeEscalation) {
      return { ...best, shouldEscalate: true, escalationReason: "Maximum failed automated attempts reached." };
    }

    if (best.confidence < defaultAutonomyThresholds.limitedTroubleshootingAt) {
      return { ...best, shouldEscalate: true, escalationReason: "Decision confidence is below the escalation threshold." };
    }

    return best;
  }

  private scoreAction(action: TroubleshootingAction, input: SelectActionInput): AdaptiveDecision {
    const historicalSuccess = this.historicalSuccess(action.actionId, input.historicalOutcomes);
    const problemSimilarity = this.simpleSimilarity(action.description, input.problemDescription);
    const contextMatch = this.contextMatch(action, input.context);
    const ragRelevance = this.ragRelevance(action.actionId, input.ragResults);
    const previousFailurePenalty = input.failedActions.includes(action.actionId) ? this.weights.failurePenalty : 0;
    const riskPenalty = this.riskPenalty(action);

    const positiveScore =
      historicalSuccess * this.weights.historicalWeight +
      problemSimilarity * this.weights.similarityWeight +
      contextMatch * this.weights.contextWeight +
      ragRelevance * this.weights.ragWeight +
      input.aiConfidence * this.weights.confidenceWeight;

    const score = this.clamp01(positiveScore - previousFailurePenalty - riskPenalty);
    const confidence = this.clamp01((score + input.aiConfidence) / 2);

    return {
      action,
      score,
      confidence,
      expectedSuccess: historicalSuccess,
      risk: action.riskLevel,
      reason: `Selected because score ${score.toFixed(2)} balances historical success, similarity, context, RAG relevance, confidence, prior failures, and risk.`,
      shouldEscalate: false,
      explanation: {
        historicalSuccess,
        problemSimilarity,
        contextMatch,
        ragRelevance,
        aiConfidence: input.aiConfidence,
        previousFailurePenalty,
        riskPenalty
      }
    };
  }

  private historicalSuccess(actionId: string, outcomes: ActionOutcome[]) {
    const matching = outcomes.filter((outcome) => outcome.actionId === actionId);
    if (matching.length === 0) return 0.5;
    return matching.filter((outcome) => outcome.result === "SUCCESS").length / matching.length;
  }

  private simpleSimilarity(left: string, right: string) {
    const leftTerms = new Set(left.toLowerCase().split(/\W+/).filter(Boolean));
    const rightTerms = new Set(right.toLowerCase().split(/\W+/).filter(Boolean));
    const overlap = [...leftTerms].filter((term) => rightTerms.has(term)).length;
    return this.clamp01(overlap / Math.max(leftTerms.size, 1));
  }

  private contextMatch(_action: TroubleshootingAction, context: Record<string, unknown>) {
    return Object.keys(context).length > 0 ? 0.7 : 0.4;
  }

  private ragRelevance(actionId: string, ragResults: RagResult[]) {
    const related = ragResults.filter((result) => result.actionId === actionId);
    if (related.length === 0) return 0.5;
    return Math.max(...related.map((result) => result.relevance));
  }

  private riskPenalty(action: TroubleshootingAction) {
    const multiplier = action.riskLevel === "high" ? 1 : action.riskLevel === "medium" ? 0.5 : 0;
    return this.weights.riskPenalty * multiplier;
  }

  private normalizeCategory(category: string) {
    return category.toLowerCase().includes("wi-fi") || category.toLowerCase().includes("wifi")
      ? "network"
      : category.toLowerCase();
  }

  private escalate(reason: string, aiConfidence: number): AdaptiveDecision {
    return {
      action: null,
      score: 0,
      confidence: aiConfidence,
      expectedSuccess: 0,
      risk: "high",
      reason,
      shouldEscalate: true,
      escalationReason: reason,
      explanation: {
        historicalSuccess: 0,
        problemSimilarity: 0,
        contextMatch: 0,
        ragRelevance: 0,
        aiConfidence,
        previousFailurePenalty: 0,
        riskPenalty: 0
      }
    };
  }

  private clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
  }
}
