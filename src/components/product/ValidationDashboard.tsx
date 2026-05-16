import { useEffect, useState } from "react";
import {
  DEMO_VALIDATION,
  type ValidationMetrics,
} from "../../data/scanpilot-demo-data";
import { getValidationMetrics } from "../../lib/scanpilot-api";

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
      setM(data);
      setMode(meta.mode);
    })();
    return () => {
      ok = false;
    };
  }, []);

  const [lo, hi] = m.auc_range;

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Validation dashboard</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Research validation summaries for external cohorts. Shown for partner
          diligence on training/evaluation infrastructure — not a live clinical
          performance claim for ScanPilot enterprise deployments.
        </p>
        <span className={mode === "live" ? "badge badge-live" : "badge badge-demo"}>
          {mode === "live" ? "Live metrics payload" : "Demo metrics"}
        </span>
      </div>

      <div className="grid-2">
        <div className="panel card-elevated">
          <h3 className="section-title">ROC / AUC</h3>
          <p className="muted">External validation range (ePAI research)</p>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {lo.toFixed(3)}–{hi.toFixed(3)}
          </div>
          <svg
            className="chart-svg"
            viewBox="0 0 400 220"
            role="img"
            aria-label="Illustrative ROC-style curve"
          >
            <rect width="400" height="220" fill="#020617" rx="12" />
            <path
              d="M 40 180 L 120 140 L 200 95 L 280 60 L 360 40"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />
            <path
              d="M 40 180 L 360 40"
              fill="none"
              stroke="rgba(148,163,184,.35)"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <text x="40" y="205" fill="#64748b" fontSize="12">
              0 · illustrative axis
            </text>
            <text x="300" y="205" fill="#64748b" fontSize="12" textAnchor="end">
              1.0
            </text>
          </svg>
        </div>
        <div className="panel card-elevated">
          <h3 className="section-title">Sensitivity · radiologist benchmark</h3>
          <p className="muted">Reader study delta (publication context)</p>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            +{m.sensitivity_delta_pp.toFixed(1)} pp
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            Versus radiologist readers on prespecified prediagnostic case mix.
          </p>
        </div>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">Cohort distribution</h3>
        <div className="metric-grid">
          <div className="metric-card">
            <b>{m.patients.toLocaleString()}</b>
            <span>Patients</span>
          </div>
          <div className="metric-card">
            <b>{m.centers}</b>
            <span>International centers</span>
          </div>
          <div className="metric-card">
            <b>{m.prediagnostic_cases}</b>
            <span>Prediagnostic cases</span>
          </div>
          <div className="metric-card">
            <b>{m.median_lead_days}</b>
            <span>Median early detection lead (days)</span>
          </div>
        </div>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">Site-level generalization</h3>
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
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          {m.footnote}
        </p>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">Prediagnostic detection curve · illustrative</h3>
        <svg className="chart-svg" viewBox="0 0 420 140" role="img">
          <rect width="420" height="140" fill="#0b1120" rx="10" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={40 + i * 68}
              y={120 - (18 + i * 14)}
              width="36"
              height={18 + i * 14}
              fill={i === 4 ? "#38bdf8" : "#1e293b"}
              rx="4"
            />
          ))}
          <text x="40" y="130" fill="#64748b" fontSize="11">
            Lead-time buckets (demo visualization)
          </text>
        </svg>
      </div>

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not intended
        for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
