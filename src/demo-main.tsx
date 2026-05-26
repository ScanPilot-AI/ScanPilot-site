import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SampleViewer } from "./components/product/SampleViewer";
import "./styles/sample-viewer.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SampleViewer />
    </StrictMode>
  );
}
