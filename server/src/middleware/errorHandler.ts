import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }

  if (error.name === "AuthenticationError") {
    res.status(401).json({ error: error.message });
    return;
  }

  if (error.name === "AuthorizationError") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (error.name === "ConflictError") {
    res.status(409).json({ error: error.message });
    return;
  }

  if (error.message === "Conversation not found") {
    res.status(404).json({ error: error.message });
    return;
  }

  if (error.message === "Message content is required" || error.message === "Message content is too long") {
    res.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
