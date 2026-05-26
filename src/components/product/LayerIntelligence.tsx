import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  FOCUS_PRESETS,
  ORGAN_GROUP_LABELS,
  formatOrganLabel,
  groupOrgans,
  type FocusPresetId,
  type OrganGroupKey,
} from "../../data/pants-atlas";

export function LayerIntelligence() {
  const {
    selectedCaseManifest,
    selectedOrgans,
    toggleOrgan,
    applyFocusPreset,
    focusPreset,
    atlasReady,
  } = useDemoWorkspace();
  const [filter, setFilter] = useState("");

  const grouped = useMemo(() => {
    if (!selectedCaseManifest) return null;
    return groupOrgans(selectedCaseManifest.availableOrgans);
  }, [selectedCaseManifest]);

  if (!atlasReady || !selectedCaseManifest || !grouped) {
    return (
      <div className="atlas-panel layer-intel">
        <div className="meta-label">Layer intelligence</div>
        <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
          Load a PanTS Atlas case to browse organ overlay stacks.
        </p>
      </div>
    );
  }

  const q = filter.trim().toLowerCase();

  function renderGroup(key: OrganGroupKey) {
    const organs = grouped![key].filter((o) => {
      if (!q) return true;
      return o.includes(q) || formatOrganLabel(o).toLowerCase().includes(q);
    });
    if (organs.length === 0) return null;
    return (
      <div key={key} className="layer-group">
        <div className="layer-group-title">{ORGAN_GROUP_LABELS[key]}</div>
        <div className="layer-organ-list">
          {organs.map((organ) => (
            <label key={organ} className="layer-organ-toggle">
              <input
                type="checkbox"
                checked={selectedOrgans.includes(organ)}
                onChange={() => toggleOrgan(organ)}
              />
              <span>{formatOrganLabel(organ)}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-panel layer-intel">
      <div className="layer-intel-head">
        <div>
          <div className="meta-label">Layer intelligence</div>
          <div className="layer-intel-sub">
            {selectedCaseManifest.availableOrgans.length} overlay stacks ·{" "}
            {selectedOrgans.length} active
          </div>
        </div>
      </div>

      <div className="focus-preset-row">
        {(Object.keys(FOCUS_PRESETS) as FocusPresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={
              focusPreset === id ? "focus-preset-btn active" : "focus-preset-btn"
            }
            onClick={() => applyFocusPreset(id)}
          >
            {FOCUS_PRESETS[id].label}
          </button>
        ))}
      </div>

      <input
        type="search"
        className="layer-search"
        placeholder="Filter organs…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Filter organ layers"
      />

      <div className="layer-groups-scroll">
        {(Object.keys(ORGAN_GROUP_LABELS) as OrganGroupKey[]).map(renderGroup)}
      </div>
    </div>
  );
}
