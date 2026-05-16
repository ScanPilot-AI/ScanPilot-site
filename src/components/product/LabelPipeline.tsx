import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { getDemoCase } from "../../data/scanpilot-demo-data";

export function LabelPipeline() {
  const { selectedCaseId } = useDemoWorkspace();
  const c = getDemoCase(selectedCaseId);

  const column1 = [
    "CT scan metadata (spacing/orientation/de-identified)",
    "Radiology report text (when available under cohort contract)",
    "Pathology / outcome status (research definitions)",
    "Outcome index timing (prediagnostic window labels)",
  ];

  const column2 = [
    "Pancreas abnormality descriptors (weak)",
    "Duct dilation / prominence language",
    "Lesion suspicion phrasing (report-grounded)",
    "Risk window estimate (weak label · training artifact)",
    "Organ visibility flags",
  ];

  const qaMetrics = [
    { t: "Accepted", n: 12840 },
    { t: "Needs review", n: 926 },
    { t: "Conflict", n: 188 },
    { t: "Verified", n: 4102 },
  ];

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Label pipeline · report-grounded weak labels</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Dataset-construction stages — outputs are training and validation
          artifacts with QA workflow states, not patient-facing conclusions.
        </p>
      </div>

      <div className="pipeline-metric-row">
        {qaMetrics.map((r) => (
          <div key={r.t} className="metric-chip">
            <b>{r.n.toLocaleString()}</b>
            <span>{r.t}</span>
          </div>
        ))}
      </div>

      <div className="pipeline-board">
        <div className="pipeline-col">
          <div className="pipeline-col-header">1 · Raw clinical artifacts</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {column1.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="pipeline-col">
          <div className="pipeline-col-header">2 · Weak-label extraction</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {column2.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="pipeline-col">
          <div className="pipeline-col-header">3 · QA / human review</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {qaMetrics.map((r) => (
              <li
                key={r.t}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                <span>{r.t}</span>
                <b>{r.n.toLocaleString()}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel card-elevated">
        <div className="meta-label">Selected case · editorial excerpt</div>
        <h3 className="section-title" style={{ marginTop: 8 }}>
          {c.case_id}
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text)" }}>
          {c.report_excerpt}
        </p>
        <div className="meta-label" style={{ marginTop: 16 }}>
          Extracted weak labels (illustrative training artifacts)
        </div>
        <div className="stack" style={{ marginTop: 10 }}>
          {c.weak_labels.map((w) => (
            <div
              key={w.label + w.value}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 13,
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span>
                <b>{w.label}:</b> {w.value}
              </span>
              <span className="muted">
                {w.confidence != null ? `conf ${w.confidence.toFixed(2)}` : ""}{" "}
                · {w.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not
        intended for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
