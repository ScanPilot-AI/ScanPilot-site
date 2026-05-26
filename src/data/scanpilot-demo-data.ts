export type ModelAnalysisResponse = {
  risk_score: number;
  risk_band: string;
  confidence: number;
  prediagnostic_window_days?: number;
  attention_regions: string[];
  label_explanations: string[];
  model_version: string;
  disclaimer: string;
};

export type DemoCase = {
  case_id: string;
  scan_id: string;
  cancer_type: string;
  organ: string;
  modality: string;
  contrast_phase: string;
  center: string;
  deidentified_age_bucket: string;
  sex: string;
  report_excerpt: string;
  slice_count: number;
  /** Folder name under assets/demo-cases (matches PanTS id) */
  asset_folder: string;
  labels: string[];
  weak_labels: LabelExtraction[];
  model_demo_result: ModelAnalysisResponse;
  disclaimer: string;
};

export type DatasetCohort = {
  cohort_id: string;
  cancer_type: string;
  modality: string;
  centers: string;
  /** Numeric representation for API/table consumers */
  center_count: number;
  patients: number;
  label_type: string;
  status: "Ready" | "Processing" | "QA";
  readiness: number;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  label_schema: string[];
  demo_case_ids: string[];
  export_options: string[];
  api_preview: string;
};

export type CohortFilter = {
  cancer_type: string;
  organ: string;
  modality: string;
  institution: string;
  prediagnostic_months: [number, number];
  age_range: [number, number];
  sex: string;
  contrast_phase: string;
  scan_quality: string;
  report_available: boolean;
  ground_truth_available: boolean;
};

export type LabelExtraction = {
  label: string;
  value: string;
  confidence?: number;
  source: "report" | "weak-model" | "human-qa";
};

export type ValidationMetrics = {
  model_id: string;
  auc_range: [number, number];
  sensitivity_delta_pp: number;
  reader_sensitivity: number;
  reader_specificity: number;
  research_signal_sensitivity: number;
  patients: number;
  centers: number;
  prediagnostic_cases: number;
  median_lead_days: number;
  lead_time_buckets: Array<{ label: string; count: number }>;
  subgroup_strata: Array<{ label: string; patients: number; auc: number }>;
  qa_notes: string[];
  validation_artifacts: string[];
  per_center: Array<{
    label: string;
    patients: number;
    auc: number;
    sensitivity: number;
    specificity: number;
  }>;
  footnote: string;
};

export type ExportPackage = {
  id: string;
  title: string;
  purpose: string;
  description: string;
  included_files: string[];
  estimated_size_gb: number;
  license: string;
  access: string;
  access_mode: string;
  version: string;
  checksum_status: "verified" | "pending" | "demo";
  readiness: "ready" | "gated" | "planned";
  status: "Available" | "Gated" | "Planned";
};

const SAFE_DISCLAIMER =
  "Demo output for research and infrastructure evaluation only. Not intended for clinical diagnosis or treatment decisions.";

function bandForScore(score: number): string {
  if (score >= 0.65) return "elevated";
  if (score >= 0.45) return "moderate";
  return "low";
}

function modelResultFromScore(
  score: number,
  attention: string[],
  explanations: string[]
): ModelAnalysisResponse {
  return {
    risk_score: Number(score.toFixed(2)),
    risk_band: bandForScore(score),
    confidence: Math.min(0.95, 0.72 + score * 0.2),
    prediagnostic_window_days: 347,
    attention_regions: attention,
    label_explanations: explanations,
    model_version: "epai-compatible-demo",
    disclaimer: SAFE_DISCLAIMER,
  };
}

