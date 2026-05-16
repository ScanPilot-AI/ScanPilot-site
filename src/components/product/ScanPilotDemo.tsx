import {
  DemoWorkspaceProvider,
  useDemoWorkspace,
  type DemoSection,
} from "../../context/DemoWorkspaceContext";
import { hasScanPilotApi } from "../../lib/scanpilot-api";
import {
  DATASET_COHORTS,
  getDemoCase,
} from "../../data/scanpilot-demo-data";
import { OverviewDashboard } from "./OverviewDashboard";
import { DatasetConsole } from "./DatasetConsole";
import { CohortBuilder } from "./CohortBuilder";
import { LabelPipeline } from "./LabelPipeline";
import { CaseViewer } from "./CaseViewer";
import { ModelApiPanel } from "./ModelApiPanel";
import { ValidationDashboard } from "./ValidationDashboard";
import { ComplianceReadiness } from "./ComplianceReadiness";
import { ExportPackage } from "./ExportPackage";

const NAV: { id: DemoSection; label: string; glyph: string }[] = [
  { id: "overview", label: "Overview", glyph: "◇" },
  { id: "dataset", label: "Dataset Console", glyph: "▦" },
  { id: "cohort", label: "Cohort Builder", glyph: "◎" },
  { id: "labels", label: "Label Pipeline", glyph: "→" },
  { id: "viewer", label: "Case Viewer", glyph: "◫" },
  { id: "api", label: "Model API", glyph: "{}" },
  { id: "validation", label: "Validation", glyph: "∿" },
  { id: "compliance", label: "Compliance", glyph: "✓" },
  { id: "export", label: "Export Package", glyph: "⎘" },
];

function WorkspaceInspector() {
  const { selectedCohortId, selectedCaseId, activeSection } = useDemoWorkspace();
  const cohort = DATASET_COHORTS.find((x) => x.cohort_id === selectedCohortId);
  const kase = getDemoCase(selectedCaseId);

  return (
    <aside className="panel inspector card-elevated">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Inspector
      </h2>
      <div className="meta-label">Active view</div>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
        {NAV.find((n) => n.id === activeSection)?.label ?? "Overview"}
      </div>
      <hr className="divider" />
      <div className="meta-label">Cohort</div>
      <div style={{ fontSize: 13 }}>
        {cohort ? `${cohort.cohort_id} · ${cohort.status}` : "None selected"}
      </div>
      {cohort && (
        <p className="muted" style={{ fontSize: 12 }}>
          Readiness {Math.round(cohort.readiness * 100)}%
        </p>
      )}
      <hr className="divider" />
      <div className="meta-label">Demo case</div>
      <div style={{ fontSize: 13 }}>{kase.case_id}</div>
      <p className="muted" style={{ fontSize: 12 }}>
        {kase.scan_id} · {kase.organ} {kase.modality}
      </p>
      <hr className="divider" />
      <div className="meta-label">Remote references</div>
      <p className="muted" style={{ fontSize: 11, wordBreak: "break-all" }}>
        <code>{kase.scan_id}</code> · <code>{kase.case_id}</code>
        <br />
        cohort <code>{cohort?.cohort_id ?? "—"}</code>
      </p>
      <hr className="divider" />
      <div className="meta-label">Enterprise programs</div>
      <ul className="inspector-plan-list muted">
        <li>
          <strong className="text-body">Research Pilot</strong> — scoped cohort,
          API compatibility, validation bundle.
        </li>
        <li>
          <strong className="text-body">Commercial Build</strong> — recurring
          exports, QA workflows, multi-site governance.
        </li>
        <li>
          <strong className="text-body">Enterprise / Pharma</strong> — evidence
          packages, audit trails, sponsor-ready artifacts.
        </li>
      </ul>
      <div className="meta-label" style={{ marginTop: 12 }}>
        What happens next
      </div>
      <ol className="inspector-next-steps muted">
        <li>Technical scoping</li>
        <li>Data / API compatibility review</li>
        <li>Pilot cohort setup</li>
        <li>Validation package delivery</li>
      </ol>
      <a className="btn ghost secondary-button" style={{ marginTop: 12 }} href="../index.html#contact">
        Request pilot
      </a>
      <div className="disclaimer-bar" style={{ marginTop: 16 }}>
        Demo output for research and infrastructure evaluation only. Not
        intended for clinical diagnosis or treatment decisions.
      </div>
    </aside>
  );
}

function WorkspaceBody() {
  const { activeSection, setActiveSection } = useDemoWorkspace();
  const apiLive = hasScanPilotApi();

  return (
    <div className="workspace">
      <aside className="ws-sidebar" aria-label="Workspace navigation">
        <div className="ws-brand">
          <span className="ws-brand-mark" aria-hidden="true" />
          <div>
            <div className="ws-brand-title">ScanPilot</div>
            <div className="ws-brand-sub">Imaging infrastructure</div>
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
            <span className="ws-nav-glyph" aria-hidden="true">
              {n.glyph}
            </span>
            {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a className="ws-nav-btn" href="../index.html">
          <span className="ws-nav-glyph">⌂</span>
          Back to landing
        </a>
        <a className="ws-nav-btn" href="../demo/#viewer">
          <span className="ws-nav-glyph">▣</span>
          Legacy CT console
        </a>
      </aside>

      <div className="ws-body">
        <header className="ws-topbar">
          <div className="ws-title">
            Pancreatic Cancer Early Detection · Infrastructure workspace
          </div>
          <div className="ws-meta">
            <span className="badge badge-demo">Demo workspace</span>
            <span className={apiLive ? "badge badge-live" : "badge badge-demo"}>
              {apiLive ? "Live API" : "API · Demo fallback"}
            </span>
            <span className="badge">Export · Ready (demo)</span>
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
            {activeSection === "overview" && <OverviewDashboard />}
            {activeSection === "dataset" && <DatasetConsole />}
            {activeSection === "cohort" && <CohortBuilder />}
            {activeSection === "labels" && <LabelPipeline />}
            {activeSection === "viewer" && <CaseViewer />}
            {activeSection === "api" && <ModelApiPanel />}
            {activeSection === "validation" && <ValidationDashboard />}
            {activeSection === "compliance" && <ComplianceReadiness />}
            {activeSection === "export" && <ExportPackage />}
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
