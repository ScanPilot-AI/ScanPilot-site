import { useEffect, useState } from "react";
import {
  DEMO_VALIDATION,
  type ValidationMetrics,
} from "../../data/scanpilot-demo-data";
import { getValidationMetrics } from "../../lib/scanpilot-api";
import {
  ConsoleDisclaimer,
  ConsoleMetricRow,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

function RocChart({ lo, hi }: { lo: number; hi: number }) {
  const mid = (lo + hi) / 2;
  return (
    <svg className="evidence-roc-svg" viewBox="0 0 400 240" role="img" aria-label="ROC curve">
      <defs>
        <linearGradient id="rocFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(56,189,248,0.15)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="#020617" rx="10" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`g${i}`}
          x1={48}
          y1={40 + i * 36}
          x2={360}
          y2={40 + i * 36}
          stroke="rgba(148,163,184,0.08)"
        />
      ))}
      <path
        d="M 48 196 L 360 44"
        fill="none"
        stroke="rgba(148,163,184,0.35)"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      <path
        d={`M 48 196 L 120 158 L 200 108 L 280 72 L 360 52`}
        fill="url(#rocFill)"
        stroke="#38bdf8"
        strokeWidth="2.5"
      />
      <circle cx="200" cy="108" r="4" fill="#38bdf8" />
      <text x="48" y="220" fill="#64748b" fontSize="11">
        0.0 FPR
      </text>
      <text x="360" y="220" fill="#64748b" fontSize="11" textAnchor="end">
        1.0 FPR
      </text>
      <text x="28" y="200" fill="#64748b" fontSize="11" transform="rotate(-90 28 200)">
        TPR
      </text>
      <text x="200" y="28" fill="#94a3b8" fontSize="12" textAnchor="middle">
        Representative ROC · research context
      </text>
      <text x="200" y="44" fill="#38bdf8" fontSize="13" textAnchor="middle" fontWeight="600">
        AUC {lo.toFixed(3)}–{hi.toFixed(3)} (mid {mid.toFixed(3)})
      </text>
    </svg>
  );
}

