import type { AiMessage, AiProvider } from "./AiProvider.js";

export class MockAiProvider implements AiProvider {
  async classifyProblem(input: string) {
    const lowered = input.toLowerCase();
    const critical = ["production", "server down", "data loss", "security incident"].some((term) =>
      lowered.includes(term)
    );

    return {
      category: lowered.includes("wi-fi") || lowered.includes("wifi") ? "network" : "general",
      severity: critical ? "CRITICAL" : "LOW",
      confidence: critical ? 0.92 : 0.68
    };
  }

  async generateResponse(messages: AiMessage[]) {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const previousAssistantMessage =
      [...messages].reverse().find((message) => message.role === "assistant")?.content.toLowerCase() ?? "";
    const lowered = lastUserMessage.toLowerCase();

    if (["yes", "yes.", "yeah", "yep", "it is", "enabled"].includes(lowered.trim())) {
      if (previousAssistantMessage.includes("wi-fi") || previousAssistantMessage.includes("organization network")) {
        return {
          content:
            "Thanks. Since Wi-Fi is enabled and the network is visible, next confirm whether the laptop shows a password/authentication error or simply keeps reconnecting.",
          confidence: 0.73
        };
      }

      if (previousAssistantMessage.includes("vpn")) {
        return {
          content:
            "Thanks. Since that condition is confirmed, tell me the exact VPN error text so I can narrow the next approved support question.",
          confidence: 0.68
        };
      }
    }

    if (lowered.includes("wifi") || lowered.includes("wi-fi")) {
      return {
        content:
          "I can help with the Wi-Fi issue. First, is Wi-Fi turned on and can your laptop see the organization network name?",
        confidence: 0.72
      };
    }

    if (lowered.includes("vpn")) {
      return {
        content:
          "Let us narrow down the VPN problem. Are you seeing an authentication error, a connection timeout, or a certificate/device compliance message?",
        confidence: 0.7
      };
    }

    if (lowered.includes("printer")) {
      return {
        content:
          "I can help with the printer. Is the printer showing as offline on your device, or is the print job stuck in the queue?",
        confidence: 0.69
      };
    }

    if (lowered.includes("account") || lowered.includes("login") || lowered.includes("password")) {
      return {
        content:
          "I can help with account access. Are you unable to sign in because of a password error, MFA prompt, account lock, or permission message?",
        confidence: 0.71
      };
    }

    return {
      content:
        "I can help troubleshoot that. What device or application is affected, and what exact error or behavior are you seeing?",
      confidence: 0.6
    };
  }
}
