import { describe, expect, it } from "vitest";
import { AssignmentService, type TechnicianCandidate } from "./AssignmentService.js";

const service = new AssignmentService();

describe("AssignmentService", () => {
  it("selects the best technician by skill, availability, workload, and speed", () => {
    const decision = service.selectTechnician({
      category: "network",
      severity: "MEDIUM",
      priority: "P3",
      technicians: [
        candidate("tech-busy-network", ["network"], "BUSY", 1, 5, 2),
        candidate("tech-available-network", ["network", "server"], "AVAILABLE", 2, 8, 3),
        candidate("tech-identity", ["identity"], "AVAILABLE", 0, 6, 1)
      ]
    });

    expect(decision.technicianId).toBe("tech-available-network");
    expect(decision.score).toBeGreaterThan(0.75);
    expect(decision.alternatives[0]).toMatchObject({ technicianId: "tech-busy-network" });
    expect(decision.explanation.skillMatch).toBe(1);
  });

  it("prioritizes required multi-skill coverage over a lighter workload", () => {
    const decision = service.selectTechnician({
      category: "server",
      severity: "HIGH",
      priority: "P2",
      requiredSkills: ["server", "security"],
      technicians: [
        candidate("tech-server-only", ["server"], "AVAILABLE", 0, 8, 2),
        candidate("tech-server-security", ["server", "security"], "AVAILABLE", 3, 8, 4)
      ]
    });

    expect(decision.technicianId).toBe("tech-server-security");
    expect(decision.explanation.skillMatch).toBe(1);
  });

  it("ignores offline technicians and technicians at capacity", () => {
    const decision = service.selectTechnician({
      category: "identity",
      severity: "LOW",
      priority: "P4",
      technicians: [
        candidate("tech-offline", ["identity"], "OFFLINE", 0, 5, 2),
        candidate("tech-full", ["identity"], "AVAILABLE", 5, 5, 2)
      ]
    });

    expect(decision.technicianId).toBeNull();
    expect(decision.reason).toContain("No technician");
  });

  it("uses a deterministic tie-break when scores are equivalent", () => {
    const decision = service.selectTechnician({
      category: "applications",
      severity: "LOW",
      priority: "P4",
      technicians: [
        candidate("tech-b", ["applications"], "AVAILABLE", 1, 5, 3),
        candidate("tech-a", ["applications"], "AVAILABLE", 1, 5, 3)
      ]
    });

    expect(decision.technicianId).toBe("tech-a");
  });
});

function candidate(
  id: string,
  skills: string[],
  availability: TechnicianCandidate["availability"],
  workload: number,
  capacity: number,
  averageResolutionHours: number
): TechnicianCandidate {
  return { id, skills, availability, workload, capacity, averageResolutionHours };
}