function ReaderBenchmarkChart({
  readerSens,
  signalSens,
  specificity,
  deltaPp,
}: {
  readerSens: number;
  signalSens: number;
  specificity: number;
  deltaPp: number;
}) {
  const rows = [
    { label: "Radiologist readers", value: readerSens * 100, tone: "muted" },
    { label: "ScanPilot / ePAI research signal", value: signalSens * 100, tone: "accent" },
  ];
  const max = 100;
  return (
    <div className="reader-benchmark">
      <ul className="cohort-chart-bars">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="cohort-chart-label">{r.label}</span>
            <span className="cohort-chart-track">
              <i
                className={r.tone === "accent" ? "bar-accent" : "bar-muted"}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="cohort-chart-val">{r.value.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
      <div className="reader-benchmark-foot">
        <span>
          Delta <b>+{deltaPp.toFixed(1)} pp</b> sensitivity (reader-study context)
        </span>
        <span>
          Specificity <b>{(specificity * 100).toFixed(1)}%</b>
        </span>
      </div>
      <p className="muted" style={{ fontSize: 11, margin: "10px 0 0" }}>
        Comparative bars summarize publication reader-study framing — not deployed clinical
        superiority.
      </p>
    </div>
  );
}

function LeadTimeChart({
  buckets,
}: {
  buckets: ValidationMetrics["lead_time_buckets"];
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="lead-time-chart">
      {buckets.map((b) => (
        <div key={b.label} className="lead-time-col" title={`${b.label}: ${b.count}`}>
          <i style={{ height: `${(b.count / max) * 100}%` }} />
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ValidationDashboard() {
  const [m, setM] = useState<ValidationMetrics>(DEMO_VALIDATION);
  const [mode, setMode] = useState<"live" | "demo">("demo");

  useEffect(() => {
    let ok = true;
    void (async () => {
      const { data, meta } = await getValidationMetrics(
        DEMO_VALIDATION.model_id,
        DEMO_VALIDATION
      );
      if (!ok) return;
      setM({ ...DEMO_VALIDATION, ...data });
      setMode(meta.mode);
    })();
    return () => {
      ok = false;
    };
  }, []);

  const [lo, hi] = m.auc_range;

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Evidence readiness"
        title="Validation evidence"
        subtitle="Research validation summaries for external cohorts, reader comparison, cohort stratification, and exportable diligence artifacts. Not a deployed clinical performance claim."
        chips={
          <>
            <StatusChip variant="demo">Demo evidence</StatusChip>
            <StatusChip>Publication-context metrics</StatusChip>
            <StatusChip>External validation</StatusChip>
            <StatusChip variant="amber">Not clinical claim</StatusChip>
            <StatusChip variant={mode === "live" ? "teal" : "demo"}>
              {mode === "live" ? "Live payload" : "Static demo"}
            </StatusChip>
          </>
        }
      />

      <ConsoleMetricRow
        metrics={[
          { value: `${lo.toFixed(3)}–${hi.toFixed(3)}`, label: "AUC range" },
          {
            value: `+${m.sensitivity_delta_pp.toFixed(1)} pp`,
            label: "Sensitivity delta vs readers",
            variant: "tumor",
          },
          {
            value: `${(m.reader_specificity * 100).toFixed(1)}%`,
            label: "Reader-study specificity",
          },
          { value: String(m.prediagnostic_cases), label: "Prediagnostic cases" },
          { value: `${m.median_lead_days}d`, label: "Median lead time" },
          { value: m.patients.toLocaleString(), label: "Patients" },
          { value: String(m.centers), label: "Centers" },
        ]}
      />

      <div className="console-grid-2">
        <div className="console-card">
          <h3 className="console-card-title">ROC / AUC</h3>
          <RocChart lo={lo} hi={hi} />
          <div className="status-chip-row" style={{ marginTop: 10 }}>
            <StatusChip variant="teal">
              AUC {lo.toFixed(3)}–{hi.toFixed(3)}
            </StatusChip>
          </div>
          <p className="console-card-caption muted">
            External validation range, research context — diagonal baseline shown for reference.
          </p>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Reader benchmark</h3>
          <ReaderBenchmarkChart
            readerSens={m.reader_sensitivity}
            signalSens={m.research_signal_sensitivity}
            specificity={m.reader_specificity}
            deltaPp={m.sensitivity_delta_pp}
          />
        </div>
      </div>

      <div className="console-grid-4">
        <div className="console-card">
          <h3 className="console-card-title">Cohort composition</h3>
          <ul className="console-kv-list">
            <li>
              <span>Patients</span>
              <b>{m.patients.toLocaleString()}</b>
            </li>
            <li>
              <span>Centers</span>
              <b>{m.centers}</b>
            </li>
            <li>
              <span>Prediagnostic cases</span>
              <b>{m.prediagnostic_cases}</b>
            </li>
            <li>
              <span>Median lead</span>
              <b>{m.median_lead_days} days</b>
            </li>
          </ul>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Lead-time distribution</h3>
          <LeadTimeChart buckets={m.lead_time_buckets} />
          <p className="console-card-caption muted">Prediagnostic index window buckets (demo).</p>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Subgroup stratification</h3>
          <div className="table-wrap">
            <table className="data-table data-table--compact">
              <thead>
                <tr>
                  <th>Stratum</th>
                  <th>N</th>
                  <th>AUC</th>
                </tr>
              </thead>
              <tbody>
                {m.subgroup_strata.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.patients.toLocaleString()}</td>
                    <td>{row.auc.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Failure / QA notes</h3>
          <ul className="console-notes-list">
            {m.qa_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="console-card">
        <h3 className="console-card-title">Site-level generalization</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Patients</th>
                <th>AUC</th>
                <th>Sensitivity</th>
                <th>Specificity</th>
              </tr>
            </thead>
            <tbody>
              {m.per_center.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.patients.toLocaleString()}</td>
                  <td>{row.auc.toFixed(3)}</td>
                  <td>{(row.sensitivity * 100).toFixed(1)}%</td>
                  <td>{(row.specificity * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="console-card-caption muted">{m.footnote}</p>
      </div>

      <div className="console-card">
        <div className="console-card-head-row">
          <h3 className="console-card-title">Validation artifacts</h3>
          <button type="button" className="clinical-button">
            Export validation package
          </button>
        </div>
        <div className="artifact-file-grid">
          {m.validation_artifacts.map((f) => (
            <div key={f} className="artifact-file-row">
              <span className="mono-label">{f}</span>
              <StatusChip variant="demo">Demo listing</StatusChip>
            </div>
          ))}
        </div>
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
