import type { ChatMessageRecord } from "@resolveai/shared";
import type { AiMessage, AiProvider } from "./AiProvider.js";
import { MockAiProvider } from "./MockAiProvider.js";

const systemPrompt =
  "You are ResolveAI, a professional technical support assistant. Ask one clear troubleshooting question at a time, keep answers concise, and do not create tickets or use RAG in Phase 1.";

export class AIService {
  constructor(private readonly provider: AiProvider = new MockAiProvider()) {}

  async generateChatReply(messages: ChatMessageRecord[]) {
    const providerMessages: AiMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];

    try {
      return await this.provider.generateResponse(providerMessages);
    } catch (error) {
      console.error("AI provider failed", error);
      return {
        content: "I am having trouble reaching the AI service right now. Please retry in a moment.",
        confidence: 0
      };
    }
  }
}
