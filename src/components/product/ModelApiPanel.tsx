import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { getDemoCase } from "../../data/scanpilot-demo-data";
import { analyzeScan, hasScanPilotApi } from "../../lib/scanpilot-api";
import type { ModelAnalysisResponse } from "../../data/scanpilot-demo-data";
import {
  ConsoleDisclaimer,
  ConsolePage,
  ConsolePageHeader,
  StatusChip,
} from "./ConsolePage";

type Sdk = "python" | "typescript" | "curl";

const ENDPOINT = "/v1/oncology/imaging/analyze";

export function ModelApiPanel() {
  const { selectedCaseId, setLastAnalysis, lastAnalysis } = useDemoWorkspace();
  const c = getDemoCase(selectedCaseId);
  const live = hasScanPilotApi();
  const [sdk, setSdk] = useState<Sdk>("typescript");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ModelAnalysisResponse | null>(
    lastAnalysis ?? c.model_demo_result
  );

  const body = useMemo(
    () => ({
      scan_id: c.scan_id,
      case_id: c.case_id,
      task: "pancreatic_risk_screening",
      inputs: {
        modality: "CT",
        format: "remote_scan_reference",
        metadata: { contrast_phase: "portal_venous", organ: "pancreas" },
      },
      return: [
        "risk_score",
        "risk_band",
        "confidence",
        "attention_regions",
        "label_explanations",
        "model_version",
      ],
    }),
    [c]
  );

  const requestJson = JSON.stringify(body, null, 2);

  const pythonEx = `import requests, os\nimport json\n\nbase = os.environ["SCANPILOT_API_URL"]\nbody = json.loads(r"""\n${requestJson}\n""")\nr = requests.post(base + "${ENDPOINT}", json=body, timeout=60)\nr.raise_for_status()\nprint(r.json())`;

  const tsEx = `const base = import.meta.env.VITE_SCANPILOT_API_URL;\nconst res = await fetch(\`\${base}${ENDPOINT}\`, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${requestJson}),\n});\nif (!res.ok) throw new Error(await res.text());\nconsole.log(await res.json());`;

  const curlEx = `curl -X POST "$SCANPILOT_API_URL${ENDPOINT}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestJson.replaceAll("\n", "")}'`;

  async function runDemo() {
    setBusy(true);
    try {
      const { data } = await analyzeScan(
        {
          scan_id: c.scan_id,
          case_id: c.case_id,
          task: "pancreatic_risk_screening",
          inputs: body.inputs,
          return: body.return,
        },
        c.model_demo_result
      );
      setResult(data);
      setLastAnalysis(data);
    } finally {
      setBusy(false);
    }
  }

  const code = sdk === "python" ? pythonEx : sdk === "typescript" ? tsEx : curlEx;

  return (
    <ConsolePage>
      <ConsolePageHeader
        kicker="Developer console"
        title="Model API"
        subtitle="Research endpoint contract for remote scan references. Routes to VITE_SCANPILOT_API_URL when configured."
        chips={
          <>
            <StatusChip variant="demo">POST {ENDPOINT}</StatusChip>
            <StatusChip variant={live ? "teal" : "demo"}>
              {live ? "Live API" : "Demo fallback"}
            </StatusChip>
            <StatusChip>JSON response</StatusChip>
            <StatusChip>Research endpoint contract</StatusChip>
          </>
        }
      />

      <div className="console-grid-2">
        <div className="console-card">
          <h3 className="console-card-title">Request</h3>
          <div className="code-panel">{requestJson}</div>
          <button
            type="button"
            className="clinical-button"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void runDemo()}
          >
            {busy ? "Running…" : "Run demo analysis"}
          </button>
        </div>

        <div className="console-card">
          <h3 className="console-card-title">Response</h3>
          <div className="code-panel">{JSON.stringify(result, null, 2)}</div>
          {result && (
            <div className="api-response-summary">
              <div className="console-metric-row">
                <div className="metric-card metric-card--tumor">
                  <b>{result.risk_score}</b>
                  <span>Risk score</span>
                </div>
                <div className="metric-card">
                  <b>{result.risk_band}</b>
                  <span>Risk band</span>
                </div>
                <div className="metric-card">
                  <b>{result.confidence.toFixed(2)}</b>
                  <span>Confidence</span>
                </div>
                <div className="metric-card">
                  <b>{result.model_version}</b>
                  <span>Model version</span>
                </div>
              </div>
              <div className="mono-label">Attention regions</div>
              <div className="chip-row">
                {result.attention_regions.map((r) => (
                  <span key={r} className="status-chip">
                    {r}
                  </span>
                ))}
              </div>
              <div className="mono-label" style={{ marginTop: 12 }}>
                Label explanations
              </div>
              <ul className="console-file-list">
                {result.label_explanations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div className="mono-label" style={{ marginTop: 12 }}>
                Returned artifacts
              </div>
              <p className="muted" style={{ fontSize: 12 }}>
                risk_score.json · attention_heatmap.npz · label_explanations.json
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="console-card">
        <h3 className="console-card-title">SDK examples</h3>
        <div className="tabs">
          {(["python", "typescript", "curl"] as Sdk[]).map((s) => (
            <button
              key={s}
              type="button"
              className={sdk === s ? "tab active" : "tab"}
              onClick={() => setSdk(s)}
            >
              {s === "curl" ? "cURL" : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="code-panel">{code}</div>
      </div>

      <ConsoleDisclaimer />
    </ConsolePage>
  );
}
