import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";

export function ReviewQueue() {
  const { reviewQueue, setActiveSection } = useDemoWorkspace();

  return (
    <div className="stack">
      <div className="panel card-elevated">
        <div className="section-head-row">
          <div>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              Radiologist review queue
            </h2>
            <p className="muted section-lead-tight">
              Model outputs route into human review — not autonomous interpretation.
            </p>
          </div>
          <span className="badge pill-research">Human review</span>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Source</th>
                <th>Model status</th>
                <th>Priority</th>
                <th>Reviewer</th>
                <th>Package</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No cases queued. Add from CT Analysis Sandbox after a run completes.
                  </td>
                </tr>
              ) : (
                reviewQueue.map((row) => (
                  <tr key={row.caseId}>
                    <td>
                      <code>{row.caseId}</code>
                    </td>
                    <td>{row.source}</td>
                    <td>{row.modelStatus}</td>
                    <td>
                      <span className={`priority-${row.reviewPriority}`}>
                        {row.reviewPriority}
                      </span>
                    </td>
                    <td>{row.assignedReviewer}</td>
                    <td>{row.outputPackage}</td>
                    <td>
                      <span className={`queue-state queue-state--${row.stateKey}`}>
                        {row.state}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Research-use only. Not for diagnosis.{" "}
          <button
            type="button"
            className="btn-link"
            onClick={() => setActiveSection("sandbox")}
          >
            Run another case
          </button>
        </p>
      </div>
    </div>
  );
}
