import { useMemo } from "react";

const AGE_ORDER = ["<20", "20s", "30s", "40s", "50s", "60s", "70s", "80+"];

export function hasChartData(
  data: Record<string, number> | undefined | null
): boolean {
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some((v) => typeof v === "number" && v > 0);
}

function topNWithOther(
  data: Record<string, number>,
  n: number
): { label: string; value: number }[] {
  const sorted = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, n).map(([label, value]) => ({ label, value }));
  const rest = sorted.slice(n);
  if (rest.length > 0) {
    top.push({
      label: "Other",
      value: rest.reduce((s, [, v]) => s + v, 0),
    });
  }
  return top;
}

type BarProps = {
  title: string;
  bars: { label: string; value: number }[];
  variant?: "default" | "tumor" | "rate";
  emptyLabel?: string;
};

function HorizontalBars({
  title,
  bars,
  variant = "default",
  emptyLabel = "Not available in current metadata export",
}: BarProps) {
  const max = bars.length ? Math.max(...bars.map((b) => b.value), 1) : 1;

  return (
    <div className={`cohort-chart cohort-chart--${variant}`}>
      <div className="cohort-chart-title">{title}</div>
      {bars.length === 0 ? (
        <p className="cohort-chart-empty">{emptyLabel}</p>
      ) : (
        <ul className="cohort-chart-bars">
          {bars.map((b) => (
            <li key={b.label}>
              <span className="cohort-chart-label" title={b.label}>
                {b.label}
              </span>
              <span className="cohort-chart-track">
                <i style={{ width: `${(b.value / max) * 100}%` }} />
              </span>
              <span className="cohort-chart-val">{b.value.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AgeDistributionChart({
  data,
}: {
  data: Record<string, number> | undefined;
}) {
  const bars = useMemo(() => {
    if (!hasChartData(data)) return [];
    return AGE_ORDER.map((label) => ({
      label,
      value: data?.[label] ?? 0,
    }));
  }, [data]);

  return <HorizontalBars title="Age distribution" bars={bars} />;
}

export function TumorStatusChart({
  tumorPositive,
  tumorNegative,
  tumorUnknown,
}: {
  tumorPositive?: number;
  tumorNegative?: number;
  tumorUnknown?: number;
}) {
  const bars = [
    { label: "No tumor", value: tumorNegative ?? 0 },
    { label: "Tumor", value: tumorPositive ?? 0 },
    { label: "Unknown", value: tumorUnknown ?? 0 },
  ].filter((b) => b.value > 0);

  return (
    <HorizontalBars title="Tumor status" bars={bars} variant="tumor" />
  );
}

export function SexDistributionChart({
  data,
}: {
  data: Record<string, number> | undefined;
}) {
  const order = ["M", "F", "Unknown"];
  const bars = useMemo(() => {
    if (!hasChartData(data)) return [];
    const merged: Record<string, number> = {};
    for (const [k, v] of Object.entries(data!)) {
      const key = k.trim() === "M" || k.toUpperCase() === "MALE" ? "M" : k.trim() === "F" || k.toUpperCase() === "FEMALE" ? "F" : k.trim() || "Unknown";
      merged[key] = (merged[key] ?? 0) + v;
    }
    return order
      .map((label) => ({ label, value: merged[label] ?? 0 }))
      .filter((b) => b.value > 0);
  }, [data]);

  return <HorizontalBars title="Sex distribution" bars={bars} />;
}

export function TopCategoryChart({
  title,
  data,
  topN = 8,
}: {
  title: string;
  data: Record<string, number> | undefined;
  topN?: number;
}) {
  const bars = useMemo(() => {
    if (!hasChartData(data)) return [];
    return topNWithOther(data!, topN);
  }, [data, topN]);

  return <HorizontalBars title={title} bars={bars} />;
}

export function StudyYearTimeline({
  yearCounts,
  yearRange,
}: {
  yearCounts: Record<string, number> | undefined;
  yearRange?: { min: number | null; max: number | null };
}) {
  const points = useMemo(() => {
    if (!yearCounts || !hasChartData(yearCounts)) return [];
    return Object.entries(yearCounts)
      .map(([y, v]) => ({ year: Number(y), value: v }))
      .filter((p) => !Number.isNaN(p.year))
      .sort((a, b) => a.year - b.year);
  }, [yearCounts]);

  const max = points.length ? Math.max(...points.map((p) => p.value)) : 1;

  return (
    <div className="cohort-chart cohort-chart--timeline">
      <div className="cohort-chart-title">
        Study-year timeline
        {yearRange?.min != null && yearRange?.max != null && (
          <span className="cohort-chart-sub">
            {" "}
            {yearRange.min}–{yearRange.max}
          </span>
        )}
      </div>
      {points.length === 0 ? (
        <p className="cohort-chart-empty">Not available in current metadata export</p>
      ) : (
        <div className="year-timeline">
          <div className="year-timeline-bars">
            {points.map((p) => (
              <div
                key={p.year}
                className="year-timeline-col"
                title={`${p.year}: ${p.value.toLocaleString()} cases`}
              >
                <i style={{ height: `${(p.value / max) * 100}%` }} />
                <span>{String(p.year).slice(-2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TumorRateByAgeChart({
  rates,
}: {
  rates:
    | Record<string, { tumorPositive: number; total: number; rate: number }>
    | undefined;
}) {
  const bars = useMemo(() => {
    if (!rates) return [];
    return AGE_ORDER.map((bucket) => {
      const row = rates[bucket];
      if (!row || row.total === 0) return null;
      return {
        label: bucket,
        value: row.rate,
        meta: `${row.tumorPositive}/${row.total}`,
      };
    }).filter((b): b is { label: string; value: number; meta: string } => b != null);
  }, [rates]);

  const max = bars.length ? Math.max(...bars.map((b) => b.value), 1) : 100;

  return (
    <div className="cohort-chart cohort-chart--rate">
      <div className="cohort-chart-title">Tumor-positive rate by age bucket</div>
      {bars.length === 0 ? (
        <p className="cohort-chart-empty">Not available in current metadata export</p>
      ) : (
        <ul className="cohort-chart-bars">
          {bars.map((b) => (
            <li key={b.label}>
              <span className="cohort-chart-label">{b.label}</span>
              <span className="cohort-chart-track">
                <i style={{ width: `${(b.value / max) * 100}%` }} />
              </span>
              <span className="cohort-chart-val">
                {b.value}% <span className="muted">({b.meta})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
