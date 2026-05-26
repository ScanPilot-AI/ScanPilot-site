import { useMemo, useState } from "react";
import { useSampleViewer } from "../../context/SampleViewerContext";
import {
  FOCUS_PRESET_DEFS,
  ORGAN_GROUP_LABELS,
  getLayerColor,
  getLayerLabel,
  groupLayersByCategory,
  type FocusPresetId,
  type OrganGroupId,
} from "../../data/pants-organ-layers";

export function SampleViewerLayers({ expanded }: { expanded: boolean }) {
  const {
    manifest,
    selectedOrgans,
    layerOpacityById,
    focusPreset,
    toggleOrgan,
    toggleGroup,
    setLayerOpacity,
    applyFocusPreset,
    resetLayers,
    showAllLayers,
    hideAllLayers,
  } = useSampleViewer();
  const [filter, setFilter] = useState("");

  const grouped = useMemo(() => {
    if (!manifest) return null;
    return groupLayersByCategory(manifest.availableOrgans);
  }, [manifest]);

  if (!manifest || !grouped) return null;

  const q = filter.trim().toLowerCase();

  function renderGroup(groupId: OrganGroupId) {
    const layers = grouped![groupId].filter((id) => {
      if (!q) return true;
      return id.includes(q) || getLayerLabel(id).toLowerCase().includes(q);
    });
    if (layers.length === 0) return null;
    const allOn = layers.every((id) => selectedOrgans.includes(id));

    return (
      <div key={groupId} className="sv-layer-group">
        <label className="sv-layer-group-head">
          <input
            type="checkbox"
            checked={allOn}
            onChange={() => toggleGroup(layers)}
          />
          <span>{ORGAN_GROUP_LABELS[groupId]}</span>
        </label>
        <ul className="sv-layer-list">
          {layers.map((id) => {
            const on = selectedOrgans.includes(id);
            const opacity = Math.round((layerOpacityById[id] ?? 0.55) * 100);
            return (
              <li key={id} className={on ? "is-on" : ""}>
                <label>
                  <input type="checkbox" checked={on} onChange={() => toggleOrgan(id)} />
                  <span className="sv-layer-swatch" style={{ background: getLayerColor(id) }} />
                  <span>{getLayerLabel(id)}</span>
                </label>
                {on && (
                  <input
                    type="range"
                    className="sv-layer-opacity"
                    min={10}
                    max={100}
                    value={opacity}
                    onChange={(e) => setLayerOpacity(id, Number(e.target.value) / 100)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className={`sv-layers-panel${expanded ? " is-expanded" : ""}`}>
      <div className="sv-layers-compact">
        <div className="mono-label">Focus presets</div>
        <div className="sv-preset-row">
          {(Object.keys(FOCUS_PRESET_DEFS) as FocusPresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`sv-preset-btn${focusPreset === id ? " is-active" : ""}`}
              onClick={() => applyFocusPreset(id)}
            >
              {FOCUS_PRESET_DEFS[id].label}
            </button>
          ))}
        </div>
        <div className="sv-layer-actions">
          <button type="button" className="sv-hud-btn" onClick={showAllLayers}>
            Show all
          </button>
          <button type="button" className="sv-hud-btn" onClick={hideAllLayers}>
            Hide all
          </button>
          <button type="button" className="sv-hud-btn" onClick={resetLayers}>
            Reset
          </button>
        </div>
      </div>

      {expanded && (
        <div className="sv-layers-expanded">
          <input
            type="search"
            className="sv-layer-search"
            placeholder="Filter layers…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="sv-layers-scroll">
            {(Object.keys(ORGAN_GROUP_LABELS) as OrganGroupId[]).map(renderGroup)}
          </div>
        </div>
      )}
    </div>
  );
}
