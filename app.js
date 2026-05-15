let muralData = null;
let objectData = [];
const DEBUG_POLYGON = true;

async function initializeApp() {
  console.log("Mural AR Demo initialized.");
  showMuralImageWhenAvailable();
  await loadDemoData();
}

async function loadDemoData() {
  try {
    const muralResponse = await fetch("data/mural.json");
    const objectsResponse = await fetch("data/objects.json");

    muralData = await muralResponse.json();
    objectData = await objectsResponse.json();

    console.log("Mural data loaded:", muralData);
    console.log("Object data loaded:", objectData);
    updateMuralTitle(muralData);
    updateOverlaySize();
  } catch (error) {
    console.error("Failed to load demo data:", error);
  }
}

function updateMuralTitle(mural) {
  const titleElement = document.querySelector("#muralTitle");

  if (!titleElement || !mural || !mural.title) {
    return;
  }

  titleElement.textContent = mural.title;
}

function showMuralImageWhenAvailable() {
  const muralImage = document.querySelector("#muralImage");
  const missingMessage = document.querySelector("#muralMissingMessage");

  if (!muralImage || !missingMessage) {
    return;
  }

  muralImage.addEventListener("load", function () {
    muralImage.hidden = false;
    missingMessage.hidden = true;
    updateOverlaySize();
  });

  muralImage.addEventListener("error", function () {
    muralImage.hidden = true;
    missingMessage.hidden = false;
    updateOverlaySize();
  });

  if (muralImage.complete) {
    muralImage.hidden = muralImage.naturalWidth === 0;
    missingMessage.hidden = muralImage.naturalWidth > 0;
    updateOverlaySize();
  }
}

function updateOverlaySize() {
  const muralFrame = document.querySelector("#muralFrame");
  const polygonOverlay = document.querySelector("#polygonOverlay");

  if (!muralFrame || !polygonOverlay) {
    return;
  }

  const frameRect = muralFrame.getBoundingClientRect();
  polygonOverlay.setAttribute("viewBox", `0 0 ${frameRect.width} ${frameRect.height}`);
  polygonOverlay.setAttribute("width", frameRect.width);
  polygonOverlay.setAttribute("height", frameRect.height);
  renderObjectPolygons();
}

function renderObjectPolygons() {
  const polygonOverlay = document.querySelector("#polygonOverlay");

  if (!polygonOverlay || objectData.length === 0) {
    return;
  }

  const overlayWidth = Number(polygonOverlay.getAttribute("width"));
  const overlayHeight = Number(polygonOverlay.getAttribute("height"));

  if (!overlayWidth || !overlayHeight) {
    return;
  }

  polygonOverlay.innerHTML = "";

  objectData.forEach(function (objectItem) {
    const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const points = objectItem.polygon
      .map(function (point) {
        const x = point[0] * overlayWidth;
        const y = point[1] * overlayHeight;
        return `${x},${y}`;
      })
      .join(" ");

    polygonElement.setAttribute("points", points);
    polygonElement.setAttribute("data-object-id", objectItem.id);
    polygonElement.classList.add("object-polygon");

    if (DEBUG_POLYGON) {
      polygonElement.classList.add("is-debug-visible");
    }

    polygonOverlay.appendChild(polygonElement);
  });
}

window.addEventListener("resize", updateOverlaySize);
document.addEventListener("DOMContentLoaded", initializeApp);
