import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { buildCohort } from "../../lib/scanpilot-api";
import {
  filterCatalogCases,
  getTumorBadge,
  type PanTSCatalogCase,
} from "../../data/pants-atlas";
import {
  DEFAULT_COHORT_FILTER,
  type CohortFilter,
} from "../../data/scanpilot-demo-data";
import {
  ConsoleDisclaimer,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

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
  const { catalog } = useDemoWorkspace();
  const [filters, setFilters] = useState<CohortFilter>(DEFAULT_COHORT_FILTER);
  const [busy, setBusy] = useState(false);
  const [packages, setPackages] = useState<CohortPackage[]>([]);
  const [lastMeta, setLastMeta] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const queryDsl = useMemo(
    () =>
      JSON.stringify(
        { op: "cohort.match", version: 1, filters },
        null,
        2
      ),
    [filters]
  );

  const inclusionChips = [
    `${filters.organ}-visible ${filters.modality}`,
    `${filters.contrast_phase} phase`,
    `Ages ${filters.age_range[0]}–${filters.age_range[1]}`,
    filters.report_available ? "Report required" : "Report optional",
  ];

  const exclusionChips = [
    "Prior cancer (configurable)",
    "Non-diagnostic QA fail",
    "Missing prediagnostic window",
  ];

  const previewCases = useMemo((): PanTSCatalogCase[] => {
    if (!catalog) return [];
    return filterCatalogCases(catalog.cases, {
      sex: filters.sex === "All" ? undefined : filters.sex === "Male" ? "M" : filters.sex === "Female" ? "F" : undefined,
    }).slice(0, 8);
  }, [catalog, filters.sex]);

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
      { filters: { ...filters } as unknown as Record<string, unknown> },
      mockResult
    );
    const id =
      typeof data.cohort_preview_id === "string"
        ? data.cohort_preview_id
        : mockResult.cohort_preview_id;
    setPackages((p) => [
      {
        id,
        name: `${filters.cancer_type} · deterministic demo package`,
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
        : `Deterministic demo package${meta.error ? `: ${meta.error}` : ""}`
    );
    setBusy(false);
  }

  function set<K extends keyof CohortFilter>(key: K, v: CohortFilter[K]) {
    setFilters((f) => ({ ...f, [key]: v }));
  }

  const moStart = filters.prediagnostic_months[0];
  const moEnd = filters.prediagnostic_months[1];

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Query console"
        title="Cohort builder"
        subtitle="Construct multi-center oncology cohorts from metadata filters. Executes against ScanPilot APIs when configured; otherwise returns a deterministic demo package."
        chips={
          <>
            <StatusChip variant="demo">Deterministic demo</StatusChip>
            <StatusChip>Query DSL v1</StatusChip>
          </>
        }
      />

      <div className="console-grid-2">
        <div className="console-card">
          <h3 className="console-card-title">Filters</h3>
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
            </div>

            <div className="filter-group">
              <div className="filter-group-title">Time & demographics</div>
              <label className="muted">
                Prediagnostic window (months)
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
              </label>
              <label className="muted">
                Age range
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input
                    type="number"
                    className="btn"
                    value={filters.age_range[0]}
                    onChange={(e) =>
                      set("age_range", [Number(e.target.value), filters.age_range[1]])
                    }
                  />
                  <input
                    type="number"
                    className="btn"
                    value={filters.age_range[1]}
                    onChange={(e) =>
                      set("age_range", [filters.age_range[0], Number(e.target.value)])
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
          </div>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Query DSL preview</h3>
          <div className="code-panel">{queryDsl}</div>

          <h3 className="console-card-title" style={{ marginTop: 16 }}>
            Natural-language summary
          </h3>
          <p style={{ fontSize: 13 }}>
            {filters.organ}-visible abdominal {filters.modality} ·{" "}
            <strong>
              {moStart}–{moEnd} months before diagnosis
            </strong>{" "}
            · reports {filters.report_available ? "required" : "optional"} · ages{" "}
            {filters.age_range[0]}–{filters.age_range[1]}.
          </p>

          <div className="console-metric-row" style={{ marginTop: 14 }}>
            <div className="metric-card">
              <b>4,182</b>
              <span>Patients (demo estimate)</span>
            </div>
            <div className="metric-card">
              <b>6</b>
              <span>Centers</span>
            </div>
            <div className="metric-card">
              <b>159</b>
              <span>Prediagnostic cases</span>
            </div>
            <div className="metric-card">
              <b>347d</b>
              <span>Median lead time</span>
            </div>
          </div>

          <div className="criteria-chips">
            <div className="mono-label">Inclusion</div>
            <div className="chip-row">
              {inclusionChips.map((c) => (
                <span key={c} className="status-chip status-chip--teal">
                  {c}
                </span>
              ))}
            </div>
            <div className="mono-label" style={{ marginTop: 10 }}>
              Exclusion
            </div>
            <div className="chip-row">
              {exclusionChips.map((c) => (
                <span key={c} className="status-chip status-chip--amber">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="clinical-button"
            style={{ marginTop: 14 }}
            disabled={busy}
            onClick={() => void onCreate()}
          >
            {busy ? "Creating…" : "Create cohort package"}
          </button>

          {justCreated && (
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Package <code>{justCreated}</code> queued (deterministic demo).
            </p>
          )}
          {lastMeta && (
            <p className="muted" style={{ fontSize: 12 }}>
              {lastMeta}
            </p>
          )}
        </div>
      </div>

      <div className="console-card">
        <h3 className="console-card-title">Matching cases preview</h3>
        <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
          Sample rows from the 9,901-case metadata catalog — not a live backend query unless API
          is configured.
        </p>
        <div className="table-wrap">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Age</th>
                <th>Sex</th>
                <th>CT phase</th>
                <th>Tumor</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {previewCases.map((c) => (
                <tr key={c.caseId}>
                  <td>{c.caseId}</td>
                  <td>{c.age != null ? Math.round(c.age) : "—"}</td>
                  <td>{c.sex ?? "—"}</td>
                  <td>{c.ctPhase ?? "—"}</td>
                  <td>{getTumorBadge(c)}</td>
                  <td>{c.hasLocalVolume ? "Local atlas" : "Metadata only"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {packages.length > 0 && (
        <div className="console-card">
          <h3 className="console-card-title">Recent demo cohort packages</h3>
          <div className="console-package-grid">
            {packages.map((p) => (
              <div key={p.id} className="console-card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 700 }}>{p.id}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {p.name} · {p.created_at}
                </div>
                <div className="console-metric-row" style={{ marginTop: 10 }}>
                  <div className="metric-card">
                    <b>{p.patients.toLocaleString()}</b>
                    <span>Patients</span>
                  </div>
                  <div className="metric-card">
                    <b>{p.centers}</b>
                    <span>Centers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
