import { useEffect, useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  ORGAN_GROUP_LABELS,
  loadPanTSAtlasDatabase,
  toPublicAssetPath,
  type OrganGroupKey,
  type PanTSAtlasDatabase,
} from "../../data/pants-atlas";

export function DatasetConsole() {
  const { globalManifest, setSelectedCaseId, setActiveSection } = useDemoWorkspace();
  const [database, setDatabase] = useState<PanTSAtlasDatabase | null>(null);

  useEffect(() => {
    void loadPanTSAtlasDatabase().then(setDatabase);
  }, []);

  const groupStats = useMemo(() => {
    if (!database) return null;
    const keys = Object.keys(ORGAN_GROUP_LABELS) as OrganGroupKey[];
    return keys.map((key) => ({
      key,
      label: ORGAN_GROUP_LABELS[key],
      caseCount: database.groupCoverage[key]?.caseCount ?? 0,
    }));
  }, [database]);

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <h2 className="section-title">PanTS Atlas Database</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Database-driven abdominal CT workspace built from PanTS-derived volumes.
          Precomputed PNG stacks power the browser viewer — no raw NIfTI/NPZ in
          the client.
        </p>

        <div className="metric-grid" style={{ marginTop: 16 }}>
          <div className="metric-card">
            <b>{globalManifest?.caseCount ?? database?.caseCount ?? "—"}</b>
            <span>Cases indexed</span>
          </div>
          <div className="metric-card">
            <b>{globalManifest?.totalExportedCtFrames ?? "—"}</b>
            <span>Exported CT frames</span>
          </div>
          <div className="metric-card">
            <b>{globalManifest?.totalOrganOverlayStacks ?? "—"}</b>
            <span>Organ overlay stacks</span>
          </div>
          <div className="metric-card">
            <b>{globalManifest?.uniqueOrganLayers.length ?? "—"}</b>
            <span>Unique organ layers</span>
          </div>
        </div>

        {groupStats && (
          <>
            <hr className="divider" />
            <div className="meta-label">Organ group coverage</div>
            <div className="coverage-grid" style={{ marginTop: 10 }}>
              {groupStats.map((g) => (
                <div key={g.key} className="coverage-card">
                  <div className="coverage-label">{g.label}</div>
                  <div className="coverage-value">{g.caseCount} cases</div>
                </div>
              ))}
            </div>
          </>
        )}

        <hr className="divider" />
        <div className="meta-label">Atlas cases</div>
        <p className="muted" style={{ fontSize: 12 }}>
          Select a case to load it in the ScanPilot Atlas workspace.
        </p>
        <div className="thumbnail-grid">
          {(globalManifest?.cases ?? []).map((c) => {
            const thumb = c.thumbnailFrame
              ? toPublicAssetPath(c.thumbnailFrame)
              : "";
            return (
              <button
                key={c.caseId}
                type="button"
                className="case-tile"
                onClick={() => {
                  setSelectedCaseId(c.caseId);
                  setActiveSection("atlas");
                }}
              >
                <div className="case-tile-image-wrap">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="case-tile-image"
                      width={80}
                      height={64}
                    />
                  ) : (
                    <div
                      className="case-tile-image"
                      style={{
                        background:
                          "linear-gradient(135deg,#1e293b,#0f172a)",
                      }}
                    />
                  )}
                </div>
                <span className="case-tile-label">{c.caseId}</span>
                <span className="muted" style={{ fontSize: 10 }}>
                  {c.organCount} layers · {c.sliceCount} slices
                </span>
              </button>
            );
          })}
        </div>

        <div className="disclaimer-bar" style={{ marginTop: 16 }}>
          Static demo using precomputed PanTS-derived assets. Not intended for
          clinical diagnosis or treatment decisions.
        </div>
      </div>
    </div>
  );
}
