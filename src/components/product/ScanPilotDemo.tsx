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
import { CaseViewer } from "./CaseViewer";
import { ReviewQueue } from "./ReviewQueue";
import { AIFindingsCard } from "./AIFindingsCard";
import { CatalogMetadataDrawer } from "./CatalogMetadataDrawer";

const DatasetConsole = lazy(() =>
  import("./DatasetConsole").then((m) => ({ default: m.DatasetConsole }))
);
const CohortBuilder = lazy(() =>
  import("./CohortBuilder").then((m) => ({ default: m.CohortBuilder }))
);
const LabelPipeline = lazy(() =>
  import("./LabelPipeline").then((m) => ({ default: m.LabelPipeline }))
);
const CTAnalysisSandbox = lazy(() =>
  import("./CTAnalysisSandbox").then((m) => ({ default: m.CTAnalysisSandbox }))
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
const OverviewDashboard = lazy(() =>
  import("./OverviewDashboard").then((m) => ({ default: m.OverviewDashboard }))
);

const NAV: { id: DemoSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "atlas", label: "Atlas workspace" },
  { id: "dataset", label: "Atlas database" },
  { id: "cohort", label: "Cohort builder" },
  { id: "labels", label: "Label pipeline" },
  { id: "sandbox", label: "CT analysis" },
  { id: "validation", label: "Validation" },
  { id: "export", label: "Export package" },
  { id: "compliance", label: "Readiness" },
  { id: "api", label: "Model API" },
];

function SectionFallback() {
  return (
    <div className="panel card-elevated muted" style={{ padding: 24 }}>
      Loading module…
    </div>
  );
}

function AtlasWorkspace() {
  const { summary, atlasLoading, disclaimer } = useDemoWorkspace();

  return (
    <div className="atlas-workspace">
      <header className="atlas-workspace-header">
        <div>
          <h1 className="atlas-title">ScanPilot Atlas</h1>
          <p className="atlas-subtitle">
            5 bundled local CT volumes with exported segmentation overlays · 9,901-case
            metadata catalog for cohort context · research-use static demo
          </p>
        </div>
        <div className="atlas-header-stats">
          {!atlasLoading && summary && (
            <>
              <span className="atlas-stat">
                <b>{summary.totalCatalogCases.toLocaleString()}</b> catalog
              </span>
              <span className="atlas-stat">
                <b>{summary.localVolumeCases}</b> local volumes
              </span>
              <span className="atlas-stat">
                <b>{summary.exportedOrganLayerCount ?? summary.uniqueOrganLayers.length}</b>
                {" exported layers"}
              </span>
            </>
          )}
          <span className="badge pill-research">Research-use</span>
        </div>
      </header>

      <div className="atlas-grid">
        <aside className="atlas-col atlas-col--queue">
          <ReviewQueue />
        </aside>

        <main className="atlas-col atlas-col--viewer">
          <CaseViewer />
        </main>

        <aside className="atlas-col atlas-col--findings">
          <AIFindingsCard />
        </aside>
      </div>

      <div className="atlas-bottom">
        <WorkflowTimeline />
      </div>

      <p className="atlas-footer-disclaimer">{disclaimer}</p>
      <CatalogMetadataDrawer />
    </div>
  );
}

function WorkflowTimeline() {
  const steps = [
    { label: "Case ingest", state: "complete" },
    { label: "Layer QA", state: "complete" },
    { label: "Evidence review", state: "active" },
    { label: "Radiologist review", state: "pending" },
    { label: "Export readiness", state: "pending" },
  ];

  return (
    <div className="atlas-panel workflow-timeline">
      <div className="meta-label">Review workflow</div>
      <ol className="workflow-steps">
        {steps.map((s) => (
          <li key={s.label} className={`workflow-step workflow-step--${s.state}`}>
            <span className="workflow-dot" aria-hidden="true" />
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActiveSection() {
  const { activeSection, ctAnalysisResult } = useDemoWorkspace();

  if (activeSection === "atlas") {
    return <AtlasWorkspace />;
  }

  return (
    <Suspense fallback={<SectionFallback />}>
      {activeSection === "sandbox" && <CTAnalysisSandbox />}
      {activeSection === "dataset" && <DatasetConsole />}
      {activeSection === "cohort" && <CohortBuilder />}
      {activeSection === "labels" && <LabelPipeline />}
      {activeSection === "findings" && (
        <AIFindingsCard result={ctAnalysisResult} mode="sandbox" />
      )}
      {activeSection === "queue" && <ReviewQueue />}
      {activeSection === "viewer" && <AtlasWorkspace />}
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
    <div className="workspace workspace--atlas">
      <aside className="ws-sidebar" aria-label="Workspace navigation">
        <div className="ws-brand">
          <span className="ws-brand-mark" aria-hidden="true" />
          <div>
            <div className="ws-brand-title">ScanPilot</div>
            <div className="ws-brand-sub">Atlas · Research infrastructure</div>
          </div>
        </div>
        <div className="ws-workspace-label">Workspace</div>
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
        <a className="ws-nav-btn" href="../demo/#console">
          Explore sample viewer
        </a>
      </aside>

      <div className="ws-body">
        <header className="ws-topbar ws-topbar--minimal">
          <div className="ws-meta">
            <span className="badge pill-research">Research-use</span>
            {mock ? (
              <span className="badge badge-demo">Mock mode</span>
            ) : (
              <span className="badge badge-live">API connected</span>
            )}
            {ctLive && <span className="badge pill-epai">JHU/ePAI</span>}
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

        <div className="ws-main ws-main--full">
          <ActiveSection />
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
