const defaultCollection = "resolveai_knowledge";
const defaultVectorSize = 384;

export interface QdrantServiceOptions {
  url?: string;
  apiKey?: string;
  collectionName?: string;
  vectorSize?: number;
  fetchImpl?: typeof fetch;
}

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface SearchResult {
  id: string | number;
  score: number;
  payload: Record<string, unknown>;
}

export class QdrantConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QdrantConfigurationError";
  }
}

export class QdrantService {
  readonly collectionName: string;
  readonly vectorSize: number;
  private readonly url: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: QdrantServiceOptions = {}) {
    this.url = normalizeUrl(options.url ?? process.env.QDRANT_URL);
    this.apiKey = options.apiKey ?? process.env.QDRANT_API_KEY;
    this.collectionName = options.collectionName ?? process.env.QDRANT_COLLECTION ?? defaultCollection;
    this.vectorSize = Number(options.vectorSize ?? process.env.QDRANT_VECTOR_SIZE ?? defaultVectorSize);
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (!Number.isInteger(this.vectorSize) || this.vectorSize <= 0) {
      throw new QdrantConfigurationError("QDRANT_VECTOR_SIZE must be a positive integer.");
    }
  }

  async health() {
    const response = await this.request<{ title?: string; version?: string }>("/", { method: "GET" });
    return {
      ok: true,
      title: response.title ?? "Qdrant",
      version: response.version
    };
  }

  async collectionExists(collectionName = this.collectionName) {
    const response = await this.fetchImpl(`${this.url}/collections/${encodeURIComponent(collectionName)}`, {
      method: "GET",
      headers: this.headers()
    });

    if (response.status === 404) {
      return false;
    }

    await this.parseResponse(response);
    return true;
  }

  async ensureCollection(collectionName = this.collectionName) {
    if (await this.collectionExists(collectionName)) {
      return { collectionName, created: false };
    }

    await this.request(`/collections/${encodeURIComponent(collectionName)}`, {
      method: "PUT",
      body: JSON.stringify({
        vectors: {
          size: this.vectorSize,
          distance: "Cosine"
        }
      })
    });

    return { collectionName, created: true };
  }

  /**
   * Batch-upsert points into the collection.
   * Used by the RAG pipeline to insert knowledge chunk embeddings.
   */
  async upsertPoints(points: QdrantPoint[]) {
    if (points.length === 0) return;

    await this.request(`/collections/${encodeURIComponent(this.collectionName)}/points?wait=true`, {
      method: "PUT",
      body: JSON.stringify({ points })
    });
  }

  /**
   * Semantic vector search with an optional payload filter.
   * Returns up to `limit` results sorted by cosine similarity (descending).
   */
  async search(vector: number[], limit: number, filter?: Record<string, unknown>): Promise<SearchResult[]> {
    const body: Record<string, unknown> = {
      vector,
      limit,
      with_payload: true
    };

    if (filter) {
      body.filter = filter;
    }

    const response = await this.request<{ result: SearchResult[] }>(
      `/collections/${encodeURIComponent(this.collectionName)}/points/search`,
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    return response.result;
  }

  // ── test helpers ─────────────────────────────────────────────────────────

  async upsertTestVector(pointId = `qdrant-test-${Date.now()}`) {
    const vector = Array.from({ length: this.vectorSize }, (_, index) => (index === 0 ? 1 : 0));
    const point: QdrantPoint = {
      id: pointId,
      vector,
      payload: {
        source: "resolveai-qdrant-healthcheck",
        temporary: true
      }
    };

    await this.request(`/collections/${encodeURIComponent(this.collectionName)}/points?wait=true`, {
      method: "PUT",
      body: JSON.stringify({ points: [point] })
    });

    return point;
  }

  async searchTestVector(limit = 1) {
    const vector = Array.from({ length: this.vectorSize }, (_, index) => (index === 0 ? 1 : 0));
    const response = await this.request<{ result: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }> }>(
      `/collections/${encodeURIComponent(this.collectionName)}/points/search`,
      {
        method: "POST",
        body: JSON.stringify({
          vector,
          limit,
          with_payload: true
        })
      }
    );

    return response.result;
  }

  async deletePoint(pointId: string | number) {
    await this.request(`/collections/${encodeURIComponent(this.collectionName)}/points/delete?wait=true`, {
      method: "POST",
      body: JSON.stringify({
        points: [pointId]
      })
    });
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.url}${path}`, {
      ...init,
      headers: this.headers(init.headers)
    });

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T = unknown>(response: Response): Promise<T> {
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(`Qdrant request failed with ${response.status}: ${text || response.statusText}`);
    }

    return body as T;
  }

  private headers(headers?: HeadersInit) {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "api-key": this.apiKey } : {}),
      ...(headers ?? {})
    };
  }
}

export function createQdrantService(options?: QdrantServiceOptions) {
  return new QdrantService(options);
}

function normalizeUrl(url?: string) {
  if (!url) {
    throw new QdrantConfigurationError("QDRANT_URL is required for Qdrant operations.");
  }

  return url.replace(/\/+$/, "");
}
