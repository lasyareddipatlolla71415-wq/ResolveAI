import type { ScoringWeights } from "@resolveai/shared";

export const defaultScoringWeights: ScoringWeights = {
  historicalWeight: 0.3,
  similarityWeight: 0.2,
  contextWeight: 0.15,
  ragWeight: 0.15,
  confidenceWeight: 0.2,
  failurePenalty: 0.45,
  riskPenalty: 0.2
};

export const defaultAutonomyThresholds = {
  continueAt: 0.85,
  askQuestionAt: 0.65,
  limitedTroubleshootingAt: 0.4,
  maxFailuresBeforeEscalation: 3
};
