import { useState } from "react";
import { SampleViewerProvider, useSampleViewer } from "../../context/SampleViewerContext";
import { SampleViewerHudLeft, SampleViewerHudRight } from "./SampleViewerHud";
import { SampleViewerLayers } from "./SampleViewerLayers";
import { SampleViewerTimeline } from "./SampleViewerTimeline";
import { SampleViewerViewport } from "./SampleViewerViewport";

type HudTab = "overview" | "anatomy" | "monitoring";

function SampleViewerShell() {
  const [tab, setTab] = useState<HudTab>("overview");
  const { layersOpen, setLayersOpen } = useSampleViewer();

  const layersExpanded = tab === "anatomy" || layersOpen;

  return (
    <div className="sv-scene">
      <div className="sv-scene-grid" aria-hidden="true" />
      <div className="sv-scene-vignette" aria-hidden="true" />

      <header className="sv-topbar">
        <div className="sv-brand">
          <span className="sv-brand-mark" aria-hidden="true" />
          <div>
            <div className="sv-brand-title">ScanPilot</div>
            <div className="sv-brand-sub">Powered by ePAI</div>
            <div className="sv-brand-caption">PanTS Atlas Sample Viewer</div>
          </div>
        </div>

        <nav className="sv-pill-nav" aria-label="Viewer mode">
          {(
            [
              ["overview", "Overview"],
              ["anatomy", "Anatomy"],
              ["monitoring", "Monitoring"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`sv-pill${tab === id ? " is-active" : ""}`}
              onClick={() => {
                setTab(id);
                if (id === "anatomy") setLayersOpen(true);
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sv-topbar-actions">
          <span className="sv-top-chip">Research-use</span>
          <span className="sv-top-chip">Static demo</span>
          <a className="sv-top-cta" href="../product/">
            Open console
          </a>
        </div>
      </header>

      <div className={`sv-stage${tab === "monitoring" ? " sv-stage--monitor" : ""}`}>
        <div
          className={`sv-hud-wrap sv-hud-wrap--left${
            tab === "monitoring" ? " is-dim" : ""
          }`}
        >
          <SampleViewerHudLeft />
        </div>

        <div className="sv-center">
          <SampleViewerViewport />
          {tab === "anatomy" && (
            <div className="sv-layers-float">
              <div className="sv-layers-float-head">
                <span className="mono-label">Layer controls</span>
                <button
                  type="button"
                  className="sv-hud-btn"
                  onClick={() => setLayersOpen(!layersOpen)}
                >
                  {layersOpen ? "Collapse" : "Expand"}
                </button>
              </div>
              <SampleViewerLayers expanded={layersExpanded} />
            </div>
          )}
        </div>

        <div
          className={`sv-hud-wrap sv-hud-wrap--right${
            tab === "anatomy" ? " is-dim" : ""
          }${tab === "monitoring" ? " is-emphasis" : ""}`}
        >
          <SampleViewerHudRight />
        </div>
      </div>

      <SampleViewerTimeline />

      <footer className="sv-footer-compliance">
        Research-use static demo · Not for diagnosis · Not FDA cleared · Layer-derived evidence
        only
      </footer>
    </div>
  );
}

export function SampleViewer() {
  return (
    <SampleViewerProvider>
      <SampleViewerShell />
    </SampleViewerProvider>
  );
}
