export class EscalationService {
  shouldEscalate(input: { severity: string; confidence: number; failedAttempts: number }) {
    if (input.severity === "CRITICAL") return { escalate: true, reason: "Critical issue bypass." };
    if (input.confidence < 0.4) return { escalate: true, reason: "Confidence below threshold." };
    if (input.failedAttempts >= 3) return { escalate: true, reason: "Maximum automated attempts reached." };
    return { escalate: false, reason: "Automated troubleshooting may continue." };
  }
}
