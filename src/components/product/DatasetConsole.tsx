import { useMemo, useState } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  filterCatalogCases,
  getAvailabilityBadge,
  getTumorBadge,
  toPublicAssetPath,
  type PanTSCatalogCase,
} from "../../data/pants-atlas";
import { CANONICAL_ORGAN_LABEL_COUNT } from "../../data/pants-organ-layers";
import {
  AgeDistributionChart,
  SexDistributionChart,
  StudyYearTimeline,
  TopCategoryChart,
  TumorRateByAgeChart,
  TumorStatusChart,
} from "./CohortCharts";
import { CatalogMetadataDrawer } from "./CatalogMetadataDrawer";

const PAGE_SIZE = 40;

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}

function formatAvail(c: PanTSCatalogCase): string {
  if (c.hasLocalVolume && c.hasLocalLabels) return "Local atlas";
  if (c.hasLocalVolume) return "Local volume";
  return "Metadata only";
}

export function DatasetConsole() {
  const {
    catalog,
    summary,
    localAtlas,
    atlasLoading,
    selectCatalogCase,
    openAtlasCase,
    selectedConsoleCaseId,
    getCatalogCase,
  } = useDemoWorkspace();

  const [query, setQuery] = useState("");
  const [tumor, setTumor] = useState<"any" | "tumor" | "no_tumor">("any");
  const [sex, setSex] = useState<"any" | "M" | "F">("any");
  const [availability, setAvailability] = useState<"all" | "local" | "metadata">("all");
  const [ctPhase, setCtPhase] = useState("any");
  const [nationality, setNationality] = useState("any");
  const [manufacturer, setManufacturer] = useState("any");
  const [page, setPage] = useState(0);

  const localThumbMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of localAtlas?.cases ?? []) {
      if (c.thumbnail) m.set(c.caseId, toPublicAssetPath(c.thumbnail));
    }
    return m;
  }, [localAtlas]);

  const filterOptions = useMemo(() => {
    const cases = catalog?.cases ?? [];
    return {
      ctPhases: uniqueSorted(cases.map((c) => c.ctPhase)),
      nationalities: uniqueSorted(cases.map((c) => c.siteNationality)).slice(0, 24),
      manufacturers: uniqueSorted(cases.map((c) => c.manufacturer)).slice(0, 20),
    };
  }, [catalog]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    return filterCatalogCases(catalog.cases, {
      query,
      tumor,
      sex,
      availability,
      ctPhase: ctPhase === "any" ? undefined : ctPhase,
      siteNationality: nationality === "any" ? undefined : nationality,
      manufacturer: manufacturer === "any" ? undefined : manufacturer,
    });
  }, [catalog, query, tumor, sex, availability, ctPhase, nationality, manufacturer]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageCases = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const inspector = selectedConsoleCaseId
    ? getCatalogCase(selectedConsoleCaseId)
    : null;

  const exportedLayers =
    summary?.exportedOrganLayerCount ?? summary?.uniqueOrganLayers?.length ?? 0;
  const yearRange = summary?.studyYearRange;

  function resetPage() {
    setPage(0);
  }

  return (
    <div className="dataset-console-hud">
      <CatalogMetadataDrawer />

      <header className="ds-console-header">
        <div>
          <h2 className="ds-console-title">PanTS Atlas Dataset Console</h2>
          <p className="ds-console-sub">
            9,901 metadata catalog cases with 5 bundled local full-volume segmentation
            exemplars. Metadata-only cases do not include browser-viewable CT volumes
            in this research-use static demo.
          </p>
        </div>
        <div className="ds-status-chips">
          <span className="ds-chip">De-identified</span>
          <span className="ds-chip">Research-use only</span>
          <span className="ds-chip">Static demo</span>
          <span className="ds-chip ds-chip-warn">Not for diagnosis</span>
          <span className="ds-chip ds-chip-warn">Not FDA cleared</span>
        </div>
      </header>

      <div className="ds-metrics-row">
        <div className="ds-metric">
          <b>{summary?.totalCatalogCases.toLocaleString() ?? "—"}</b>
          <span>Metadata catalog cases</span>
        </div>
        <div className="ds-metric ds-metric-tumor">
          <b>
            {summary?.tumorPositiveCases?.toLocaleString() ??
              summary?.tumorCases?.toLocaleString() ??
              "—"}
          </b>
          <span>
            Tumor-positive
            {summary?.tumorPositiveRate != null && ` (${summary.tumorPositiveRate}%)`}
          </span>
        </div>
        <div className="ds-metric ds-metric-local">
          <b>{summary?.localFullSegmentationCases ?? summary?.localVolumeCases ?? "—"}</b>
          <span>Local bundled CT volumes</span>
        </div>
        <div className="ds-metric">
          <b>{summary?.metadataOnlyCases?.toLocaleString() ?? "—"}</b>
          <span>Metadata-only cases</span>
        </div>
        <div className="ds-metric">
          <b>
            {exportedLayers}
            <span className="ds-metric-sub"> / {CANONICAL_ORGAN_LABEL_COUNT} possible</span>
          </b>
          <span>Exported local overlay layers</span>
        </div>
        <div className="ds-metric">
          <b>
            {yearRange?.min != null && yearRange?.max != null
              ? `${yearRange.min}–${yearRange.max}`
              : "—"}
          </b>
          <span>Study years (catalog)</span>
        </div>
      </div>

      <div className="ds-console-grid">
        <section className="ds-panel ds-panel-db">
          <div className="meta-label">Searchable case database</div>
          <div className="catalog-filters">
            <input
              type="search"
              className="catalog-search"
              placeholder="Case ID or keyword…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
            />
            <select
              className="catalog-select"
              value={tumor}
              onChange={(e) => {
                setTumor(e.target.value as typeof tumor);
                resetPage();
              }}
            >
              <option value="any">Any tumor</option>
              <option value="tumor">Tumor</option>
              <option value="no_tumor">No tumor</option>
            </select>
            <select
              className="catalog-select"
              value={sex}
              onChange={(e) => {
                setSex(e.target.value as typeof sex);
                resetPage();
              }}
            >
              <option value="any">Any sex</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
            <select
              className="catalog-select"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value as typeof availability);
                resetPage();
              }}
            >
              <option value="all">All catalog cases</option>
              <option value="local">Local volume only</option>
              <option value="metadata">Metadata only</option>
            </select>
            <select
              className="catalog-select"
              value={ctPhase}
              onChange={(e) => {
                setCtPhase(e.target.value);
                resetPage();
              }}
            >
              <option value="any">Any CT phase</option>
              {filterOptions.ctPhases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="catalog-select"
              value={nationality}
              onChange={(e) => {
                setNationality(e.target.value);
                resetPage();
              }}
            >
              <option value="any">Any nationality</option>
              {filterOptions.nationalities.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              className="catalog-select"
              value={manufacturer}
              onChange={(e) => {
                setManufacturer(e.target.value);
                resetPage();
              }}
            >
              <option value="any">Any manufacturer</option>
              {filterOptions.manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="catalog-results-bar">
            <span className="muted" style={{ fontSize: 11 }}>
              {atlasLoading
                ? "Loading catalog…"
                : `${filtered.length.toLocaleString()} matches`}
            </span>
            <div className="catalog-pager">
              <button
                type="button"
                className="btn ghost"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span style={{ fontSize: 11 }}>
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="btn ghost"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>

          <div className="ds-case-list">
            {pageCases.map((c) => {
              const thumb = localThumbMap.get(c.caseId);
              const selected = c.caseId === selectedConsoleCaseId;
              return (
                <button
                  key={c.caseId}
                  type="button"
                  className={`ds-case-row${selected ? " selected" : ""}${
                    c.hasLocalVolume ? " is-local" : ""
                  }`}
                  onClick={() => selectCatalogCase(c.caseId)}
                >
                  {thumb ? (
                    <img className="ds-case-thumb" src={thumb} alt="" />
                  ) : (
                    <div className="ds-case-thumb ds-case-thumb-meta">
                      <span>{c.caseId.replace("PanTS_", "")}</span>
                    </div>
                  )}
                  <div className="ds-case-row-body">
                    <div className="ds-case-row-id">{c.caseId}</div>
                    <div className="ds-case-row-meta">
                      {c.sex ?? "—"} · {c.age != null ? Math.round(c.age) : "—"} ·{" "}
                      {getTumorBadge(c)}
                    </div>
                    <div className="ds-case-row-sub">
                      {c.ctPhase ?? "—"} · {c.siteNationality ?? "—"}
                    </div>
                    <span
                      className={`catalog-badge avail-${
                        c.hasLocalVolume ? "local" : "meta"
                      }`}
                    >
                      {formatAvail(c)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ds-panel ds-panel-analytics">
          <div className="meta-label">Cohort analytics</div>
          <p className="muted ds-analytics-note">
            Distributions from metadata.xlsx via pantsAtlasSummary.json — computed, not
            simulated.
          </p>
          <div className="ds-analytics-grid">
            <AgeDistributionChart data={summary?.ageBucketCounts} />
            <TumorStatusChart
              tumorPositive={summary?.tumorPositiveCases ?? summary?.tumorCases}
              tumorNegative={summary?.tumorNegativeCases ?? summary?.noTumorCases}
              tumorUnknown={summary?.tumorUnknownCases}
            />
            <SexDistributionChart data={summary?.sexCounts} />
            <TopCategoryChart title="CT phase" data={summary?.ctPhaseCounts} topN={6} />
            <TopCategoryChart
              title="Site nationality (top 8)"
              data={summary?.siteNationalityCounts}
              topN={8}
            />
            <TopCategoryChart
              title="Manufacturer (top 6)"
              data={summary?.manufacturerCounts}
              topN={6}
            />
            <StudyYearTimeline
              yearCounts={summary?.studyYearCounts}
              yearRange={summary?.studyYearRange}
            />
            <TumorRateByAgeChart rates={summary?.tumorRateByAgeBucket} />
          </div>
        </section>

        <aside className="ds-panel ds-panel-inspector">
          <div className="meta-label">Selected case inspector</div>
          {!inspector ? (
            <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              Select a catalog case to inspect metadata and availability.
            </p>
          ) : (
            <>
              <h3 className="ds-inspector-id">{inspector.caseId}</h3>
              <dl className="ds-inspector-dl">
                {[
                  ["Case ID", inspector.caseId],
                  ["Sex", inspector.sex],
                  ["Age", inspector.age != null ? Math.round(inspector.age) : null],
                  ["Tumor status", getTumorBadge(inspector)],
                  ["Availability", getAvailabilityBadge(inspector)],
                  ["Shape", inspector.shape],
                  ["Spacing", inspector.spacing],
                  ["CT phase", inspector.ctPhase],
                  ["Manufacturer", inspector.manufacturer],
                  ["Manufacturer model", inspector.manufacturerModel],
                  ["Study type", inspector.studyType],
                  ["Site", inspector.site],
                  ["Site detail", inspector.siteDetail],
                  ["Site nationality", inspector.siteNationality],
                  ["Study year", inspector.studyYear],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <dt>{label}</dt>
                    <dd>{val != null ? String(val) : "—"}</dd>
                  </div>
                ))}
              </dl>

              {inspector.hasLocalVolume && inspector.hasLocalLabels ? (
                <>
                  <p className="ds-inspector-note ds-inspector-note-local">
                    Bundled CT PNG frames and segmentation overlays available.
                  </p>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => openAtlasCase(inspector.caseId)}
                  >
                    Open Atlas Viewer
                  </button>
                </>
              ) : (
                <>
                  <p className="ds-inspector-note">
                    This case is indexed in the PanTS metadata catalog. The CT volume
                    is not bundled in this static ScanPilot demo.
                  </p>
                  <button type="button" className="btn" disabled>
                    Atlas unavailable
                  </button>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
