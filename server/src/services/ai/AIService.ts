import type { ChatMessageRecord } from "@resolveai/shared";
import type { AiMessage, AiProvider } from "./AiProvider.js";
import { MockAiProvider } from "./MockAiProvider.js";
import { OpenAiProvider } from "./OpenAiProvider.js";
import { createRagService } from "../rag/RagService.js";

export const itSupportSystemPrompt = `You are an experienced, friendly IT support technician for the company helpdesk. You help non-technical users solve common IT problems step by step, and you escalate to a human technician only when appropriate.

SOURCE OF TRUTH:
- You MUST use the approved troubleshooting procedures from the knowledge base provided below BEFORE recommending any step.
- NEVER invent troubleshooting steps that are not supported by the knowledge base. If the knowledge base has no relevant procedure, say so and offer to escalate to a technician.

SUPPORTED CATEGORIES:
- Wi-Fi / Network
- Internet connection
- VPN
- Printer
- Outlook / Email
- Password / Account access
- General computer problems

TROUBLESHOOTING PROCESS:
1. Understand the problem and identify the category. If the category or device is unclear, ask a brief clarifying question.
2. Give exactly ONE step at a time using this format:
   Step N:
   [one action]

   Expected result:
   [what should happen]

   What happened after you tried this?
3. Wait for the user result before giving the next step. Never dump multiple steps at once.
4. If a step solved it: Confirm cheerfully that the issue has been resolved and no support ticket is needed.
5. If a step did not solve it: Continue to the NEXT approved step. Do NOT escalate just because one step failed.
6. When ALL relevant approved steps are exhausted and the issue is unresolved: Let the user know you are raising a support ticket so a technician can continue the investigation.

ESCALATION RULES:
- All relevant approved steps attempted and issue still unresolved, OR
- The user explicitly asks for a technician / support ticket / says they do not want to troubleshoot (escalate IMMEDIATELY), OR
- An urgent condition is described (office-wide outage, business-critical service down).`;

export function resolveAiProvider(): AiProvider {
  if (process.env.NODE_ENV === "test" && !process.env.FORCE_LLM_TEST) {
    return new MockAiProvider();
  }

  const providerType = (process.env.LLM_PROVIDER ?? "mock").toLowerCase().trim();
  const apiKey = (process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "").trim();

  if (providerType === "openai" || (apiKey && providerType !== "mock")) {
    if (!apiKey) {
      console.warn("LLM_PROVIDER is configured as 'openai' but LLM_API_KEY / OPENAI_API_KEY is missing. Falling back to MockAiProvider.");
      return new MockAiProvider();
    }
    return new OpenAiProvider(apiKey);
  }

  return new MockAiProvider();
}

export class AIService {
  constructor(private readonly provider: AiProvider = resolveAiProvider()) {}

  async generateChatReply(messages: ChatMessageRecord[]) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    let ragContext = "";
    if (lastUserMessage) {
      try {
        const ragService = createRagService();
        const relevantChunks = await ragService.retrieve(lastUserMessage, { limit: 3 });
        if (relevantChunks.length > 0) {
          const procedures = relevantChunks
            .map(
              (chunk, index) =>
                `--- PROCEDURE ${index + 1}: ${chunk.title} (${chunk.category}) ---\n${chunk.content}`
            )
            .join("\n\n");
          ragContext = `\n\nAPPROVED KNOWLEDGE BASE PROCEDURES (SOURCE OF TRUTH):\n${procedures}\n\nINSTRUCTION: Recommend steps from these procedures one at a time.`;
        }
      } catch (err) {
        console.warn("[AIService] RAG retrieval error:", err);
      }
    }

    const providerMessages: AiMessage[] = [
      { role: "system", content: `${itSupportSystemPrompt}${ragContext}` },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];

    try {
      return await this.provider.generateResponse(providerMessages);
    } catch (error) {
      console.error("AI provider failed:", error);
      const msg = error instanceof Error ? error.message : String(error);
      const isQuotaError = msg.includes("credits remaining") || msg.includes("insufficient_quota") || msg.includes("credit_balance_exhausted");

      return {
        content: isQuotaError
          ? "I am having trouble reaching the AI service right now: Your OpenAI account has exhausted its available credits. Please check your quota or billing details at https://platform.openai.com/settings/organization/billing/."
          : "I am having trouble reaching the AI service right now. Please retry in a moment.",
        confidence: 0
      };
    }
  }
}

