import { useState } from "react";
import { EXPORT_PACKAGES_DEMO } from "../../data/scanpilot-demo-data";

const DEMO_BUNDLE_FILES = [
  "cohort_manifest.json",
  "label_schema.json",
  "model_card.json",
  "validation_report.pdf",
  "audit_log.csv",
];

export function ExportPackage() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Export packages</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          ScanPilot bundles dataset manifests, label schemas, validation reports,
          and API integration assets for pilots.
        </p>
        <button
          type="button"
          className="btn primary primary-button"
          onClick={() => setGenerated(true)}
        >
          Generate demo package
        </button>
        {generated && (
          <div className="panel card-elevated deliverable-card" style={{ marginTop: 16 }}>
            <div className="meta-label">Generated bundle</div>
            <p style={{ margin: "8px 0 12px", color: "var(--emerald)", fontSize: 14 }}>
              Package ready (demo): scanpilot_pancreas_validation_demo.zip
            </p>
            {DEMO_BUNDLE_FILES.map((f) => (
              <div key={f} className="file-row">
                <span className="file-icon" aria-hidden="true">
                  📄
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {EXPORT_PACKAGES_DEMO.map((p) => (
        <div key={p.id} className="panel card-elevated deliverable-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <h3 className="section-title" style={{ margin: 0 }}>
              {p.title}
            </h3>
            <span className="badge badge-demo">{p.status}</span>
          </div>
          <p className="muted">{p.description}</p>
          <div className="grid-2">
            <div>
              <div className="meta-label">Included files</div>
              <ul style={{ fontSize: 13, margin: "8px 0 0", paddingLeft: "1.1rem" }}>
                {p.included_files.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td className="muted">Est. size</td>
                    <td>
                      {p.estimated_size_gb >= 1
                        ? `${p.estimated_size_gb} GB`
                        : `${Math.round(p.estimated_size_gb * 1000)} MB`}
                    </td>
                  </tr>
                  <tr>
                    <td className="muted">License</td>
                    <td>{p.license}</td>
                  </tr>
                  <tr>
                    <td className="muted">Access</td>
                    <td>{p.access}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not intended
        for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
