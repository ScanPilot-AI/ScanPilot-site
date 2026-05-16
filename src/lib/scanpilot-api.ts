import type {
  ModelAnalysisResponse,
  ValidationMetrics,
} from "../data/scanpilot-demo-data";

const ANALYZE = "/v1/oncology/imaging/analyze";
const COHORTS_BUILD = "/v1/cohorts/build";
const DATASETS = "/v1/datasets";
const VALIDATION = "/v1/validation";
const EXPORT_PKG = "/v1/export/package";

export function getScanPilotApiBase(): string | null {
  const v = import.meta.env.VITE_SCANPILOT_API_URL?.trim();
  if (!v) return null;
  return v.replace(/\/+$/, "");
}

export function hasScanPilotApi(): boolean {
  return Boolean(getScanPilotApiBase());
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