export const DEMO_CASES: DemoCase[] = [
  {
    case_id: "case_pancreas_001",
    scan_id: "demo_scan_001",
    asset_folder: "PanTS_00000001",
    cancer_type: "Pancreatic (research cohort)",
    organ: "Pancreas",
    modality: "CT",
    contrast_phase: "Portal venous",
    center: "External validation site A",
    deidentified_age_bucket: "60–69",
    sex: "Unspecified",
    report_excerpt:
      "Subtle pancreatic duct prominence is present. No discrete mass identified on this portal venous phase study. Correlate clinically and with prior imaging if available.",
    slice_count: 9,
    labels: [
      "pancreas",
      "pancreatic_duct",
      "nearby_anatomy",
      "candidate_region",
    ],
    weak_labels: [
      {
        label: "Organ",
        value: "Pancreas",
        confidence: 0.93,
        source: "weak-model",
      },
      {
        label: "Finding",
        value: "duct prominence (report-grounded)",
        confidence: 0.87,
        source: "report",
      },
      {
        label: "Risk signal (weak label)",
        value: "positive window",
        confidence: 0.81,
        source: "weak-model",
      },
      {
        label: "Outcome index window (research label)",
        value: "347 days (median cohort statistic)",
        source: "report",
      },
    ],
    model_demo_result: modelResultFromScore(
      0.41,
      ["pancreatic head", "duct region"],
      [
        "duct prominence language in report",
        "subtle peri-duct anatomy context",
        "prior-report correlation (when present)",
      ]
    ),
    disclaimer: SAFE_DISCLAIMER,
  },
  {
    case_id: "case_pancreas_017",
    scan_id: "demo_scan_017",
    asset_folder: "PanTS_00000017",
    cancer_type: "Pancreatic (research cohort)",
    organ: "Pancreas",
    modality: "CT",
    contrast_phase: "Portal venous",
    center: "External validation site B",
    deidentified_age_bucket: "50–59",
    sex: "Unspecified",
    report_excerpt:
      "Mild prominence of the pancreatic duct without an obvious obstructing lesion on this routine abdominal CT. Clinical correlation recommended.",
    slice_count: 9,
    labels: ["pancreas", "pancreatic_duct", "nearby_anatomy"],
    weak_labels: [
      {
        label: "Organ",
        value: "Pancreas",
        confidence: 0.92,
        source: "weak-model",
      },
      {
        label: "Finding",
        value: "duct prominence / mild ectasia",
        confidence: 0.83,
        source: "report",
      },
      {
        label: "Risk signal (weak label)",
        value: "indeterminate",
        confidence: 0.64,
        source: "weak-model",
      },
    ],
    model_demo_result: modelResultFromScore(
      0.37,
      ["duct region", "pancreatic body"],
      ["duct-centered report language", "anatomy context overlays available"]
    ),
    disclaimer: SAFE_DISCLAIMER,
  },
  {
    case_id: "case_pancreas_030",
    scan_id: "demo_scan_030",
    asset_folder: "PanTS_00000030",
    cancer_type: "Pancreatic (research cohort)",
    organ: "Pancreas",
    modality: "CT",
    contrast_phase: "Portal venous",
    center: "External validation site C",
    deidentified_age_bucket: "70–79",
    sex: "Unspecified",
    report_excerpt:
      "CT demonstrates pancreatic head enlargement with adjacent stranding and duct changes. Differential includes inflammatory etiologies; dedicated pancreas protocol imaging may be considered per clinical context.",
    slice_count: 9,
    labels: [
      "pancreas",
      "pancreatic_duct",
      "nearby_anatomy",
      "candidate_region",
    ],
    weak_labels: [
      {
        label: "Organ",
        value: "Pancreas",
        confidence: 0.94,
        source: "weak-model",
      },
      {
        label: "Finding",
        value: "head enlargement + stranding language",
        confidence: 0.88,
        source: "report",
      },
      {
        label: "Risk signal (weak label)",
        value: "elevated attention region",
        confidence: 0.86,
        source: "weak-model",
      },
    ],
    model_demo_result: modelResultFromScore(
      0.62,
      ["pancreatic head", "peri-pancreatic interface"],
      [
        "regional architecture change vs baseline",
        "model-highlighted region for QA review",
        "correlation with report descriptors",
      ]
    ),
    disclaimer: SAFE_DISCLAIMER,
  },
  {
    case_id: "case_pancreas_035",
    scan_id: "demo_scan_035",
    asset_folder: "PanTS_00000035",
    cancer_type: "Pancreatic (research cohort)",
    organ: "Pancreas",
    modality: "CT",
    contrast_phase: "Portal venous",
    center: "External validation site D",
    deidentified_age_bucket: "40–49",
    sex: "Unspecified",
    report_excerpt:
      "Pancreas appears within normal limits without discrete mass. No duct dilatation on this single phase study. Continued routine care.",
    slice_count: 9,
    labels: ["pancreas", "nearby_anatomy"],
    weak_labels: [
      {
        label: "Organ",
        value: "Pancreas",
        confidence: 0.91,
        source: "weak-model",
      },
      {
        label: "Finding",
        value: "no duct dilatation described",
        confidence: 0.79,
        source: "report",
      },
      {
        label: "Risk signal (weak label)",
        value: "low",
        confidence: 0.58,
        source: "weak-model",
      },
    ],
    model_demo_result: modelResultFromScore(
      0.28,
      ["pancreas body–tail"],
      ["limited suspicious language in report", "low model attention burden"]
    ),
    disclaimer: SAFE_DISCLAIMER,
  },
  {
    case_id: "case_pancreas_121",
    scan_id: "demo_scan_121",
    asset_folder: "PanTS_00000121",
    cancer_type: "Pancreatic (research cohort)",
    organ: "Pancreas",
    modality: "CT",
    contrast_phase: "Portal venous",
    center: "International site",
    deidentified_age_bucket: "60–69",
    sex: "Unspecified",
    report_excerpt:
      "Ill-defined pancreatic head contour with adjacent subtle hypodensity. Recommend pancreas-protocol CT or MR/MRCP for further characterization if clinically indicated.",
    slice_count: 9,
    labels: [
      "pancreas",
      "pancreatic_duct",
      "nearby_anatomy",
      "candidate_region",
    ],
    weak_labels: [
      {
        label: "Organ",
        value: "Pancreas",
        confidence: 0.93,
        source: "weak-model",
      },
      {
        label: "Finding",
        value: "contour irregularity language",
        confidence: 0.85,
        source: "report",
      },
      {
        label: "Risk signal (weak label)",
        value: "elevated",
        confidence: 0.8,
        source: "weak-model",
      },
    ],
    model_demo_result: modelResultFromScore(
      0.55,
      ["pancreatic head", "peripancreatic soft tissue"],
      [
        "ill-defined contour phrases",
        "adjacent subtle density change",
        "cross-site generalization evaluation",
      ]
    ),
    disclaimer: SAFE_DISCLAIMER,
  },
];

