import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { optionalAuthenticate } from "../middleware/auth.js";
import { appendMessage, createConversation, deleteConversation, getConversation, listConversations } from "../services/chatService.js";

const createChatSchema = z.object({
  message: z.string().trim().min(1).max(4000).optional(),
  userId: z.string().trim().min(1).optional()
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  userId: z.string().trim().min(1).optional()
});

function resolveUserId(req: Request, userId?: string) {
  if (req.authUser) {
    return req.authUser.id;
  }

  return userId ?? "development-user";
}

export const chatRouter = Router();

chatRouter.use(optionalAuthenticate);

chatRouter.get("/", async (req, res, next) => {
  try {
    const conversations = await listConversations(resolveUserId(req, req.query.userId?.toString()));
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/", async (req, res, next) => {
  try {
    const input = createChatSchema.parse(req.body);
    const conversation = await createConversation({
      userId: resolveUserId(req, input.userId),
      message: input.message
    });
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/new", async (req, res, next) => {
  try {
    const input = createChatSchema.parse(req.body);
    const conversation = await createConversation({
      userId: resolveUserId(req, input.userId),
      message: input.message
    });
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
});

chatRouter.get("/:conversationId", async (req, res, next) => {
  try {
    const conversation = await getConversation(req.params.conversationId, resolveUserId(req, req.query.userId?.toString()));
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/:conversationId/message", async (req, res, next) => {
  try {
    const input = messageSchema.parse(req.body);
    const conversation = await appendMessage(req.params.conversationId, input.message, resolveUserId(req, input.userId));
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

chatRouter.delete("/:conversationId", async (req, res, next) => {
  try {
    const result = await deleteConversation(req.params.conversationId, resolveUserId(req, req.query.userId?.toString()));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

