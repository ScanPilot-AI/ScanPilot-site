import { useMemo } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { ctFrameForSlice, overlayForSlice } from "../../data/pants-atlas";
import { ctSliceUrl, overlaySliceUrl } from "../../data/demo-asset-urls";
import { getDemoCase } from "../../data/scanpilot-demo-data";
import { AtlasLayerPanel } from "./AtlasLayerPanel";

const LEGACY_LAYERS = {
  pancreas: "pancreas" as const,
  duct: "duct" as const,
  lesion: "lesion" as const,
};

export function CaseViewer() {
  const {
    atlasReady,
    atlasLoading,
    selectedCaseId,
    selectedCaseManifest,
    getCatalogCase,
    sliceIndex,
    setSliceIndex,
    selectedOrgans,
    layerOpacityById,
    isPlaying,
    setIsPlaying,
    disclaimer,
  } = useDemoWorkspace();

  const meta = getCatalogCase(selectedCaseId);
  const legacyCase = useMemo(
    () => (atlasReady ? null : getDemoCase(selectedCaseId)),
    [atlasReady, selectedCaseId]
  );

  const maxSlice = useMemo(() => {
    if (selectedCaseManifest) return Math.max(0, selectedCaseManifest.sliceCount - 1);
    if (legacyCase) return Math.max(0, legacyCase.slice_count - 1);
    return 0;
  }, [selectedCaseManifest, legacyCase]);

  const ctSrc = useMemo(() => {
    if (selectedCaseManifest) {
      return ctFrameForSlice(selectedCaseManifest, sliceIndex);
    }
    if (legacyCase) return ctSliceUrl(legacyCase.asset_folder, sliceIndex);
    return null;
  }, [selectedCaseManifest, legacyCase, sliceIndex]);

  const overlaySrcs = useMemo(() => {
    if (selectedCaseManifest) {
      return selectedOrgans
        .map((organ) => ({
          key: organ,
          href: overlayForSlice(selectedCaseManifest, organ, sliceIndex),
          opacity: layerOpacityById[organ] ?? 0.55,
        }))
        .filter((x): x is { key: string; href: string; opacity: number } =>
          Boolean(x.href)
        );
    }
    if (!legacyCase) return [];
    return [
      { key: "pancreas", prefix: LEGACY_LAYERS.pancreas },
      { key: "duct", prefix: LEGACY_LAYERS.duct },
      { key: "lesion", prefix: LEGACY_LAYERS.lesion },
    ]
      .map((l) => ({
        key: l.key,
        href: overlaySliceUrl(legacyCase.asset_folder, l.prefix, sliceIndex),
        opacity: 0.55,
      }))
      .filter((x) => x.href);
  }, [selectedCaseManifest, selectedOrgans, layerOpacityById, legacyCase, sliceIndex]);

  const sourceSliceId = selectedCaseManifest?.sourceSliceIds[sliceIndex];

  if (!selectedCaseManifest && !legacyCase && !atlasLoading) {
    return (
      <div className="atlas-viewer-empty panel card-elevated">
        <h3 className="section-title">Atlas viewer unavailable</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Metadata-only cases do not include browser-viewable CT volumes in this
          research-use static demo. Select one of the 5 bundled local CT volumes
          from the case database or left queue.
        </p>
      </div>
    );
  }

  return (
    <div className="atlas-viewer-layout">
      <div className="atlas-viewer-main">
        <div className="viewer-canvas-wrap atlas-viewport-hud">
          <div className="viewer-scanline" aria-hidden="true" />
          <div className="viewer-canvas">
            {ctSrc ? (
              <img src={ctSrc} alt={`CT slice ${sliceIndex + 1}`} className="viewer-ct" />
            ) : (
              <div className="viewer-placeholder" aria-hidden="true" />
            )}
            {overlaySrcs.map((layer) => (
              <img
                key={layer.key}
                src={layer.href}
                alt=""
                className="viewer-overlay"
                style={{ opacity: layer.opacity }}
              />
            ))}
            <div className="viewer-hud">
              <span className="viewer-hud-chip">
                Slice {sliceIndex + 1} / {maxSlice + 1}
              </span>
              {sourceSliceId !== undefined && (
                <span className="viewer-hud-chip muted-hud">Source Z {sourceSliceId}</span>
              )}
              {selectedCaseManifest && (
                <span className="viewer-hud-chip">{selectedCaseManifest.caseId}</span>
              )}
              {meta?.hasLocalVolume && (
                <span className="viewer-hud-chip hud-local">Local atlas</span>
              )}
            </div>
          </div>
        </div>

        <div className="atlas-timeline">
          <div className="atlas-timeline-ticks">
            {Array.from({ length: maxSlice + 1 }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`atlas-tick${i === sliceIndex ? " active" : ""}`}
                onClick={() => setSliceIndex(i)}
                aria-label={`Go to slice ${i + 1}`}
              />
            ))}
          </div>
          <div className="viewer-controls atlas-viewer-controls">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))}
            >
              ◀
            </button>
            <input
              type="range"
              min={0}
              max={maxSlice}
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              aria-label="Slice scrubber"
            />
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSliceIndex(Math.min(maxSlice, sliceIndex + 1))}
            >
              ▶
            </button>
            <button
              type="button"
              className={`btn ghost cine-btn${isPlaying ? " active" : ""}`}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={atlasLoading || (!selectedCaseManifest && !legacyCase)}
            >
              {isPlaying ? "Pause" : "Cine"}
            </button>
          </div>
        </div>

        <p className="viewer-disclaimer">{disclaimer} · Not FDA cleared.</p>
      </div>

      <aside className="atlas-viewer-layers">
        <AtlasLayerPanel />
      </aside>
    </div>
  );
}
