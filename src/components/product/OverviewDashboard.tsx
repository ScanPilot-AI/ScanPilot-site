import { useDemoWorkspace, type DemoSection } from "../../context/DemoWorkspaceContext";
import { hasScanPilotApi } from "../../lib/scanpilot-api";

export function OverviewDashboard() {
  const { setActiveSection } = useDemoWorkspace();
  const apiLive = hasScanPilotApi();

  const runSteps: Array<{
    icon: string;
    title: string;
    meta: string;
    action: DemoSection | null;
  }> = [
    {
      icon: "①",
      title: "Ingest de-identified CT case references",
      meta: "Ready · demo routing",
      action: null,
    },
    {
      icon: "②",
      title: "Normalize cohort metadata",
      meta: "Complete",
      action: null,
    },
    {
      icon: "③",
      title: "Extract report-grounded weak labels",
      meta: "12,840 accepted · demo statistic",
      action: "labels",
    },
    {
      icon: "④",
      title: "Route uncertain cases to QA",
      meta: "188 conflicts · demo queue depth",
      action: "labels",
    },
    {
      icon: "⑤",
      title: "Generate validation package",
      meta: "Exportable (workflow)",
      action: "export",
    },
    {
      icon: "⑥",
      title: "Expose model inference contract",
      meta: apiLive ? "Live endpoint configured" : "Demo fallback active",
      action: "api",
    },
  ];

  return (
    <div className="stack">
      <div className="run-status-strip">
        <div className="run-status-item">
          <div className="meta-label">Cohort sync</div>
          <div className="run-status-value">Complete</div>
        </div>
        <div className="run-status-item">
          <div className="meta-label">Label extraction</div>
          <div className="run-status-value">12,840 accepted</div>
        </div>
        <div className="run-status-item">
          <div className="meta-label">QA conflicts</div>
          <div className="run-status-value">188</div>
        </div>
        <div className="run-status-item">
          <div className="meta-label">Model endpoint</div>
          <div className="run-status-value">
            {apiLive ? "Live API" : "Demo fallback"}
          </div>
        </div>
        <div className="run-status-item">
          <div className="meta-label">Export package</div>
          <div className="run-status-value">Ready</div>
        </div>
      </div>

      <div className="panel card-elevated">
        <h2 className="section-title">Active project</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Pancreatic Cancer Early Detection · Command surface for cohort
          operations, weak labels, model API integration, and validation
          exports.
        </p>
        <div className="grid-2">
          <div>
            <div className="meta-label">Dataset readiness</div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <i className="progress-fill" style={{ width: "86%" }} />
            </div>
          </div>
          <div>
            <div className="meta-label">Regulatory workflow readiness</div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <i className="progress-fill" style={{ width: "82%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel card-elevated">
        <h2 className="section-title">Infrastructure runbook</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Operational sequence — illustrates how ScanPilot packages training /
          validation work (research/demo simulation).
        </p>
        <div className="runbook-list" style={{ marginTop: 12 }}>
          {runSteps.map((s) => (
            <div key={s.title} className="runbook-step">
              <div className="runbook-step-icon">{s.icon}</div>
              <div className="runbook-step-body">
                <div className="runbook-step-title">{s.title}</div>
                <div className="runbook-step-meta">{s.meta}</div>
              </div>
              {s.action ? (
                <div className="runbook-step-action">
                  <button
                    type="button"
                    className="btn ghost secondary-button"
                    onClick={() => s.action && setActiveSection(s.action)}
                  >
                    Open
                  </button>
                </div>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="section-title">Cohort size</h2>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>7,158</p>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            patients · 6 centers (research validation context)
          </p>
        </div>
        <div className="panel">
          <h2 className="section-title">Prediagnostic cases</h2>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>159</p>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            median 347 days lead index (publication cohort statistic)
          </p>
        </div>
        <div className="panel">
          <h2 className="section-title">Label coverage</h2>
          <p className="muted" style={{ margin: 0 }}>
            Reports + weak labels + organ masks · PNG stacks under{" "}
            <code>assets/demo-cases</code>
          </p>
        </div>
        <div className="panel">
          <h2 className="section-title">Model endpoint</h2>
          <p className="muted" style={{ margin: 0 }}>
            Remote inference contract —{" "}
            <button
              type="button"
              className="btn ghost secondary-button"
              style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={() => setActiveSection("api")}
            >
              Open Model API
            </button>
          </p>
        </div>
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <h2 className="section-title">
            Validation · research benchmark (not deployment claim)
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            AUC 0.918–0.945 external range · +50.3pp sensitivity vs readers in
            reader study (ePAI publication context).
          </p>
        </div>
      </div>

      <div className="panel card-elevated">
        <h2 className="section-title">Infrastructure workflow</h2>
        <div className="timeline" style={{ marginTop: 12 }}>
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

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not
        intended for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
