import { describe, expect, it } from "vitest";
import { createRagService } from "./RagService.js";

describe("RagService development vector store", () => {
  it("indexes document chunks and retrieves them by vector similarity", async () => {
    const service = createRagService();
    const document = await service.indexDocument({
      title: "Printer Queue Recovery",
      category: "hardware",
      content:
        "When a print job is stuck in the queue, clear the spooler cache and restart the print spooler service. Confirm the printer is online before retrying the job."
    });

    expect(document.chunkCount).toBe(1);
    expect(document.storage).toBe("memory");

    const chunks = await service.retrieve("print job stuck queue spooler cache", {
      category: "hardware",
      limit: 3
    });

    expect(chunks[0]).toMatchObject({
      documentId: document.documentId,
      title: "Printer Queue Recovery"
    });
    expect(chunks[0]?.relevance).toBeGreaterThan(0);
  });
});
