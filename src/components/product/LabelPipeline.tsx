import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { getDemoCase } from "../../data/scanpilot-demo-data";
import {
  ConsoleDisclaimer,
  ConsoleMetricRow,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

const QA_METRICS = [
  { t: "Accepted", n: 12840, variant: "local" as const },
  { t: "Needs review", n: 926, variant: "amber" as const },
  { t: "Conflict", n: 188, variant: "tumor" as const },
  { t: "Verified", n: 4102, variant: "default" as const },
];

const PIPELINE_STEPS = [
  {
    title: "Raw clinical artifacts",
    items: [
      "CT scan metadata (spacing / orientation / de-identified)",
      "Radiology report text (cohort contract)",
      "Pathology / outcome status (research definitions)",
      "Outcome index timing (prediagnostic window labels)",
    ],
  },
  {
    title: "Weak-label extraction",
    items: [
      "Pancreas abnormality descriptors (weak)",
      "Duct dilation / prominence language",
      "Lesion suspicion phrasing (report-grounded)",
      "Risk window estimate (training artifact)",
      "Organ visibility flags",
    ],
  },
  {
    title: "QA / human review",
    items: [
      "Reviewer queue routing",
      "Conflict adjudication",
      "Training-ready label promotion",
    ],
  },
];

export function LabelPipeline() {
  const { selectedCaseId } = useDemoWorkspace();
  const c = getDemoCase(selectedCaseId);

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Dataset construction"
        title="Label pipeline · report-grounded research labels"
        subtitle="Training and validation artifacts with QA workflow states — not patient-facing conclusions."
        chips={
          <>
            <StatusChip variant="demo">Report-grounded</StatusChip>
            <StatusChip>Weak labels</StatusChip>
            <StatusChip variant="amber">QA required</StatusChip>
          </>
        }
      />

      <ConsoleMetricRow
        metrics={QA_METRICS.map((r) => ({
          value: r.n.toLocaleString(),
          label: r.t,
          variant: r.variant,
        }))}
      />

      <div className="pipeline-flow">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.title} className="pipeline-flow-step">
            <div className="pipeline-flow-num">{i + 1}</div>
            <div className="console-card pipeline-flow-card">
              <h3 className="console-card-title">{step.title}</h3>
              <ul className="console-file-list">
                {step.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <span className="pipeline-flow-arrow" aria-hidden="true">
                →
              </span>
            )}
          </div>
        ))}
        <div className="pipeline-flow-step">
          <div className="pipeline-flow-num">4</div>
          <div className="console-card pipeline-flow-card">
            <h3 className="console-card-title">Training-ready labels</h3>
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              Promoted artifacts with provenance, confidence, and QA state for model development.
            </p>
          </div>
        </div>
      </div>

      <div className="console-card">
        <div className="mono-label">Selected case · editorial excerpt</div>
        <h3 className="console-card-title">{c.case_id}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.55 }}>{c.report_excerpt}</p>

        <div className="console-kv-grid" style={{ marginTop: 14 }}>
          <div>
            <span className="mono-label">Source</span>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Report</p>
          </div>
          <div>
            <span className="mono-label">QA state</span>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Needs review (demo)</p>
          </div>
          <div>
            <span className="mono-label">Training artifact</span>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Weak label bundle v3.1</p>
          </div>
        </div>

        <div className="mono-label" style={{ marginTop: 16 }}>
          Extracted weak labels
        </div>
        <div className="stack" style={{ marginTop: 10 }}>
          {c.weak_labels.map((w) => (
            <div key={w.label + w.value} className="weak-label-row">
              <span>
                <b>{w.label}:</b> {w.value}
              </span>
              <span className="muted">
                {w.confidence != null ? `conf ${w.confidence.toFixed(2)}` : ""} · {w.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
