import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import { toPublicAssetPath } from "../../data/pants-atlas";

export function ReviewQueue() {
  const {
    globalManifest,
    atlasReady,
    atlasLoading,
    selectedCaseId,
    setSelectedCaseId,
  } = useDemoWorkspace();

  if (atlasLoading) {
    return (
      <div className="atlas-panel">
        <p className="muted">Loading PanTS Atlas case database…</p>
      </div>
    );
  }

  if (!atlasReady || !globalManifest) {
    return (
      <div className="atlas-panel">
        <p className="muted">PanTS Atlas manifest unavailable. Using legacy demo cases.</p>
      </div>
    );
  }

  return (
    <div className="case-database">
      <div className="case-database-head">
        <div className="meta-label">Case database</div>
        <div className="case-database-count">{globalManifest.caseCount} cases</div>
      </div>
      <div className="case-card-list">
        {globalManifest.cases.map((c) => {
          const thumb = c.thumbnailFrame
            ? toPublicAssetPath(c.thumbnailFrame)
            : null;
          const selected = c.caseId === selectedCaseId;
          return (
            <button
              key={c.caseId}
              type="button"
              className={`case-card${selected ? " selected" : ""}`}
              onClick={() => setSelectedCaseId(c.caseId)}
            >
              <div className="case-card-thumb">
                {thumb ? (
                  <img src={thumb} alt="" />
                ) : (
                  <div className="case-card-thumb-fallback" />
                )}
              </div>
              <div className="case-card-body">
                <div className="case-card-id">{c.caseId.replace("PanTS_", "")}</div>
                <div className="case-card-meta">
                  <span>{c.sliceCount} slices</span>
                  <span>{c.organCount} layers</span>
                </div>
                <div className="case-card-flags">
                  <span
                    className={
                      c.hasPancreaticLesion ? "flag on" : "flag off"
                    }
                  >
                    Lesion {c.hasPancreaticLesion ? "yes" : "—"}
                  </span>
                  <span
                    className={c.hasPancreaticDuct ? "flag on" : "flag off"}
                  >
                    Duct {c.hasPancreaticDuct ? "yes" : "—"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
