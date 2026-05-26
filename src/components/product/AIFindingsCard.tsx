import { useMemo } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  formatOrganLabel,
  organGroupFor,
} from "../../data/pants-atlas";
import type { CtAnalysisResult } from "../../lib/scanpilot-api";

type Finding = {
  id: string;
  title: string;
  detail: string;
  level: "info" | "attention" | "context";
};

type Props = {
  result?: CtAnalysisResult | null;
  compact?: boolean;
  mode?: "atlas" | "sandbox";
};

function buildFindings(
  organs: string[],
  hasLesion: boolean,
  hasDuct: boolean
): Finding[] {
  const findings: Finding[] = [];

  if (organs.includes("pancreatic_lesion") && hasLesion) {
    findings.push({
      id: "lesion",
      title: "Lesion candidate region",
      detail:
        "A pancreatic lesion segmentation layer is present in this case. Use duct/lesion review preset to correlate morphology with adjacent parenchyma — research triage only.",
      level: "attention",
    });
  }

  if (organs.includes("pancreatic_duct") && hasDuct) {
    findings.push({
      id: "duct",
      title: "Duct context available",
      detail:
        "Main pancreatic duct overlay is exported for this slice window. Useful for duct-centric screening workflows and report-language alignment in demo review.",
      level: "attention",
    });
  }

  const subregions = ["pancreas_head", "pancreas_body", "pancreas_tail"].filter(
    (o) => organs.includes(o)
  );
  if (subregions.length > 0) {
    findings.push({
      id: "subregion",
      title: "Subregion parsing",
      detail: `Head/body/tail layers available (${subregions.map(formatOrganLabel).join(", ")}). Supports spatial reasoning across pancreatic subregions.`,
      level: "info",
    });
  } else if (organs.includes("pancreas")) {
    findings.push({
      id: "pancreas",
      title: "Pancreas segmentation",
      detail:
        "Whole-organ pancreas mask is active for this case. Screening preset highlights parenchymal context for pre-diagnostic triage demos.",
      level: "info",
    });
  }

  const vascular = organs.filter((o) => organGroupFor(o) === "vascular");
  if (vascular.length > 0) {
    findings.push({
      id: "vascular",
      title: "Vascular context",
      detail: `${vascular.length} vascular overlay stack(s) available (${vascular
        .slice(0, 4)
        .map(formatOrganLabel)
        .join(", ")}${vascular.length > 4 ? "…" : ""}). Supports arterial/venous landmark review adjacent to the pancreas.`,
      level: "context",
    });
  }

  const gi = organs.filter((o) => organGroupFor(o) === "adjacent_gi");
  if (gi.length > 0) {
    findings.push({
      id: "gi",
      title: "Adjacent GI anatomy",
      detail: `${gi.length} adjacent GI layer(s) loaded for multi-organ context reasoning in abdominal CT review.`,
      level: "context",
    });
  }

  if (findings.length === 0) {
    findings.push({
      id: "baseline",
      title: "Atlas case loaded",
      detail:
        "Select organ layers in Layer Intelligence to surface structured, product-facing evidence blocks for this static demo.",
      level: "info",
    });
  }

  return findings;
}

function SandboxFindingsCard({
  result,
  compact = false,
}: {
  result: CtAnalysisResult | null;
  compact?: boolean;
}) {
  if (!result) {
    return (
      <div className="panel card-elevated findings-card findings-card--empty">
        <h2 className="section-title">AI findings</h2>
        <p className="muted">
          Run a de-identified CT through the sandbox to surface research-use findings.
        </p>
      </div>
    );
  }

  return (
    <div className={`panel card-elevated findings-card${compact ? " findings-card--compact" : ""}`}>
      <div className="findings-card-head">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Research-use findings
          </h2>
          <p className="findings-disclaimer">
            Model-generated research-use findings require human expert review and are
            not intended for diagnosis.
          </p>
        </div>
        <div className="findings-badges">
          {result.simulated && (
            <span className="badge badge-demo">Simulated demo output</span>
          )}
          <span className="badge pill-research">Research-use</span>
          <span className="badge pill-epai">JHU/ePAI</span>
          {result.humanReviewRequired && (
            <span className="badge pill-review">Human review</span>
          )}
        </div>
      </div>

      <dl className="findings-dl">
        <div>
          <dt>Analysis status</dt>
          <dd>{result.modelStatus}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{result.analysisMode}</dd>
        </div>
        <div>
          <dt>Anatomy outputs</dt>
          <dd>{result.anatomyParsed.join(" · ")}</dd>
        </div>
        <div>
          <dt>Candidate region</dt>
          <dd>{result.candidateRegionSummary}</dd>
        </div>
        <div>
          <dt>Review priority</dt>
          <dd className={`priority-${result.reviewPriority}`}>{result.reviewPriority}</dd>
        </div>
      </dl>
    </div>
  );
}

function AtlasFindingsCard() {
  const { selectedCaseManifest, disclaimer, atlasLoading } = useDemoWorkspace();

  const findings = useMemo(() => {
    if (!selectedCaseManifest) return [];
    return buildFindings(
      selectedCaseManifest.availableOrgans,
      selectedCaseManifest.hasPancreaticLesion,
      selectedCaseManifest.hasPancreaticDuct
    );
  }, [selectedCaseManifest]);

  if (atlasLoading) {
    return (
      <div className="atlas-panel findings-panel">
        <p className="muted">Loading findings…</p>
      </div>
    );
  }

  if (!selectedCaseManifest) {
    return (
      <div className="atlas-panel findings-panel">
        <div className="meta-label">Layer-derived evidence</div>
        <p className="muted" style={{ fontSize: 13 }}>
          Select a bundled local CT volume to summarize anatomy context from exported
          segmentation layers.
        </p>
      </div>
    );
  }

  return (
    <div className="atlas-panel findings-panel">
      <div className="findings-panel-head">
        <div className="meta-label">Anatomy context summary</div>
        <span className="badge pill-research">Static demo</span>
      </div>
      <p className="findings-lead">
        Layer-derived evidence from exported segmentation stacks — not live diagnosis or
        inference.
      </p>
      <ul className="findings-evidence-list">
        {findings.map((f) => (
          <li key={f.id} className={`finding-item finding-${f.level}`}>
            <div className="finding-title">{f.title}</div>
            <p>{f.detail}</p>
          </li>
        ))}
      </ul>
      <p className="viewer-disclaimer">{disclaimer}</p>
    </div>
  );
}

export function AIFindingsCard({
  result = null,
  compact = false,
  mode = "atlas",
}: Props) {
  if (mode === "sandbox") {
    return <SandboxFindingsCard result={result} compact={compact} />;
  }
  return <AtlasFindingsCard />;
}
