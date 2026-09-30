import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { assignmentRouter } from "./assignment.routes.js";
import { chatRouter } from "./chat.routes.js";
import { knowledgeRouter } from "./knowledge.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { qdrantRouter } from "./qdrant.routes.js";
import { sessionRouter } from "./session.routes.js";
import { staffRouter } from "./staff.routes.js";
import { ticketRouter } from "./ticket.routes.js";
import { troubleshootingRouter } from "./troubleshooting.routes.js";
import { incidentRouter } from "./incidents.routes.js";
import { analyticsRouter } from "./analytics.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/assignment", assignmentRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/incidents", incidentRouter);
apiRouter.use("/knowledge", knowledgeRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/qdrant", qdrantRouter);
apiRouter.use("/sessions", sessionRouter);
apiRouter.use("/staff", staffRouter);
apiRouter.use("/tickets", ticketRouter);
apiRouter.use("/troubleshooting", troubleshootingRouter);

apiRouter.use((_req, res) => {
  res.status(404).json({ error: "Route not implemented in current phase" });
});

