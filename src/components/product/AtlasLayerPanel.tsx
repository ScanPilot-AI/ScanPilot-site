import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  FOCUS_PRESET_DEFS,
  ORGAN_GROUP_LABELS,
  groupLayersByCategory,
  getLayerColor,
  getLayerLabel,
  type FocusPresetId,
  type OrganGroupId,
} from "../../data/pants-organ-layers";

export function AtlasLayerPanel() {
  const {
    selectedCaseManifest,
    selectedOrgans,
    layerOpacityById,
    focusPreset,
    toggleOrgan,
    toggleGroup,
    setLayerOpacity,
    applyFocusPreset,
    resetLayerState,
    showAllLayers,
    hideAllLayers,
    atlasReady,
  } = useDemoWorkspace();
  const [filter, setFilter] = useState("");

  const grouped = useMemo(() => {
    if (!selectedCaseManifest) return null;
    return groupLayersByCategory(selectedCaseManifest.availableOrgans);
  }, [selectedCaseManifest]);

  if (!atlasReady || !selectedCaseManifest || !grouped) {
    return (
      <div className="atlas-layer-panel">
        <p className="muted" style={{ fontSize: 12 }}>
          Select a bundled local CT volume to control segmentation layers.
        </p>
      </div>
    );
  }

  const q = filter.trim().toLowerCase();

  function renderGroup(groupId: OrganGroupId) {
    const layers = grouped![groupId].filter((id) => {
      if (!q) return true;
      return id.includes(q) || getLayerLabel(id).toLowerCase().includes(q);
    });
    if (layers.length === 0) return null;

    const allOn = layers.every((id) => selectedOrgans.includes(id));

    return (
      <div key={groupId} className="layer-panel-group">
        <div className="layer-panel-group-head">
          <label className="layer-panel-group-toggle">
            <input
              type="checkbox"
              checked={allOn}
              onChange={() => toggleGroup(groupId, layers)}
            />
            <span>{ORGAN_GROUP_LABELS[groupId]}</span>
          </label>
        </div>
        <ul className="layer-panel-list">
          {layers.map((id) => {
            const on = selectedOrgans.includes(id);
            const opacity = Math.round((layerOpacityById[id] ?? 0.55) * 100);
            return (
              <li key={id} className={on ? "is-on" : ""}>
                <label className="layer-panel-row">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleOrgan(id)}
                  />
                  <span
                    className="layer-swatch"
                    style={{ background: getLayerColor(id) }}
                  />
                  <span className="layer-panel-name">{getLayerLabel(id)}</span>
                </label>
                {on && (
                  <input
                    type="range"
                    className="layer-opacity-slider"
                    min={10}
                    max={100}
                    value={opacity}
                    onChange={(e) =>
                      setLayerOpacity(id, Number(e.target.value) / 100)
                    }
                    aria-label={`${getLayerLabel(id)} opacity`}
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
    <div className="atlas-layer-panel">
      <div className="layer-panel-head">
        <div className="meta-label">Layer intelligence</div>
        <span className="muted" style={{ fontSize: 11 }}>
          {selectedOrgans.length} active layers ·{" "}
          {FOCUS_PRESET_DEFS[focusPreset].label} preset
        </span>
      </div>

      <div className="focus-preset-row">
        {(Object.keys(FOCUS_PRESET_DEFS) as FocusPresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`focus-preset-btn${focusPreset === id ? " active" : ""}`}
            onClick={() => applyFocusPreset(id)}
          >
            {FOCUS_PRESET_DEFS[id].label}
          </button>
        ))}
      </div>

      <div className="layer-panel-actions">
        <button type="button" className="btn ghost" onClick={showAllLayers}>
          Show all
        </button>
        <button type="button" className="btn ghost" onClick={hideAllLayers}>
          Hide all
        </button>
        <button type="button" className="btn ghost" onClick={resetLayerState}>
          Reset
        </button>
      </div>

      <input
        type="search"
        className="layer-search"
        placeholder="Filter layers…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="layer-panel-scroll">
        {(Object.keys(ORGAN_GROUP_LABELS) as OrganGroupId[]).map(renderGroup)}
      </div>
    </div>
  );
}
