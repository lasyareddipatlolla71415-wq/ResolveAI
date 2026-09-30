# ResolveAI System Architecture

## Purpose

ResolveAI is built around outcome-driven adaptive troubleshooting. The ticketing system is the escalation layer, RAG is the organizational knowledge layer, and the Adaptive Troubleshooting Engine is the core intelligence component.

## Runtime Architecture

```text
React client
  REST + WebSocket
Express API
  Controllers
  Services
    AI Provider
    RAG Retrieval
    Adaptive Troubleshooting
    Escalation
    Ticketing
    Assignment
    Incident Detection
    Analytics
    Notifications
MongoDB Atlas
```

## Critical Flow

1. User describes a problem.
2. Classification detects category, severity, confidence, and critical bypass conditions.
3. Critical problems immediately become P1 tickets with human assignment.
4. Non-critical problems retrieve knowledge chunks and approved troubleshooting actions.
5. The adaptive engine selects the next action using explainable scoring.
6. The user confirms whether the action worked.
7. Outcomes update troubleshooting memory.
8. The system either resolves, tries a better action, asks a question, or escalates.

## Design Decisions

- Troubleshooting actions come from an approved action library. The LLM may recommend among approved actions but must not invent operationally dangerous steps.
- The first adaptive implementation is an interpretable scoring mechanism, not a machine learning claim.
- All adaptive decisions store explanations for research traceability and reviewer inspection.
- AI provider selection is abstracted so cloud LLM and local Ollama modes can be swapped.
- Mock AI behavior is allowed only in development mode and must be labeled as such.

