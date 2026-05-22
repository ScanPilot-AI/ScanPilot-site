import type { CtAnalysisResult } from "../../lib/scanpilot-api";

type Props = {
  result: CtAnalysisResult | null;
  compact?: boolean;
};

export function AIFindingsCard({ result, compact = false }: Props) {
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

      {!compact && (
        <div className="findings-artifacts">
          <div className="meta-label">Output artifacts</div>
          <ul>
            {result.artifacts.overlayPreview && (
              <li>Overlay preview</li>
            )}
            {result.artifacts.combinedLabels && (
              <li>Combined labels</li>
            )}
            {result.artifacts.reportPackage && (
              <li>Report package</li>
            )}
            {result.artifacts.viewerSession && <li>Viewer session</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