export const DATASET_COHORTS: DatasetCohort[] = [
  {
    cohort_id: "PAN-EARLY-001",
    cancer_type: "Pancreatic",
    modality: "CT",
    centers: "6",
    center_count: 6,
    patients: 7158,
    label_type: "report-grounded + weak labels",
    status: "Ready",
    readiness: 0.92,
    inclusion_criteria: [
      "Abdominal CT with pancreas visualized",
      "Research-use de-identified metadata",
      "Linked radiology report artifacts where available",
    ],
    exclusion_criteria: [
      "Non-diagnostic motion (per QA flags)",
      "Incomplete acquisition metadata",
    ],
    label_schema: [
      "organ_visibility",
      "duct_descriptors",
      "weak_risk_window",
      "annotation_qa_state",
    ],
    demo_case_ids: DEMO_CASES.map((c) => c.case_id),
    export_options: [
      "Cohort manifest JSON",
      "Label schema + QA audit slice",
      "Training/validation split documentation",
    ],
    api_preview: "POST /v1/cohorts/build · GET /v1/datasets",
  },
  {
    cohort_id: "ABD-ORG-020K",
    cancer_type: "Abdomen multi-organ",
    modality: "CT",
    centers: "multi-source",
    center_count: 18,
    patients: 20_000,
    label_type: "segmentation masks",
    status: "Ready",
    readiness: 0.88,
    inclusion_criteria: [
      "Multi-organ research annotations",
      "Consistent orientation / spacing metadata",
    ],
    exclusion_criteria: ["QC failures on mask completeness"],
    label_schema: ["organ_masks", "duct_channel", "lesion_channel"],
    demo_case_ids: [DEMO_CASES[0].case_id, DEMO_CASES[2].case_id],
    export_options: ["Mask bundles", "Thumbnail previews", "Partner pilot package"],
    api_preview: "GET /v1/datasets · POST /v1/export/package",
  },
  {
    cohort_id: "LIVER-SCREEN-002",
    cancer_type: "Liver lesion",
    modality: "CT",
    centers: "3",
    center_count: 3,
    patients: 2410,
    label_type: "radiology report labels",
    status: "Processing",
    readiness: 0.64,
    inclusion_criteria: ["Liver protocol or diagnostic abdominal CT"],
    exclusion_criteria: ["Severe artifact series"],
    label_schema: ["lesion_presence_weak", "report_entities"],
    demo_case_ids: [],
    export_options: ["Report-grounded label bundle"],
    api_preview: "POST /v1/cohorts/build",
  },
  {
    cohort_id: "KIDNEY-RISK-003",
    cancer_type: "Kidney tumor",
    modality: "CT",
    centers: "4",
    center_count: 4,
    patients: 1880,
    label_type: "structured labels",
    status: "QA",
    readiness: 0.71,
    inclusion_criteria: ["Renal mass evaluation cohorts"],
    exclusion_criteria: ["Post-treatment-only imaging (configurable)"],
    label_schema: ["tumor_descriptor", "bosniak_style_weak"],
    demo_case_ids: [],
    export_options: ["QA exports", "Human review queue"],
    api_preview: "GET /v1/datasets",
  },
];

export const DEFAULT_COHORT_FILTER: CohortFilter = {
  cancer_type: "Pancreatic",
  organ: "Pancreas",
  modality: "CT",
  institution: "Any (6-center external mix)",
  prediagnostic_months: [0, 18],
  age_range: [45, 85],
  sex: "All",
  contrast_phase: "Portal venous",
  scan_quality: "Diagnostic (QA-pass)",
  report_available: true,
  ground_truth_available: true,
};

