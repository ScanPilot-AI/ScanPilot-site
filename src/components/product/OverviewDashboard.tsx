import { useDemoWorkspace, type DemoSection } from "../../context/DemoWorkspaceContext";
import { hasScanPilotApi } from "../../lib/scanpilot-api";
import {
  ConsoleDisclaimer,
  ConsoleMetricRow,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

export function OverviewDashboard() {
  const { setActiveSection, summary } = useDemoWorkspace();
  const apiLive = hasScanPilotApi();

  const go = (section: DemoSection) => () => setActiveSection(section);

  const runbook: Array<{ label: string; action: DemoSection }> = [
    { label: "View cohort", action: "cohort" },
    { label: "Review labels", action: "labels" },
    { label: "Open QA", action: "labels" },
    { label: "Export package", action: "export" },
    { label: "Test API", action: "api" },
  ];

  const readiness = [
    { label: "Dataset readiness", pct: 86, section: "dataset" as DemoSection },
    { label: "Label readiness", pct: 78, section: "labels" as DemoSection },
    { label: "Validation readiness", pct: 82, section: "validation" as DemoSection },
    { label: "Export readiness", pct: 74, section: "export" as DemoSection },
  ];

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Command center"
        title="Overview"
        subtitle="Operational surface for cohort construction, report-grounded labels, validation evidence, and export packaging across the PanTS metadata catalog and bundled local atlas exemplars."
        chips={
          <>
            <StatusChip variant="teal">Cohort sync complete</StatusChip>
            <StatusChip>12,840 labels accepted</StatusChip>
            <StatusChip variant="amber">188 QA conflicts</StatusChip>
            <StatusChip variant={apiLive ? "teal" : "demo"}>
              {apiLive ? "Model endpoint live" : "Demo fallback"}
            </StatusChip>
            <StatusChip variant="teal">Export package ready</StatusChip>
          </>
        }
      />

      <div className="run-status-strip">
        <div className="run-status-item">
          <div className="mono-label">Cohort sync</div>
          <div className="run-status-value">Complete</div>
        </div>
        <div className="run-status-item">
          <div className="mono-label">Label extraction</div>
          <div className="run-status-value">12,840 accepted</div>
        </div>
        <div className="run-status-item">
          <div className="mono-label">QA conflicts</div>
          <div className="run-status-value">188</div>
        </div>
        <div className="run-status-item">
          <div className="mono-label">Model endpoint</div>
          <div className="run-status-value">{apiLive ? "Live API" : "Demo fallback"}</div>
        </div>
        <div className="run-status-item">
          <div className="mono-label">Export package</div>
          <div className="run-status-value">Ready</div>
        </div>
      </div>

      <div className="console-grid-2">
        <div className="console-card">
          <h3 className="console-card-title">Active project</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            Pancreatic cancer early detection infrastructure — 9,901 metadata catalog cases
            with 5 bundled local full-volume segmentation exemplars in this static demo.
          </p>
          <div className="readiness-grid">
            {readiness.map((r) => (
              <div key={r.label} className="readiness-row">
                <div className="readiness-row-head">
                  <span className="mono-label">{r.label}</span>
                  <button
                    type="button"
                    className="clinical-button-secondary"
                    onClick={go(r.section)}
                  >
                    Open
                  </button>
                </div>
                <div className="progress-track">
                  <i className="progress-fill" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Infrastructure runbook</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
            Research/demo workflow — illustrates how ScanPilot packages training and validation
            work without implying live clinical deployment.
          </p>
          <ul className="runbook-actions">
            {runbook.map((step) => (
              <li key={step.label}>
                <button
                  type="button"
                  className="clinical-button-secondary"
                  onClick={go(step.action)}
                >
                  {step.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConsoleMetricRow
        metrics={[
          { value: "7,158", label: "Cohort size (external validation context)" },
          { value: "159", label: "Prediagnostic cases" },
          { value: "347d", label: "Median lead time" },
          { value: "6", label: "Centers" },
          {
            value: summary?.tumorPositiveCases?.toLocaleString() ?? "—",
            label: "Tumor-positive catalog",
            variant: "tumor",
          },
          {
            value: String(summary?.localFullSegmentationCases ?? summary?.localVolumeCases ?? 5),
            label: "Local atlas exemplars",
            variant: "local",
          },
        ]}
      />

      <div className="console-card">
        <h3 className="console-card-title">Infrastructure workflow</h3>
        <div className="timeline workflow-timeline-inline">
          <span className="timeline-step">Raw CT + reports</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Cohort selection</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Weak labels</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Annotation QA</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Model API</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Validation package</span>
          <span className="timeline-arrow">→</span>
          <span className="timeline-step">Evidence export</span>
        </div>
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
