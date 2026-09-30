import { Router } from "express";
import { z } from "zod";
import { AdaptiveTroubleshootingEngine } from "../services/troubleshooting/AdaptiveTroubleshootingEngine.js";
import { defaultScoringWeights } from "../config/scoring.js";
import { createRagService } from "../services/rag/RagService.js";

const nextActionSchema = z.object({
  problemDescription: z.string().min(3),
  category: z.string().min(1),
  context: z.record(z.unknown()).default({}),
  previousActions: z.array(z.string()).default([]),
  failedActions: z.array(z.string()).default([]),
  aiConfidence: z.number().min(0).max(1).default(0.5),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW")
});

export const troubleshootingRouter = Router();

troubleshootingRouter.post("/next-action", async (req, res, next) => {
  try {
    const input = nextActionSchema.parse(req.body);
    const ragSources = await createRagService().retrieve(input.problemDescription, {
      category: input.category,
      limit: 5
    });
    const engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);
    const decision = engine.selectNextAction({
      ...input,
      ragResults: ragSources.map((source) => ({
        actionId: typeof source.metadata.actionId === "string" ? source.metadata.actionId : undefined,
        relevance: source.relevance
      })),
      historicalOutcomes: []
    });

    res.json({ ...decision, ragSources });
  } catch (error) {
    next(error);
  }
});
