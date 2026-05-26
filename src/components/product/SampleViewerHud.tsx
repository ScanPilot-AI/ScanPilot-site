import { useMemo } from "react";
import { useSampleViewer } from "../../context/SampleViewerContext";
import { toPublicAssetPath } from "../../data/pants-atlas";
import {
  FOCUS_PRESET_DEFS,
  ORGAN_GROUP_LABELS,
  getGroupForLayer,
  groupLayersByCategory,
  type OrganGroupId,
} from "../../data/pants-organ-layers";

const HUD_GROUPS: OrganGroupId[] = [
  "pancreas",
  "duct_lesion",
  "vascular",
  "adjacent_gi",
  "renal_adrenal",
];

function tumorLabel(tumor: boolean | null | undefined) {
  if (tumor === true) return "Tumor";
  if (tumor === false) return "No tumor";
  return "Unknown";
}

export function SampleViewerHudLeft() {
  const { localAtlas, summary, selectedCaseId, selectCase, manifest } = useSampleViewer();

  const cases = localAtlas?.cases ?? [];
  const sliceCount = manifest?.sliceCount ?? 17;

  return (
    <aside className="sv-hud sv-hud-left">
      <section className="sv-hud-card">
        <div className="sv-hud-card-head">
          <span className="mono-label">Case library</span>
          <span className="sv-live-dot" aria-hidden="true" />
          <span className="sv-live-label">Local</span>
        </div>
        <p className="sv-hud-hint">5 bundled local CT volumes · metadata-only cases excluded</p>
        <ul className="sv-case-list">
          {cases.map((c) => {
            const thumb = c.thumbnail ? toPublicAssetPath(c.thumbnail) : null;
            const meta = c.metadata;
            const selected = c.caseId === selectedCaseId;
            return (
              <li key={c.caseId}>
                <button
                  type="button"
                  className={`sv-case-row${selected ? " is-selected" : ""}`}
                  onClick={() => selectCase(c.caseId)}
                >
                  <div className="sv-case-thumb">
                    {thumb ? <img src={thumb} alt="" /> : <span>CT</span>}
                  </div>
                  <div className="sv-case-body">
                    <strong>{c.caseId}</strong>
                    <span>
                      {c.localFrameCount} exported slices · {c.availableOrgans.length} layers
                    </span>
                    <span>
                      {tumorLabel(meta?.tumor)} ·{" "}
                      <em className="sv-badge-local">Local atlas</em>
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sv-hud-card">
        <div className="mono-label">Atlas status</div>
        <div className="sv-metric-chips">
          <div className="sv-metric-chip">
            <b>{summary?.localVolumeCases ?? 5}</b>
            <span>Local volumes</span>
          </div>
          <div className="sv-metric-chip">
            <b>{sliceCount}</b>
            <span>Exported slices</span>
          </div>
          <div className="sv-metric-chip">
            <b>{summary?.exportedOrganLayerCount ?? summary?.uniqueOrganLayers?.length ?? 26}</b>
            <span>Overlay layers</span>
          </div>
          <div className="sv-metric-chip">
            <b>{(summary?.totalCatalogCases ?? 9901).toLocaleString()}</b>
            <span>Catalog context</span>
          </div>
        </div>
        <p className="sv-hud-footnote">
          9,901 metadata catalog cases are searchable in the{" "}
          <a href="../product/">Atlas database console</a>.
        </p>
      </section>

      <section className="sv-hud-card">
        <div className="mono-label">Recent signals</div>
        <ul className="sv-signal-list">
          <li>
            <span className="sv-signal-dot" /> Pancreas mask active
          </li>
          <li>
            <span className="sv-signal-dot" /> Multi-organ context available
          </li>
          <li>
            <span className="sv-signal-dot" /> Metadata catalog linked
          </li>
          <li>
            <span className="sv-signal-dot" /> Static demo assets loaded
          </li>
        </ul>
      </section>
    </aside>
  );
}

export function SampleViewerHudRight() {
  const {
    manifest,
    selectedOrgans,
    focusPreset,
    globalOverlayOpacity,
    catalogMeta,
  } = useSampleViewer();

  const composition = useMemo(() => {
    if (!manifest) return [];
    const grouped = groupLayersByCategory(manifest.availableOrgans);
    return HUD_GROUPS.map((groupId) => {
      const inGroup = grouped[groupId] ?? [];
      const active = inGroup.filter((id) => selectedOrgans.includes(id)).length;
      const total = inGroup.length;
      return {
        label: ORGAN_GROUP_LABELS[groupId],
        active,
        total,
        pct: total > 0 ? Math.round((active / total) * 100) : 0,
        available: total > 0,
      };
    }).filter((r) => r.available);
  }, [manifest, selectedOrgans]);

  const evidenceBullets = useMemo(() => {
    if (!manifest) return [];
    const bullets: string[] = [];
    if (selectedOrgans.some((o) => getGroupForLayer(o) === "pancreas")) {
      bullets.push("Whole-organ pancreas segmentation active");
    }
    bullets.push(
      `${manifest.availableOrgans.length} organ overlay stacks available · ${manifest.sliceCount} exported axial frames`
    );
    if (
      selectedOrgans.some(
        (o) =>
          getGroupForLayer(o) === "vascular" || getGroupForLayer(o) === "adjacent_gi"
      )
    ) {
      bullets.push("Adjacent anatomy context loaded");
    }
    return bullets.slice(0, 3);
  }, [manifest, selectedOrgans]);

  return (
    <aside className="sv-hud sv-hud-right">
      <section className="sv-hud-card">
        <div className="sv-hud-card-head">
          <span className="mono-label">Anatomy composition</span>
          <span className="sv-live-dot" />
          <span className="sv-live-label">Live</span>
        </div>
        <ul className="sv-composition-bars">
          {composition.map((row) => (
            <li key={row.label}>
              <span className="sv-comp-label">{row.label}</span>
              <span className="sv-comp-track">
                <i style={{ width: `${row.pct}%` }} />
              </span>
              <span className="sv-comp-val">
                {row.active}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sv-hud-card">
        <div className="mono-label">Layer intelligence</div>
        <ul className="sv-kv-mini">
          <li>
            <span>Active layers</span>
            <b>{selectedOrgans.length}</b>
          </li>
          <li>
            <span>Available</span>
            <b>{manifest?.availableOrgans.length ?? "—"}</b>
          </li>
          <li>
            <span>Focus preset</span>
            <b>{FOCUS_PRESET_DEFS[focusPreset].label}</b>
          </li>
          <li>
            <span>Overlay opacity</span>
            <b>{Math.round(globalOverlayOpacity * 100)}%</b>
          </li>
        </ul>
      </section>

      <section className="sv-hud-card">
        <div className="mono-label">Layer-derived evidence</div>
        <p className="sv-evidence-lead">
          Structured evidence from exported segmentation layers. Static demo only. Not a live
          diagnostic inference.
        </p>
        <ul className="sv-evidence-list">
          {evidenceBullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="sv-hud-card sv-hud-card-note">
        <p>
          Bundled local CT volume with precomputed PNG frames and segmentation overlays.
          Research-use static demo — not for diagnosis. Not FDA cleared.
        </p>
        {catalogMeta && (
          <p className="sv-meta-line">
            {catalogMeta.sex ?? "—"} ·{" "}
            {catalogMeta.age != null ? Math.round(catalogMeta.age) : "—"} ·{" "}
            {tumorLabel(catalogMeta.tumor)}
          </p>
        )}
        <a className="sv-hud-btn sv-hud-btn-primary" href="../product/#atlas">
          Open Atlas workspace
        </a>
      </section>
    </aside>
  );
}
