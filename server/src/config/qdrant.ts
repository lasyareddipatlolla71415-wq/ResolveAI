import { QdrantConfigurationError, QdrantService } from "../services/qdrant/QdrantService.js";

let qdrantInstance: QdrantService | null = null;

/**
 * Called once at server startup.
 * Reads QDRANT_URL from the environment. If not set, logs a warning and
 * returns null so the server continues without Qdrant (dev-memory RAG stays active).
 * If set, creates the singleton, ensures the collection exists, and returns it.
 */
export async function initQdrant(): Promise<QdrantService | null> {
  if (!process.env.QDRANT_URL) {
    console.warn("QDRANT_URL is not set. Qdrant is disabled; RAG will use the in-memory/MongoDB fallback.");
    return null;
  }

  try {
    const service = new QdrantService();
    await service.health();
    const collection = await service.ensureCollection();
    console.log(
      `Qdrant connected (${service.collectionName} — ${collection.created ? "collection created" : "collection exists"})`
    );
    qdrantInstance = service;
    return service;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (error instanceof QdrantConfigurationError) {
      console.error(`Qdrant configuration error: ${message}. Qdrant is disabled.`);
    } else {
      console.error(`Qdrant connection failed: ${message}. Qdrant is disabled.`);
    }

    return null;
  }
}

/**
 * Returns the initialised QdrantService singleton, or null if Qdrant was not
 * configured / failed to connect. Callers must handle the null case and fall
 * back to in-memory or MongoDB RAG.
 */
export function getQdrantService(): QdrantService | null {
  return qdrantInstance;
}

export function getQdrantStatus(): { configured: boolean; connected: boolean; collection: string | null } {
  return {
    configured: Boolean(process.env.QDRANT_URL),
    connected: qdrantInstance !== null,
    collection: qdrantInstance?.collectionName ?? null
  };
}
