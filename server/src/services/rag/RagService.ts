import { createHash, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { KnowledgeChunkModel } from "../../models/KnowledgeChunk.js";

const embeddingDimensions = 384;
const defaultVectorIndexName = "knowledge_embedding_index";
const defaultRetrievalLimit = 5;

export interface RagChunk {
  chunkId: string;
  documentId: string;
  title: string;
  content: string;
  relevance: number;
  metadata: Record<string, unknown>;
}

export interface RagService {
  indexDocument(input: IndexKnowledgeDocumentInput): Promise<KnowledgeDocumentSummary>;
  listDocuments(): Promise<KnowledgeDocumentSummary[]>;
  retrieve(query: string, options?: RetrieveKnowledgeOptions): Promise<RagChunk[]>;
}

export interface IndexKnowledgeDocumentInput {
  title: string;
  content: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface RetrieveKnowledgeOptions {
  category?: string;
  limit?: number;
}

export interface KnowledgeDocumentSummary {
  documentId: string;
  title: string;
  category: string;
  chunkCount: number;
  storage: "memory" | "mongodb-vector";
  updatedAt: string;
}

interface StoredKnowledgeChunk extends Omit<RagChunk, "relevance"> {
  category: string;
  embedding: number[];
  updatedAt: string;
}

const developmentChunks: StoredKnowledgeChunk[] = [];

export function createRagService(): RagService {
  return isDatabaseConnected() ? new MongoVectorRagService() : new InMemoryVectorRagService();
}

export function embedText(text: string) {
  const vector = Array.from({ length: embeddingDimensions }, () => 0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();

    for (let index = 0; index < 4; index += 1) {
      const position = digest.readUInt16BE(index * 2) % embeddingDimensions;
      const sign = digest[index + 8] % 2 === 0 ? 1 : -1;
      vector[position] += sign * (1 + Math.log(token.length));
    }
  }

  return normalizeVector(vector);
}

class InMemoryVectorRagService implements RagService {
  constructor() {
    seedDevelopmentKnowledge();
  }

  async indexDocument(input: IndexKnowledgeDocumentInput): Promise<KnowledgeDocumentSummary> {
    const documentId = randomUUID();
    const category = normalizeCategory(input.category);
    const chunks = chunkText(input.content).map((content, index) => ({
      chunkId: `${documentId}:${index}`,
      documentId,
      title: input.title,
      category,
      content,
      embedding: embedText(`${input.title}\n${content}`),
      metadata: { ...input.metadata, sourceType: "development", chunkIndex: index },
      updatedAt: new Date().toISOString()
    }));

    developmentChunks.push(...chunks);

    return summarizeChunks(chunks, "memory")[0];
  }

  async listDocuments(): Promise<KnowledgeDocumentSummary[]> {
    return summarizeChunks(developmentChunks, "memory");
  }

  async retrieve(query: string, options: RetrieveKnowledgeOptions = {}): Promise<RagChunk[]> {
    const queryEmbedding = embedText(query);
    const category = options.category ? normalizeCategory(options.category) : undefined;
    const limit = clampLimit(options.limit);

    return developmentChunks
      .filter((chunk) => !category || chunk.category === category)
      .map((chunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        title: chunk.title,
        content: chunk.content,
        relevance: cosineSimilarity(queryEmbedding, chunk.embedding),
        metadata: chunk.metadata
      }))
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, limit);
  }
}

class MongoVectorRagService implements RagService {
  async indexDocument(input: IndexKnowledgeDocumentInput): Promise<KnowledgeDocumentSummary> {
    const documentId = new mongoose.Types.ObjectId().toString();
    const category = normalizeCategory(input.category);
    const chunks = chunkText(input.content).map((content, index) => ({
      documentId,
      chunkId: `${documentId}:${index}`,
      title: input.title,
      category,
      content,
      embedding: embedText(`${input.title}\n${content}`),
      metadata: { ...input.metadata, chunkIndex: index }
    }));

    await KnowledgeChunkModel.insertMany(chunks);

    return {
      documentId,
      title: input.title,
      category,
      chunkCount: chunks.length,
      storage: "mongodb-vector",
      updatedAt: new Date().toISOString()
    };
  }

