import type {
  ModelAnalysisResponse,
  ValidationMetrics,
} from "../data/scanpilot-demo-data";

const ANALYZE = "/v1/oncology/imaging/analyze";
const COHORTS_BUILD = "/v1/cohorts/build";
const DATASETS = "/v1/datasets";
const VALIDATION = "/v1/validation";
const EXPORT_PKG = "/v1/export/package";

/** PanTS / ePAI flask backend base (no trailing slash). */
function envString(key: string): string {
  const raw = import.meta.env[key as keyof ImportMetaEnv];
  return typeof raw === "string" ? raw.trim() : "";
}

export function getScanPilotApiBase(): string | null {
  const v =
    envString("VITE_SCANPILOT_API_BASE_URL") || envString("VITE_SCANPILOT_API_URL");
  if (!v) return null;
  return v.replace(/\/+$/, "");
}

/** Legacy enterprise mock API — separate from CT upload pipeline. */
export function hasScanPilotApi(): boolean {
  return Boolean(getScanPilotApiBase()) && !isCtAnalysisMockMode();
}

/** CT sandbox uses PanTS routes when base URL is set and demo mode is not "mock". */
export function isCtAnalysisMockMode(): boolean {
  if (envString("VITE_SCANPILOT_DEMO_MODE").toLowerCase() === "mock") {
    return true;
  }
  const base = getScanPilotApiBase();
  if (!base || base.includes("your-pants-flask-host")) {
    return true;
  }
  return false;
}

