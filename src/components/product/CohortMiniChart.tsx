type Bar = { label: string; value: number };

type Props = {
  title: string;
  data: Record<string, number> | undefined;
  maxBars?: number;
  emptyLabel?: string;
};

export function CohortMiniChart({
  title,
  data,
  maxBars = 8,
  emptyLabel = "Not available in current metadata export",
}: Props) {
  const bars: Bar[] = data
    ? Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxBars)
        .map(([label, value]) => ({ label, value }))
    : [];

  const max = bars.length ? Math.max(...bars.map((b) => b.value)) : 1;

  return (
    <div className="cohort-chart">
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
