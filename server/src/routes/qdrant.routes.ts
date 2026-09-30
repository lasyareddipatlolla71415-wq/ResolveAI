import { Router } from "express";
import { createQdrantService } from "../services/qdrant/QdrantService.js";

export const qdrantRouter = Router();

qdrantRouter.get("/health", async (_req, res, next) => {
  try {
    const qdrant = createQdrantService();
    const health = await qdrant.health();
    const collection = await qdrant.ensureCollection();

    res.json({
      qdrant: health,
      collection,
      vectorSize: qdrant.vectorSize
    });
  } catch (error) {
    next(error);
  }
});

qdrantRouter.post("/self-test", async (_req, res, next) => {
  try {
    const qdrant = createQdrantService();
    await qdrant.ensureCollection();
    const point = await qdrant.upsertTestVector();
    const results = await qdrant.searchTestVector(1);
    await qdrant.deletePoint(point.id);

    res.json({
      collectionName: qdrant.collectionName,
      insertedPointId: point.id,
      searchResultCount: results.length,
      cleanedUp: true
    });
  } catch (error) {
    next(error);
  }
});
