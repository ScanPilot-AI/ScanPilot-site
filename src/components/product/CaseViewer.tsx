import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  DEMO_CASES,
  getDemoCase,
} from "../../data/scanpilot-demo-data";
import { ctSliceUrl, overlaySliceUrl } from "../../data/demo-asset-urls";

const LAYERS = {
  nearby: {
    label: "Nearby anatomy",
    prefix: "nearby" as const,
    color: "#a78bfa",
  },
  pancreas: {
    label: "Pancreas mask",
    prefix: "pancreas" as const,
    color: "#34d399",
  },
  duct: {
    label: "Duct region",
    prefix: "duct" as const,
    color: "#22d3ee",
  },
  lesion: {
    label: "Model-highlighted region",
    prefix: "lesion" as const,
    color: "#fbbf24",
  },
};

export function CaseViewer() {
  const { selectedCaseId, setSelectedCaseId, selectedCohortId } =
    useDemoWorkspace();
  const c = getDemoCase(selectedCaseId);

  const [slice, setSlice] = useState(4);
  const [overlayOpacity, setOverlayOpacity] = useState(42);
  const [maskOn, setMaskOn] = useState(true);
  const [attentionOn, setAttentionOn] = useState(true);
  const [ductOn, setDuctOn] = useState(true);
  const [nearbyOn, setNearbyOn] = useState(false);

  const maxSlice = Math.max(0, c.slice_count - 1);

  const ctSrc = useMemo(() => ctSliceUrl(c.asset_folder, slice), [c, slice]);

  function reset() {
    setSlice(4);
    setOverlayOpacity(42);
    setMaskOn(true);
    setAttentionOn(true);
    setDuctOn(true);
    setNearbyOn(false);
  }

  const overlays = useMemo(() => {
    const o: Array<{ key: string; href: string }> = [];
    if (nearbyOn) {
      const href = overlaySliceUrl(c.asset_folder, LAYERS.nearby.prefix, slice);
      if (href) o.push({ key: "nearby", href });
    }
    if (maskOn) {
      const href = overlaySliceUrl(
        c.asset_folder,
        LAYERS.pancreas.prefix,
        slice
      );
      if (href) o.push({ key: "pancreas", href });
    }
    if (ductOn) {
      const href = overlaySliceUrl(c.asset_folder, LAYERS.duct.prefix, slice);
      if (href) o.push({ key: "duct", href });
    }
    if (attentionOn) {
      const href = overlaySliceUrl(c.asset_folder, LAYERS.lesion.prefix, slice);
      if (href) o.push({ key: "lesion", href });
    }
    return o;
  }, [attentionOn, c.asset_folder, ductOn, maskOn, nearbyOn, slice]);

  const hasCt = Boolean(ctSrc);

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">Case viewer · QA preview</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          De-identified axial PNG stack with exported masks (PanTS-style public
          assets). Toggle model-highlighted regions for annotation QA — not a
          diagnostic read or hospital PACS replacement.
        </p>
        <label className="muted" style={{ display: "block", marginBottom: 8 }}>
          Demo case
          <select
            className="btn"
            style={{ width: "100%", maxWidth: 440, marginTop: 4 }}
            value={c.case_id}
            onChange={(e) => setSelectedCaseId(e.target.value)}
          >
            {DEMO_CASES.map((x) => (
              <option key={x.case_id} value={x.case_id}>
                {x.case_id} · {x.scan_id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="panel card-elevated">
        <div className="viewer-shell">
          <div className="viewer">
            {hasCt ? (
              <img src={ctSrc} alt={`CT slice ${slice + 1} (demo)`} />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-linear-gradient(0deg,#0f172a 0 2px,#020617 2px 6px), radial-gradient(circle at 50% 45%,#1e293b,#020617)",
                }}
              />
            )}
            {overlays.map((layer) => (
              <img
                key={layer.key}
                src={layer.href}
                alt=""
                className="viewer-overlay"
                style={{
                  opacity: overlayOpacity / 100,
                  mixBlendMode: "screen",
                }}
              />
            ))}
          </div>
        </div>

        <div className="viewer-legend">
          {(Object.keys(LAYERS) as Array<keyof typeof LAYERS>).map((k) => (
            <span key={k} className="legend-item">
              <span
                className="legend-swatch"
                style={{ background: LAYERS[k].color }}
              />
              {LAYERS[k].label}
            </span>
          ))}
        </div>

        <div className="controls-row">
          <label>
            Slice
            <input
              type="range"
              min={0}
              max={maxSlice}
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
            />
            <span className="muted">
              {slice + 1} / {maxSlice + 1}
            </span>
          </label>
          <label>
            Overlay opacity
            <input
              type="range"
              min={0}
              max={100}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            />
          </label>
          <button type="button" className="btn ghost secondary-button" onClick={reset}>
            Reset view
          </button>
        </div>

        <div className="controls-row" style={{ marginTop: 4 }}>
          <label
            className="muted"
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={maskOn}
              onChange={(e) => setMaskOn(e.target.checked)}
            />
            Pancreas mask
          </label>
          <label
            className="muted"
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={attentionOn}
              onChange={(e) => setAttentionOn(e.target.checked)}
            />
            Model-highlighted region
          </label>
          <label
            className="muted"
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={ductOn}
              onChange={(e) => setDuctOn(e.target.checked)}
            />
            Duct overlay
          </label>
          <label
            className="muted"
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <input
              type="checkbox"
              checked={nearbyOn}
              onChange={(e) => setNearbyOn(e.target.checked)}
            />
            Nearby anatomy
          </label>
        </div>

        <div className="meta-label" style={{ marginTop: 16 }}>
          Remote references (production routing)
        </div>
        <div className="code-panel" style={{ marginTop: 8 }}>
          {JSON.stringify(
            {
              scan_id: c.scan_id,
              case_id: c.case_id,
              cohort_id: selectedCohortId ?? "PAN-EARLY-001",
              modality: c.modality,
            },
            null,
            2
          )}
        </div>

        <div className="disclaimer-bar" style={{ marginTop: 14 }}>
          Demo output for research and infrastructure evaluation only. Not
          intended for clinical diagnosis or treatment decisions.
        </div>
      </div>

      <div className="grid-2">
        <div className="panel card-elevated">
          <h3 className="section-title">Report excerpt</h3>
          <p style={{ fontSize: 14 }}>{c.report_excerpt}</p>
          <div className="chips" style={{ marginTop: 10 }}>
            {c.labels.map((l) => (
              <span key={l} className="chip">
                {l.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
        <div className="panel card-elevated">
          <h3 className="section-title">Acquisition metadata</h3>
          <table className="data data-table">
            <tbody>
              <tr>
                <td className="muted">scan_id</td>
                <td>{c.scan_id}</td>
              </tr>
              <tr>
                <td className="muted">case_id</td>
                <td>{c.case_id}</td>
              </tr>
              <tr>
                <td className="muted">cohort_id</td>
                <td>{selectedCohortId ?? "—"}</td>
              </tr>
              <tr>
                <td className="muted">organ</td>
                <td>{c.organ}</td>
              </tr>
              <tr>
                <td className="muted">modality</td>
                <td>{c.modality}</td>
              </tr>
              <tr>
                <td className="muted">contrast</td>
                <td>{c.contrast_phase}</td>
              </tr>
              <tr>
                <td className="muted">center</td>
                <td>{c.center}</td>
              </tr>
              <tr>
                <td className="muted">age bucket</td>
                <td>{c.deidentified_age_bucket}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel card-elevated">
        <h3 className="section-title">Model demo scalar (infrastructure preview)</h3>
        <div className="grid-2">
          <div>
            <div className="muted">Risk score (demo)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {c.model_demo_result.risk_score}
            </div>
          </div>
          <div>
            <div className="muted">Band</div>
            <div>{c.model_demo_result.risk_band}</div>
          </div>
          <div>
            <div className="muted">Confidence</div>
            <div>{c.model_demo_result.confidence.toFixed(2)}</div>
          </div>
          <div>
            <div className="muted">Model version</div>
            <div>{c.model_demo_result.model_version}</div>
          </div>
        </div>
        <div className="meta-label" style={{ marginTop: 12 }}>
          Attention regions
        </div>
        <div className="chips" style={{ marginTop: 6 }}>
          {c.model_demo_result.attention_regions.map((r) => (
            <span key={r} className="chip chip-attn">
              {r}
            </span>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12 }}>
          {c.disclaimer}
        </p>
      </div>
    </div>
  );
}
