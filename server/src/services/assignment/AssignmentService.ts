import type { Priority, Severity, TechnicianProfile } from "@resolveai/shared";

export interface TechnicianCandidate
  extends Pick<TechnicianProfile, "id" | "skills" | "availability" | "workload" | "capacity" | "averageResolutionHours"> {}

export interface AssignmentInput {
  category: string;
  severity: Severity;
  priority: Priority;
  requiredSkills?: string[];
  preferredTechnicianIds?: string[];
  technicians: TechnicianCandidate[];
}

export interface AssignmentDecision {
  technicianId: string | null;
  score: number;
  reason: string;
  alternatives: Array<{
    technicianId: string;
    score: number;
  }>;
  explanation: {
    skillMatch: number;
    availability: number;
    workload: number;
    speed: number;
    priorityFit: number;
  };
}

interface ScoredTechnician {
  technician: TechnicianCandidate;
  score: number;
  explanation: AssignmentDecision["explanation"];
}

export class AssignmentService {
  selectTechnician(input: AssignmentInput): AssignmentDecision {
    const availableTechnicians = input.technicians.filter((technician) => this.canAcceptTicket(technician));

    if (availableTechnicians.length === 0) {
      return this.emptyDecision("No technician is currently available with spare capacity.");
    }

    const scored = availableTechnicians
      .map((technician) => this.scoreTechnician(technician, input))
      .sort((left, right) => this.compareTechnicians(left, right));
    const best = scored[0];

    if (!best || best.score <= 0) {
      return this.emptyDecision("No technician has a useful match for this ticket.");
    }

    return {
      technicianId: best.technician.id,
      score: this.roundScore(best.score),
      reason: this.reasonFor(best, input),
      alternatives: scored.slice(1, 4).map((candidate) => ({
        technicianId: candidate.technician.id,
        score: this.roundScore(candidate.score)
      })),
      explanation: best.explanation
    };
  }

  private scoreTechnician(technician: TechnicianCandidate, input: AssignmentInput): ScoredTechnician {
    const skillMatch = this.skillMatch(technician, input);
    const availability = technician.availability === "AVAILABLE" ? 1 : 0.45;
    const workload = this.workloadScore(technician);
    const speed = this.speedScore(technician);
    const priorityFit = this.priorityFit(technician, input);
    const preferredBoost = input.preferredTechnicianIds?.includes(technician.id) ? 0.05 : 0;

    const score =
      skillMatch * 0.4 +
      availability * 0.22 +
      workload * 0.23 +
      speed * 0.1 +
      priorityFit * 0.05 +
      preferredBoost;

    return {
      technician,
      score: this.clamp01(score),
      explanation: {
        skillMatch: this.roundScore(skillMatch),
        availability: this.roundScore(availability),
        workload: this.roundScore(workload),
        speed: this.roundScore(speed),
        priorityFit: this.roundScore(priorityFit)
      }
    };
  }

  private canAcceptTicket(technician: TechnicianCandidate) {
    return technician.availability !== "OFFLINE" && technician.workload < technician.capacity;
  }

  private skillMatch(technician: TechnicianCandidate, input: AssignmentInput) {
    const requiredSkills = this.requiredSkills(input);
    if (requiredSkills.length === 0) return 0.5;

    const technicianSkills = new Set(technician.skills.map((skill) => this.normalize(skill)));
    const matches = requiredSkills.filter((skill) => technicianSkills.has(skill)).length;
    return matches / requiredSkills.length;
  }

  private requiredSkills(input: AssignmentInput) {
    const skills = input.requiredSkills && input.requiredSkills.length > 0 ? input.requiredSkills : [input.category];
    return [...new Set(skills.map((skill) => this.normalize(skill)).filter(Boolean))];
  }

  private workloadScore(technician: TechnicianCandidate) {
    return this.clamp01(1 - technician.workload / Math.max(technician.capacity, 1));
  }

  private speedScore(technician: TechnicianCandidate) {
    if (technician.averageResolutionHours <= 0) return 0.6;
    return this.clamp01(1 - technician.averageResolutionHours / 12);
  }

  private priorityFit(technician: TechnicianCandidate, input: AssignmentInput) {
    if (input.severity === "CRITICAL" || input.priority === "P1") {
      return technician.availability === "AVAILABLE" && technician.workload === 0 ? 1 : 0.55;
    }

    if (input.priority === "P2" || input.severity === "HIGH") {
      return technician.availability === "AVAILABLE" ? 0.85 : 0.5;
    }

    return 0.65;
  }

  private compareTechnicians(left: ScoredTechnician, right: ScoredTechnician) {
    const scoreDelta = right.score - left.score;
    if (scoreDelta !== 0) return scoreDelta;

    const skillDelta = right.explanation.skillMatch - left.explanation.skillMatch;
    if (skillDelta !== 0) return skillDelta;

    const workloadDelta = left.technician.workload - right.technician.workload;
    if (workloadDelta !== 0) return workloadDelta;

    const speedDelta = left.technician.averageResolutionHours - right.technician.averageResolutionHours;
    if (speedDelta !== 0) return speedDelta;

    return left.technician.id.localeCompare(right.technician.id);
  }

  private reasonFor(best: ScoredTechnician, input: AssignmentInput) {
    const skills = this.requiredSkills(input).join(", ");
    return `Selected ${best.technician.id} because the technician best balances ${skills} skill coverage, availability, workload, resolution speed, and priority fit.`;
  }

  private emptyDecision(reason: string): AssignmentDecision {
    return {
      technicianId: null,
      score: 0,
      reason,
      alternatives: [],
      explanation: {
        skillMatch: 0,
        availability: 0,
        workload: 0,
        speed: 0,
        priorityFit: 0
      }
    };
  }

  private normalize(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
  }

  private roundScore(value: number) {
    return Number(value.toFixed(2));
  }

  private clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
  }
}
