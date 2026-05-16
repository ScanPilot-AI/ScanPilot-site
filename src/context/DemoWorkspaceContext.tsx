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

type DemoWorkspaceValue = {
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
  selectedCohortId: string | null;
  setSelectedCohortId: (id: string | null) => void;
  lastAnalysis: ModelAnalysisResponse | null;
  setLastAnalysis: (r: ModelAnalysisResponse | null) => void;
  activeSection: DemoSection;
  setActiveSection: (s: DemoSection) => void;
};

export type DemoSection =
  | "overview"
  | "dataset"
  | "cohort"
  | "labels"
  | "viewer"
  | "api"
  | "validation"
  | "compliance"
  | "export";

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
  const [activeSection, setActiveSection] = useState<DemoSection>("overview");

  const setSelectedCaseId = useCallback((id: string) => {
    const next = getDemoCase(id);
    setSelectedCaseIdState(next.case_id);
  }, []);

  const value = useMemo(
    () => ({
      selectedCaseId,
      setSelectedCaseId,
      selectedCohortId,
      setSelectedCohortId,
      lastAnalysis,
      setLastAnalysis,
      activeSection,
      setActiveSection,
    }),
    [
      selectedCaseId,
      setSelectedCaseId,
      selectedCohortId,
      lastAnalysis,
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
