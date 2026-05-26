(function () {
  "use strict";

  var PAGE_SIZE = 40;
  var CINE_MS = 300;

  var catalog = [];
  var localMap = {};
  var summary = null;
  var filtered = [];
  var page = 0;
  var selectedId = null;
  var selectedLocal = null;
  var sliceIndex = 0;
  var cineTimer = null;
  var activeOrgans = [];
  var tumorFilterActive = false;

  function assetRoot() {
    try {
      return new URL("../assets/", location.href).href;
    } catch (e) {
      return "";
    }
  }

  function dataUrl(name) {
    return new URL("data/" + name, assetRoot()).href;
  }

  function publicPath(rel) {
    if (!rel) return "";
    if (rel.indexOf("http") === 0) return rel;
    return new URL(rel.replace(/^assets\//, ""), assetRoot()).href;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function tumorLabel(c) {
    if (c.tumor === true) return "Tumor";
    if (c.tumor === false) return "No tumor";
    return "Unknown";
  }

  function availLabel(c) {
    return c.hasLocalVolume ? "Local volume" : "Metadata only";
  }

  function applyFilters() {
    var q = ($("librarySearch").value || "").trim().toLowerCase();
    var tumor = $("filterTumor").value;
    var avail = $("filterAvail").value;
    tumorFilterActive = tumor !== "any";

    filtered = catalog.filter(function (c) {
      if (tumor === "tumor" && c.tumor !== true) return false;
      if (tumor === "no_tumor" && c.tumor !== false) return false;
      if (avail === "local" && !c.hasLocalVolume) return false;
      if (avail === "metadata" && c.hasLocalVolume) return false;
      if (!q) return true;
      return (
        c.caseId.toLowerCase().indexOf(q) >= 0 ||
        (c.site && String(c.site).toLowerCase().indexOf(q) >= 0) ||
        (c.ctPhase && String(c.ctPhase).toLowerCase().indexOf(q) >= 0)
      );
    });

    page = 0;
    renderLibrary();
    updateChips();
  }

  function updateChips() {
    var el = $("statusChips");
    if (!el || !summary) return;
    var chips = [
      { label: "Catalog indexed", value: summary.totalCatalogCases.toLocaleString() },
      { label: "Local volume", value: String(summary.localVolumeCases) },
      { label: "Metadata only", value: summary.metadataOnlyCases.toLocaleString() },
    ];
    if (tumorFilterActive) chips.push({ label: "Tumor filter", value: "Active" });
    if (activeOrgans.length) chips.push({ label: "Overlay", value: "Active" });
    el.innerHTML = chips
      .map(function (c) {
        return (
          '<span class="monitor-chip"><span class="monitor-chip-k">' +
          c.label +
          '</span><span class="monitor-chip-v">' +
          c.value +
          "</span></span>"
        );
      })
      .join("");
  }

  function renderLibrary() {
    var list = $("caseList");
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page >= totalPages) page = totalPages - 1;
    var slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    $("libraryCount").textContent = filtered.length.toLocaleString() + " matches";
    $("pageLabel").textContent = page + 1 + " / " + totalPages;

    list.innerHTML = slice
      .map(function (c) {
        var local = localMap[c.caseId];
        var thumb = local && local.thumbnail ? publicPath(local.thumbnail) : "";
        var sel = c.caseId === selectedId ? " is-selected" : "";
        var visual = thumb
          ? '<img src="' + thumb + '" alt="" />'
          : '<div class="monitor-meta-card"><span>' +
            c.caseId.replace("PanTS_", "") +
            "</span><small>" +
            (c.ctPhase || "CT") +
            "</small></div>";
        return (
          '<button type="button" class="monitor-case-item' +
          sel +
          (c.hasLocalVolume ? " is-local" : "") +
          '" data-case="' +
          c.caseId +
          '">' +
          '<div class="monitor-case-thumb">' +
          visual +
          "</div>" +
          '<div class="monitor-case-meta">' +
          "<strong>" +
          c.caseId +
          "</strong>" +
          "<span>" +
          (c.sex || "—") +
          " · " +
          (c.age != null ? Math.round(c.age) : "—") +
          "</span>" +
          '<span class="monitor-case-tags">' +
          tumorLabel(c) +
          " · " +
          availLabel(c) +
          "</span>" +
          "</div></button>"
        );
      })
      .join("");

    list.querySelectorAll("[data-case]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectCase(btn.getAttribute("data-case"));
      });
    });
  }

  function openProductAtlas() {
    if (!selectedLocal) return;
    window.location.href = new URL("../product/#atlas", location.href).href;
  }

  function renderMeta(c) {
    var dl = $("metaDl");
    var fields = [
      ["Case ID", c.caseId],
      ["Sex", c.sex],
      ["Age", c.age != null ? Math.round(c.age) : null],
      ["Tumor", tumorLabel(c)],
      ["Availability", availLabel(c)],
      ["Shape", c.shape],
      ["Spacing", c.spacing],
      ["CT phase", c.ctPhase],
      ["Manufacturer", c.manufacturer],
      ["Model", c.manufacturerModel],
      ["Study type", c.studyType],
      ["Site", c.site],
      ["Site detail", c.siteDetail],
      ["Nationality", c.siteNationality],
      ["Study year", c.studyYear],
    ];
    dl.innerHTML = fields
      .map(function (f) {
        return "<dt>" + f[0] + "</dt><dd>" + (f[1] != null ? f[1] : "—") + "</dd>";
      })
      .join("");

    var note = $("metaNote");
    var actions = document.getElementById("metaActions");
    if (actions) actions.innerHTML = "";
    if (c.hasLocalVolume && selectedLocal) {
      note.textContent =
        "Bundled local CT volume with precomputed PNG frames and segmentation overlays. Research-use static demo only.";
      if (actions) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "monitor-btn monitor-btn-accent";
        btn.textContent = "Open Atlas workspace";
        btn.onclick = openProductAtlas;
        actions.appendChild(btn);
      }
    } else {
      note.textContent =
        "Atlas unavailable in static demo. This case is indexed in the PanTS metadata catalog; the CT volume is not bundled for browser viewing.";
    }
  }

  function renderFindings(c, local) {
    var ul = $("findingsList");
    var items = [];
    if (local) {
      if (local.hasPancreaticLesion)
        items.push("Lesion overlay stack available for duct/lesion review.");
      if (local.hasPancreaticDuct)
        items.push("Pancreatic duct layer exported in slice window.");
      if (local.availableOrgans && local.availableOrgans.indexOf("pancreas") >= 0)
        items.push("Whole-organ pancreas segmentation active.");
      items.push(
        local.availableOrgans.length +
          " organ overlay stacks · " +
          local.localFrameCount +
          " axial frames."
      );
    } else {
      items.push("Metadata catalog entry — no bundled CT in this demo.");
      if (c.tumor === true) items.push("Catalog tumor flag: positive.");
    }
    ul.innerHTML = items.map(function (t) {
      return "<li>" + t + "</li>";
    }).join("");
  }

  function buildLayerPills(local) {
    var wrap = $("layerPills");
    if (!local) {
      wrap.innerHTML = "";
      return;
    }
    activeOrgans = local.availableOrgans.slice(0, 6);
    wrap.innerHTML = local.availableOrgans
      .map(function (organ) {
        var on = activeOrgans.indexOf(organ) >= 0;
        return (
          '<button type="button" class="monitor-pill' +
          (on ? " is-on" : "") +
          '" data-organ="' +
          organ +
          '">' +
          organ.replace(/_/g, " ") +
          "</button>"
        );
      })
      .join("");

    wrap.querySelectorAll("[data-organ]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var o = btn.getAttribute("data-organ");
        var i = activeOrgans.indexOf(o);
        if (i >= 0) activeOrgans.splice(i, 1);
        else activeOrgans.push(o);
        btn.classList.toggle("is-on");
        renderSlice();
        updateChips();
      });
    });
  }

  function buildTimeline(count) {
    var strip = $("timelineStrip");
    strip.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "monitor-tick" + (i === sliceIndex ? " is-active" : "");
      b.setAttribute("aria-label", "Slice " + (i + 1));
      (function (idx) {
        b.addEventListener("click", function () {
          sliceIndex = idx;
          renderSlice();
        });
      })(i);
      strip.appendChild(b);
    }
  }

  function renderSlice() {
    var empty = $("viewportEmpty");
    var ct = $("ctImage");
    var layers = $("overlayLayers");

    if (!selectedLocal) {
      ct.removeAttribute("src");
      layers.innerHTML = "";
      empty.hidden = false;
      $("sliceLabel").textContent = "—";
      return;
    }

    empty.hidden = true;
    var frames = selectedLocal.ctPngFrames;
    var max = frames.length - 1;
    if (sliceIndex > max) sliceIndex = max;
    if (sliceIndex < 0) sliceIndex = 0;

    ct.src = publicPath(frames[sliceIndex]);
    var srcId =
      selectedLocal.sourceSliceIds && selectedLocal.sourceSliceIds[sliceIndex];
    $("sliceLabel").textContent =
      "Slice " +
      (sliceIndex + 1) +
      " / " +
      frames.length +
      (srcId != null ? " · Z " + srcId : "");

    layers.innerHTML = activeOrgans
      .map(function (organ) {
        var paths = selectedLocal.overlaysByOrgan[organ];
        if (!paths || !paths[sliceIndex]) return "";
        return (
          '<img class="monitor-overlay" src="' +
          publicPath(paths[sliceIndex]) +
          '" alt="" style="opacity:' +
          ($("overlayOpacity").value / 100).toFixed(2) +
          '" />'
        );
      })
      .join("");

    var ticks = $("timelineStrip").querySelectorAll(".monitor-tick");
    ticks.forEach(function (t, i) {
      t.classList.toggle("is-active", i === sliceIndex);
    });
  }

  function selectCase(caseId) {
    selectedId = caseId;
    var c = catalog.find(function (x) {
      return x.caseId === caseId;
    });
    if (!c) return;

    selectedLocal = localMap[caseId] || null;
    sliceIndex = selectedLocal
      ? Math.floor(selectedLocal.localFrameCount / 2)
      : 0;

    renderMeta(c);
    renderFindings(c, selectedLocal);
    buildLayerPills(selectedLocal);
    if (selectedLocal) buildTimeline(selectedLocal.localFrameCount);
    else $("timelineStrip").innerHTML = "";

    renderSlice();
    renderLibrary();
    updateChips();
  }

  function stepSlice(delta) {
    if (!selectedLocal) return;
    var max = selectedLocal.ctPngFrames.length - 1;
    sliceIndex = sliceIndex + delta;
    if (sliceIndex > max) sliceIndex = 0;
    if (sliceIndex < 0) sliceIndex = max;
    renderSlice();
  }

  function toggleCine() {
    var btn = $("btnCine");
    if (cineTimer) {
      clearInterval(cineTimer);
      cineTimer = null;
      btn.setAttribute("aria-pressed", "false");
      return;
    }
    if (!selectedLocal) return;
    btn.setAttribute("aria-pressed", "true");
    cineTimer = setInterval(function () {
      stepSlice(1);
    }, CINE_MS);
  }

  function initEvents() {
    $("librarySearch").addEventListener("input", applyFilters);
    $("filterTumor").addEventListener("change", applyFilters);
    $("filterAvail").addEventListener("change", applyFilters);
    $("btnPrevPage").addEventListener("click", function () {
      if (page > 0) {
        page--;
        renderLibrary();
      }
    });
    $("btnNextPage").addEventListener("click", function () {
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (page < totalPages - 1) {
        page++;
        renderLibrary();
      }
    });
    $("btnPrevSlice").addEventListener("click", function () {
      stepSlice(-1);
    });
    $("btnNextSlice").addEventListener("click", function () {
      stepSlice(1);
    });
    $("btnCine").addEventListener("click", toggleCine);
    $("overlayOpacity").addEventListener("input", renderSlice);
  }

  function boot() {
    Promise.all([
      fetch(dataUrl("pantsCatalog.json")).then(function (r) {
        return r.json();
      }),
      fetch(dataUrl("pantsLocalAtlas.json")).then(function (r) {
        return r.json();
      }),
      fetch(dataUrl("pantsAtlasSummary.json")).then(function (r) {
        return r.json();
      }),
    ])
      .then(function (results) {
        catalog = results[0].cases || [];
        summary = results[2];
        (results[1].cases || []).forEach(function (c) {
          localMap[c.caseId] = c;
        });
        filtered = catalog.slice();
        initEvents();
        applyFilters();
        var firstLocal = catalog.find(function (c) {
          return c.hasLocalVolume;
        });
        if (firstLocal) selectCase(firstLocal.caseId);
        updateChips();
      })
      .catch(function (err) {
        console.error(err);
        $("libraryCount").textContent = "Failed to load catalog";
      });
  }

  boot();
})();
