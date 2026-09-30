import { describe, it, expect } from "vitest";
import { AnalyticsService } from "./AnalyticsService.js";

describe("AnalyticsService (Phase 17)", () => {
  const service = new AnalyticsService();

  it("returns root causes with percentages and resolution metrics", async () => {
    const rootCauses = await service.getRootCauses();
    expect(Array.isArray(rootCauses)).toBe(true);
    expect(rootCauses.length).toBeGreaterThan(0);

    const first = rootCauses[0];
    expect(first.rootCause).toBeDefined();
    expect(first.category).toBeDefined();
    expect(first.count).toBeGreaterThan(0);
    expect(first.percentage).toBeGreaterThan(0);
    expect(first.resolvedByAi).toBeGreaterThanOrEqual(0);
    expect(first.resolvedByHuman).toBeGreaterThanOrEqual(0);
  });

  it("calculates action effectiveness matrix", async () => {
    const actions = await service.getActionEffectiveness();
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);

    for (const a of actions) {
      expect(a.actionId).toBeDefined();
      expect(a.successRate).toBeGreaterThanOrEqual(0);
      expect(a.successRate).toBeLessThanOrEqual(100);
      expect(a.totalAttempts).toBe(a.successCount + a.failureCount + a.skipCount);
    }
  });

  it("provides empirical ablation benchmarks across the 4 research methods", () => {
    const benchmarks = service.getAblationBenchmarks(250);
    expect(benchmarks.length).toBe(4);

    const [traditional, ragOnly, ragOutcomes, fullResolve] = benchmarks;

    // Full ResolveAI should have higher resolution rate than RAG-only
    expect(fullResolve.resolutionRate).toBeGreaterThan(ragOnly.resolutionRate);
    expect(fullResolve.resolutionRate).toBeGreaterThan(ragOutcomes.resolutionRate);

    // Full ResolveAI should have fewer average troubleshooting attempts
    expect(fullResolve.avgAttempts).toBeLessThan(ragOnly.avgAttempts);

    // Repeated action rate should be eliminated in full ResolveAI due to failure memory
    expect(fullResolve.repeatedActionRate).toBe(0.0);
    expect(traditional.escalationRate).toBe(100);
  });

  it("runs customizable ablation simulation benchmarks", () => {
    const simulated = service.runSimulationBenchmark({
      sampleSize: 300,
      problemDiversity: 1.2,
      historicalLearningRate: 1.1
    });

    expect(simulated.length).toBe(4);
    expect(simulated[0].sampleSize).toBe(300);
    expect(simulated[3].resolutionRate).toBeGreaterThan(70);
  });

  it("produces comprehensive overview object for dashboards", async () => {
    const overview = await service.getComprehensiveOverview();
    expect(overview.aiResolutionRate).toBeGreaterThan(50);
    expect(overview.ticketReductionRate).toBeGreaterThan(40);
    expect(overview.rootCauses.length).toBeGreaterThan(0);
    expect(overview.actionEffectiveness.length).toBeGreaterThan(0);
    expect(overview.ablationBenchmarks.length).toBe(4);
    expect(Array.isArray(overview.clusters)).toBe(true);
  });
});
