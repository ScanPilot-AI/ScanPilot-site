import { HashRouter, Routes, Route } from "react-router-dom";
import { ScanPilotDemo } from "./components/product/ScanPilotDemo";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ScanPilotDemo />} />
      </Routes>
    </HashRouter>
  );
}
