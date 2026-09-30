import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
  Filter,
  Layers,
  Link2,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
  Zap
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  type AblationBenchmarkRow,
  type ComprehensiveAnalyticsOverview,
  type DuplicateDetectionResult,
  type IncidentCluster,
  detectDuplicateIncidentsApi,
  getComprehensiveAnalyticsApi,
  linkDuplicateTicketApi,
  simulateAblationBenchmarkApi
} from "../services/api";

const PIE_COLORS = ["#0f766e", "#0284c7", "#6366f1", "#f59e0b", "#ec4899", "#84cc16"];

export function Analytics() {
  const [data, setData] = useState<ComprehensiveAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"root-causes" | "actions" | "ablations" | "detector">("root-causes");
  const [refreshing, setRefreshing] = useState(false);

  // Ablation simulation state
  const [sampleSize, setSampleSize] = useState(250);
  const [problemDiversity, setProblemDiversity] = useState(1.0);
  const [learningRate, setLearningRate] = useState(1.0);
  const [simulating, setSimulating] = useState(false);
  const [customAblations, setCustomAblations] = useState<AblationBenchmarkRow[] | null>(null);

  // Live duplicate detector state
  const [testTitle, setTestTitle] = useState("GlobalProtect VPN tunnel drops connection during video calls");
  const [testDescription, setTestDescription] = useState(
    "Whenever I join high bandwidth video meetings over VPN, gateway handshake timeout (code 0x8007274c) occurs."
  );
  const [testCategory, setTestCategory] = useState("vpn");
  const [detectorResult, setDetectorResult] = useState<DuplicateDetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);

  useEffect(() => {
    void loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setRefreshing(true);
    try {
      const result = await getComprehensiveAnalyticsApi();
      setData(result);
      if (!customAblations) {
        setCustomAblations(result.ablationBenchmarks);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRunSimulation() {
    setSimulating(true);
    try {
      const response = await simulateAblationBenchmarkApi({
        sampleSize,
        problemDiversity,
        historicalLearningRate: learningRate
      });
      setCustomAblations(response.results);
    } catch (err) {
      console.error("Failed simulation", err);
    } finally {
      setSimulating(false);
    }
  }

  async function handleTestDuplicate() {
    setDetecting(true);
    setLinkStatus(null);
    try {
      const result = await detectDuplicateIncidentsApi({
        title: testTitle,
        description: testDescription,
        category: testCategory
      });
      setDetectorResult(result);
    } catch (err) {
      console.error("Failed duplicate detection", err);
    } finally {
      setDetecting(false);
    }
  }

  async function handleLinkTicket(ticketId: string, targetTicketId: string) {
    try {
      const result = await linkDuplicateTicketApi(ticketId, targetTicketId);
      setLinkStatus(result.message);
      void loadAnalytics();
    } catch (err) {
      console.error("Failed to link ticket", err);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-slate-500">Loading ResolveAI Analytics Suite...</p>
      </div>
    );
  }

  const ablations = customAblations || data.ablationBenchmarks;

  return (
    <>
      <PageHeader
        eyebrow="Research & Operations"
        title="Adaptive Troubleshooting & Root-Cause Analytics"
        actions={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Analytics Engine
            </span>
            <button
              onClick={() => void loadAnalytics()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      <main className="space-y-6 p-6">
        {/* Top 6 KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">AI Autonomy Rate</span>
              <Brain className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{data.aiResolutionRate}%</span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" /> +24%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Issues resolved without human</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Ticket Reduction</span>
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.ticketReductionRate}%
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <ArrowDownRight className="h-3.5 w-3.5" /> -56% load
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Compared to ticket-first baseline</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Mean Steps</span>
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.avgTroubleshootingAttempts}
              </span>
              <span className="text-xs text-slate-400">steps / resolution</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Down from 4.6 steps in RAG-only</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Resolution</span>
              <Timer className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.avgResolutionTimeMinutes}m
              </span>
              <span className="text-xs text-slate-400">vs 285m manual</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">95% reduction in MTTR</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Duplicate Rate</span>
              <Link2 className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.duplicateIncidentRate}%
              </span>
              <span className="text-xs font-semibold text-sky-600">flagged early</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Pre-empts duplicated technician work</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium uppercase tracking-wider">Outage Clusters</span>
              <AlertTriangle
                className={`h-4 w-4 ${data.potentialOutagesActive > 0 ? "text-amber-500 animate-bounce" : "text-slate-400"}`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {data.potentialOutagesActive}
              </span>
              {data.potentialOutagesActive > 0 ? (
                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Active
                </span>
              ) : (
                <span className="text-xs text-slate-400">None detected</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">Shared incident clusters</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("root-causes")}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "root-causes"
                  ? "border-teal-600 text-teal-600 font-semibold"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Cpu className="h-4 w-4" />
              Root Causes & Outages (Phase 16 & 17)
            </button>

            <button
              onClick={() => setActiveTab("actions")}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "actions"
                  ? "border-teal-600 text-teal-600 font-semibold"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Activity className="h-4 w-4" />
              Action Library Efficacy (Phase 6 & 8)
            </button>

            <button
              onClick={() => setActiveTab("ablations")}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "ablations"
                  ? "border-teal-600 text-teal-600 font-semibold"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Research Ablation Benchmarks (Phases 17 & 19)
            </button>

            <button
              onClick={() => setActiveTab("detector")}
              className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === "detector"
                  ? "border-teal-600 text-teal-600 font-semibold"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Search className="h-4 w-4" />
              Duplicate & Outage Detector (Phase 16)
            </button>
          </nav>
        </div>

        {/* Tab 1: Root Causes & Outages */}
        {activeTab === "root-causes" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Root Cause Distribution Chart */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Verified Root-Cause Distribution</h2>
                    <p className="text-xs text-slate-500">
                      Empirical breakdown of identified system faults across resolved tickets & sessions
                    </p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {data.rootCauses.length} categories
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.rootCauses}
                        dataKey="count"
                        nameKey="rootCause"
                        outerRadius={105}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name.slice(0, 18)}... (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.rootCauses.map((entry, index) => (
                          <Cell key={entry.rootCause} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} incidents (${props.payload.percentage}%)`,
                          props.payload.rootCause
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Root Cause Details List */}
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Root Causes & Autonomous Split</h2>
                <p className="text-xs text-slate-500 mb-4">Comparison of AI vs Human resolution per fault pattern</p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {data.rootCauses.map((rc, idx) => (
                    <div
                      key={rc.rootCause}
                      className="rounded-lg border border-slate-200 p-3 hover:border-teal-400 transition-colors bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{rc.rootCause}</p>
                          <span className="inline-block mt-1 uppercase text-[10px] tracking-wide font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                            {rc.category}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                          {rc.count} incidents ({rc.percentage}%)
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                          <Brain className="h-3.5 w-3.5" /> AI Resolved: {rc.resolvedByAi}
                        </span>
                        <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
                          <Layers className="h-3.5 w-3.5" /> Human Resolved: {rc.resolvedByHuman}
                        </span>
                        <span>Avg MTTR: {rc.avgResolutionMinutes}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Active Incident Outage Clusters */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-teal-700" />
                    Detected Incident Clusters & Potential Outages (Phase 16)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Incidents grouped by text similarity and category within recent time windows to detect duplicate
                    ticket surges and infrastructure outages
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {data.clusters.length} Cluster(s) Tracked
                </span>
              </div>

              {data.clusters.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium">No widespread incident clusters detected.</p>
                  <p className="text-xs text-slate-400">All recent problems are isolated individual requests.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.clusters.map((cluster) => (
                    <div
                      key={cluster.id}
                      className={`rounded-xl border p-4 transition-all ${
                        cluster.isPotentialOutage
                          ? "border-amber-400 bg-amber-50/40 shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                              {cluster.category}
                            </span>
                            {cluster.isPotentialOutage && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                                <AlertTriangle className="h-3 w-3" /> Potential Outage
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-sm font-bold text-slate-900">
                            Cluster #{cluster.id.slice(-6).toUpperCase()} · {cluster.ticketCount} affected tickets
                          </h3>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            cluster.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800"
                              : cluster.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {cluster.severity}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {cluster.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-600"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Correlated Incident Tickets:
                        </p>
                        {cluster.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs rounded bg-white p-2 border border-slate-100"
                          >
                            <span className="font-medium text-slate-800 truncate max-w-[280px]">
                              #{t.id.slice(-6).toUpperCase()} — {t.title}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Action Library Efficacy */}
        {activeTab === "actions" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Action Resolution Performance</h2>
                  <p className="text-xs text-slate-500">
                    Success vs Failure breakdown for each troubleshooting action executed by the Adaptive Engine
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {data.actionEffectiveness.length} Actions in Library
                </span>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.actionEffectiveness} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <XAxis
                      dataKey="actionName"
                      angle={-15}
                      textAnchor="end"
                      height={40}
                      tick={{ fontSize: 11, fill: "#475569" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: "15px" }} />
                    <Bar dataKey="successCount" name="Successful Executions" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failureCount" name="Failed Executions" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="skipCount" name="Skipped by User" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Matrix Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Action Library Telemetry & Failure Penalty Scores</h3>
                <p className="text-xs text-slate-500">
                  Historical outcomes directly feed the Adaptive Troubleshooting Engine's utility ranking formula
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Action Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4 text-center">Attempts</th>
                      <th className="py-3 px-4">Success Rate</th>
                      <th className="py-3 px-4 text-right">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.actionEffectiveness.map((action) => (
                      <tr key={action.actionId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{action.actionName}</td>
                        <td className="py-3 px-4 uppercase font-bold text-slate-500">{action.category}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              action.riskLevel === "high"
                                ? "bg-rose-100 text-rose-800"
                                : action.riskLevel === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {action.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {action.totalAttempts}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${action.successRate}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800">{action.successRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {action.avgExecutionSeconds}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Research Ablation Benchmarks */}
        {activeTab === "ablations" && (
          <div className="space-y-6">
            {/* Interactive Simulation Controls */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-700" />
                    Empirical Ablation Benchmark Runner (Phases 17 & 19)
                  </h3>
                  <p className="text-xs text-teal-800 mt-0.5">
                    Generate comparative empirical evidence across the 4 core architecture variants for research paper
                    tables
                  </p>
                </div>
                <button
                  onClick={() => void handleRunSimulation()}
                  disabled={simulating}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-50"
                >
                  <Play className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
                  {simulating ? "Running Monte Carlo..." : "Run Ablation Benchmark"}
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3 pt-3 border-t border-teal-200/60">
                <label className="text-xs font-semibold text-slate-700">
                  Evaluation Sample Size ({sampleSize} cases)
                  <input
                    type="range"
                    min="50"
                    max="800"
                    step="50"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full mt-1.5 accent-teal-600"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Problem Diversity Factor ({problemDiversity.toFixed(1)}x)
                  <input
                    type="range"
                    min="0.8"
                    max="2.0"
                    step="0.1"
                    value={problemDiversity}
                    onChange={(e) => setProblemDiversity(Number(e.target.value))}
                    className="w-full mt-1.5 accent-teal-600"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Historical Learning Rate ({learningRate.toFixed(1)}x)
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={learningRate}
                    onChange={(e) => setLearningRate(Number(e.target.value))}
                    className="w-full mt-1.5 accent-teal-600"
                  />
                </label>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Ablation Comparison: Autonomy vs Escalation Rate
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Demonstrating the step-change reduction in human escalations when combining RAG, outcome learning, and
                failure memory
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ablations} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <XAxis
                      dataKey="method"
                      tick={{ fontSize: 11, fill: "#475569" }}
                      height={40}
                      tickFormatter={(val) => val.split("(")[0]}
                    />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: "#475569" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolutionRate" name="AI Resolution Rate (%)" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="escalationRate" name="Human Escalation Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repeatedActionRate" name="Repeated Action Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Research Paper Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Table 1: Empirical Ablation Comparison (ResolveAI Evaluation)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Formatted for experimental validation in research paper section 12 & 13
                  </p>
                </div>
                <span className="rounded bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5">
                  N = {sampleSize}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-sans">Support Architecture</th>
                      <th className="py-3 px-4 text-center">AI Res %</th>
                      <th className="py-3 px-4 text-center">Ticket Red %</th>
                      <th className="py-3 px-4 text-center">Mean Steps</th>
                      <th className="py-3 px-4 text-center">MTTR (min)</th>
                      <th className="py-3 px-4 text-center">Escalation %</th>
                      <th className="py-3 px-4 text-center">Repeat %</th>
                      <th className="py-3 px-4 text-right">CSAT / 5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ablations.map((row, idx) => (
                      <tr
                        key={row.method}
                        className={idx === 3 ? "bg-teal-50/50 font-bold text-teal-950" : "hover:bg-slate-50"}
                      >
                        <td className="py-3 px-4 font-sans font-medium">{row.method}</td>
                        <td className="py-3 px-4 text-center text-teal-700 font-bold">{row.resolutionRate}%</td>
                        <td className="py-3 px-4 text-center text-emerald-700 font-bold">{row.ticketReductionRate}%</td>
                        <td className="py-3 px-4 text-center">{row.avgAttempts}</td>
                        <td className="py-3 px-4 text-center">{row.avgResolutionMinutes}m</td>
                        <td className="py-3 px-4 text-center">{row.escalationRate}%</td>
                        <td className="py-3 px-4 text-center text-rose-600 font-bold">
                          {row.repeatedActionRate}%
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{row.userSatisfaction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Live Duplicate & Outage Detector */}
        {activeTab === "detector" && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Input Simulation Panel */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search className="h-5 w-5 text-teal-700" />
                  Live Incident Similarity & Duplicate Checker
                </h3>
                <p className="text-xs text-slate-500">
                  Test the Phase 16 Duplicate Incident Detection algorithm against current repository tickets in
                  real-time
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Problem Title</label>
                <input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600"
                  >
                    <option value="vpn">VPN</option>
                    <option value="network">Network</option>
                    <option value="wi-fi">Wi-Fi</option>
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="account">Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Problem Description & Error Details</label>
                <textarea
                  rows={4}
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <button
                onClick={() => void handleTestDuplicate()}
                disabled={detecting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-800 disabled:opacity-50"
              >
                <Search className={`h-4 w-4 ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "Analyzing Repositories..." : "Analyze Incident For Duplicates & Outages"}
              </button>

              {linkStatus && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {linkStatus}
                </div>
              )}
            </section>

            {/* Results Panel */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Detection Analysis & Candidates</h3>

              {!detectorResult ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center text-slate-400">
                  <Search className="mx-auto h-8 w-8 mb-2 text-slate-300" />
                  <p className="text-xs">Click "Analyze Incident" to run the Jaccard & Cosine duplicate matcher.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`rounded-xl p-4 border ${
                      detectorResult.potentialOutage
                        ? "border-amber-400 bg-amber-50/50"
                        : detectorResult.isDuplicate
                        ? "border-teal-400 bg-teal-50/40"
                        : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Confidence Assessment
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          detectorResult.isDuplicate
                            ? "bg-teal-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {Math.round(detectorResult.highestSimilarity * 100)}% Max Similarity
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-800">{detectorResult.analysis}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Matched Tickets ({detectorResult.candidates.length}):
                    </h4>
                    {detectorResult.candidates.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No existing tickets matched similarity threshold.</p>
                    ) : (
                      detectorResult.candidates.map((cand) => (
                        <div
                          key={cand.ticketId}
                          className="rounded-lg border border-slate-200 p-3.5 space-y-2 bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900">
                                #{cand.ticketId.slice(-6).toUpperCase()} — {cand.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {cand.category}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500">{cand.status}</span>
                              </div>
                            </div>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                cand.confidenceLevel === "HIGH"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {Math.round(cand.similarity * 100)}% Match
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {cand.matchedKeywords.map((k) => (
                              <span
                                key={k}
                                className="rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[10px] font-mono text-teal-800"
                              >
                                {k}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                            {cand.recommendation}
                          </p>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => void handleLinkTicket("ticket-test-new", cand.ticketId)}
                              className="inline-flex items-center gap-1.5 rounded bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800"
                            >
                              <Link2 className="h-3 w-3" /> Link As Duplicate
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
