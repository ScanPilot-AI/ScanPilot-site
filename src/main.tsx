import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProductFallback } from "./components/product/ProductFallback";
import "./styles/app.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui;background:#05070b;color:#f8fafc">Infrastructure Console failed to mount: #root not found.</div>';
} else {
  document.documentElement.classList.add("sp-product-page");
  document.body.classList.add("sp-product-body");

  void (async () => {
    try {
      const { default: App } = await import("./App");
      createRoot(rootEl).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[ScanPilot boot]", err);
      createRoot(rootEl).render(
        <StrictMode>
          <ProductFallback error={new Error(message)} />
        </StrictMode>
      );
    }
  })();
}
