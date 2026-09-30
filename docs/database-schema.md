# Database Schema

The application uses MongoDB Atlas with Mongoose models. MongoDB Atlas Vector Search is used for knowledge chunks when RAG indexing is configured.

## Collections

- users: account identity, password hash, role, department, contact, timestamps
- technicians: human support staff profile, skills, availability, workload, capacity, performance
- tickets: escalation records, status, priority, user, technician, attempted actions, RAG sources, AI confidence
- conversations: user/AI/technician messages, linked problem and ticket references
- troubleshootingAttempts: case-level action path from first recommendation through resolution or escalation
- troubleshootingActions: controlled library of approved actions
- actionOutcomes: action-level result memory for adaptive scoring
- knowledgeDocuments: uploaded document metadata and processing state
- knowledgeChunks: chunk text, embeddings, metadata, source, category
- feedback: user confirmation, rating, comments
- notifications: real-time and persisted notification state
- incidents: master incidents and affected users/tickets
- auditLogs: AI decisions, ticket changes, assignments, admin changes, escalation events

## Outcome Memory

Action outcomes are the central learning unit:

```json
{
  "problemCategory": "network",
  "problemType": "wifi_authentication",
  "actionId": "forget_network",
  "context": {
    "device": "Windows laptop",
    "location": "campus"
  },
  "result": "SUCCESS",
  "resolutionTimeSeconds": 240,
  "aiConfidence": 0.86,
  "userFeedback": 5,
  "timestamp": "2026-08-28T00:00:00.000Z"
}
```

Historical statistics are derived from this collection and cached where needed for performance.

