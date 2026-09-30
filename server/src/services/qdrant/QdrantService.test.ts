import { afterEach, describe, expect, it, vi } from "vitest";
import { QdrantConfigurationError, QdrantService } from "./QdrantService.js";

describe("QdrantService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a Qdrant URL", () => {
    expect(() => new QdrantService({ url: "" })).toThrow(QdrantConfigurationError);
  });

  it("checks Qdrant health", async () => {
    const fetchImpl = mockFetch([jsonResponse({ title: "qdrant", version: "1.0.0" })]);
    const service = new QdrantService({ url: "http://localhost:6333", fetchImpl });

    await expect(service.health()).resolves.toMatchObject({
      ok: true,
      title: "qdrant",
      version: "1.0.0"
    });
    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:6333/", expect.objectContaining({ method: "GET" }));
  });

  it("creates the collection when it does not exist", async () => {
    const fetchImpl = mockFetch([jsonResponse({}, 404), jsonResponse({ result: true })]);
    const service = new QdrantService({
      url: "http://localhost:6333",
      collectionName: "resolveai_knowledge",
      vectorSize: 384,
      fetchImpl
    });

    await expect(service.ensureCollection()).resolves.toEqual({
      collectionName: "resolveai_knowledge",
      created: true
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "http://localhost:6333/collections/resolveai_knowledge",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ vectors: { size: 384, distance: "Cosine" } })
      })
    );
  });

  it("detects an existing collection", async () => {
    const fetchImpl = mockFetch([jsonResponse({ result: { status: "green" } })]);
    const service = new QdrantService({ url: "http://localhost:6333", fetchImpl });

    await expect(service.collectionExists()).resolves.toBe(true);
  });

  it("inserts, searches, and cleans up a test vector", async () => {
    const fetchImpl = mockFetch([
      jsonResponse({ result: true }),
      jsonResponse({ result: [{ id: "test-point", score: 1, payload: { temporary: true } }] }),
      jsonResponse({ result: true })
    ]);
    const service = new QdrantService({
      url: "http://localhost:6333",
      collectionName: "resolveai_knowledge",
      vectorSize: 4,
      fetchImpl
    });

    const point = await service.upsertTestVector("test-point");
    const results = await service.searchTestVector();
    await service.deletePoint(point.id);

    expect(point.vector).toEqual([1, 0, 0, 0]);
    expect(results[0]).toMatchObject({ id: "test-point", score: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  // ── upsertPoints ───────────────────────────────────────────────────────────

  describe("upsertPoints", () => {
    it("batch-upserts multiple points in a single request", async () => {
      const fetchImpl = mockFetch([jsonResponse({ result: { operation_id: 0, status: "acknowledged" } })]);
      const service = new QdrantService({
        url: "http://localhost:6333",
        collectionName: "resolveai_knowledge",
        vectorSize: 4,
        fetchImpl
      });

      const points = [
        { id: "p1", vector: [1, 0, 0, 0], payload: { chunkId: "c1" } },
        { id: "p2", vector: [0, 1, 0, 0], payload: { chunkId: "c2" } }
      ];

      await expect(service.upsertPoints(points)).resolves.toBeUndefined();
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledWith(
        "http://localhost:6333/collections/resolveai_knowledge/points?wait=true",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ points })
        })
      );
    });

    it("skips the network request when given an empty array", async () => {
      const fetchImpl = mockFetch([]);
      const service = new QdrantService({
        url: "http://localhost:6333",
        vectorSize: 4,
        fetchImpl
      });

      await expect(service.upsertPoints([])).resolves.toBeUndefined();
      expect(fetchImpl).not.toHaveBeenCalled();
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe("search", () => {
    it("returns ranked results for a query vector", async () => {
      const mockResults = [
        { id: "p1", score: 0.95, payload: { chunkId: "c1", category: "network" } },
        { id: "p2", score: 0.78, payload: { chunkId: "c2", category: "network" } }
      ];
      const fetchImpl = mockFetch([jsonResponse({ result: mockResults })]);
      const service = new QdrantService({
        url: "http://localhost:6333",
        collectionName: "resolveai_knowledge",
        vectorSize: 4,
        fetchImpl
      });

      const queryVector = [1, 0, 0, 0];
      const results = await service.search(queryVector, 2);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ id: "p1", score: 0.95 });
      expect(fetchImpl).toHaveBeenCalledWith(
        "http://localhost:6333/collections/resolveai_knowledge/points/search",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ vector: queryVector, limit: 2, with_payload: true })
        })
      );
    });

    it("forwards a payload filter to Qdrant when provided", async () => {
      const fetchImpl = mockFetch([jsonResponse({ result: [] })]);
      const service = new QdrantService({
        url: "http://localhost:6333",
        collectionName: "resolveai_knowledge",
        vectorSize: 4,
        fetchImpl
      });

      const queryVector = [0, 1, 0, 0];
      const filter = { must: [{ key: "category", match: { value: "network" } }] };
      await service.search(queryVector, 5, filter);

      expect(fetchImpl).toHaveBeenCalledWith(
        "http://localhost:6333/collections/resolveai_knowledge/points/search",
        expect.objectContaining({
          body: JSON.stringify({ vector: queryVector, limit: 5, with_payload: true, filter })
        })
      );
    });
  });
});

function mockFetch(responses: Response[]) {
  return vi.fn(async () => {
    const response = responses.shift();

    if (!response) {
      throw new Error("No mock response queued");
    }

    return response;
  }) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
