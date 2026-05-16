import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { getDemoCase } from "../../data/scanpilot-demo-data";
import {
  analyzeScan,
  hasScanPilotApi,
} from "../../lib/scanpilot-api";
import type { ModelAnalysisResponse } from "../../data/scanpilot-demo-data";

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
        metadata: {
          contrast_phase: "portal_venous",
          organ: "pancreas",
        },
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

  const pythonEx = `import requests, os
import json

base = os.environ["SCANPILOT_API_URL"]
body = json.loads(r"""
${requestJson}
""")
r = requests.post(base + "${ENDPOINT}", json=body, timeout=60)
r.raise_for_status()
print(r.json())`;

  const tsEx = `const base = import.meta.env.VITE_SCANPILOT_API_URL;
const res = await fetch(\`\${base}${ENDPOINT}\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${requestJson}),
});
if (!res.ok) throw new Error(await res.text());
console.log(await res.json());`;

  const curlEx = `curl -X POST "$SCANPILOT_API_URL${ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '${requestJson.replaceAll("\n", "")}'`;

  async function runDemo() {
    setBusy(true);
    try {
      const { data, meta } = await analyzeScan(
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
      void window.console?.debug?.("analyzeScan", meta);
    } finally {
      setBusy(false);
    }
  }

  const code =
    sdk === "python" ? pythonEx : sdk === "typescript" ? tsEx : curlEx;

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Model API · oncology imaging analyze</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Developer contract for remote scan references. Production traffic
          routes to <code>VITE_SCANPILOT_API_URL</code> when configured.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={live ? "badge badge-live" : "badge badge-demo"}>
            {live ? "Live API" : "Demo fallback"}
          </span>
          <span className="badge">
            POST {ENDPOINT}
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel card-elevated">
          <h3 className="section-title">Request JSON</h3>
          <div className="code-panel">{requestJson}</div>
          <button
            type="button"
            className="btn primary primary-button"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() => void runDemo()}
          >
            {busy ? "Running…" : "Run demo analysis"}
          </button>
          <p className="muted" style={{ fontSize: 12 }}>
            Demo output for research and infrastructure evaluation only. Not
            intended for clinical diagnosis or treatment decisions.
          </p>
        </div>
        <div className="panel card-elevated">
          <h3 className="section-title">Response</h3>
          <div className="code-panel">
            {JSON.stringify(result, null, 2)}
          </div>
          {result && (
            <div style={{ marginTop: 14 }}>
              <div className="grid-2">
                <div>
                  <div className="muted">Risk score</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {result.risk_score}
                  </div>
                </div>
                <div>
                  <div className="muted">Band</div>
                  <div>{result.risk_band}</div>
                </div>
                <div>
                  <div className="muted">Confidence</div>
                  <div>{result.confidence.toFixed(2)}</div>
                </div>
                <div>
                  <div className="muted">Model version</div>
                  <div>{result.model_version}</div>
                </div>
              </div>
              <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                Attention regions
              </div>
              <div className="chips" style={{ marginTop: 6 }}>
                {result.attention_regions.map((r) => (
                  <span key={r} className="chip chip-attn">
                    {r}
                  </span>
                ))}
              </div>
              <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                Label explanations
              </div>
              <ul style={{ fontSize: 13 }}>
                {result.label_explanations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: 12 }}>
                {result.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">SDK examples</h3>
        <div className="tabs">
          <button
            type="button"
            className={sdk === "python" ? "tab active" : "tab"}
            onClick={() => setSdk("python")}
          >
            Python
          </button>
          <button
            type="button"
            className={sdk === "typescript" ? "tab active" : "tab"}
            onClick={() => setSdk("typescript")}
          >
            TypeScript
          </button>
          <button
            type="button"
            className={sdk === "curl" ? "tab active" : "tab"}
            onClick={() => setSdk("curl")}
          >
            cURL
          </button>
        </div>
        <div className="code-panel">{code}</div>
      </div>

      <div className="disclaimer-bar">
        Demo output for research and infrastructure evaluation only. Not intended
        for clinical diagnosis or treatment decisions.
      </div>
    </div>
  );
}
