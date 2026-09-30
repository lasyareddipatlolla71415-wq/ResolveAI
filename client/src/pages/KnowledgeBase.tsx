import { useEffect, useState } from "react";
import { Database, FileText, Search, Upload } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  type KnowledgeDocumentSummary,
  type RagChunk,
  indexKnowledgeDocument,
  listKnowledgeDocuments,
  searchKnowledge
} from "../services/api";

export function KnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDocumentSummary[]>([]);
  const [results, setResults] = useState<RagChunk[]>([]);
  const [title, setTitle] = useState("VPN Access Troubleshooting");
  const [category, setCategory] = useState("network");
  const [content, setContent] = useState(
    "If a user cannot connect to VPN, first confirm internet connectivity and account status. Ask the user to restart the VPN client and retry. If the client shows an authentication error, clear cached credentials and sign in again. Escalate when the device certificate is missing or multiple users report the same outage."
  );
  const [query, setQuery] = useState("Wi-Fi asks for password again and will not connect");
  const [status, setStatus] = useState("Loading knowledge index.");

  useEffect(() => {
    void refreshDocuments();
  }, []);

  async function refreshDocuments() {
    try {
      const nextDocuments = await listKnowledgeDocuments();
      setDocuments(nextDocuments);
      setStatus(`${nextDocuments.length} documents available for retrieval.`);
    } catch {
      setStatus("Knowledge API is unavailable.");
    }
  }

  async function addDocument() {
    try {
      const document = await indexKnowledgeDocument({ title, category, content });
      setDocuments((current) => [document, ...current]);
      setStatus(`Indexed ${document.title} into ${document.storage}.`);
    } catch {
      setStatus("Document indexing failed.");
    }
  }

  async function runSearch() {
    try {
      const chunks = await searchKnowledge(query, category);
      setResults(chunks);
      setStatus(`Retrieved ${chunks.length} chunks for the current query.`);
    } catch {
      setStatus("Knowledge search failed.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Knowledge base"
        title="Source documents for retrieval-aware troubleshooting"
        actions={
          <button className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white" onClick={addDocument}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Index
          </button>
        }
      />
      <main className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Title
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Category
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
              Document text
              <textarea
                className="min-h-[150px] resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Vector search</h2>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800" onClick={runSearch}>
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {results.map((result) => (
                <article key={result.chunkId} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{result.title}</p>
                    <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                      {(result.relevance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{result.content}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Index status</h2>
            </div>
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{status}</p>
          </section>
          <section className="grid gap-4">
            {documents.map((document) => (
              <article key={document.documentId} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <FileText className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="mt-4 font-semibold">{document.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {document.category} · {document.chunkCount} chunks · {document.storage}
                </p>
              </article>
            ))}
          </section>
        </aside>
      </main>
    </>
  );
}
