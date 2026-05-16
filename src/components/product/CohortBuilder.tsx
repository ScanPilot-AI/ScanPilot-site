import { useMemo, useState } from "react";
import { buildCohort } from "../../lib/scanpilot-api";
import {
  DEFAULT_COHORT_FILTER,
  type CohortFilter,
} from "../../data/scanpilot-demo-data";

type CohortPackage = {
  id: string;
  name: string;
  created_at: string;
  patients: number;
  scans: number;
  centers: number;
  label_completeness: number;
  training_readiness: number;
};

export function CohortBuilder() {
  const [filters, setFilters] = useState<CohortFilter>(DEFAULT_COHORT_FILTER);
  const [busy, setBusy] = useState(false);
  const [packages, setPackages] = useState<CohortPackage[]>([]);
  const [lastMeta, setLastMeta] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const queryDsl = useMemo(
    () =>
      JSON.stringify(
        {
          op: "cohort.match",
          version: 1,
          filters,
        },
        null,
        2
      ),
    [filters]
  );

  const summary =
    "Find abdominal CT scans with pancreas visible, prediagnostic window 0–18 months before diagnosis, radiology report available, cohort configurable for prior-cancer exclusions.";

  async function onCreate() {
    setBusy(true);
    setLastMeta(null);
    setJustCreated(null);
    const mockResult = {
      cohort_preview_id: `SP-DEMO-${String(packages.length + 1).padStart(4, "0")}`,
      patients: 4182,
      scans: 6120,
      centers: 6,
      label_completeness: 0.88,
      training_readiness: 0.81,
    };
    const { data, meta } = await buildCohort(
      {
        filters: { ...filters } as unknown as Record<string, unknown>,
      },
      mockResult
    );
    const id =
      typeof data.cohort_preview_id === "string"
        ? data.cohort_preview_id
        : mockResult.cohort_preview_id;
    setPackages((p) => [
      {
        id,
        name: filters.cancer_type + " · demo cohort package",
        created_at: new Date().toISOString().slice(0, 19),
        patients: Number(data.patients) || mockResult.patients,
        scans: Number(data.scans) || mockResult.scans,
        centers: Number(data.centers) || mockResult.centers,
        label_completeness: Number(data.label_completeness) || 0.88,
        training_readiness: Number(data.training_readiness) || 0.81,
      },
      ...p,
    ]);
    setJustCreated(id);
    setLastMeta(
      meta.mode === "live"
        ? "Live cohort build response"
        : `Demo fallback${meta.error ? `: ${meta.error}` : ""}`
    );
    setBusy(false);
  }

  function set<K extends keyof CohortFilter>(key: K, v: CohortFilter[K]) {
    setFilters((f) => ({ ...f, [key]: v }));
  }

  const moStart = filters.prediagnostic_months[0];
  const moEnd = filters.prediagnostic_months[1];

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Cohort builder</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Visual query for multi-center oncology cohort construction. Executes
          against ScanPilot APIs when configured; otherwise returns a
          deterministic demo package.
        </p>
        <p style={{ fontSize: 14, marginBottom: 0 }}>{summary}</p>
      </div>

      <div className="grid-2">
        <div className="panel card-elevated">
          <h2 className="section-title">Filters</h2>
          <div className="filter-grid">
            <div className="filter-group">
              <div className="filter-group-title">Case definition</div>
              <label className="muted">
                Cancer type
                <select
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.cancer_type}
                  onChange={(e) => set("cancer_type", e.target.value)}
                >
                  <option>Pancreatic</option>
                  <option>Liver</option>
                  <option>Kidney</option>
                  <option>Multi-organ abdomen</option>
                </select>
              </label>
              <label className="muted">
                Organ
                <input
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.organ}
                  onChange={(e) => set("organ", e.target.value)}
                />
              </label>
              <label className="muted">
                Modality
                <select
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.modality}
                  onChange={(e) => set("modality", e.target.value)}
                >
                  <option>CT</option>
                  <option>MRI</option>
                </select>
              </label>
              <label className="muted">
                Institution / center
                <input
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.institution}
                  onChange={(e) => set("institution", e.target.value)}
                />
              </label>
            </div>

            <div className="filter-group">
              <div className="filter-group-title">Time & demographics</div>
              <label className="muted">
                Prediagnostic window (months, numeric)
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    type="number"
                    className="btn"
                    value={filters.prediagnostic_months[0]}
                    onChange={(e) =>
                      set("prediagnostic_months", [
                        Number(e.target.value),
                        filters.prediagnostic_months[1],
                      ])
                    }
                  />
                  <input
                    type="number"
                    className="btn"
                    value={filters.prediagnostic_months[1]}
                    onChange={(e) =>
                      set("prediagnostic_months", [
                        filters.prediagnostic_months[0],
                        Number(e.target.value),
                      ])
                    }
                  />
                </div>
                <span className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                  UI framing: {moStart}–{moEnd} months before diagnosis (research
                  window).
                </span>
              </label>
              <label className="muted">
                Age range
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    type="number"
                    className="btn"
                    value={filters.age_range[0]}
                    onChange={(e) =>
                      set("age_range", [
                        Number(e.target.value),
                        filters.age_range[1],
                      ])
                    }
                  />
                  <input
                    type="number"
                    className="btn"
                    value={filters.age_range[1]}
                    onChange={(e) =>
                      set("age_range", [
                        filters.age_range[0],
                        Number(e.target.value),
                      ])
                    }
                  />
                </div>
              </label>
              <label className="muted">
                Sex
                <select
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.sex}
                  onChange={(e) => set("sex", e.target.value)}
                >
                  <option>All</option>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </label>
            </div>

            <div className="filter-group">
              <div className="filter-group-title">Acquisition & QA</div>
              <label className="muted">
                Contrast phase
                <select
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.contrast_phase}
                  onChange={(e) => set("contrast_phase", e.target.value)}
                >
                  <option>Portal venous</option>
                  <option>Arterial</option>
                  <option>Unenhanced</option>
                </select>
              </label>
              <label className="muted">
                Scan quality
                <select
                  className="btn"
                  style={{ width: "100%", marginTop: 4 }}
                  value={filters.scan_quality}
                  onChange={(e) => set("scan_quality", e.target.value)}
                >
                  <option>Diagnostic (QA-pass)</option>
                  <option>Research-grade</option>
                </select>
              </label>
              <label
                className="muted"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={filters.report_available}
                  onChange={(e) => set("report_available", e.target.checked)}
                />
                Radiology report available
              </label>
              <label
                className="muted"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={filters.ground_truth_available}
                  onChange={(e) =>
                    set("ground_truth_available", e.target.checked)
                  }
                />
                Ground truth available (research definitions)
              </label>
            </div>
          </div>
        </div>

        <div className="panel card-elevated">
          <h2 className="section-title">Query DSL preview</h2>
          <div className="code-panel">{queryDsl}</div>

          <h2 className="section-title" style={{ marginTop: 20 }}>
            Natural-language summary
          </h2>
          <p style={{ fontSize: 13 }}>
            {filters.organ}-visible abdominal {filters.modality} ·{" "}
            <strong>
              {moStart}–{moEnd} months before diagnosis
            </strong>{" "}
            window · reports {filters.report_available ? "required" : "optional"}{" "}
            · ages {filters.age_range[0]}–{filters.age_range[1]}.
          </p>

          <button
            type="button"
            className="btn primary primary-button"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void onCreate()}
          >
            {busy ? "Creating…" : "Create cohort package"}
          </button>

          {justCreated && (
            <div
              className="disclaimer-bar"
              style={{ marginTop: 14, borderStyle: "solid", borderColor: "rgba(52,211,153,0.35)" }}
            >
              <strong style={{ color: "var(--emerald)" }}>Package queued:</strong>{" "}
              <code>{justCreated}</code> · demo artifact only.
            </div>
          )}

          {lastMeta && (
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              {lastMeta}
            </p>
          )}

          <hr className="divider" />

          <h3 className="section-title">Recent demo cohort packages</h3>
          {packages.length === 0 ? (
            <p className="muted">No packages yet · run create to simulate</p>
          ) : (
            <div className="stack">
              {packages.map((p) => (
                <div
                  key={p.id}
                  className="card-elevated"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{p.id}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.name} · {p.created_at}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginTop: 10,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      Patients <b>{p.patients.toLocaleString()}</b>
                    </div>
                    <div>
                      Scans <b>{p.scans.toLocaleString()}</b>
                    </div>
                    <div>
                      Centers <b>{p.centers}</b>
                    </div>
                    <div>
                      Labels <b>{Math.round(p.label_completeness * 100)}%</b>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      Training readiness{" "}
                      <b>{Math.round(p.training_readiness * 100)}%</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not
        intended for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
