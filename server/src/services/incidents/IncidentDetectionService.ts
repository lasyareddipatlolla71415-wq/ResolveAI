import mongoose from "mongoose";
import type {
  AuthenticatedUser,
  DuplicateDetectionCandidate,
  DuplicateDetectionResult,
  IncidentCluster,
  Severity,
  TicketStatus
} from "@resolveai/shared";
import { TicketModel } from "../../models/Ticket.js";
import { getDevStaffTicketsMap, type DevStaffTicket } from "../staffService.js";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
  "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had",
  "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "it's", "its",
  "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of",
  "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
  "own", "same", "shan't", "she", "should", "shouldn't", "so", "some", "such", "than", "that",
  "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
  "were", "weren't", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
  "won't", "would", "wouldn't", "you", "your", "yours", "yourself", "yourselves", "issue", "problem",
  "help", "please", "user", "error", "facing", "getting"
]);

function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export interface DetectDuplicateInput {
  title: string;
  description: string;
  category?: string;
  excludeTicketId?: string;
}

export class IncidentDetectionService {
  /**
   * Tokenize and normalize input string into cleaned terms
   */
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
  }

  /**
   * Calculate Jaccard similarity between two token lists
   */
  jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionCount = 0;
    for (const token of setA) {
      if (setB.has(token)) intersectionCount++;
    }

    const unionCount = new Set([...setA, ...setB]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }

  /**
   * Calculate Cosine similarity between two token frequency bags
   */
  cosineSimilarity(tokensA: string[], tokensB: string[]): number {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const freqA = new Map<string, number>();
    const freqB = new Map<string, number>();

    for (const t of tokensA) freqA.set(t, (freqA.get(t) || 0) + 1);
    for (const t of tokensB) freqB.set(t, (freqB.get(t) || 0) + 1);

    const allKeys = new Set([...freqA.keys(), ...freqB.keys()]);
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (const key of allKeys) {
      const vA = freqA.get(key) || 0;
      const vB = freqB.get(key) || 0;
      dotProduct += vA * vB;
      magA += vA * vA;
      magB += vB * vB;
    }

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Extracts common key technical terms between query and ticket
   */
  extractMatchedKeywords(tokensA: string[], tokensB: string[]): string[] {
    const setA = new Set(tokensA);
    const matched = new Set<string>();
    for (const t of tokensB) {
      if (setA.has(t)) matched.add(t);
    }
    return Array.from(matched).slice(0, 8);
  }

  /**
   * Retrieve candidate tickets from DB or dev memory store
   */
  async getRecentTickets(excludeTicketId?: string): Promise<Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    status: TicketStatus;
    severity: Severity;
    createdAt: string;
  }>> {
    if (!isDatabaseConnected()) {
      const devTickets = Array.from(getDevStaffTicketsMap().values());
      return devTickets
        .filter((t) => !excludeTicketId || t.id !== excludeTicketId)
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          status: t.status,
          severity: t.severity,
          createdAt: t.createdAt
        }));
    }

    const filter: Record<string, unknown> = {};
    if (excludeTicketId) {
      try {
        filter._id = { $ne: new mongoose.Types.ObjectId(excludeTicketId) };
      } catch {
        // ignore invalid ObjectId
      }
    }

    const tickets = await TicketModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return tickets.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      category: t.category,
      status: t.status as TicketStatus,
      severity: t.severity as Severity,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Detect potential duplicate incidents for a given title/description
   */
  async detectPotentialDuplicate(input: DetectDuplicateInput): Promise<DuplicateDetectionResult> {
    const inputTokens = this.tokenize(`${input.title} ${input.description}`);
    const tickets = await this.getRecentTickets(input.excludeTicketId);

    const candidates: DuplicateDetectionCandidate[] = [];
    const normalizedInputCategory = (input.category || "").toLowerCase().trim();

    for (const ticket of tickets) {
      const ticketTokens = this.tokenize(`${ticket.title} ${ticket.description}`);
      const jaccard = this.jaccardSimilarity(inputTokens, ticketTokens);
      const cosine = this.cosineSimilarity(inputTokens, ticketTokens);

      let similarity = 0.5 * cosine + 0.5 * jaccard;

      // Category match boost
      const ticketCategory = ticket.category.toLowerCase().trim();
      const isCategoryMatch = normalizedInputCategory && ticketCategory && (
        normalizedInputCategory === ticketCategory ||
        normalizedInputCategory.includes(ticketCategory) ||
        ticketCategory.includes(normalizedInputCategory)
      );

      if (isCategoryMatch) {
        similarity = Math.min(1, similarity + 0.15);
      }

      // Recency boost (within 6 hours)
      const ageHours = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours <= 6) {
        similarity = Math.min(1, similarity + 0.10);
      } else if (ageHours <= 24) {
        similarity = Math.min(1, similarity + 0.05);
      }

      similarity = Math.round(similarity * 100) / 100;

      if (similarity >= 0.45) {
        const matchedKeywords = this.extractMatchedKeywords(inputTokens, ticketTokens);
        const confidenceLevel: "HIGH" | "MEDIUM" | "LOW" =
          similarity >= 0.70 ? "HIGH" : similarity >= 0.55 ? "MEDIUM" : "LOW";

        const recommendation =
          similarity >= 0.70
            ? `High technical similarity (${Math.round(similarity * 100)}%). Recommended to link as duplicate to Ticket #${ticket.id.slice(-6).toUpperCase()} to avoid duplicate technician effort.`
            : `Moderate technical overlap (${Math.round(similarity * 100)}%) with Ticket #${ticket.id.slice(-6).toUpperCase()}. Verify whether root cause matches before linking.`;

        candidates.push({
          ticketId: ticket.id,
          title: ticket.title,
          category: ticket.category,
          status: ticket.status,
          severity: ticket.severity,
          similarity,
          matchedKeywords,
          confidenceLevel,
          recommendation,
          createdAt: ticket.createdAt
        });
      }
    }

    candidates.sort((a, b) => b.similarity - a.similarity);

    const highestSimilarity = candidates.length > 0 ? candidates[0].similarity : 0;
    const isDuplicate = highestSimilarity >= 0.65;

    // Detect if this incident belongs to an active cluster / potential outage
    const clusters = await this.getIncidentClusters();
    const matchingCluster = clusters.find(
      (c) =>
        (normalizedInputCategory && c.category.toLowerCase().includes(normalizedInputCategory)) ||
        candidates.some((cand) => c.tickets.some((ct) => ct.id === cand.ticketId))
    );

    const potentialOutage = Boolean(matchingCluster?.isPotentialOutage) || (candidates.filter((c) => c.similarity >= 0.60).length >= 2);

    let analysis = "No significant duplicate incidents detected.";
    if (isDuplicate) {
      analysis = `Identified ${candidates.length} potential duplicate incident(s). Highest similarity: ${Math.round(highestSimilarity * 100)}% with Ticket #${candidates[0].ticketId.slice(-6).toUpperCase()}.`;
    }
    if (potentialOutage) {
      analysis += " [WARNING: Multiple concurrent incidents detected in this domain. Potential systemic outage!]";
    }

    return {
      isDuplicate,
      highestSimilarity,
      candidates: candidates.slice(0, 5),
      potentialOutage,
      cluster: matchingCluster,
      analysis
    };
  }

  /**
   * Group active/recent tickets into incident clusters and flag potential outages
   */
  async getIncidentClusters(): Promise<IncidentCluster[]> {
    const tickets = await this.getRecentTickets();
    const clustersMap = new Map<string, IncidentCluster>();

    // Group by category and common root keywords
    for (const ticket of tickets) {
      const category = ticket.category.toLowerCase();
      const tokens = this.tokenize(`${ticket.title} ${ticket.description}`);
      const clusterKey = category;

      if (!clustersMap.has(clusterKey)) {
        clustersMap.set(clusterKey, {
          id: `cluster-${clusterKey}-${Date.now().toString().slice(-4)}`,
          category,
          keywords: tokens.slice(0, 4),
          ticketCount: 0,
          tickets: [],
          isPotentialOutage: false,
          severity: ticket.severity,
          firstReportedAt: ticket.createdAt,
          latestReportedAt: ticket.createdAt
        });
      }

      const cluster = clustersMap.get(clusterKey)!;
      cluster.ticketCount++;
      cluster.tickets.push({
        id: ticket.id,
        title: ticket.title,
        createdAt: ticket.createdAt,
        status: ticket.status
      });

      // Update timestamps and highest severity
      if (new Date(ticket.createdAt) < new Date(cluster.firstReportedAt)) {
        cluster.firstReportedAt = ticket.createdAt;
      }
      if (new Date(ticket.createdAt) > new Date(cluster.latestReportedAt)) {
        cluster.latestReportedAt = ticket.createdAt;
      }
      if (ticket.severity === "CRITICAL" || (ticket.severity === "HIGH" && cluster.severity !== "CRITICAL")) {
        cluster.severity = ticket.severity;
      }

      // Add overlapping keywords
      const currentKeywordSet = new Set(cluster.keywords);
      for (const t of tokens.slice(0, 3)) {
        if (!currentKeywordSet.has(t) && cluster.keywords.length < 6) {
          cluster.keywords.push(t);
        }
      }
    }

    const clusters = Array.from(clustersMap.values());
    for (const cluster of clusters) {
      // Flag as outage if >= 2 tickets in recent cluster or high severity
      cluster.isPotentialOutage = cluster.ticketCount >= 2 && (cluster.severity === "HIGH" || cluster.severity === "CRITICAL" || cluster.ticketCount >= 3);
    }

    return clusters.sort((a, b) => b.ticketCount - a.ticketCount);
  }

  /**
   * Link a ticket as duplicate of another ticket
   */
  async linkDuplicate(
    ticketId: string,
    targetTicketId: string,
    actor: AuthenticatedUser,
    note?: string
  ): Promise<{ success: boolean; message: string }> {
    const linkNote = note || `Marked as duplicate of Ticket #${targetTicketId.slice(-6).toUpperCase()}`;

    if (!isDatabaseConnected()) {
      const devTickets = getDevStaffTicketsMap();
      const ticket = devTickets.get(ticketId);
      if (!ticket) {
        throw new Error(`Ticket ${ticketId} not found`);
      }

      ticket.status = "RESOLVED";
      ticket.resolution = {
        summary: `Linked as duplicate of Ticket #${targetTicketId}`,
        rootCause: `Duplicate Incident (Target: #${targetTicketId})`,
        actionsTaken: ["Identified duplicate via Incident Detection Engine", "Linked to primary ticket"],
        resolvedByName: actor.name,
        resolvedAt: new Date().toISOString()
      };
      ticket.replies.push({
        id: `rep-dup-${Date.now()}`,
        senderId: actor.id,
        senderRole: actor.role,
        message: `[INCIDENT DETECTION SYSTEM] ${linkNote}`,
        createdAt: new Date().toISOString()
      });
      ticket.updatedAt = new Date().toISOString();

      return {
        success: true,
        message: `Ticket #${ticketId.slice(-6).toUpperCase()} linked as duplicate of #${targetTicketId.slice(-6).toUpperCase()}`
      };
    }

    const ticket = await TicketModel.findById(ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }

    ticket.status = "RESOLVED";
    ticket.resolution = {
      summary: `Linked as duplicate of Ticket #${targetTicketId}`,
      rootCause: `Duplicate Incident (Target: #${targetTicketId})`,
      actionsTaken: ["Identified duplicate via Incident Detection Engine", "Linked to primary ticket"],
      resolvedBy: new mongoose.Types.ObjectId(actor.id),
      resolvedByName: actor.name,
      resolvedAt: new Date()
    };
    await ticket.save();

    return {
      success: true,
      message: `Ticket #${ticketId.slice(-6).toUpperCase()} linked as duplicate of #${targetTicketId.slice(-6).toUpperCase()}`
    };
  }
}
