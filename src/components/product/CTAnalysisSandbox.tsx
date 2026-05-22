import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAnalysisSession,
  getAnalysisResult,
  getViewerUrl,
  isAcceptedCtFile,
  isCtAnalysisLive,
  isCtAnalysisMockMode,
  pollAnalysisStatus,
  runMockAnalysisPipeline,
  startEpaiAnalysis,
  uploadCTFile,
  type CtAnalysisResult,
  type CtUploadMeta,
} from "../../lib/scanpilot-api";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { AIFindingsCard } from "./AIFindingsCard";

const PIPELINE_STEPS = [
  "Upload received",
  "Volume normalized",
  "JHU/ePAI model queued",
  "Anatomy-aware output generated",
  "Report package prepared",
] as const;

type SandboxPhase = "empty" | "uploading" | "analyzing" | "result" | "error";

export function CTAnalysisSandbox() {
  const {
    setCtAnalysisResult,
    ctAnalysisResult,
    addToReviewQueue,
    setActiveSection,
  } = useDemoWorkspace();

  const [phase, setPhase] = useState<SandboxPhase>("empty");
  const [, setSessionId] = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<CtAnalysisResult | null>(ctAnalysisResult);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMetaRef = useRef<CtUploadMeta | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const live = isCtAnalysisLive();
  const mock = isCtAnalysisMockMode();

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const reset = () => {
    stopPoll();
    setPhase("empty");
    setSessionId("");
    setUploadPct(0);
    setUploadLabel("");
    setPipelineStep(0);
    setResult(null);
    setCtAnalysisResult(null);
    setError(null);
    setSelectedFile(null);
    uploadMetaRef.current = null;
  };

  const runAnalysis = async (sid: string, meta: CtUploadMeta) => {
    setPhase("analyzing");
    setPipelineStep(0);

    if (mock) {
      const out = await runMockAnalysisPipeline(sid, setPipelineStep);
      setResult(out);
      setCtAnalysisResult(out);
      setPhase("result");
      return;
    }

    await startEpaiAnalysis(sid, meta);
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const st = await pollAnalysisStatus(sid);
        if (st.status === "completed") {
          stopPoll();
          setPipelineStep(4);
          const out = await getAnalysisResult(sid, meta);
          setResult(out);
          setCtAnalysisResult(out);
          setPhase("result");
        } else if (st.status === "failed") {
          stopPoll();
          setError(st.error ?? "Inference failed");
          setPhase("error");
        } else {
          setPipelineStep((s) => Math.min(4, s + 1));
        }
      } catch (e) {
        stopPoll();
        setError(e instanceof Error ? e.message : "Status polling failed");
        setPhase("error");
      }
    }, 2500);
  };

  const handleFile = async (file: File) => {
    if (!isAcceptedCtFile(file)) {
      setError("Unsupported file type. Use .nii, .nii.gz, .npz, or .zip.");
      setPhase("error");
      return;
    }

    setSelectedFile(file);
    setError(null);
    const session = createAnalysisSession();
    setSessionId(session.sessionId);
    setPhase("uploading");
    setUploadPct(0);
    setUploadLabel("Preparing CT volume");

    try {
      const meta = await uploadCTFile(session.sessionId, file, (pct, label) => {
        setUploadPct(pct);
        if (label) setUploadLabel(label);
      });
      uploadMetaRef.current = meta;
      await runAnalysis(session.sessionId, meta);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      setPhase("error");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleAddToQueue = () => {
    if (!result) return;
    addToReviewQueue(result);
    setActiveSection("queue");
  };

  return (
    <div className="stack sandbox-stack">
      <div className="sandbox-hero panel card-elevated">
        <div className="sandbox-hero-copy">
          <p className="meta-label">Infrastructure console</p>
          <h2 className="section-title sandbox-title">
            Run a de-identified CT through the JHU/ePAI research pipeline
          </h2>
          <p className="muted section-lead-tight">
            Upload → analyze → review → export. Research-use only. Human review required.
          </p>
          <div className="sandbox-mode-badges">
            {mock ? (
              <span className="badge badge-demo">Mock mode</span>
            ) : (
              <span className="badge badge-live">API connected</span>
            )}
            <span className="badge pill-research">Research-use</span>
            <span className="badge pill-epai">JHU/ePAI</span>
          </div>
        </div>
      </div>

      <div className="sandbox-grid">
        <div className="sandbox-main">
          {phase === "empty" && (
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <input
                type="file"
                id="ct-upload"
                className="upload-zone-input"
                accept=".nii,.nii.gz,.npz,.zip"
                onChange={onInputChange}
              />
              <label htmlFor="ct-upload" className="upload-zone-label">
                <span className="upload-zone-title">
                  Upload a de-identified abdominal CT volume
                </span>
                <span className="muted">
                  .nii · .nii.gz · .npz · .zip
                </span>
                <span className="btn primary primary-button" style={{ marginTop: 16 }}>
                  Select file
                </span>
              </label>
              <p className="upload-disclaimer">
                Do not upload protected health information. Research-use files only.
              </p>
            </div>
          )}

          {phase === "uploading" && (
            <div className="panel card-elevated sandbox-state-card">
              <div className="meta-label">{uploadLabel || "Preparing CT volume"}</div>
              <p className="sandbox-state-file muted">
                {selectedFile?.name ?? "CT volume"}
              </p>
              <div className="progress-track" style={{ marginTop: 16 }}>
                <span
                  className="progress-fill"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                {uploadPct}%
              </p>
            </div>
          )}

          {phase === "analyzing" && (
            <div className="panel card-elevated sandbox-state-card">
              <div className="meta-label">JHU/ePAI analysis</div>
              <ol className="pipeline-stepper">
                {PIPELINE_STEPS.map((label, i) => (
                  <li
                    key={label}
                    className={
                      i < pipelineStep
                        ? "done"
                        : i === pipelineStep
                          ? "active"
                          : ""
                    }
                  >
                    <span className="pipeline-step-dot" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {phase === "result" && result && (
            <div className="panel card-elevated sandbox-result-card">
              {result.simulated && (
                <div className="sandbox-sim-banner">
                  Simulated demo output — not connected to a live inference backend.
                </div>
              )}
              <div className="sandbox-result-grid">
                <div>
                  <div className="meta-label">Session ID</div>
                  <code className="sandbox-session-id">{result.sessionId}</code>
                </div>
                <div>
                  <div className="meta-label">Model status</div>
                  <div>{result.modelStatus}</div>
                </div>
                <div>
                  <div className="meta-label">Analysis mode</div>
                  <div>{result.analysisMode}</div>
                </div>
                <div>
                  <div className="meta-label">Anatomy parsed</div>
                  <div>{result.anatomyParsed.join(", ")}</div>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                {result.candidateRegionSummary}
              </p>
              <div className="meta-label" style={{ marginTop: 16 }}>
                Output artifacts
              </div>
              <ul className="artifact-list muted">
                <li>Overlay preview</li>
                <li>Combined labels</li>
                <li>Report package</li>
                <li>Viewer session</li>
              </ul>
              <div className="sandbox-actions">
                <a
                  className="btn primary primary-button"
                  href={getViewerUrl(result.sessionId)}
                  target={live ? "_blank" : undefined}
                  rel={live ? "noreferrer" : undefined}
                >
                  Open in Viewer
                </a>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={handleAddToQueue}
                >
                  Add to Review Queue
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => setActiveSection("export")}
                >
                  Export Validation Package
                </button>
                <button type="button" className="btn-link" onClick={reset}>
                  Upload another case
                </button>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="panel card-elevated sandbox-error-card">
              <h3 className="section-title">Something went wrong</h3>
              <p>{error ?? "An unexpected error occurred."}</p>
              <ul className="muted sandbox-error-causes">
                <li>Unsupported file type</li>
                <li>Upload too large</li>
                <li>API unavailable</li>
                <li>Inference timeout</li>
              </ul>
              <button type="button" className="btn primary primary-button" onClick={reset}>
                Retry
              </button>
            </div>
          )}
        </div>

        <aside className="sandbox-side panel card-elevated">
          <h3 className="section-title" style={{ marginTop: 0 }}>
            JHU/ePAI analysis pipeline
          </h3>
          <ul className="sandbox-side-list muted">
            <li>Pancreas / duct / lesion-aware outputs</li>
            <li>Anatomy-aware segmentation channels</li>
            <li>Human review required</li>
          </ul>
          <hr className="divider" />
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Research-use only. Not for diagnosis. Not FDA cleared.
          </p>
        </aside>
      </div>

      {(phase === "result" || ctAnalysisResult) && (
        <AIFindingsCard result={result ?? ctAnalysisResult} />
      )}
    </div>
  );
}
