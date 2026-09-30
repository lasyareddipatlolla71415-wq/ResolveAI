import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { IncidentDetectionService } from "../services/incidents/IncidentDetectionService.js";

const detectDuplicateSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().optional(),
  excludeTicketId: z.string().optional()
});

const linkDuplicateSchema = z.object({
  ticketId: z.string().min(1),
  targetTicketId: z.string().min(1),
  note: z.string().optional()
});

export const incidentRouter = Router();

incidentRouter.use(authenticate);

/* POST /api/incidents/detect-duplicate — Detect duplicates for input problem */
incidentRouter.post("/detect-duplicate", async (req, res, next) => {
  try {
    const input = detectDuplicateSchema.parse(req.body);
    const service = new IncidentDetectionService();
    const result = await service.detectPotentialDuplicate(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/* GET /api/incidents/clusters — List active incident clusters and outages */
incidentRouter.get("/clusters", async (_req, res, next) => {
  try {
    const service = new IncidentDetectionService();
    const clusters = await service.getIncidentClusters();
    res.json({ clusters });
  } catch (error) {
    next(error);
  }
});

/* POST /api/incidents/link-duplicate — Link ticket as duplicate (Staff/Admin) */
incidentRouter.post("/link-duplicate", authorizeRoles("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const input = linkDuplicateSchema.parse(req.body);
    const user = req.authUser!;
    const service = new IncidentDetectionService();
    const result = await service.linkDuplicate(input.ticketId, input.targetTicketId, user, input.note);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
