import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  startSession,
  submitStepOutcome,
  getSession,
  listSessions,
  getUserDashboardStats
} from "../services/troubleshootingSessionService.js";

export const sessionRouter = Router();

sessionRouter.use(authenticate);

/* POST /api/sessions — Start new troubleshooting session */
sessionRouter.post("/", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const { problemDescription, category, severity } = req.body;

    if (!problemDescription) {
      res.status(400).json({ error: "problemDescription is required" });
      return;
    }

    const result = await startSession(user, { problemDescription, category, severity });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/* GET /api/sessions — List user's sessions */
sessionRouter.get("/", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const status = req.query.status as string | undefined;
    const sessions = await listSessions(user, { status });
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

/* GET /api/sessions/stats — Dashboard stats */
sessionRouter.get("/stats", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const stats = await getUserDashboardStats(user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/* GET /api/sessions/:id — Get session details */
sessionRouter.get("/:id", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const session = await getSession(user, req.params.id);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

/* POST /api/sessions/:id/steps/:stepNumber/outcome — Submit step outcome */
sessionRouter.post("/:id/steps/:stepNumber/outcome", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const { outcome, userFeedback } = req.body;

    if (!outcome || !["SUCCESS", "FAILURE", "SKIPPED"].includes(outcome)) {
      res.status(400).json({ error: "outcome must be SUCCESS, FAILURE, or SKIPPED" });
      return;
    }

    const result = await submitStepOutcome(
      user,
      req.params.id,
      parseInt(req.params.stepNumber, 10),
      { outcome, userFeedback }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});
