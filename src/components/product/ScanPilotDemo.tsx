import { Suspense, lazy } from "react";
import {
  DemoWorkspaceProvider,
  useDemoWorkspace,
  type DemoSection,
} from "../../context/DemoWorkspaceContext";
import {
  hasScanPilotApi,
  isCtAnalysisLive,
  isCtAnalysisMockMode,
} from "../../lib/scanpilot-api";
import {
  DATASET_COHORTS,
  getDemoCase,
} from "../../data/scanpilot-demo-data";
import { CTAnalysisSandbox } from "./CTAnalysisSandbox";

const DatasetConsole = lazy(() =>
  import("./DatasetConsole").then((m) => ({ default: m.DatasetConsole }))
);
const CohortBuilder = lazy(() =>
  import("./CohortBuilder").then((m) => ({ default: m.CohortBuilder }))
);
const LabelPipeline = lazy(() =>
  import("./LabelPipeline").then((m) => ({ default: m.LabelPipeline }))
);
const CaseViewer = lazy(() =>
  import("./CaseViewer").then((m) => ({ default: m.CaseViewer }))
);
const ModelApiPanel = lazy(() =>
  import("./ModelApiPanel").then((m) => ({ default: m.ModelApiPanel }))
);
const ValidationDashboard = lazy(() =>
  import("./ValidationDashboard").then((m) => ({ default: m.ValidationDashboard }))
);
const ComplianceReadiness = lazy(() =>
  import("./ComplianceReadiness").then((m) => ({ default: m.ComplianceReadiness }))
);
const ExportPackage = lazy(() =>
  import("./ExportPackage").then((m) => ({ default: m.ExportPackage }))
);
const AIFindingsCard = lazy(() =>
  import("./AIFindingsCard").then((m) => ({ default: m.AIFindingsCard }))
);
const ReviewQueue = lazy(() =>
  import("./ReviewQueue").then((m) => ({ default: m.ReviewQueue }))
);
const OverviewDashboard = lazy(() =>
  import("./OverviewDashboard").then((m) => ({ default: m.OverviewDashboard }))
);

const NAV: { id: DemoSection; label: string }[] = [
  { id: "sandbox", label: "CT Analysis" },
  { id: "dataset", label: "Dataset ingest" },
  { id: "api", label: "Model API" },
  { id: "findings", label: "AI findings" },
  { id: "queue", label: "Review queue" },
  { id: "validation", label: "Validation" },
  { id: "export", label: "Export package" },
  { id: "compliance", label: "Compliance" },
  { id: "cohort", label: "Cohort builder" },
  { id: "labels", label: "Label pipeline" },
  { id: "viewer", label: "Case viewer" },
  { id: "overview", label: "Overview" },
];

function SectionFallback() {
  return (
    <div className="panel card-elevated muted" style={{ padding: 24 }}>
      Loading module…
    </div>
  );
}

function WorkspaceInspector() {
  const { selectedCohortId, selectedCaseId, activeSection, ctAnalysisResult } =
    useDemoWorkspace();
  const cohort = DATASET_COHORTS.find((x) => x.cohort_id === selectedCohortId);
  const kase = getDemoCase(selectedCaseId);

  return (
    <aside className="panel inspector card-elevated">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Workflow
      </h2>
      <div className="meta-label">Active step</div>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
        {NAV.find((n) => n.id === activeSection)?.label ?? "CT Analysis"}
      </div>
      {ctAnalysisResult && (
        <>
          <hr className="divider" />
          <div className="meta-label">Last sandbox session</div>
          <code style={{ fontSize: 11, wordBreak: "break-all" }}>
            {ctAnalysisResult.sessionId.slice(0, 18)}…
          </code>
        </>
      )}
      <hr className="divider" />
      <div className="meta-label">Cohort</div>
      <div style={{ fontSize: 13 }}>
        {cohort ? `${cohort.cohort_id} · ${cohort.status}` : "None selected"}
      </div>
      <hr className="divider" />
      <div className="meta-label">Reference case</div>
      <div style={{ fontSize: 13 }}>{kase.case_id}</div>
      <div className="disclaimer-bar" style={{ marginTop: 16 }}>
        Research-use only. Not for diagnosis. Human review required.
      </div>
      <a className="btn ghost secondary-button" style={{ marginTop: 12 }} href="../index.html#contact">
        Request pilot
      </a>
    </aside>
  );
}

function ActiveSection() {
  const { activeSection, ctAnalysisResult } = useDemoWorkspace();

  return (
    <Suspense fallback={<SectionFallback />}>
      {activeSection === "sandbox" && <CTAnalysisSandbox />}
      {activeSection === "dataset" && <DatasetConsole />}
      {activeSection === "cohort" && <CohortBuilder />}
      {activeSection === "labels" && <LabelPipeline />}
      {activeSection === "findings" && (
        <AIFindingsCard result={ctAnalysisResult} />
      )}
      {activeSection === "queue" && <ReviewQueue />}
      {activeSection === "viewer" && <CaseViewer />}
      {activeSection === "api" && <ModelApiPanel />}
      {activeSection === "validation" && <ValidationDashboard />}
      {activeSection === "compliance" && <ComplianceReadiness />}
      {activeSection === "export" && <ExportPackage />}
      {activeSection === "overview" && <OverviewDashboard />}
    </Suspense>
  );
}

function WorkspaceBody() {
  const { setActiveSection, activeSection } = useDemoWorkspace();
  const apiLive = hasScanPilotApi();
  const ctLive = isCtAnalysisLive();
  const mock = isCtAnalysisMockMode();

  return (
    <div className="workspace">
      <aside className="ws-sidebar" aria-label="Workspace navigation">
        <div className="ws-brand">
          <span className="ws-brand-mark" aria-hidden="true" />
          <div>
            <div className="ws-brand-title">ScanPilot</div>
            <div className="ws-brand-sub">Infrastructure console</div>
          </div>
        </div>
        <div className="ws-workspace-label">Workflow</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={
              n.id === activeSection ? "ws-nav-btn active" : "ws-nav-btn"
            }
            onClick={() => setActiveSection(n.id)}
          >
            {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a className="ws-nav-btn" href="../index.html">
          Back to landing
        </a>
        <a className="ws-nav-btn" href="../demo/#viewer">
          Sample CT Viewer
        </a>
      </aside>

      <div className="ws-body">
        <header className="ws-topbar">
          <div className="ws-title">
            Upload, analyze, review, and export from one console
          </div>
          <div className="ws-meta">
            <span className="badge pill-research">Research-use</span>
            {mock ? (
              <span className="badge badge-demo">Mock mode</span>
            ) : (
              <span className="badge badge-live">API connected</span>
            )}
            {ctLive && <span className="badge pill-epai">JHU/ePAI</span>}
            <span className="badge pill-review">Human review</span>
            {apiLive && (
              <span className="badge badge-live">Enterprise API</span>
            )}
          </div>
          <a
            className="btn primary primary-button"
            href="mailto:szhu71@jh.edu?subject=Request%20ScanPilot%20Pilot"
          >
            Request pilot
          </a>
        </header>

        <div className="ws-main">
          <div className="stack ws-content-col">
            <ActiveSection />
          </div>
          <WorkspaceInspector />
        </div>
      </div>
    </div>
  );
}

export function ScanPilotDemo() {
  return (
    <DemoWorkspaceProvider>
      <WorkspaceBody />
    </DemoWorkspaceProvider>
  );
}
