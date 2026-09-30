import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/auth.js";
import {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  addReply
} from "../services/ticketService.js";

export const ticketRouter = Router();

// All ticket routes require authentication
ticketRouter.use(authenticate);

/* ------------------------------------------------------------------ */
/*  POST /api/tickets — Create a new ticket (any authenticated user)   */
/* ------------------------------------------------------------------ */
ticketRouter.post("/", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const { title, description, category, severity, priority } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({ error: "title, description, and category are required" });
      return;
    }

    const ticket = await createTicket(user, { title, description, category, severity, priority });
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/tickets — List tickets (role-filtered)                    */
/* ------------------------------------------------------------------ */
ticketRouter.get("/", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await listTickets(user, { status: status as any, page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/tickets/:id — Ticket details + replies                    */
/* ------------------------------------------------------------------ */
ticketRouter.get("/:id", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const ticket = await getTicketById(user, req.params.id);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  PUT /api/tickets/:id — Update ticket (Staff / Admin only)          */
/* ------------------------------------------------------------------ */
ticketRouter.put("/:id", authorizeRoles("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const { status, severity, priority, technicianId } = req.body;
    const ticket = await updateTicket(req.params.id, { status, severity, priority, technicianId });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/*  POST /api/tickets/:id/replies — Add reply to ticket thread         */
/* ------------------------------------------------------------------ */
ticketRouter.post("/:id/replies", async (req, res, next) => {
  try {
    const user = req.authUser!;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const reply = await addReply(user, req.params.id, { message });

    if (!reply) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.status(201).json(reply);
  } catch (error) {
    next(error);
  }
});