  async listDocuments(): Promise<KnowledgeDocumentSummary[]> {
    const documents = await KnowledgeChunkModel.aggregate<{
      _id: string;
      title: string;
      category: string;
      chunkCount: number;
      updatedAt: Date;
    }>([
      {
        $group: {
          _id: "$documentId",
          title: { $first: "$title" },
          category: { $first: "$category" },
          chunkCount: { $sum: 1 },
          updatedAt: { $max: "$updatedAt" }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    return documents.map((document) => ({
      documentId: document._id,
      title: document.title,
      category: document.category,
      chunkCount: document.chunkCount,
      storage: "mongodb-vector",
      updatedAt: document.updatedAt.toISOString()
    }));
  }

  async retrieve(query: string, options: RetrieveKnowledgeOptions = {}): Promise<RagChunk[]> {
    const category = options.category ? normalizeCategory(options.category) : undefined;
    const limit = clampLimit(options.limit);
    const filter = category ? { category } : undefined;
    const pipeline = [
      {
        $vectorSearch: {
          index: process.env.MONGODB_VECTOR_INDEX ?? defaultVectorIndexName,
          path: "embedding",
          queryVector: embedText(query),
          numCandidates: Math.max(limit * 20, 100),
          limit,
          ...(filter ? { filter } : {})
        }
      },
      {
        $project: {
          _id: 0,
          chunkId: 1,
          documentId: 1,
          title: 1,
          content: 1,
          metadata: 1,
          relevance: { $meta: "vectorSearchScore" }
        }
      }
    ];

    return KnowledgeChunkModel.aggregate<RagChunk>(pipeline);
  }
}

function seedDevelopmentKnowledge() {
  if (developmentChunks.length > 0) {
    return;
  }

  for (const document of defaultKnowledgeDocuments) {
    const documentId = document.id;
    const chunks = chunkText(document.content).map((content, index) => ({
      chunkId: `${documentId}:${index}`,
      documentId,
      title: document.title,
      category: document.category,
      content,
      embedding: embedText(`${document.title}\n${content}`),
      metadata: { sourceType: "seed", actionId: document.actionId, chunkIndex: index },
      updatedAt: new Date(0).toISOString()
    }));

    developmentChunks.push(...chunks);
  }
}

function chunkText(text: string) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text.trim()]) {
    if (`${current}\n\n${paragraph}`.trim().length > 900 && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = `${current}\n\n${paragraph}`.trim();
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

function summarizeChunks(chunks: StoredKnowledgeChunk[], storage: KnowledgeDocumentSummary["storage"]) {
  const documents = new Map<string, KnowledgeDocumentSummary>();

  for (const chunk of chunks) {
    const existing = documents.get(chunk.documentId);

    if (existing) {
      existing.chunkCount += 1;
      existing.updatedAt = chunk.updatedAt > existing.updatedAt ? chunk.updatedAt : existing.updatedAt;
      continue;
    }

    documents.set(chunk.documentId, {
      documentId: chunk.documentId,
      title: chunk.title,
      category: chunk.category,
      chunkCount: 1,
      storage,
      updatedAt: chunk.updatedAt
    });
  }

  return [...documents.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function cosineSimilarity(left: number[], right: number[]) {
  return left.reduce((score, value, index) => score + value * (right[index] ?? 0), 0);
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(8)));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function normalizeCategory(category = "general") {
  const lowered = category.trim().toLowerCase();

  if (lowered.includes("wi-fi") || lowered.includes("wifi")) {
    return "network";
  }

  return lowered || "general";
}

function clampLimit(limit = defaultRetrievalLimit) {
  return Math.max(1, Math.min(10, limit));
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

const defaultKnowledgeDocuments = [
  {
    id: "kb-wifi-authentication",
    title: "Wi-Fi Authentication Runbook",
    category: "network",
    actionId: "forget_network",
    content:
      "Use this runbook when a device can see the Wi-Fi network but cannot authenticate or keeps asking for credentials.\n\nFirst confirm the user has the correct network password and that their account is active. If credentials are correct, forget the saved Wi-Fi profile and reconnect so the device creates a fresh authentication profile.\n\nThis action is low risk and can be completed by a user or technician. If reconnecting fails, collect the device OS, location, and exact error before trying broader network resets."
  },
  {
    id: "kb-windows-network-reset",
    title: "Windows Network Reset Guide",
    category: "network",
    actionId: "reset_network",
    content:
      "Use network reset only after safer adapter restart and saved-profile cleanup have failed.\n\nThe reset clears local network adapters and stored configuration. The user should be ready to restart the device afterward and may need to reconnect VPN or Wi-Fi profiles.\n\nBecause this can disrupt connectivity, technician approval is recommended unless policy allows supervised user execution."
  },
  {
    id: "kb-adapter-restart",
    title: "Network Adapter Restart Checklist",
    category: "network",
    actionId: "restart_adapter",
    content:
      "Restarting the network adapter is a low-risk first action when connectivity is intermittent or the adapter appears stuck.\n\nAsk the user to disable and re-enable the adapter, or toggle Wi-Fi off and on. Confirm whether the device receives an IP address afterward.\n\nIf the user can see the Wi-Fi network but authentication still fails, prefer forgetting and reconnecting to the network."
  },
  {
    id: "kb-critical-incident",
    title: "Critical Incident Policy",
    category: "server",
    content:
      "Production outage, suspected data loss, and security incidents must bypass automated troubleshooting and create a P1 escalation.\n\nThe assistant should collect impact, start time, affected systems, and recent changes, then route to the technician or incident response team."
  }
];
