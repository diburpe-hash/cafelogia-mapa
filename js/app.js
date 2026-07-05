(function () {
  "use strict";

  const GROUP_CAFE = "Cafeterías de Especialidad";
  const GROUP_TURISMO = "Puntos Turísticos";
  const MAX_SLIDER_PHOTOS = 4;
  const TURISMO_DEFAULT_ICON = "default";

  // Valores permitidos en la columna "Icon" de la hoja para puntos turísticos.
  // Si una fila trae un valor que no está en esta lista (o lo deja vacío),
  // se usa el ícono "default" (montaña).
  const TURISMO_ICON_FILES = {
    default: "icons/turismo.svg",
    foto: "icons/turismo-foto.svg",
    bici: "icons/turismo-bici.svg",
    shopping: "icons/turismo-shopping.svg",
    spa: "icons/turismo-spa.svg",
    bus: "icons/turismo-bus.svg",
    deporte: "icons/turismo-deporte.svg",
    ski: "icons/turismo-ski.svg",
    museo: "icons/turismo-museo.svg",
    parque: "icons/turismo-parque.svg",
    caminata: "icons/turismo-caminata.svg",
  };

  const state = {
    map: null,
    clusterGroups: {},
    cafeIcon: null,
    turismoIcons: {}, // { foto: L.divIcon, museo: L.divIcon, ... }
    allEntries: [], // { row, marker }
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    initMap();
    bindSidebarControls();
    bindLocateButton();

    const iconKeys = Object.keys(TURISMO_ICON_FILES);
    const [cafeSvg, ...turismoSvgs] = await Promise.all([
      fetch("icons/cafe.svg").then((r) => r.text()),
      ...iconKeys.map((key) => fetch(TURISMO_ICON_FILES[key]).then((r) => r.text())),
    ]);
    state.cafeIcon = makeDivIcon(cafeSvg);
    iconKeys.forEach((key, i) => {
      state.turismoIcons[key] = makeDivIcon(turismoSvgs[i]);
    });

    state.clusterGroups[GROUP_CAFE] = makeClusterGroup("cafe");
    state.clusterGroups[GROUP_TURISMO] = makeClusterGroup("turismo");
    state.clusterGroups[GROUP_CAFE].addTo(state.map);
    state.clusterGroups[GROUP_TURISMO].addTo(state.map);

    const rows = await loadData();
    renderEntries(rows);
    bindSearch();
  }

  function initMap() {
    state.map = L.map("map", {
      zoomControl: false,
      center: CAFELOGIA_CONFIG.initialCenter,
      zoom: CAFELOGIA_CONFIG.initialZoom,
    });

    L.control.zoom({ position: "bottomleft" }).addTo(state.map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(state.map);
  }

  function makeDivIcon(svgText) {
    return L.divIcon({
      html: svgText,
      className: "pin",
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -36],
    });
  }

  function makeClusterGroup(kind) {
    return L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<span>${count}</span>`,
          className: "cluster-icon" + (kind === "turismo" ? " turismo" : ""),
          iconSize: [38, 38],
        });
      },
    });
  }

  async function loadData() {
    const url = CAFELOGIA_CONFIG.sheetCsvUrl || CAFELOGIA_CONFIG.localCsvUrl;
    try {
      const rows = await fetchCsv(url);
      if (rows.length) return rows;
      throw new Error("CSV vacío");
    } catch (err) {
      console.warn("No se pudo cargar el CSV configurado, usando respaldo local.", err);
      if (url !== CAFELOGIA_CONFIG.localCsvUrl) {
        return fetchCsv(CAFELOGIA_CONFIG.localCsvUrl);
      }
      return [];
    }
  }

  function fetchCsv(url) {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: reject,
      });
    });
  }

  function renderEntries(rows) {
    let cafeCount = 0;
    let turismoCount = 0;

    rows.forEach((row) => {
      const lat = parseFloat(row.Latitude);
      const lon = parseFloat(row.Longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;

      const group = row.Group === GROUP_CAFE ? GROUP_CAFE : GROUP_TURISMO;
      const icon = group === GROUP_CAFE ? state.cafeIcon : pickTurismoIcon(row.Icon);
      const marker = L.marker([lat, lon], { icon });

      marker.bindPopup(buildPopupHtml(row, group), { maxWidth: 280 });
      marker.on("popupopen", (e) => hydratePopupSlider(e.popup, row));

      state.clusterGroups[group].addLayer(marker);
      state.allEntries.push({ row, marker, group });

      if (group === GROUP_CAFE) cafeCount++;
      else turismoCount++;
    });

    document.getElementById("countCafe").textContent = cafeCount;
    document.getElementById("countTurismo").textContent = turismoCount;
  }

  function pickTurismoIcon(iconValue) {
    const key = String(iconValue || "").trim().toLowerCase();
    return state.turismoIcons[key] || state.turismoIcons[TURISMO_DEFAULT_ICON];
  }

  function buildPopupHtml(row, group) {
    const tags = (row.Tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${row.Latitude},${row.Longitude}`;

    return `
      <div class="popup-card" data-slug="${escapeHtml(row.Slug || "")}">
        <div class="slider-mount"></div>
        <div class="popup-body">
          <h3>${escapeHtml(row.Name || "")}</h3>
          <a class="address" href="${mapsUrl}" target="_blank" rel="noopener">${escapeHtml(row.Address || "")}</a>
          ${
            group === GROUP_CAFE && tags.length
              ? `<div class="tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
              : ""
          }
          <div class="popup-actions">
            ${
              row["Button Link"]
                ? `<a class="btn-instagram" href="${escapeHtml(row["Button Link"])}" target="_blank" rel="noopener">Instagram</a>`
                : ""
            }
            <a class="btn-directions" href="${mapsUrl}" target="_blank" rel="noopener">Cómo llegar</a>
          </div>
        </div>
      </div>
    `;
  }

  function hydratePopupSlider(popup, row) {
    const el = popup.getElement();
    if (!el) return;
    const mount = el.querySelector(".slider-mount");
    const slug = row.Slug;
    if (!mount || !slug) return;

    loadAvailableImages(slug).then((urls) => {
      if (!urls.length) return;
      mount.innerHTML = buildSliderHtml(urls);
      setupSlider(mount);
      popup._source && popup._source.getPopup() && popup.update();
    });
  }

  function loadAvailableImages(slug) {
    const checks = [];
    for (let i = 1; i <= MAX_SLIDER_PHOTOS; i++) {
      const url = `images/${slug}/${i}.jpg`;
      checks.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => resolve(null);
          img.src = url;
        })
      );
    }
    return Promise.all(checks).then((urls) => urls.filter(Boolean));
  }

  function buildSliderHtml(urls) {
    const imgs = urls
      .map((u, i) => `<img src="${u}" class="${i === 0 ? "active" : ""}" data-index="${i}" alt="" />`)
      .join("");
    const dots = urls
      .map((_, i) => `<span class="${i === 0 ? "active" : ""}" data-dot="${i}"></span>`)
      .join("");
    const nav =
      urls.length > 1
        ? `<button class="slider-nav prev" data-nav="-1">‹</button><button class="slider-nav next" data-nav="1">›</button>`
        : "";
    return `<div class="slider" data-current="0">${imgs}${nav}<div class="slider-dots">${dots}</div></div>`;
  }

  function setupSlider(mount) {
    const slider = mount.querySelector(".slider");
    if (!slider) return;
    const imgs = Array.from(slider.querySelectorAll("img"));
    const dots = Array.from(slider.querySelectorAll("[data-dot]"));

    function show(index) {
      const n = imgs.length;
      const i = ((index % n) + n) % n;
      imgs.forEach((img) => img.classList.toggle("active", Number(img.dataset.index) === i));
      dots.forEach((dot) => dot.classList.toggle("active", Number(dot.dataset.dot) === i));
      slider.dataset.current = String(i);
    }

    slider.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        show(Number(slider.dataset.current) + Number(btn.dataset.nav));
      });
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        show(Number(dot.dataset.dot));
      });
    });

    let touchStartX = null;
    slider.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    });
    slider.addEventListener("touchend", (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 30) show(Number(slider.dataset.current) + (dx < 0 ? 1 : -1));
      touchStartX = null;
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindSidebarControls() {
    document.querySelectorAll(".layer-row").forEach((row) => {
      const checkbox = row.querySelector("input[type=checkbox]");
      const group = row.dataset.group;
      checkbox.addEventListener("change", () => {
        const layer = state.clusterGroups[group];
        if (!layer) return;
        if (checkbox.checked) state.map.addLayer(layer);
        else state.map.removeLayer(layer);
      });
    });

    const sidebar = document.getElementById("sidebar");
    document.getElementById("sidebarOpen").addEventListener("click", () => sidebar.classList.add("open"));
    document.getElementById("sidebarToggle").addEventListener("click", () => sidebar.classList.remove("open"));
  }

  function bindLocateButton() {
    document.getElementById("locateBtn").addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Tu navegador no permite obtener la ubicación.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = [pos.coords.latitude, pos.coords.longitude];
          state.map.setView(latlng, 15);
          L.circleMarker(latlng, {
            radius: 8,
            color: "#1f3a5f",
            fillColor: "#4d7ac9",
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(state.map);
        },
        () => alert("No se pudo obtener tu ubicación. Revisa los permisos del navegador."),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  function bindSearch() {
    const input = document.getElementById("searchInput");
    const list = document.getElementById("resultsList");

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        list.hidden = true;
        list.innerHTML = "";
        return;
      }

      const matches = state.allEntries
        .filter((entry) => (entry.row.Name || "").toLowerCase().includes(q))
        .slice(0, 30);

      list.hidden = false;
      list.innerHTML = matches
        .map(
          (entry, i) => `
            <button class="result-item" data-index="${i}">
              ${escapeHtml(entry.row.Name || "")}
              <span class="result-group">${escapeHtml(entry.group)}</span>
            </button>
          `
        )
        .join("");

      list.querySelectorAll(".result-item").forEach((btn, i) => {
        btn.addEventListener("click", () => {
          const entry = matches[i];
          const layer = state.clusterGroups[entry.group];
          if (layer.zoomToShowLayer) {
            layer.zoomToShowLayer(entry.marker, () => entry.marker.openPopup());
          } else {
            state.map.setView(entry.marker.getLatLng(), 17);
            entry.marker.openPopup();
          }
        });
      });
    });
  }
})();