export function isCtAnalysisLive(): boolean {
  return !isCtAnalysisMockMode();
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type AnalyzeScanInput = {
  scan_id: string;
  case_id: string;
  task?: string;
  inputs?: {
    modality?: string;
    format?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  };
  return?: string[];
};

export type BuildCohortInput = {
  cohort_id?: string;
  filters: Record<string, unknown>;
  name?: string;
};

export type ExportPackageInput = {
  package_id: string;
  dataset_id?: string;
  cohort_id?: string;
  export_type?: string;
};

export type ApiCallMeta = {
  mode: "live" | "demo";
  error?: string;
};

export async function analyzeScan(
  input: AnalyzeScanInput,
  mock: ModelAnalysisResponse
): Promise<{ data: ModelAnalysisResponse; meta: ApiCallMeta }> {
  const base = getScanPilotApiBase();
  if (!base) {
    return { data: mock, meta: { mode: "demo" } };
  }
  try {
    const res = await fetch(`${base}${ANALYZE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan_id: input.scan_id,
        case_id: input.case_id,
        task: input.task ?? "pancreatic_risk_screening",
        inputs: input.inputs ?? {
          modality: "CT",
          format: "remote_scan_reference",
          metadata: {},
        },
        return: input.return ?? [
          "risk_score",
          "risk_band",
          "confidence",
          "attention_regions",
          "label_explanations",
          "model_version",
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      const body = await safeJson(res);
      return {
        data: mock,
        meta: {
          mode: "demo",
          error: `API ${res.status}: ${JSON.stringify(body)}`,
        },
      };
    }
    const parsed = (await safeJson(res)) as ModelAnalysisResponse | null;
    if (!parsed || typeof parsed !== "object") {
      return { data: mock, meta: { mode: "demo", error: "Invalid JSON from API" } };
    }
    return { data: parsed, meta: { mode: "live" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { data: mock, meta: { mode: "demo", error: msg } };
  }
}

export async function buildCohort(
  filters: BuildCohortInput,
  mock: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; meta: ApiCallMeta }> {
  const base = getScanPilotApiBase();
  if (!base) {
    return { data: mock, meta: { mode: "demo" } };
  }
  try {
    const res = await fetch(`${base}${COHORTS_BUILD}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return {
        data: mock,
        meta: { mode: "demo", error: `API ${res.status}` },
      };
    }
    const parsed = (await safeJson(res)) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") {
      return { data: mock, meta: { mode: "demo", error: "Invalid JSON" } };
    }
    return { data: parsed, meta: { mode: "live" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { data: mock, meta: { mode: "demo", error: msg } };
  }
}

export async function exportDatasetPackage(
  input: ExportPackageInput,
  mock: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; meta: ApiCallMeta }> {
  const base = getScanPilotApiBase();
  if (!base) {
    return { data: mock, meta: { mode: "demo" } };
  }
  try {
    const res = await fetch(`${base}${EXPORT_PKG}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return {
        data: mock,
        meta: { mode: "demo", error: `API ${res.status}` },
      };
    }
    const parsed = (await safeJson(res)) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") {
      return { data: mock, meta: { mode: "demo", error: "Invalid JSON" } };
    }
    return { data: parsed, meta: { mode: "live" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { data: mock, meta: { mode: "demo", error: msg } };
  }
}

export async function getValidationMetrics(
  modelId: string,
  mock: ValidationMetrics
): Promise<{ data: ValidationMetrics; meta: ApiCallMeta }> {
  const base = getScanPilotApiBase();
  if (!base) {
    return { data: mock, meta: { mode: "demo" } };
  }
  try {
    const res = await fetch(
      `${base}${VALIDATION}/${encodeURIComponent(modelId)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(25_000),
      }
    );
    if (!res.ok) {
      return { data: mock, meta: { mode: "demo", error: `API ${res.status}` } };
    }
    const parsed = (await safeJson(res)) as ValidationMetrics | null;
    if (!parsed || typeof parsed !== "object") {
      return { data: mock, meta: { mode: "demo", error: "Invalid JSON" } };
    }
    return { data: parsed, meta: { mode: "live" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { data: mock, meta: { mode: "demo", error: msg } };
  }
}

export type DatasetRow = {
  dataset_id: string;
  name: string;
  modality: string;
  patients: number;
  centers: number;
  label_types: string[];
  status: string;
};

export async function getDatasets(
  mock: DatasetRow[]
): Promise<{ data: DatasetRow[]; meta: ApiCallMeta }> {
  const base = getScanPilotApiBase();
  if (!base) {
    return { data: mock, meta: { mode: "demo" } };
  }
  try {
    const res = await fetch(`${base}${DATASETS}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      return { data: mock, meta: { mode: "demo", error: `API ${res.status}` } };
    }
    const parsed = (await safeJson(res)) as unknown;
    if (Array.isArray(parsed)) {
      return { data: parsed as DatasetRow[], meta: { mode: "live" } };
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { datasets?: unknown }).datasets)
    ) {
      return {
        data: (parsed as { datasets: DatasetRow[] }).datasets,
        meta: { mode: "live" },
      };
    }
    return { data: mock, meta: { mode: "demo", error: "Unexpected shape" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { data: mock, meta: { mode: "demo", error: msg } };
  }
}

/* -------------------------------------------------------------------------- */
/* CT Analysis Sandbox — PanTS flask `/api/*` adapter                           */
/* -------------------------------------------------------------------------- */

const CHUNK_SIZE = 256 * 1024;
const ACCEPTED_CT_EXTENSIONS = [".nii", ".nii.gz", ".npz", ".zip"];

export type CtAnalysisSession = {
  sessionId: string;
  createdAt: string;
};

export type CtJobStatus = {
  jobId: string;
  sessionId: string;
  status: "queued" | "running" | "completed" | "failed" | "not_found";
  progress?: number;
  error?: string;
  rawStatus?: string;
};

export type CtAnalysisArtifacts = {
  overlayPreview?: string;
  combinedLabels?: string;
  reportPackage?: string;
  viewerSession?: string;
};

export type CtAnalysisResult = {
  sessionId: string;
  modelStatus: string;
  analysisMode: string;
  anatomyParsed: string[];
  candidateRegionSummary: string;
  reviewPriority: "routine" | "elevated" | "urgent";
  humanReviewRequired: boolean;
  artifacts: CtAnalysisArtifacts;
  uploadedFilename?: string;
  bdmapId?: string;
  simulated: boolean;
};

export type CtUploadMeta = {
  uploadedFilename: string;
  path?: string;
  bdmapId?: string;
};

function pantsApi(path: string): string {
  return `${getScanPilotApiBase()}${path.startsWith("/api") ? path : `/api${path}`}`;
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as Record<string, unknown>;
  }
  const text = await res.text();
  throw new Error(
    `Expected JSON (HTTP ${res.status}): ${text.slice(0, 160).replace(/\s+/g, " ")}`
  );
}

function normalizeInferenceStatus(
  sessionId: string,
  data: Record<string, unknown>
): CtJobStatus {
  const raw = String(data.status ?? "unknown").toLowerCase();
  let status: CtJobStatus["status"] = "running";
  if (raw === "completed" || raw === "succeeded" || raw === "done") {
    status = "completed";
  } else if (raw === "failed" || raw === "error") {
    status = "failed";
  } else if (raw === "not_found") {
    status = "not_found";
  } else if (raw === "queued" || raw === "pending") {
    status = "queued";
  }
  return {
    jobId: sessionId,
    sessionId,
    status,
    error: typeof data.error === "string" ? data.error : undefined,
    rawStatus: raw,
  };
}

function buildMockResult(sessionId: string): CtAnalysisResult {
  return {
    sessionId,
    modelStatus: "Completed (simulated)",
    analysisMode: "JHU/ePAI research-use inference",
    anatomyParsed: ["Pancreas", "Pancreatic duct", "Lesion channel"],
    candidateRegionSummary:
      "Research-use candidate region flagged in head of pancreas — requires expert review.",
    reviewPriority: "elevated",
    humanReviewRequired: true,
    artifacts: {
      overlayPreview: "../demo/#viewer",
      combinedLabels: "combined_labels.nii.gz (simulated)",
      reportPackage: "validation_bundle_demo.zip (simulated)",
      viewerSession: "../demo/#viewer",
    },
    simulated: true,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function isAcceptedCtFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_CT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function createAnalysisSession(): CtAnalysisSession {
  const sessionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return { sessionId, createdAt: new Date().toISOString() };
}

export async function uploadCTFile(
  sessionId: string,
  file: File,
  onProgress?: (pct: number, label?: string) => void
): Promise<CtUploadMeta> {
  if (!isAcceptedCtFile(file)) {
    throw new Error("Unsupported file type. Use .nii, .nii.gz, .npz, or .zip.");
  }

  if (isCtAnalysisMockMode()) {
    const steps = [12, 28, 45, 62, 78, 92, 100];
    for (const pct of steps) {
      await delay(180);
      onProgress?.(pct, pct < 100 ? "Uploading in secure chunks (simulated)" : "Volume ready");
    }
    return {
      uploadedFilename: file.name,
      bdmapId: `BDMAP_${sessionId.replace(/-/g, "").slice(0, 8)}`,
    };
  }

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  onProgress?.(0, "Preparing CT volume");

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("chunk_index", i.toString());
    formData.append("total_chunks", totalChunks.toString());
    formData.append("file", chunk);

    const res = await fetch(pantsApi("/upload-inference-chunk"), {
      method: "POST",
      body: formData,
    });
    if (res.status === 413) {
      throw new Error("Upload chunk too large for server limit (HTTP 413).");
    }
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(String(data.error ?? "Chunk upload failed"));
    }
    const pct = Math.round(((i + 1) / totalChunks) * 100);
    onProgress?.(pct, totalChunks > 1 ? "Uploading in secure chunks" : "Preparing CT volume");
  }

  const finalizeBody = new URLSearchParams({
    session_id: sessionId,
    total_chunks: totalChunks.toString(),
    output_filename: file.name,
  });
  const finalizeRes = await fetch(pantsApi("/finalize-upload"), {
    method: "POST",
    body: finalizeBody,
  });
  const finalizeData = await parseJsonResponse(finalizeRes);
  if (!finalizeRes.ok) {
    throw new Error(String(finalizeData.error ?? "Finalize upload failed"));
  }

  return {
    uploadedFilename: String(finalizeData.uploaded_filename ?? file.name),
    path: typeof finalizeData.path === "string" ? finalizeData.path : undefined,
    bdmapId: typeof finalizeData.bdmap_id === "string" ? finalizeData.bdmap_id : undefined,
  };
}

export async function startEpaiAnalysis(
  sessionId: string,
  uploadMeta?: CtUploadMeta
): Promise<{ jobId: string; sessionId: string }> {
  if (isCtAnalysisMockMode()) {
    await delay(400);
    return { jobId: sessionId, sessionId };
  }

  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("model_name", "ePAI");
  if (uploadMeta?.uploadedFilename) {
    formData.append("uploaded_filename", uploadMeta.uploadedFilename);
  }
  if (uploadMeta?.path) {
    formData.append("INPUT_SERVER_PATH", uploadMeta.path);
  }

  const res = await fetch(pantsApi("/run-epai-inference"), {
    method: "POST",
    body: formData,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(String(data.error ?? "Failed to start ePAI analysis"));
  }
  const sid = String(data.session_id ?? sessionId);
  return { jobId: sid, sessionId: sid };
}

export async function pollAnalysisStatus(jobId: string): Promise<CtJobStatus> {
  if (isCtAnalysisMockMode()) {
    return { jobId, sessionId: jobId, status: "running", rawStatus: "running" };
  }

  const res = await fetch(pantsApi(`/inference-status/${encodeURIComponent(jobId)}`));
  if (res.status === 404) {
    return { jobId, sessionId: jobId, status: "not_found" };
  }
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    return {
      jobId,
      sessionId: jobId,
      status: "failed",
      error: String(data.error ?? data.status ?? "Status check failed"),
    };
  }
  return normalizeInferenceStatus(jobId, data);
}

export async function getAnalysisResult(
  sessionId: string,
  uploadMeta?: CtUploadMeta
): Promise<CtAnalysisResult> {
  if (isCtAnalysisMockMode()) {
    return buildMockResult(sessionId);
  }

  const status = await pollAnalysisStatus(sessionId);
  const modelStatus =
    status.status === "completed"
      ? "Completed"
      : status.status === "failed"
        ? "Failed"
        : status.status === "queued"
          ? "Queued"
          : "Running";

  const artifacts: CtAnalysisArtifacts = {
    combinedLabels: pantsApi(`/get_result/${encodeURIComponent(sessionId)}`),
    reportPackage: pantsApi(
      `/get-report/${encodeURIComponent(uploadMeta?.bdmapId ?? sessionId)}`
    ),
    viewerSession: getViewerUrl(sessionId),
    overlayPreview: getViewerUrl(sessionId),
  };

  return {
    sessionId,
    modelStatus,
    analysisMode: "JHU/ePAI research-use inference",
    anatomyParsed: ["Pancreas", "Pancreatic duct", "Lesion-aware channel"],
    candidateRegionSummary:
      "Model output available for research-use review. Human expert review required.",
    reviewPriority: status.status === "completed" ? "elevated" : "routine",
    humanReviewRequired: true,
    artifacts,
    uploadedFilename: uploadMeta?.uploadedFilename,
    bdmapId: uploadMeta?.bdmapId,
    simulated: false,
  };
}

export function getViewerUrl(sessionId: string): string {
  if (isCtAnalysisMockMode()) {
    return "../demo/#viewer";
  }
  const base = getScanPilotApiBase();
  if (!base) return "../demo/#viewer";
  return `${base}/visualization?session=${encodeURIComponent(sessionId)}`;
}

export async function runMockAnalysisPipeline(
  sessionId: string,
  onStep?: (step: number) => void
): Promise<CtAnalysisResult> {
  for (let i = 0; i < 5; i++) {
    onStep?.(i);
    await delay(1400);
  }
  return buildMockResult(sessionId);
}
