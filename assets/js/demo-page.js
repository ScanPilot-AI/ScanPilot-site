(function () {
  const ASSET_BASE = "../assets/";
  const DATA_URL = ASSET_BASE + "data/demoCases.json";

  const ctImage = document.getElementById("ctImage");
  const olPancreas = document.getElementById("olPancreas");
  const olDuct = document.getElementById("olDuct");
  const olLesion = document.getElementById("olLesion");
  const olNearby = document.getElementById("olNearby");
  const layerMap = {
    pancreas: olPancreas,
    duct: olDuct,
    lesion: olLesion,
    nearby: olNearby,
  };

  const caseSelect = document.getElementById("caseSelect");
  const sliceSlider = document.getElementById("sliceSlider");
  const sliceLabel = document.getElementById("sliceLabel");
  const viewerStage = document.getElementById("viewerStage");
  const crossV = document.getElementById("crossV");
  const crossH = document.getElementById("crossH");

  const fCaseId = document.getElementById("fCaseId");
  const fAnatomy = document.getElementById("fAnatomy");
  const fSuspicious = document.getElementById("fSuspicious");
  const fQueue = document.getElementById("fQueue");
  const fScore = document.getElementById("fScore");
  const fScoreBand = document.getElementById("fScoreBand");
  const fFindings = document.getElementById("fFindings");
  const fWorkflow = document.getElementById("fWorkflow");
  const fSummary = document.getElementById("fSummary");
  const demoCaseSource = document.getElementById("demoCaseSource");

  /** @type {{ cases: any[], disclaimer?: string } | null} */
  let bundle = null;
  let caseIndex = 0;
  let sliceIndex = 0;

  function assetUrl(rel) {
    return ASSET_BASE + rel.replace(/^\/+/, "");
  }

  function setLayerVisible(key, on) {
    const el = layerMap[key];
    if (!el) return;
    el.classList.toggle("on", on);
  }

  function readToggles() {
    const out = {};
    document.querySelectorAll("#overlayToggles input[type=checkbox]").forEach((inp) => {
      const key = inp.getAttribute("data-layer");
      if (key) out[key] = inp.checked;
    });
    return out;
  }

  function applySlice() {
    const c = bundle && bundle.cases[caseIndex];
    if (!c || !c.ctSlices || !c.ctSlices.length) return;

    const max = c.ctSlices.length - 1;
    sliceIndex = Math.max(0, Math.min(sliceIndex, max));
    sliceSlider.value = String(sliceIndex);
    sliceSlider.max = String(max);
    sliceLabel.textContent = `${sliceIndex + 1} / ${max + 1}`;

    const i = sliceIndex;
    ctImage.src = assetUrl(c.ctSlices[i]);
    ctImage.alt = `Axial CT slice ${sliceIndex + 1} for ${c.caseId}`;

    const ov = c.overlays || {};
    ["pancreas", "duct", "lesion", "nearby"].forEach((k) => {
      const arr = ov[k];
      const el = layerMap[k];
      if (arr && arr[i]) {
        el.src = assetUrl(arr[i]);
        el.classList.add("on");
      } else {
        el.removeAttribute("src");
        el.classList.remove("on");
      }
    });

    const toggles = readToggles();
    Object.keys(layerMap).forEach((k) => {
      const el = layerMap[k];
      const hasSrc = !!el.getAttribute("src");
      el.classList.toggle("on", hasSrc && toggles[k]);
    });
  }

  function applyCaseMeta() {
    const c = bundle && bundle.cases[caseIndex];
    if (!c) return;

    fCaseId.textContent = c.caseId;
    fAnatomy.textContent = c.anatomyStatus || "—";
    fSuspicious.textContent = c.suspiciousRegionStatus || "—";
    fQueue.textContent = c.reviewQueueStatus || "—";

    const sc = typeof c.pdacSuspicionScore === "number" ? c.pdacSuspicionScore : null;
    fScore.innerHTML =
      sc != null
        ? `${sc.toFixed(2)}<span class="unit">· demo</span>`
        : `—<span class="unit">· demo</span>`;
    if (fScoreBand) {
      fScoreBand.textContent = c.pdacSuspicionLabel
        ? `Illustrative band: ${c.pdacSuspicionLabel} suspicion`
        : "";
    }

    fFindings.innerHTML = "";
    (c.findings || []).forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      fFindings.appendChild(li);
    });

    fWorkflow.innerHTML = "";
    (c.recommendedWorkflow || []).forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      fWorkflow.appendChild(li);
    });

    fSummary.textContent =
      (c.findingSummary ? c.findingSummary + " " : "") +
      (bundle.disclaimer ||
        "Demo only. Not diagnostic. Uses public/de-identified sample data.");

    demoCaseSource.textContent = "iPanTSMini sample volume";
  }

  function initCaseSelector() {
    caseSelect.innerHTML = "";
    if (!bundle) return;
    bundle.cases.forEach((c, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = c.caseId;
      caseSelect.appendChild(opt);
    });
    caseSelect.value = String(caseIndex);
  }

  function bind() {
    caseSelect.addEventListener("change", () => {
      caseIndex = parseInt(caseSelect.value, 10) || 0;
      sliceIndex = 0;
      applyCaseMeta();
      applySlice();
    });

    sliceSlider.addEventListener("input", () => {
      sliceIndex = parseInt(sliceSlider.value, 10) || 0;
      applySlice();
    });

    document.querySelectorAll("#overlayToggles input").forEach((inp) => {
      inp.addEventListener("change", applySlice);
    });

    viewerStage.addEventListener("mousemove", (e) => {
      const r = viewerStage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      crossV.style.left = `${x}%`;
      crossH.style.top = `${y}%`;
    });
    viewerStage.addEventListener("mouseleave", () => {
      crossV.style.opacity = "0";
      crossH.style.opacity = "0";
    });
    viewerStage.addEventListener("mouseenter", () => {
      crossV.style.opacity = "";
      crossH.style.opacity = "";
    });
  }

  function revealOnScroll() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load demo metadata (${res.status})`);
      bundle = await res.json();
      if (!bundle.cases || !bundle.cases.length) throw new Error("No demo cases in JSON");

      initCaseSelector();
      applyCaseMeta();
      applySlice();
      bind();
      revealOnScroll();
    } catch (e) {
      console.error(e);
      demoCaseSource.textContent = "Load error";
      fSummary.textContent =
        "Could not load demo assets. Run the demo export script from the repository root, then serve the site over HTTP (not file://).";
    }
  }

  load();
})();
