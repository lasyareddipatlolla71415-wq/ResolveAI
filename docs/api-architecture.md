# API Architecture

The REST API is organized by user workflow and domain boundary.

## Routes

- Auth: register, login, current user
- Chat: conversation start and messages
- Problems: classification and analysis
- Troubleshooting: next action, outcome recording, history
- Tickets: create, list, update, assign, resolve, reopen
- Technicians: list, profile, workload
- Knowledge: upload, index, list, delete
- Analytics: overview, AI performance, troubleshooting, root causes, incidents
- Feedback: resolution confirmation and rating

## Implemented Endpoints

`POST /api/troubleshooting/next-action`

This endpoint validates a minimal request and exercises the first explainable adaptive scoring interface. It uses development actions only until the Phase 6 action library and Phase 8 outcomes persistence exist.

`POST /api/auth/register`

Creates a user account with a role, stores a salted password hash, and returns the authenticated profile plus a JWT.

`POST /api/auth/login`

Validates credentials for an active user and returns the authenticated profile plus a JWT.

`GET /api/auth/me`

Uses a bearer token to return the current authenticated user.

When `MONGODB_URI` is not set, auth runs against an in-memory development store so the API can be exercised before database setup. Once MongoDB is connected, the same routes persist users through Mongoose.

`GET /api/knowledge/documents`

Lists indexed RAG documents and reports whether they are stored in memory or MongoDB Vector Search.

`POST /api/knowledge/documents`

Indexes text into chunks, embeds each chunk, and stores it in the active vector store.

`POST /api/knowledge/search`

Embeds the query and retrieves relevant chunks for AI troubleshooting context.
