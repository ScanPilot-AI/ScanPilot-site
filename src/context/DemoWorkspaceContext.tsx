import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ModelAnalysisResponse } from "../data/scanpilot-demo-data";
import { DEMO_CASES, getDemoCase } from "../data/scanpilot-demo-data";
import type { CtAnalysisResult } from "../lib/scanpilot-api";

export type ReviewQueueRow = {
  caseId: string;
  source: string;
  modelStatus: string;
  reviewPriority: string;
  assignedReviewer: string;
  outputPackage: string;
  state: string;
  stateKey: "pending" | "in_review" | "exported";
};

export type DemoSection =
  | "sandbox"
  | "dataset"
  | "cohort"
  | "labels"
  | "findings"
  | "queue"
  | "viewer"
  | "api"
  | "validation"
  | "compliance"
  | "export"
  | "overview";

const SEED_QUEUE: ReviewQueueRow[] = [
  {
    caseId: "PAN-DEMO-0142",
    source: "Retrospective cohort",
    modelStatus: "Completed",
    reviewPriority: "elevated",
    assignedReviewer: "Dr. Chen (demo)",
    outputPackage: "validation_v3.zip",
    state: "In review",
    stateKey: "in_review",
  },
  {
    caseId: "PAN-DEMO-0098",
    source: "Archive ingest",
    modelStatus: "Completed",
    reviewPriority: "routine",
    assignedReviewer: "Unassigned",
    outputPackage: "validation_v3.zip",
    state: "Pending review",
    stateKey: "pending",
  },
  {
    caseId: "PAN-DEMO-0201",
    source: "Pilot export",
    modelStatus: "Completed",
    reviewPriority: "routine",
    assignedReviewer: "Dr. Okonkwo (demo)",
    outputPackage: "validation_v2.zip",
    state: "Exported",
    stateKey: "exported",
  },
];

type DemoWorkspaceValue = {
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
  selectedCohortId: string | null;
  setSelectedCohortId: (id: string | null) => void;
  lastAnalysis: ModelAnalysisResponse | null;
  setLastAnalysis: (r: ModelAnalysisResponse | null) => void;
  ctAnalysisResult: CtAnalysisResult | null;
  setCtAnalysisResult: (r: CtAnalysisResult | null) => void;
  reviewQueue: ReviewQueueRow[];
  addToReviewQueue: (result: CtAnalysisResult) => void;
  activeSection: DemoSection;
  setActiveSection: (s: DemoSection) => void;
};

const DemoWorkspaceContext = createContext<DemoWorkspaceValue | null>(null);

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedCaseId, setSelectedCaseIdState] = useState(
    DEMO_CASES[0]?.case_id ?? ""
  );
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(
    "PAN-EARLY-001"
  );
  const [lastAnalysis, setLastAnalysis] = useState<ModelAnalysisResponse | null>(
    null
  );
  const [ctAnalysisResult, setCtAnalysisResult] =
    useState<CtAnalysisResult | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueRow[]>(SEED_QUEUE);
  const [activeSection, setActiveSection] = useState<DemoSection>("sandbox");

  const setSelectedCaseId = useCallback((id: string) => {
    const next = getDemoCase(id);
    setSelectedCaseIdState(next.case_id);
  }, []);

  const addToReviewQueue = useCallback((result: CtAnalysisResult) => {
    const caseId = result.bdmapId ?? `CASE-${result.sessionId.slice(0, 8)}`;
    const row: ReviewQueueRow = {
      caseId,
      source: "CT Analysis Sandbox",
      modelStatus: result.modelStatus,
      reviewPriority: result.reviewPriority,
      assignedReviewer: "Unassigned",
      outputPackage: result.simulated
        ? "validation_bundle_demo.zip"
        : "validation_bundle.zip",
      state: "Pending review",
      stateKey: "pending",
    };
    setReviewQueue((prev) => {
      if (prev.some((r) => r.caseId === caseId)) return prev;
      return [row, ...prev];
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedCaseId,
      setSelectedCaseId,
      selectedCohortId,
      setSelectedCohortId,
      lastAnalysis,
      setLastAnalysis,
      ctAnalysisResult,
      setCtAnalysisResult,
      reviewQueue,
      addToReviewQueue,
      activeSection,
      setActiveSection,
    }),
    [
      selectedCaseId,
      setSelectedCaseId,
      selectedCohortId,
      lastAnalysis,
      ctAnalysisResult,
      reviewQueue,
      addToReviewQueue,
      activeSection,
    ]
  );

  return (
    <DemoWorkspaceContext.Provider value={value}>
      {children}
    </DemoWorkspaceContext.Provider>
  );
}

export function useDemoWorkspace(): DemoWorkspaceValue {
  const ctx = useContext(DemoWorkspaceContext);
  if (!ctx) {
    throw new Error("useDemoWorkspace must be used within DemoWorkspaceProvider");
  }
  return ctx;
}
