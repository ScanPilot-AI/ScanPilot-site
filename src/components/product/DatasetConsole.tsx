import { useMemo } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  DATASET_COHORTS,
  DEMO_CASES,
  getDemoCase,
} from "../../data/scanpilot-demo-data";
import { demoAssetUrl } from "../../data/demo-asset-urls";

function thumbForCase(caseId: string): string {
  const c = getDemoCase(caseId);
  return demoAssetUrl(c.asset_folder, "ct", "04.png");
}

function statusBadgeClass(status: string): string {
  if (status === "Ready") return "badge badge-live";
  if (status === "Processing") return "badge badge-processing";
  if (status === "QA") return "badge badge-demo";
  return "badge";
}

export function DatasetConsole() {
  const {
    selectedCohortId,
    setSelectedCohortId,
    setSelectedCaseId,
    setActiveSection,
  } = useDemoWorkspace();

  const selected = useMemo(
    () => DATASET_COHORTS.find((c) => c.cohort_id === selectedCohortId),
    [selectedCohortId]
  );

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Dataset console</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Curated oncology cohorts with label lineage and export readiness.
          Select a row to inspect criteria, linked public demo cases, and API
          routing previews.
        </p>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cohort ID</th>
                <th>Cancer type</th>
                <th>Modality</th>
                <th>Centers</th>
                <th>Patients</th>
                <th>Label type</th>
                <th>Status</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {DATASET_COHORTS.map((row) => (
                <tr
                  key={row.cohort_id}
                  className={
                    row.cohort_id === selectedCohortId ? "selected" : undefined
                  }
                  onClick={() => setSelectedCohortId(row.cohort_id)}
                >
                  <td style={{ fontWeight: 600 }}>{row.cohort_id}</td>
                  <td>{row.cancer_type}</td>
                  <td>{row.modality}</td>
                  <td>{row.centers}</td>
                  <td>{row.patients.toLocaleString()}</td>
                  <td>{row.label_type}</td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span>{Math.round(row.readiness * 100)}%</span>
                      <div className="mini-progress">
                        <i style={{ width: `${Math.round(row.readiness * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="panel card-elevated cohort-inspector-card">
          <h2 className="section-title">Cohort inspector · {selected.cohort_id}</h2>
          <p className="muted">{selected.cancer_type}</p>
          <div className="workflow-pill" style={{ marginTop: 8 }}>
            Export state:{" "}
            {selected.status === "Ready"
              ? "Exportable (demo)"
              : selected.status === "QA"
                ? "QA gate active"
                : "Processing pipeline"}
          </div>

          <div className="grid-2" style={{ marginTop: 16 }}>
            <div>
              <div className="meta-label">Inclusion</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
                {selected.inclusion_criteria.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="meta-label">Exclusion</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
                {selected.exclusion_criteria.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <hr className="divider" />

          <div className="meta-label">Label schema</div>
          <div className="chips" style={{ marginTop: 8 }}>
            {selected.label_schema.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>

          <hr className="divider" />

          <div className="meta-label">Demo cases (PNGs in repo)</div>
          <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
            Select a tile to set the workspace demo case (also opens cleanly in
            Case Viewer).
          </p>
          <div className="thumbnail-grid">
            {selected.demo_case_ids.length === 0 ? (
              <span className="muted">No linked public thumbnails</span>
            ) : (
              selected.demo_case_ids.map((id) => {
                const dc = DEMO_CASES.find((c) => c.case_id === id);
                const src = dc ? thumbForCase(id) : "";
                return (
                  <button
                    key={id}
                    type="button"
                    className="case-tile"
                    onClick={() => {
                      setSelectedCaseId(id);
                      setActiveSection("viewer");
                    }}
                  >
                    <div className="case-tile-image-wrap">
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="case-tile-image"
                          width={80}
                          height={64}
                        />
                      ) : (
                        <div
                          className="case-tile-image"
                          style={{
                            background:
                              "linear-gradient(135deg,#1e293b,#0f172a)",
                          }}
                        />
                      )}
                    </div>
                    <span className="case-tile-label" title={id}>
                      {id}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <hr className="divider" />

          <div className="meta-label">Export options</div>
          <ul style={{ fontSize: 13 }}>
            {selected.export_options.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>

          <div className="meta-label" style={{ marginTop: 12 }}>
            Endpoint preview
          </div>
          <div className="code-panel" style={{ marginTop: 8 }}>
            {selected.api_preview}
          </div>

          <div className="disclaimer-bar" style={{ marginTop: 16 }}>
            Demo output for research and infrastructure evaluation only. Not
            intended for clinical diagnosis or treatment decisions.
          </div>
        </div>
      )}
    </div>
  );
}
