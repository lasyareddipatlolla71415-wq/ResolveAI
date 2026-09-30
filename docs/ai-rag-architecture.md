# AI and RAG Architecture

## AI Provider Boundary

ResolveAI uses an `AiProvider` interface for classification and response generation. Providers may be backed by a cloud LLM API or Ollama. Application services depend on the interface, not a vendor SDK.

## RAG Pipeline

1. Upload PDF, DOCX, TXT, or Markdown.
2. Extract text with document-type parsers.
3. Clean and normalize content.
4. Chunk text with source metadata.
5. Embed chunks.
6. Store chunks and embeddings in Qdrant.
7. Retrieve relevant chunks through Qdrant semantic search.
8. Record retrieved sources in each recommendation and ticket.

## Current Implementation

The API exposes three RAG endpoints:

- `GET /api/knowledge/documents`
- `POST /api/knowledge/documents`
- `POST /api/knowledge/search`

MongoDB stores application and experience data. Qdrant stores vector knowledge memory. The current `QdrantService` provides infrastructure checks, collection creation, test vector insertion, test search, and cleanup. Full document ingestion and production embeddings are intentionally left for later RAG steps.

The current development embedder is deterministic and local. It keeps the app runnable before an external embedding provider is configured. Production RAG should replace it with the selected embedding model and re-index existing chunks so document and query embeddings come from the same model.

## Qdrant Collection

The default collection is `resolveai_knowledge`. Configure vector size with `QDRANT_VECTOR_SIZE` so it can match the selected future embedding model.

Create a vector index named by `MONGODB_VECTOR_INDEX`, defaulting to `knowledge_embedding_index`, on the `knowledgechunks` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

The backend queries `embedding` with `numCandidates` set to at least 20 times the requested result limit and pre-filters by `category` when supplied.

## Safety Constraint

RAG can influence ranking and explanations, but operational actions still come from the approved troubleshooting action library.
