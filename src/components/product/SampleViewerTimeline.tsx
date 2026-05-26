import { useSampleViewer } from "../../context/SampleViewerContext";
import { FOCUS_PRESET_DEFS } from "../../data/pants-organ-layers";

export function SampleViewerTimeline() {
  const {
    manifest,
    sliceIndex,
    setSliceIndex,
    isPlaying,
    setIsPlaying,
    selectedOrgans,
    globalOverlayOpacity,
    setGlobalOverlayOpacity,
    focusPreset,
  } = useSampleViewer();

  if (!manifest) return null;

  const sourceZ = manifest.sourceSliceIds[sliceIndex];

  return (
    <div className="sv-timeline-bar">
      <button
        type="button"
        className={`sv-timeline-play${isPlaying ? " is-playing" : ""}`}
        onClick={() => setIsPlaying(!isPlaying)}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Pause cine" : "Play cine"}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      <div className="sv-timeline-core">
        <div className="sv-timeline-label-row">
          <span className="sv-timeline-kicker">Axial slice timeline</span>
          <span className="sv-timeline-slice-readout">
            Slice {sliceIndex + 1} / {manifest.sliceCount}
            {sourceZ !== undefined && (
              <span className="sv-timeline-z"> · z {sourceZ}</span>
            )}
          </span>
        </div>
        <div className="sv-timeline-track" role="tablist" aria-label="Slice timeline">
          {Array.from({ length: manifest.sliceCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === sliceIndex}
              className={`sv-timeline-tick${i === sliceIndex ? " is-active" : ""}`}
              onClick={() => setSliceIndex(i)}
              title={`Slice ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="sv-timeline-meta">
        <span className="sv-timeline-stack" title="Exported slice stack" aria-hidden="true">
          ⊞
        </span>
        <label className="sv-timeline-opacity">
          <span className="mono-label">Overlay</span>
          <input
            type="range"
            min={15}
            max={100}
            value={Math.round(globalOverlayOpacity * 100)}
            onChange={(e) => setGlobalOverlayOpacity(Number(e.target.value) / 100)}
          />
        </label>
        <span className="sv-timeline-active-count">
          {selectedOrgans.length} active · {FOCUS_PRESET_DEFS[focusPreset].label}
        </span>
      </div>
    </div>
  );
}
