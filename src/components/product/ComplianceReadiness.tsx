import { useState } from "react";
import { exportDatasetPackage } from "../../lib/scanpilot-api";
import {
  ConsoleDisclaimer,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

const READINESS = 82;

type CheckStatus = "complete" | "partial" | "demo-only" | "pending";

type CheckItem = { label: string; status: CheckStatus };

const CHECKLIST_GROUPS: { title: string; items: CheckItem[] }[] = [
  {
    title: "Dataset readiness",
    items: [
      { label: "De-identified imaging metadata", status: "complete" },
      { label: "Cohort inclusion criteria", status: "complete" },
      { label: "Multi-site routing identifiers", status: "complete" },
    ],
  },
  {
    title: "Label readiness",
    items: [
      { label: "Annotation protocol", status: "complete" },
      { label: "Label confidence scores", status: "partial" },
      { label: "Weak label model versions", status: "demo-only" },
    ],
  },
  {
    title: "Validation readiness",
    items: [
      { label: "Validation split documentation", status: "complete" },
      { label: "External site performance tables", status: "partial" },
      { label: "Subgroup stratification exports", status: "demo-only" },
    ],
  },
  {
    title: "Export readiness",
    items: [
      { label: "Audit log export", status: "complete" },
      { label: "Regulatory evidence bundle", status: "pending" },
      { label: "Checksum verification pipeline", status: "partial" },
    ],
  },
];

const AUDIT_LOG = [
  {
    ts: "2026-05-01 09:14 UTC",
    event: "QA conflict resolved",
    actor: "qa_bot",
    status: "complete" as const,
  },
  {
    ts: "2026-04-28 14:02 UTC",
    event: "Label schema v3.1 promoted",
    actor: "sys_export",
    status: "complete" as const,
  },
  {
    ts: "2026-04-22 11:40 UTC",
    event: "Cohort manifest checksum verified",
    actor: "job_demo_001",
    status: "complete" as const,
  },
  {
    ts: "2026-04-18 16:05 UTC",
    event: "Validation artifact bundle staged",
    actor: "readiness_svc",
    status: "partial" as const,
  },
];

function statusChip(s: CheckStatus) {
  if (s === "complete") return <StatusChip variant="teal">Complete</StatusChip>;
  if (s === "partial") return <StatusChip variant="amber">Partial</StatusChip>;
  if (s === "demo-only") return <StatusChip variant="demo">Demo-only</StatusChip>;
  return <StatusChip>Pending</StatusChip>;
}

export function ComplianceReadiness() {
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<string[] | null>(null);

  async function onExport() {
    setBusy(true);
    try {
      const { data } = await exportDatasetPackage(
        { package_id: "regulatory_evidence_demo" },
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Workflow support"
        title="Readiness · regulatory workflow support"
        subtitle="Dataset provenance, label lineage, validation artifacts, and export bundles for sponsor diligence — not formal regulatory clearance."
        chips={
          <>
            <StatusChip variant="teal">Readiness {READINESS}%</StatusChip>
            <StatusChip variant="amber">Demo workflow</StatusChip>
            <StatusChip>Audit trail enabled</StatusChip>
          </>
        }
        actions={
          <button
            type="button"
            className="clinical-button"
            disabled={busy}
            onClick={() => void onExport()}
          >
            {busy ? "Exporting…" : "Export validation package"}
          </button>
        }
      />

      <div className="console-grid-2">
        <div className="console-card">
          <h3 className="console-card-title">Readiness score</h3>
          <div className="readiness-score">{READINESS}%</div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${READINESS}%` }} />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Composite readiness across dataset, label, validation, and export tracks for
            research pilots.
          </p>
          {files && (
            <div style={{ marginTop: 16 }}>
              <div className="mono-label">Evidence package (demo)</div>
              {files.map((f) => (
                <div key={f} className="artifact-file-row">
                  <span className="mono-label">{f}</span>
                  <StatusChip variant="teal">Staged</StatusChip>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Readiness checklist</h3>
          <div className="readiness-checklist-grid">
            {CHECKLIST_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mono-label">{group.title}</div>
                <ul className="readiness-checklist">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <span>{item.label}</span>
                      {statusChip(item.status)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="console-card">
        <h3 className="console-card-title">Audit trail</h3>
        <div className="audit-log-console">
          <div className="audit-log-header">
            <span>Timestamp</span>
            <span>Event</span>
            <span>Actor</span>
            <span>Status</span>
          </div>
          {AUDIT_LOG.map((row) => (
            <div key={row.ts} className="audit-log-row">
              <span className="audit-ts">{row.ts}</span>
              <span>{row.event}</span>
              <span>
                <code>{row.actor}</code>
              </span>
              {statusChip(row.status)}
            </div>
          ))}
        </div>
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
