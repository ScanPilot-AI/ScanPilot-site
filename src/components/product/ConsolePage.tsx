import type { ReactNode } from "react";

export function ConsolePage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`console-page stack ${className}`.trim()}>{children}</div>;
}

export function ConsolePageHeader({
  kicker,
  title,
  subtitle,
  chips,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="console-panel console-page-header">
      <div className="console-page-header-main">
        {kicker && <div className="section-kicker">{kicker}</div>}
        <h2 className="console-page-title">{title}</h2>
        {subtitle && <p className="console-page-subtitle muted">{subtitle}</p>}
        {chips && <div className="status-chip-row">{chips}</div>}
      </div>
      {actions && <div className="console-page-header-actions">{actions}</div>}
    </header>
  );
}

export function StatusChip({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "teal" | "amber" | "danger" | "demo";
}) {
  return <span className={`status-chip status-chip--${variant}`}>{children}</span>;
}

export function ConsoleMetricRow({
  metrics,
}: {
  metrics: Array<{
    value: string;
    label: string;
    variant?: "default" | "tumor" | "local" | "amber";
  }>;
}) {
  return (
    <div className="console-metric-row">
      {metrics.map((m) => (
        <div key={m.label} className={`metric-card metric-card--${m.variant ?? "default"}`}>
          <b>{m.value}</b>
          <span>{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ConsoleDisclaimer() {
  return (
    <p className="console-disclaimer">
      Research-use static demo. Not for diagnosis. Not FDA cleared. Not a live clinical
      performance claim.
    </p>
  );
}