export const DEMO_VALIDATION: ValidationMetrics = {
  model_id: "epai-research-baseline",
  auc_range: [0.918, 0.945],
  sensitivity_delta_pp: 50.3,
  reader_sensitivity: 0.251,
  reader_specificity: 0.954,
  research_signal_sensitivity: 0.754,
  patients: 7158,
  centers: 6,
  prediagnostic_cases: 159,
  median_lead_days: 347,
  lead_time_buckets: [
    { label: "0–90d", count: 12 },
    { label: "91–180d", count: 28 },
    { label: "181–270d", count: 41 },
    { label: "271–365d", count: 38 },
    { label: "366d+", count: 40 },
  ],
  subgroup_strata: [
    { label: "Age 45–59", patients: 2104, auc: 0.926 },
    { label: "Age 60–74", patients: 3820, auc: 0.931 },
    { label: "Age 75+", patients: 1234, auc: 0.919 },
    { label: "Portal venous", patients: 5012, auc: 0.928 },
  ],
  qa_notes: [
    "Reader-study metrics are publication-context summaries — not deployed product claims.",
    "External validation spans 6 international centers with prespecified prediagnostic case mix.",
    "Subgroup tables are illustrative diligence artifacts in this static demo.",
  ],
  validation_artifacts: [
    "validation_report.pdf",
    "cohort_manifest.json",
    "roc_summary.csv",
    "reader_study_summary.json",
    "subgroup_stratification.csv",
    "model_card.json",
    "audit_log.csv",
  ],
  per_center: [
    {
      label: "Center A",
      patients: 1420,
      auc: 0.931,
      sensitivity: 0.84,
      specificity: 0.91,
    },
    {
      label: "Center B",
      patients: 1188,
      auc: 0.927,
      sensitivity: 0.81,
      specificity: 0.9,
    },
    {
      label: "Center C",
      patients: 1310,
      auc: 0.924,
      sensitivity: 0.82,
      specificity: 0.89,
    },
    {
      label: "International site",
      patients: 3240,
      auc: 0.919,
      sensitivity: 0.79,
      specificity: 0.88,
    },
  ],
  footnote:
    "Metrics shown from research validation of underlying ePAI work; commercial product is infrastructure for model training and validation.",
};

export const EXPORT_PACKAGES_DEMO: ExportPackage[] = [
  {
    id: "train",
    title: "Training dataset package",
    purpose: "Model development tensors, manifests, and split protocols.",
    description: "Curated training tensors + manifests for infrastructure pilots.",
    included_files: [
      "cohort_manifest.json",
      "label_schema.json",
      "split_protocol.md",
    ],
    estimated_size_gb: 480,
    license: "Research pilot DUA template",
    access: "Signed URL / private bucket policy",
    access_mode: "Private object store",
    version: "v2.4.1-demo",
    checksum_status: "verified",
    readiness: "ready",
    status: "Available",
  },
  {
    id: "val",
    title: "Validation dataset package",
    purpose: "Held-out evaluation folds with stratification metadata.",
    description: "External validation index and site stratification tables.",
    included_files: ["validation_index.csv", "site_stratification.json"],
    estimated_size_gb: 120,
    license: "Research pilot DUA template",
    access: "Private link",
    access_mode: "Gated download",
    version: "v1.8.0-demo",
    checksum_status: "verified",
    readiness: "gated",
    status: "Gated",
  },
  {
    id: "reg",
    title: "Regulatory evidence package",
    purpose: "Diligence bundle for sponsor review — not a submission claim.",
    description: "Regulatory workflow support artifacts for audit readiness.",
    included_files: [
      "validation_report.pdf",
      "audit_log.csv",
      "model_card.json",
    ],
    estimated_size_gb: 12,
    license: "Sponsor-specific",
    access: "Readiness review channel",
    access_mode: "Secure transfer",
    version: "v1.2.0-demo",
    checksum_status: "pending",
    readiness: "gated",
    status: "Gated",
  },
];

export function getDemoCase(caseId: string | null | undefined): DemoCase {
  if (!caseId) return DEMO_CASES[0];
  return DEMO_CASES.find((c) => c.case_id === caseId) ?? DEMO_CASES[0];
}

export function listDatasetsFromDemo(): Array<{
  dataset_id: string;
  name: string;
  modality: string;
  patients: number;
  centers: number;
  label_types: string[];
  status: string;
}> {
  return DATASET_COHORTS.map((c) => ({
    dataset_id: c.cohort_id,
    name: `${c.cancer_type} · ${c.cohort_id}`,
    modality: c.modality,
    patients: c.patients,
    centers: c.center_count,
    label_types: c.label_type.split("+").map((s) => s.trim()),
    status: c.status,
  }));
}
