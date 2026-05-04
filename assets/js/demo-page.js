(function () {
  "use strict";

  const ASSET_BASE = "../assets/";
  const DATA_URL = ASSET_BASE + "data/demoCases.json";

  const IS_DEV =
    typeof location !== "undefined" &&
    (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /[?&]debug=1\b/.test(location.search));

  function devWarn() {
    if (IS_DEV && typeof console !== "undefined" && console.warn) console.warn.apply(console, arguments);
  }

  /**
   * State keys are decoupled from PNG file prefixes (e.g. duct → duct_XX.png).
   * zIndex: nearby at bottom of overlay stack, lesion on top so thin duct remains visible.
   */
  const OVERLAY_LAYERS = {
    nearby: {
      label: "Nearby anatomy",
      filePrefix: "nearby",
      color: "#a78bfa",
      defaultVisible: true,
      zIndex: 1,
    },
    pancreas: {
      label: "Pancreas",
      filePrefix: "pancreas",
      color: "#34d399",
      defaultVisible: true,
      zIndex: 2,
    },
    duct: {
      label: "Pancreatic duct",
      filePrefix: "duct",
      color: "#6ee7ff",
      defaultVisible: true,
      zIndex: 4,
    },
    lesion: {
      label: "Pancreatic lesion",
      filePrefix: "lesion",
      color: "#fbbf24",
      defaultVisible: true,
      zIndex: 5,
    },
  };

  const LAYER_ORDER = ["pancreas", "duct", "lesion", "nearby"];

  const AGENT_STEPS = [
    "Load CT volume",
    "Parse anatomy",
    "Segment pancreas",
    "Review duct / peri-pancreatic anatomy",
    "Localize candidate lesion",
    "Generate PDAC suspicion score",
    "Queue radiologist second-read",
    "Prepare follow-up recommendation",
  ];

  const WINDOW_PRESETS = ["abdomen", "soft", "pancreas", "high"];

  const ANATOMY_GROUPS = [
    { title: "Pancreas", items: ["pancreas", "pancreas head / body / tail", "pancreatic duct"] },
    { title: "Upper GI & solid organs", items: ["liver", "spleen", "stomach", "duodenum"] },
    { title: "Vessels", items: ["aorta", "celiac axis", "SMA", "portal / mesenteric veins (subset)"] },
  ];

  const ctImage = document.getElementById("ctImage");
  const viewerImageStack = document.getElementById("viewerImageStack");
  const viewerStage = document.getElementById("viewerStage");
  const layerElements = {
    pancreas: document.getElementById("olPancreas"),
    duct: document.getElementById("olDuct"),
    lesion: document.getElementById("olLesion"),
    nearby: document.getElementById("olNearby"),
  };

  const caseSelect = document.getElementById("caseSelect");
  const sliceSlider = document.getElementById("sliceSlider");
  const sliceLabel = document.getElementById("sliceLabel");
  const sliceIndicator = document.getElementById("sliceIndicator");
  const crossV = document.getElementById("crossV");
  const crossH = document.getElementById("crossH");
  const layerPills = document.getElementById("layerPills");
  const overlayOpacityInput = document.getElementById("overlayOpacity");
  const overlayOpacityValue = document.getElementById("overlayOpacityValue");
  const btnSlicePrev = document.getElementById("btnSlicePrev");
  const btnSliceNext = document.getElementById("btnSliceNext");
  const btnCine = document.getElementById("btnCine");
  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const btnZoomReset = document.getElementById("btnZoomReset");
  const btnRunReview = document.getElementById("btnRunReview");
  const caseMetaDl = document.getElementById("caseMetaDl");
  const agentStepper = document.getElementById("agentStepper");
  const fScore = document.getElementById("fScore");
  const fScoreBand = document.getElementById("fScoreBand");
  const fFindings = document.getElementById("fFindings");
  const fWorkflow = document.getElementById("fWorkflow");
  const fSafety = document.getElementById("fSafety");
  const anatomyParsedLead = document.getElementById("anatomyParsedLead");
  const anatomyGroupList = document.getElementById("anatomyGroupList");
  const retroValidationDl = document.getElementById("retroValidationDl");
  const queueCard = document.getElementById("queueCard");
  const apiJson = document.getElementById("apiJson");
  const btn3dToggle = document.getElementById("btn3dToggle");
  const panel3dBody = document.getElementById("panel3dBody");
  const modelHost = document.getElementById("modelHost");

  Object.entries(OVERLAY_LAYERS).forEach(function ([key, cfg]) {
    const el = layerElements[key];
    if (el) el.style.zIndex = String(cfg.zIndex);
  });

  /** @type {{ version?: number, disclaimer?: string, cases: any[] } | null} */
  let bundle = null;
  let caseIndex = 0;
  let sliceIndex = 0;
  /** @type {Record<string, boolean>} */
  let layerVisibility = {};
  let overlayOpacity = 0.65;
  let windowPreset = "abdomen";
  let zoom = 1;
  let cineTimer = null;
  let cinePlaying = false;
  let agentRunTimer = null;
  let agentStepIndex = -1;
  let modelViewerLoaded = false;
  /** True after “Run ScanPilot review” completes for the current case */
  let queueSimulated = false;

  function assetUrl(rel) {
    return ASSET_BASE + String(rel).replace(/^\/+/, "");
  }

  function normalizeCase(raw) {
    const c = Object.assign({}, raw);
    c.id = c.id || c.caseId;
    c.caseId = c.id;
    c.displayName = c.displayName || c.id;
    c.sliceCount = c.sliceCount || (c.ctSlices && c.ctSlices.length) || 9;
    c.defaultSlice =
      typeof c.defaultSlice === "number"
        ? Math.max(0, Math.min(c.defaultSlice, c.sliceCount - 1))
        : 0;
    c.score = typeof c.score === "number" ? c.score : c.pdacSuspicionScore;
    c.scoreBand =
      c.scoreBand ||
      (c.pdacSuspicionLabel ? c.pdacSuspicionLabel + " suspicion" : "");
    c.priority = c.priority || "Moderate";
    c.findings = c.findings || [];
    c.workflowRecommendations = c.workflowRecommendations || c.recommendedWorkflow || [];
    c.anatomyAvailable = c.anatomyAvailable || [];
    c.parsedStructureCount = c.parsedStructureCount ?? 28;
    c.source = c.source || c.dataSource || "De-identified PanTS sample volume";
    c.inputType = c.inputType || "Routine abdominal CT";
    c.candidateRegionStatus = c.candidateRegionStatus || c.suspiciousRegionStatus || "—";
    c.anatomyStatus = c.anatomyStatus || "—";
    c.reviewQueueStatus = c.reviewQueueStatus || "—";
    c.apiResponse =
      c.apiResponse ||
      (c.id
        ? {
            case_id: c.id,
            anatomy_status: "parsed",
            candidate_region: "localized",
            pdac_suspicion_score: c.score,
            recommended_action: "radiologist_second_read",
          }
        : {});
    c.demoDisclaimer =
      c.demoDisclaimer ||
      "Illustrative demo score only — not a calibrated clinical model output.";
    const base = c.basePath || "demo-cases/" + c.id;
    if (!c.ctSlices || !c.ctSlices.length) {
      c.ctSlices = [];
      for (let i = 0; i < c.sliceCount; i++) {
        const p = String(i).padStart(2, "0");
        c.ctSlices.push(base + "/ct/" + p + ".png");
      }
    }
    if (!c.overlays) c.overlays = {};
    LAYER_ORDER.forEach(function (key) {
      const prefix = OVERLAY_LAYERS[key].filePrefix;
      if (!c.overlays[key] || !c.overlays[key].length) {
        c.overlays[key] = [];
        for (let i = 0; i < c.sliceCount; i++) {
          const p = String(i).padStart(2, "0");
          c.overlays[key].push(base + "/overlay/" + prefix + "_" + p + ".png");
        }
      }
    });
    return c;
  }

  function getCase() {
    return bundle && bundle.cases[caseIndex] ? bundle.cases[caseIndex] : null;
  }

  function bindImageError(img, path) {
    img.onerror = function () {
      devWarn("[ScanPilot demo] Missing or failed image:", path);
      img.removeAttribute("src");
      img.classList.remove("is-visible");
    };
    img.onload = function () {
      img.removeAttribute("data-error");
    };
  }

  /**
   * Recompose CT viewer: case, slice, layer toggles, opacity, window preset, zoom.
   */
  function renderViewer() {
    const c = getCase();
    if (!c || !c.ctSlices || !c.ctSlices.length) return;

    const max = c.ctSlices.length - 1;
    sliceIndex = Math.max(0, Math.min(sliceIndex, max));
    sliceSlider.min = "0";
    sliceSlider.max = String(max);
    sliceSlider.value = String(sliceIndex);
    sliceLabel.textContent = sliceIndex + 1 + " / " + (max + 1);
    sliceIndicator.textContent = "Slice " + (sliceIndex + 1) + " / " + (max + 1);
    sliceSlider.setAttribute("aria-valuetext", "Slice " + (sliceIndex + 1) + " of " + (max + 1));

    const i = sliceIndex;
    const ctPath = assetUrl(c.ctSlices[i]);
    ctImage.src = ctPath;
    ctImage.alt = "Axial CT slice " + (sliceIndex + 1) + " for " + c.id;
    bindImageError(ctImage, ctPath);

    const ov = c.overlays || {};
    LAYER_ORDER.forEach(function (key) {
      const el = layerElements[key];
      if (!el) return;
      const arr = ov[key];
      const rel = arr && arr[i];
      const want = !!(rel && layerVisibility[key]);
      if (rel) {
        const url = assetUrl(rel);
        if (el.getAttribute("src") !== url) {
          el.src = url;
          bindImageError(el, url);
        }
        el.classList.toggle("is-visible", want);
        if (!want) {
          /* keep src for next toggle; visibility is opacity-driven */
        }
      } else {
        devWarn("[ScanPilot demo] No overlay path for layer", key, "slice", i, "case", c.id);
        el.removeAttribute("src");
        el.classList.remove("is-visible");
      }
    });

    viewerImageStack.style.setProperty("--overlay-fill-opacity", String(overlayOpacity));
    viewerImageStack.dataset.window = windowPreset;
    viewerImageStack.style.transform = "scale(" + zoom + ")";

    syncLayerPills();
  }

  function syncLayerPills() {
    if (!layerPills) return;
    layerPills.querySelectorAll(".demo-layer-pill").forEach(function (btn) {
      const k = btn.getAttribute("data-layer");
      if (!k) return;
      btn.setAttribute("aria-pressed", layerVisibility[k] ? "true" : "false");
    });
  }

  function setLayerVisible(key, on) {
    if (!OVERLAY_LAYERS[key]) return;
    layerVisibility[key] = !!on;
    renderViewer();
  }

  function buildLayerPills() {
    if (!layerPills) return;
    layerPills.innerHTML = "";
    LAYER_ORDER.forEach(function (key) {
      const cfg = OVERLAY_LAYERS[key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "demo-layer-pill";
      btn.setAttribute("data-layer", key);
      btn.setAttribute("aria-pressed", layerVisibility[key] ? "true" : "false");
      const sw = document.createElement("span");
      sw.className = "demo-layer-swatch";
      sw.style.background = cfg.color;
      btn.appendChild(sw);
      btn.appendChild(document.createTextNode(cfg.label));
      btn.addEventListener("click", function () {
        setLayerVisible(key, !layerVisibility[key]);
      });
      layerPills.appendChild(btn);
    });
  }

  function buildStepperDom() {
    if (!agentStepper) return;
    agentStepper.innerHTML = "";
    AGENT_STEPS.forEach(function (label) {
      const li = document.createElement("li");
      li.textContent = label;
      li.dataset.state = "pending";
      agentStepper.appendChild(li);
    });
  }

  function setStepperIdle() {
    if (!agentStepper) return;
    agentStepper.querySelectorAll("li").forEach(function (li) {
      li.dataset.state = "pending";
    });
    agentStepIndex = -1;
  }

  function stopCine() {
    if (cineTimer) {
      clearInterval(cineTimer);
      cineTimer = null;
    }
    cinePlaying = false;
    if (btnCine) {
      btnCine.setAttribute("aria-pressed", "false");
      btnCine.textContent = "▶";
    }
  }

  function startCine() {
    const c = getCase();
    if (!c || !c.ctSlices || c.ctSlices.length < 2) return;
    stopCine();
    cinePlaying = true;
    if (btnCine) {
      btnCine.setAttribute("aria-pressed", "true");
      btnCine.textContent = "❚❚";
    }
    cineTimer = setInterval(function () {
      const max = c.ctSlices.length - 1;
      sliceIndex = sliceIndex >= max ? 0 : sliceIndex + 1;
      renderViewer();
    }, 750);
  }

  function toggleCine() {
    if (cinePlaying) stopCine();
    else startCine();
  }

  function renderCaseMeta() {
    const c = getCase();
    if (!c || !caseMetaDl) return;
    caseMetaDl.innerHTML = "";
    function row(dt, dd) {
      const ddt = document.createElement("dt");
      ddt.textContent = dt;
      const ddd = document.createElement("dd");
      ddd.textContent = dd;
      caseMetaDl.appendChild(ddt);
      caseMetaDl.appendChild(ddd);
    }
    row("Case ID", c.displayName || c.id);
    row("Input type", c.inputType);
    row("Source", c.source);
    row("Status", c.anatomyStatus);
    row("Series", "Axial");
    row("Slices loaded", String(c.sliceCount || c.ctSlices.length));
    row(
      "Second-read queue",
      queueSimulated ? "Second-read requested (workflow simulation)" : "Idle — run agent to enqueue (demo)"
    );
  }

  function renderFindingsPanel() {
    const c = getCase();
    if (!c) return;

    renderCaseMeta();

    const sc = typeof c.score === "number" ? c.score : null;
    fScore.innerHTML =
      sc != null
        ? sc.toFixed(2) + '<span class="unit">· demo</span>'
        : '—<span class="unit">· demo</span>';
    fScoreBand.textContent = sc != null && c.scoreBand ? "Illustrative band: " + c.scoreBand : "";

    fFindings.innerHTML = "";
    (c.findings || []).forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      fFindings.appendChild(li);
    });

    fWorkflow.innerHTML = "";
    (c.workflowRecommendations || []).forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      fWorkflow.appendChild(li);
    });

    const disc = bundle && bundle.disclaimer ? bundle.disclaimer + " " : "";
    fSafety.textContent =
      disc +
      (c.demoDisclaimer ||
        "Research and product demonstration only. Not for diagnosis, treatment, or patient-care decisions. Not FDA cleared.");

    if (apiJson) {
      apiJson.textContent = JSON.stringify(c.apiResponse || {}, null, 2);
    }

    const n = c.parsedStructureCount ?? 28;
    anatomyParsedLead.textContent =
      String(n) +
      " structures available from PanTS-style labels in the upstream viewer; this static demo uses aggregated overlay channels.";

    anatomyGroupList.innerHTML = "";
    ANATOMY_GROUPS.forEach(function (g) {
      const li = document.createElement("li");
      li.innerHTML = "<strong>" + g.title + ":</strong> " + g.items.join(", ");
      anatomyGroupList.appendChild(li);
    });

    const idx = caseIndex;
    const scans = 128400 + idx * 1700;
    const flags = 812 + idx * 23;
    retroValidationDl.innerHTML = "";
    function retroRow(label, val) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = val;
      retroValidationDl.appendChild(dt);
      retroValidationDl.appendChild(dd);
    }
    retroRow("Scans reviewed (sim.)", scans.toLocaleString());
    retroRow("Candidate flags (sim.)", String(flags));
    retroRow("Review burden (sim.)", (4.1 + idx * 0.08).toFixed(1) + "%");
    retroRow("Median lead-time (sim.)", 16 + idx * 2 + " days");
  }

  function queuePriorityClass(p) {
    if (!p) return "mod";
    const x = String(p).toLowerCase();
    if (x.indexOf("low") >= 0) return "low";
    if (x.indexOf("elev") >= 0) return "elev";
    return "mod";
  }

  function renderQueueIdle() {
    queueSimulated = false;
    queueCard.classList.remove("is-queued");
    queueCard.innerHTML =
      '<p class="demo-queue-placeholder">Run the agent to enqueue this sample case.</p>';
    renderCaseMeta();
  }

  function renderQueueQueued() {
    const c = getCase();
    if (!c) return;
    queueSimulated = true;
    queueCard.classList.add("is-queued");
    const pr = c.priority || "Moderate";
    queueCard.innerHTML =
      '<div class="demo-queue-inner">' +
      '<div class="demo-queue-case-id">' +
      (c.displayName || c.id) +
      "</div>" +
      '<div class="demo-queue-meta">' +
      '<span class="demo-queue-priority ' +
      queuePriorityClass(pr) +
      '">Priority: ' +
      pr +
      "</span>" +
      "<span>Second-read requested</span>" +
      "</div>" +
      "</div>";
    renderCaseMeta();
  }

  function flashLesionLayer() {
    const el = layerElements.lesion;
    if (!el) return;
    el.classList.add("demo-flash-emphasis");
    setTimeout(function () {
      el.classList.remove("demo-flash-emphasis");
    }, 2200);
  }

  function clearAgentTimers() {
    if (agentRunTimer) {
      clearTimeout(agentRunTimer);
      agentRunTimer = null;
    }
  }

  function runScanPilotReview() {
    clearAgentTimers();
    stopCine();
    const lis = agentStepper ? agentStepper.querySelectorAll("li") : [];
    if (!lis.length) return;

    setStepperIdle();
    renderQueueIdle();

    let step = 0;
    btnRunReview.disabled = true;

    function finish() {
      btnRunReview.disabled = false;
      agentRunTimer = null;
      renderQueueQueued();
    }

    function tick() {
      if (step > 0) {
        var completed = step - 1;
        lis[completed].dataset.state = "complete";
        if (completed === 4) {
          setTimeout(flashLesionLayer, 120);
        }
      }
      if (step >= lis.length) {
        finish();
        return;
      }
      lis[step].dataset.state = "active";
      agentStepIndex = step;
      step += 1;
      agentRunTimer = setTimeout(tick, 820);
    }

    tick();
  }

  function initLayerVisibility() {
    layerVisibility = {};
    LAYER_ORDER.forEach(function (k) {
      layerVisibility[k] = OVERLAY_LAYERS[k].defaultVisible;
    });
  }

  function setWindowPreset(preset) {
    if (WINDOW_PRESETS.indexOf(preset) < 0) return;
    windowPreset = preset;
    document.querySelectorAll(".demo-preset-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-window") === preset);
    });
    renderViewer();
  }

  function renderAll() {
    renderFindingsPanel();
    renderViewer();
  }

  function revealOnScroll() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) en.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function loadModelViewerOnce() {
    if (modelViewerLoaded) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.1/model-viewer.min.js";
      s.onload = function () {
        modelViewerLoaded = true;
        resolve();
      };
      s.onerror = function () {
        reject(new Error("model-viewer failed to load"));
      };
      document.head.appendChild(s);
    });
  }

  function open3dPanel() {
    panel3dBody.hidden = false;
    btn3dToggle.setAttribute("aria-expanded", "true");
    if (modelHost.querySelector("model-viewer")) {
      return;
    }
    modelHost.innerHTML =
      '<p style="padding:16px;color:#8fa3bf;font-size:0.85rem">Loading 3D preview…</p>';
    loadModelViewerOnce()
      .then(function () {
        modelHost.innerHTML = "";
        const mv = document.createElement("model-viewer");
        mv.setAttribute("src", assetUrl("models/3d-pancreas.glb"));
        mv.setAttribute("camera-controls", "");
        mv.setAttribute("touch-action", "pan-y");
        mv.setAttribute("shadow-intensity", "1");
        mv.setAttribute("environment-image", "neutral");
        modelHost.appendChild(mv);
      })
      .catch(function () {
        modelHost.innerHTML =
          '<p style="padding:16px;color:#fca5a5;font-size:0.85rem">3D preview could not load. Static demo remains fully usable.</p>';
      });
  }

  function bind() {
    caseSelect.addEventListener("change", function () {
      caseIndex = parseInt(caseSelect.value, 10) || 0;
      const c = getCase();
      sliceIndex = c ? c.defaultSlice || 0 : 0;
      stopCine();
      clearAgentTimers();
      setStepperIdle();
      renderQueueIdle();
      btnRunReview.disabled = false;
      renderAll();
    });

    sliceSlider.addEventListener("pointerdown", function () {
      stopCine();
    });
    sliceSlider.addEventListener("input", function () {
      sliceIndex = parseInt(sliceSlider.value, 10) || 0;
      renderViewer();
    });

    overlayOpacityInput.addEventListener("input", function () {
      overlayOpacity = parseFloat(overlayOpacityInput.value) || 0.65;
      overlayOpacityValue.textContent = Math.round(overlayOpacity * 100) + "%";
      renderViewer();
    });

    btnSlicePrev.addEventListener("click", function () {
      stopCine();
      const c = getCase();
      if (!c) return;
      sliceIndex = Math.max(0, sliceIndex - 1);
      renderViewer();
    });
    btnSliceNext.addEventListener("click", function () {
      stopCine();
      const c = getCase();
      if (!c || !c.ctSlices) return;
      sliceIndex = Math.min(c.ctSlices.length - 1, sliceIndex + 1);
      renderViewer();
    });
    btnCine.addEventListener("click", function () {
      toggleCine();
    });

    var zoomMin = 0.75;
    var zoomMax = 2.4;
    var zoomStep = 0.12;
    btnZoomIn.addEventListener("click", function () {
      zoom = Math.min(zoomMax, zoom + zoomStep);
      renderViewer();
    });
    btnZoomOut.addEventListener("click", function () {
      zoom = Math.max(zoomMin, zoom - zoomStep);
      renderViewer();
    });
    btnZoomReset.addEventListener("click", function () {
      zoom = 1;
      renderViewer();
    });

    document.querySelectorAll(".demo-preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setWindowPreset(btn.getAttribute("data-window") || "abdomen");
      });
    });

    btnRunReview.addEventListener("click", function () {
      runScanPilotReview();
    });

    viewerStage.addEventListener("mousemove", function (e) {
      const r = viewerStage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      crossV.style.left = x + "%";
      crossH.style.top = y + "%";
    });
    viewerStage.addEventListener("mouseleave", function () {
      crossV.style.opacity = "0";
      crossH.style.opacity = "0";
    });
    viewerStage.addEventListener("mouseenter", function () {
      crossV.style.opacity = "";
      crossH.style.opacity = "";
    });

    document.addEventListener("keydown", function (e) {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        stopCine();
        sliceIndex = Math.max(0, sliceIndex - 1);
        renderViewer();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stopCine();
        const c = getCase();
        if (c && c.ctSlices) sliceIndex = Math.min(c.ctSlices.length - 1, sliceIndex + 1);
        renderViewer();
      } else if (e.code === "Space") {
        e.preventDefault();
        toggleCine();
      } else if (e.key === "r" || e.key === "R") {
        if (!btnRunReview.disabled) runScanPilotReview();
      } else if (e.key >= "1" && e.key <= "4") {
        var idx = parseInt(e.key, 10) - 1;
        var key = LAYER_ORDER[idx];
        if (key) setLayerVisible(key, !layerVisibility[key]);
      }
    });

    if (btn3dToggle && panel3dBody) {
      btn3dToggle.addEventListener("click", function () {
        var open = btn3dToggle.getAttribute("aria-expanded") === "true";
        if (open) {
          panel3dBody.hidden = true;
          btn3dToggle.setAttribute("aria-expanded", "false");
        } else {
          open3dPanel();
        }
      });
    }
  }

  function initCaseSelector() {
    caseSelect.innerHTML = "";
    if (!bundle) return;
    bundle.cases.forEach(function (c, idx) {
      var opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = c.displayName || c.id;
      caseSelect.appendChild(opt);
    });
    caseSelect.value = String(caseIndex);
  }

  async function load() {
    try {
      var res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to load demo metadata (" + res.status + ")");
      bundle = await res.json();
      if (!bundle.cases || !bundle.cases.length) throw new Error("No demo cases in JSON");

      bundle.cases = bundle.cases.map(normalizeCase);

      initLayerVisibility();
      buildLayerPills();
      buildStepperDom();
      setStepperIdle();

      caseIndex = 0;
      var c0 = getCase();
      sliceIndex = c0 ? c0.defaultSlice || 0 : 0;
      overlayOpacity = parseFloat(overlayOpacityInput.value) || 0.65;
      overlayOpacityValue.textContent = Math.round(overlayOpacity * 100) + "%";

      initCaseSelector();
      renderQueueIdle();
      renderAll();
      bind();
      revealOnScroll();
    } catch (err) {
      console.error(err);
      if (caseMetaDl) {
        caseMetaDl.innerHTML = "<dt>Status</dt><dd>Load error</dd>";
      }
      fSafety.textContent =
        "Could not load demo assets. Serve the site over HTTP (not file://) so JSON and images resolve.";
    }
  }

  load();
})();
