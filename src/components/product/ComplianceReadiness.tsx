import { useState } from "react";
import { exportDatasetPackage } from "../../lib/scanpilot-api";

const READINESS = 82;

const CHECKLIST = [
  "De-identified imaging metadata",
  "Cohort inclusion criteria",
  "Ground truth definition",
  "Annotation protocol",
  "Label confidence scores",
  "Validation split documentation",
  "External site performance",
  "Audit log export",
];

const MID = Math.ceil(CHECKLIST.length / 2);

export function ComplianceReadiness() {
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<string[] | null>(null);

  async function onExport() {
    setBusy(true);
    try {
      const { data, meta } = await exportDatasetPackage(
        { package_id: "fda_evidence_demo" },
        {
          job_id: "job_demo_001",
          status: "completed",
          files: [
            "cohort_manifest.json",
            "label_schema.json",
            "validation_report.pdf",
            "model_card.json",
            "audit_log.csv",
          ],
        }
      );
      const list = Array.isArray(data.files)
        ? (data.files as string[])
        : [
            "cohort_manifest.json",
            "label_schema.json",
            "validation_report.pdf",
            "model_card.json",
            "audit_log.csv",
          ];
      setFiles(list);
      void window.console?.debug?.("export", meta);
    } finally {
      setBusy(false);
    }
  }

  const colA = CHECKLIST.slice(0, MID);
  const colB = CHECKLIST.slice(MID);

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Compliance · regulatory workflow support</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Regulatory workflow support: dataset provenance, label lineage, QA,
          multi-center validation artifacts, bias analysis outputs, and export
          bundles for sponsor review.
        </p>
      </div>

      <div className="grid-2">
        <div className="panel card-elevated">
          <h3 className="section-title">Readiness score</h3>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{READINESS}%</div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${READINESS}%` }} />
          </div>
          <button
            type="button"
            className="btn primary primary-button"
            style={{ marginTop: 16 }}
            disabled={busy}
            onClick={() => void onExport()}
          >
            {busy ? "Exporting…" : "Export validation package"}
          </button>
          {files && (
            <div style={{ marginTop: 16 }}>
              <div className="meta-label">Evidence package (mock)</div>
              {files.map((f) => (
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
        <div className="panel card-elevated">
          <h3 className="section-title">Checklist</h3>
          <div className="checklist-2col">
            <ul className="checklist">
              {colA.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <ul className="checklist">
              {colB.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="cols-3">
        <div className="lp-col-card">
          <h4>Dataset provenance</h4>
          <ul>
            <li>Multi-site routing identifiers</li>
            <li>De-identification checkpoints</li>
            <li>Acquisition metadata parity rules</li>
          </ul>
        </div>
        <div className="lp-col-card">
          <h4>Label lineage</h4>
          <ul>
            <li>Weak label model versions</li>
            <li>Human QA reviewer queues</li>
            <li>Conflict adjudication trail</li>
          </ul>
        </div>
        <div className="lp-col-card">
          <h4>Bias / subgroup analysis</h4>
          <ul>
            <li>Age buckets</li>
            <li>Sex strata where permitted</li>
            <li>Scanner / site normalization</li>
          </ul>
        </div>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">Audit trail (demo)</h3>
        <ul className="muted audit-trail-list">
          <li>
            <span className="audit-ts">2026-05-01 09:14 UTC</span> — QA
            conflict resolved · reviewer <code>qa_bot</code>
          </li>
          <li>
            <span className="audit-ts">2026-04-28 14:02 UTC</span> — Label
            schema v3.1 promoted · actor <code>sys_export</code>
          </li>
          <li>
            <span className="audit-ts">2026-04-22 11:40 UTC</span> — Cohort
            manifest checksum verified · job <code>job_demo_001</code>
          </li>
        </ul>
      </div>

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not
        intended for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
