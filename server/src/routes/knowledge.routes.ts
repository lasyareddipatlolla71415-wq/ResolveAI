import { Router } from "express";
import { z } from "zod";
import { createRagService } from "../services/rag/RagService.js";

const indexDocumentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  content: z.string().trim().min(20),
  category: z.string().trim().min(1).max(80).default("general"),
  metadata: z.record(z.unknown()).default({})
});

const searchSchema = z.object({
  query: z.string().trim().min(3),
  category: z.string().trim().min(1).max(80).optional(),
  limit: z.number().int().min(1).max(10).default(5)
});

export const knowledgeRouter = Router();

knowledgeRouter.get("/documents", async (_req, res, next) => {
  try {
    const documents = await createRagService().listDocuments();
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

knowledgeRouter.post("/documents", async (req, res, next) => {
  try {
    const input = indexDocumentSchema.parse(req.body);
    const document = await createRagService().indexDocument(input);
    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

knowledgeRouter.post("/search", async (req, res, next) => {
  try {
    const input = searchSchema.parse(req.body);
    const chunks = await createRagService().retrieve(input.query, {
      category: input.category,
      limit: input.limit
    });

    res.json({ chunks });
  } catch (error) {
    next(error);
  }
});
