import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/product/ErrorBoundary";

const ScanPilotDemo = lazy(() =>
  import("./components/product/ScanPilotDemo").then((m) => ({
    default: m.ScanPilotDemo,
  }))
);

function ConsoleLoader() {
  return (
    <main className="product-page-shell product-boot-shell">
      <p className="meta-label">Infrastructure console</p>
      <h1>Loading console…</h1>
      <p className="muted">Preparing CT analysis sandbox and workflow modules.</p>
    </main>
  );
}

export default function App() {
  return (
    <main className="product-page-shell">
      <ErrorBoundary>
        <Suspense fallback={<ConsoleLoader />}>
          <ScanPilotDemo />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
