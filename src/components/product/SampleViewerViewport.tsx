import { useMemo, type CSSProperties } from "react";
import { useSampleViewer } from "../../context/SampleViewerContext";
import { ctFrameForSlice, overlayForSlice } from "../../data/pants-atlas";
import { getGroupForLayer } from "../../data/pants-organ-layers";

type Callout = {
  id: string;
  label: string;
  style: CSSProperties;
};

export function SampleViewerViewport() {
  const {
    manifest,
    sliceIndex,
    selectedOrgans,
    layerOpacityById,
    globalOverlayOpacity,
    loading,
  } = useSampleViewer();

  const ctSrc = useMemo(() => {
    if (!manifest) return null;
    return ctFrameForSlice(manifest, sliceIndex);
  }, [manifest, sliceIndex]);

  const overlays = useMemo(() => {
    if (!manifest) return [];
    return selectedOrgans
      .map((organ) => ({
        key: organ,
        href: overlayForSlice(manifest, organ, sliceIndex),
        opacity: (layerOpacityById[organ] ?? 0.55) * globalOverlayOpacity,
      }))
      .filter((x): x is { key: string; href: string; opacity: number } => Boolean(x.href));
  }, [manifest, selectedOrgans, layerOpacityById, globalOverlayOpacity, sliceIndex]);

  const callouts = useMemo((): Callout[] => {
    if (!manifest) return [];
    const out: Callout[] = [];
    const hasPancreas = selectedOrgans.some((o) => getGroupForLayer(o) === "pancreas");
    const hasDuctLesion = selectedOrgans.some(
      (o) => o === "pancreatic_duct" || o === "pancreatic_lesion"
    );
    const hasVascular = selectedOrgans.some((o) => getGroupForLayer(o) === "vascular");
    const hasGi = selectedOrgans.some((o) => getGroupForLayer(o) === "adjacent_gi");

    if (hasPancreas) {
      out.push({
        id: "pancreas",
        label: "Pancreas context",
        style: { top: "38%", left: "52%" },
      });
    }
    if (hasDuctLesion && manifest.hasPancreaticLesion) {
      out.push({
        id: "lesion",
        label: "Duct / lesion",
        style: { top: "44%", left: "58%" },
      });
    } else if (hasDuctLesion && manifest.hasPancreaticDuct) {
      out.push({
        id: "duct",
        label: "Duct context",
        style: { top: "42%", left: "56%" },
      });
    }
    if (hasVascular) {
      out.push({
        id: "vascular",
        label: "Vascular adjacency",
        style: { top: "30%", left: "42%" },
      });
    }
    if (hasGi) {
      out.push({
        id: "gi",
        label: "Adjacent GI",
        style: { top: "52%", left: "38%" },
      });
    }
    return out.slice(0, 5);
  }, [manifest, selectedOrgans]);

  if (loading) {
    return (
      <div className="sv-viewport sv-viewport--loading">
        <p className="muted">Loading PanTS Atlas sample volumes…</p>
      </div>
    );
  }

  if (!manifest || !ctSrc) {
    return (
      <div className="sv-viewport sv-viewport--empty">
        <p>Select a bundled local CT volume from the case library.</p>
      </div>
    );
  }

  return (
    <div className="sv-viewport">
      <div className="sv-viewport-glow" aria-hidden="true" />
      <div className="sv-viewport-frame">
        <span className="sv-corner sv-corner-tl" aria-hidden="true" />
        <span className="sv-corner sv-corner-tr" aria-hidden="true" />
        <span className="sv-corner sv-corner-bl" aria-hidden="true" />
        <span className="sv-corner sv-corner-br" aria-hidden="true" />
        <div className="sv-scan-beam" aria-hidden="true" />
        <div className="sv-image-stack">
          <img src={ctSrc} alt={`CT slice ${sliceIndex + 1}`} className="sv-ct" />
          {overlays.map((layer) => (
            <img
              key={layer.key}
              src={layer.href}
              alt=""
              className="sv-overlay"
              style={{ opacity: layer.opacity }}
            />
          ))}
          {callouts.map((c) => (
            <div key={c.id} className="sv-callout" style={c.style}>
              <span className="sv-callout-node" aria-hidden="true" />
              <span className="sv-callout-label">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sv-viewport-badge">
        <span>{manifest.caseId}</span>
        <span className="sv-viewport-badge-sub">Exported PNG · static demo</span>
      </div>
    </div>
  );
}
