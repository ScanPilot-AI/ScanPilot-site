/**
 * Research affiliations: premium logo rail + extended list.
 */
(function () {
  const wall = document.getElementById("affiliation-logo-grid");
  const extendedList = document.getElementById("affiliation-extended-list");
  if (!wall) return;

  wall.classList.add("logo-grid");

  function resolveBadgeClass(item) {
    if (item.logoBadge === "light" || item.logoBadge === "dark" || item.logoBadge === "invert") {
      return item.logoBadge;
    }
    if (item.lightLogo === true) return "light";
    const name = (item.name || "").toLowerCase();
    if (
      name.includes("toronto") ||
      name.includes("nvidia") ||
      name.includes("meta") ||
      name.includes("harvard") ||
      name.includes("hopkins") ||
      name.includes("illinois") ||
      name.includes("dkfz") ||
      name.includes("stanford") ||
      name.includes("ucsf")
    ) {
      return "light";
    }
    return "dark";
  }

  function appendMainLogoCard(container, item) {
    const logoPath = (item.logo || "").trim();
    if (!logoPath) return;

    const badgeKind = resolveBadgeClass(item);
    const tile = document.createElement("div");
    tile.className = "logo-tile";

    const badge = document.createElement("div");
    badge.className = `logo-badge ${badgeKind}`;

    const altText = (item.alt || item.name || "").trim();
    const img = document.createElement("img");
    img.src = logoPath;
    img.alt = altText;
    img.className = "logo-img";
    img.decoding = "async";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";

    img.addEventListener("error", () => {
      tile.classList.add("logo-tile--error");
      badge.remove();
      const sr = document.createElement("span");
      sr.className = "affiliation-sr-only";
      sr.textContent = altText || "Affiliation logo";
      tile.appendChild(sr);
    });

    badge.appendChild(img);
    tile.appendChild(badge);
    container.appendChild(tile);
  }

  function renderExtended(names) {
    if (!extendedList || !names.length) return;
    const frag = document.createDocumentFragment();
    names.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      frag.appendChild(li);
    });
    extendedList.appendChild(frag);
  }

  function run(list) {
    const featured = list
      .filter((x) => x.featured === true && (x.logo || "").trim())
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

    const featuredNames = new Set(featured.map((x) => x.name));
    const extended = list
      .filter((x) => x.featured !== true && x.name && !featuredNames.has(x.name))
      .map((x) => x.name)
      .sort((a, b) => a.localeCompare(b));

    wall.textContent = "";
    featured.forEach((item) => appendMainLogoCard(wall, item));

    if (extendedList) extendedList.textContent = "";
    renderExtended(extended);

    const details = document.querySelector(".affiliation-extended-details");
    if (details && !extended.length) {
      details.hidden = true;
    } else if (details) {
      details.hidden = false;
    }
  }

  fetch("assets/data/researchAffiliations.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : data.items;
      if (!Array.isArray(list) || !list.length) throw new Error("empty");
      run(list);
    })
    .catch(() => {
      wall.innerHTML =
        '<p class="affiliation-wall-fallback">Affiliation list is temporarily unavailable. Please refresh the page.</p>';
    });
})();
