import { Router } from "express";
import { z } from "zod";
import { AssignmentService } from "../services/assignment/AssignmentService.js";

const technicianSchema = z.object({
  id: z.string().trim().min(1),
  skills: z.array(z.string().trim().min(1)).default([]),
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]),
  workload: z.number().int().min(0),
  capacity: z.number().int().min(1),
  averageResolutionHours: z.number().min(0)
});

const selectTechnicianSchema = z.object({
  category: z.string().trim().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
  priority: z.enum(["P4", "P3", "P2", "P1"]).default("P4"),
  requiredSkills: z.array(z.string().trim().min(1)).optional(),
  preferredTechnicianIds: z.array(z.string().trim().min(1)).optional(),
  technicians: z.array(technicianSchema).min(1)
});

export const assignmentRouter = Router();

assignmentRouter.post("/select-technician", (req, res, next) => {
  try {
    const input = selectTechnicianSchema.parse(req.body);
    const decision = new AssignmentService().selectTechnician(input);
    res.json({ decision });
  } catch (error) {
    next(error);
  }
});
