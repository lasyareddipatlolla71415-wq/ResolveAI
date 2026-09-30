import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from "../services/notificationService.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

/* GET /api/notifications — List user's notifications */
notificationRouter.get("/", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const unreadOnly = req.query.unreadOnly === "true";
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const notifications = await listNotifications(user, { unreadOnly, limit });
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

/* GET /api/notifications/unread-count — Unread count */
notificationRouter.get("/unread-count", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const count = await getUnreadCount(user);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

/* PUT /api/notifications/:id/read — Mark one as read */
notificationRouter.put("/:id/read", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const result = await markAsRead(user, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/* PUT /api/notifications/read-all — Mark all as read */
notificationRouter.put("/read-all", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const result = await markAllAsRead(user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
