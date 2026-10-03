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

    if (["solved", "it worked", "working now", "fixed", "thank you", "thanks"].some((t) => lowered.includes(t))) {
      return {
        content: "Great! It looks like the issue has been resolved. No support ticket is needed. Feel free to reach out if you need anything else!",
        confidence: 0.95
      };
    }

    if (["technician", "human", "ticket", "escalate"].some((t) => lowered.includes(t))) {
      return {
        content: "I will immediately raise a support ticket and escalate this to an IT technician with the diagnostics gathered so far.",
        confidence: 0.95
      };
    }

    if (lowered.includes("wifi") || lowered.includes("wi-fi")) {
      return {
        content:
          "I can help with the Wi-Fi issue.\n\nStep 1:\nConfirm Wi-Fi is turned on (check the Wi-Fi toggle / airplane mode is off).\n\nExpected result:\nThe Wi-Fi list shows available networks and the organization network is visible.\n\nWhat happened after you tried this?",
        confidence: 0.75
      };
    }

    if (lowered.includes("internet") || lowered.includes("web page") || lowered.includes("no internet")) {
      return {
        content:
          "I can help troubleshoot your internet connection.\n\nStep 1:\nCheck whether other devices on the same network have internet.\n\nExpected result:\nIdentifies if the issue is local to your device or network-wide.\n\nWhat happened after you tried this?",
        confidence: 0.74
      };
    }

    if (lowered.includes("vpn")) {
      return {
        content:
          "Let us narrow down the VPN problem.\n\nStep 1:\nConfirm the device has working internet without the VPN by testing a public website.\n\nExpected result:\nGeneral browsing works normally.\n\nWhat happened after you tried this?",
        confidence: 0.72
      };
    }

    if (lowered.includes("printer")) {
      return {
        content:
          "I can help with the printer.\n\nStep 1:\nCheck the printer is powered on, has paper and toner/ink, and no error lights.\n\nExpected result:\nPrinter shows ready status.\n\nWhat happened after you tried this?",
        confidence: 0.72
      };
    }

    if (lowered.includes("outlook") || lowered.includes("email") || lowered.includes("mail")) {
      return {
        content:
          "I can help with Outlook and email.\n\nStep 1:\nCheck internet connectivity and confirm Outlook is Online (under Send/Receive tab, ensure 'Work Offline' is not active).\n\nExpected result:\nStatus bar displays 'Connected' and folders synchronize.\n\nWhat happened after you tried this?",
        confidence: 0.73
      };
    }

    if (lowered.includes("account") || lowered.includes("login") || lowered.includes("password")) {
      return {
        content:
          "I can help with account access.\n\nStep 1:\nConfirm your username/email is correct and Caps Lock is off.\n\nExpected result:\nCorrect credentials entered without capitalization mistakes.\n\nWhat happened after you tried this?",
        confidence: 0.73
      };
    }

    if (lowered.includes("slow") || lowered.includes("frozen") || lowered.includes("freeze") || lowered.includes("computer")) {
      return {
        content:
          "I can help with computer performance.\n\nStep 1:\nSave any open work and restart the computer.\n\nExpected result:\nPerformance improves and frozen services clear after a reboot.\n\nWhat happened after you tried this?",
        confidence: 0.7
      };
    }

    return {
      content:
        "I can help troubleshoot that. What device or application is affected, and what exact error or behavior are you seeing?",
      confidence: 0.6
    };
  }
}
