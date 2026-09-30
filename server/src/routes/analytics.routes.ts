import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { AnalyticsService } from "../services/analytics/AnalyticsService.js";

const simulateBenchmarkSchema = z.object({
  sampleSize: z.number().min(20).max(2000).optional(),
  problemDiversity: z.number().min(0.5).max(3.0).optional(),
  historicalLearningRate: z.number().min(0.2).max(2.0).optional()
});

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

/* GET /api/analytics/overview — Comprehensive overview */
analyticsRouter.get("/overview", async (_req, res, next) => {
  try {
    const service = new AnalyticsService();
    const data = await service.getComprehensiveOverview();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/* GET /api/analytics/root-causes — Root-cause distributions */
analyticsRouter.get("/root-causes", async (_req, res, next) => {
  try {
    const service = new AnalyticsService();
    const rootCauses = await service.getRootCauses();
    res.json({ rootCauses });
  } catch (error) {
    next(error);
  }
});

/* GET /api/analytics/action-effectiveness — Troubleshooting action matrix */
analyticsRouter.get("/action-effectiveness", async (_req, res, next) => {
  try {
    const service = new AnalyticsService();
    const actions = await service.getActionEffectiveness();
    res.json({ actions });
  } catch (error) {
    next(error);
  }
});

/* GET /api/analytics/ablations — Research ablation benchmarks */
analyticsRouter.get("/ablations", async (_req, res, next) => {
  try {
    const service = new AnalyticsService();
    const benchmarks = service.getAblationBenchmarks();
    res.json({ benchmarks });
  } catch (error) {
    next(error);
  }
});

/* POST /api/analytics/simulate — Run customized ablation benchmark simulation */
analyticsRouter.post("/simulate", async (req, res, next) => {
  try {
    const input = simulateBenchmarkSchema.parse(req.body);
    const service = new AnalyticsService();
    const results = service.runSimulationBenchmark(input);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});
