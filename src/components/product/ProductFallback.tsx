type Props = {
  error?: Error | null;
};

const WORKFLOW = [
  { title: "CT upload sandbox", desc: "De-identified .nii / .npz upload" },
  { title: "JHU/ePAI API status", desc: "Research-use inference pipeline" },
  { title: "AI findings", desc: "Anatomy-aware research-use outputs" },
  { title: "Review queue", desc: "Human expert review routing" },
  { title: "Validation export", desc: "Retrospective validation package" },
];

export function ProductFallback({ error }: Props) {
  const isDev = import.meta.env.DEV;

  return (
    <main className="product-page-shell product-fallback-shell">
      <header className="product-fallback-header">
        <span className="badge badge-demo">Console fallback mode</span>
        <p className="meta-label">Infrastructure console</p>
        <h1>Upload, analyze, review, and export from one console.</h1>
        <p className="product-fallback-lead">
          ScanPilot turns a de-identified CT into a research-use AI workflow: JHU/ePAI
          analysis, anatomy-aware findings, human review, and validation packaging.
        </p>
        {error && (
          <p className="product-fallback-error">
            Product console failed to load. Fallback shell is active.
            {isDev && (
              <span className="product-fallback-error-detail"> {error.message}</span>
            )}
          </p>
        )}
      </header>

      <div className="product-fallback-grid">
        {WORKFLOW.map((card) => (
          <article key={card.title} className="product-fallback-card">
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>

      <div className="product-fallback-actions">
        <button
          type="button"
          className="btn primary primary-button"
          onClick={() => window.location.reload()}
        >
          Reload console
        </button>
        <a className="btn secondary-button" href="../index.html">
          Back to homepage
        </a>
        <a className="btn secondary-button" href="../demo/#viewer">
          Sample CT Viewer
        </a>
      </div>

      <p className="product-fallback-disclaimer">
        Research-use only. Not for diagnosis. Human review required.
      </p>
    </main>
  );
}
