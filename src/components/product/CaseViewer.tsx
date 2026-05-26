import { useMemo } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  ctFrameForSlice,
  overlayForSlice,
} from "../../data/pants-atlas";
import { ctSliceUrl, overlaySliceUrl } from "../../data/demo-asset-urls";
import { getDemoCase } from "../../data/scanpilot-demo-data";

const LEGACY_LAYERS = {
  pancreas: "pancreas" as const,
  duct: "duct" as const,
  lesion: "lesion" as const,
  nearby: "nearby" as const,
};

export function CaseViewer() {
  const {
    atlasReady,
    atlasLoading,
    selectedCaseId,
    selectedCaseManifest,
    sliceIndex,
    setSliceIndex,
    selectedOrgans,
    overlayOpacity,
    setOverlayOpacity,
    isPlaying,
    setIsPlaying,
    disclaimer,
  } = useDemoWorkspace();

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
        }))
        .filter((x): x is { key: string; href: string } => Boolean(x.href));
    }
    if (!legacyCase) return [];
    const layers = [
      { key: "pancreas", on: true, prefix: LEGACY_LAYERS.pancreas },
      { key: "duct", on: true, prefix: LEGACY_LAYERS.duct },
      { key: "lesion", on: true, prefix: LEGACY_LAYERS.lesion },
    ];
    return layers
      .map((l) => ({
        key: l.key,
        href: overlaySliceUrl(legacyCase.asset_folder, l.prefix, sliceIndex),
      }))
      .filter((x) => x.href);
  }, [selectedCaseManifest, selectedOrgans, legacyCase, sliceIndex]);

  const sourceSliceId = selectedCaseManifest?.sourceSliceIds[sliceIndex];

  return (
    <div className="case-viewer-root">
      <div className="viewer-canvas-wrap">
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
              style={{ opacity: overlayOpacity / 100 }}
            />
          ))}
          <div className="viewer-hud">
            <span className="viewer-hud-chip">
              Slice {sliceIndex + 1} / {maxSlice + 1}
            </span>
            {sourceSliceId !== undefined && (
              <span className="viewer-hud-chip muted-hud">
                Source Z {sourceSliceId}
              </span>
            )}
            {selectedCaseManifest && (
              <span className="viewer-hud-chip">{selectedCaseManifest.caseId}</span>
            )}
          </div>
        </div>
      </div>

      <div className="viewer-controls">
        <label className="viewer-control">
          <span className="meta-label">Slice</span>
          <input
            type="range"
            min={0}
            max={maxSlice}
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
          />
        </label>
        <label className="viewer-control">
          <span className="meta-label">Overlay</span>
          <input
            type="range"
            min={0}
            max={100}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className={`btn ghost cine-btn${isPlaying ? " active" : ""}`}
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={atlasLoading || (!selectedCaseManifest && !legacyCase)}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <p className="viewer-disclaimer">{disclaimer}</p>
    </div>
  );
}
