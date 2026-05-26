import { useState } from "react";
import { EXPORT_PACKAGES_DEMO } from "../../data/scanpilot-demo-data";
import {
  ConsoleDisclaimer,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

const DEMO_BUNDLE_FILES = [
  "cohort_manifest.json",
  "label_schema.json",
  "model_card.json",
  "validation_report.pdf",
  "audit_log.csv",
];

function readinessBadge(r: string) {
  if (r === "ready") return <StatusChip variant="teal">Ready</StatusChip>;
  if (r === "gated") return <StatusChip variant="amber">Gated</StatusChip>;
  return <StatusChip variant="demo">Planned</StatusChip>;
}

export function ExportPackage() {
  const [generated, setGenerated] = useState(false);

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Artifact delivery"
        title="Export package"
        subtitle="Dataset manifests, label schemas, validation reports, and API integration assets for research pilots and diligence workflows."
        chips={
          <>
            <StatusChip variant="demo">Demo bundles</StatusChip>
            <StatusChip>Checksum verification</StatusChip>
            <StatusChip variant="amber">DUA required</StatusChip>
          </>
        }
        actions={
          <button
            type="button"
            className="clinical-button"
            onClick={() => setGenerated(true)}
          >
            Generate demo package
          </button>
        }
      />

      {generated && (
        <div className="console-card">
          <div className="mono-label">Generated bundle</div>
          <p style={{ margin: "8px 0 12px", color: "var(--emerald)", fontSize: 14 }}>
            Package ready (demo): scanpilot_pancreas_validation_demo.zip
          </p>
          {DEMO_BUNDLE_FILES.map((f) => (
            <div key={f} className="artifact-file-row">
              <span className="mono-label">{f}</span>
              <StatusChip variant="teal">SHA-256 verified</StatusChip>
            </div>
          ))}
        </div>
      )}

      <div className="console-package-grid">
        {EXPORT_PACKAGES_DEMO.map((p) => (
          <div key={p.id} className="console-card console-package-card">
            <div className="console-card-head-row">
              <h3 className="console-card-title">{p.title}</h3>
              {readinessBadge(p.readiness)}
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
              {p.purpose}
            </p>
            <p className="muted" style={{ fontSize: 12 }}>
              {p.description}
            </p>

            <div className="console-kv-grid">
              <div>
                <span className="mono-label">Included artifacts</span>
                <ul className="console-file-list">
                  {p.included_files.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <ul className="console-kv-list">
                  <li>
                    <span>Est. size</span>
                    <b>
                      {p.estimated_size_gb >= 1
                        ? `${p.estimated_size_gb} GB`
                        : `${Math.round(p.estimated_size_gb * 1000)} MB`}
                    </b>
                  </li>
                  <li>
                    <span>Access mode</span>
                    <b>{p.access_mode}</b>
                  </li>
                  <li>
                    <span>License / DUA</span>
                    <b>{p.license}</b>
                  </li>
                  <li>
                    <span>Version</span>
                    <b>{p.version}</b>
                  </li>
                  <li>
                    <span>Integrity</span>
                    <b>
                      {p.checksum_status === "verified"
                        ? "Checksum verified"
                        : p.checksum_status === "pending"
                          ? "Pending verification"
                          : "Demo placeholder"}
                    </b>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
