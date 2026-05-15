let muralData = null;
let objectData = [];
let activeObjectId = null;
const DEBUG_POLYGON = true;
const MURAL_IMAGE_CANDIDATES = [
  "assets/murals/mural_001.jpg",
  "assets/murals/mural_001.png"
];

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
  let currentImageIndex = 0;

  if (!muralImage || !missingMessage) {
    return;
  }

  muralImage.addEventListener("load", function () {
    muralImage.hidden = false;
    missingMessage.hidden = true;
    updateOverlaySize();
  });

  muralImage.addEventListener("error", function () {
    currentImageIndex += 1;

    if (currentImageIndex < MURAL_IMAGE_CANDIDATES.length) {
      muralImage.src = MURAL_IMAGE_CANDIDATES[currentImageIndex];
      return;
    }

    showMissingMuralMessage(muralImage, missingMessage);
  });

  if (muralImage.complete) {
    if (muralImage.naturalWidth === 0) {
      muralImage.src = MURAL_IMAGE_CANDIDATES[currentImageIndex];
    } else {
      muralImage.hidden = false;
      missingMessage.hidden = true;
      updateOverlaySize();
    }
  }
}

function showMissingMuralMessage(muralImage, missingMessage) {
  muralImage.hidden = true;
  missingMessage.hidden = false;
  updateOverlaySize();
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
    polygonElement.setAttribute("aria-label", objectItem.name);
    polygonElement.classList.add("object-polygon");
    bindPolygonTooltip(polygonElement, objectItem);
    bindPolygonActiveState(polygonElement, objectItem);

    if (DEBUG_POLYGON) {
      polygonElement.classList.add("is-debug-visible");
    }

    polygonOverlay.appendChild(polygonElement);
  });
}

function bindPolygonActiveState(polygonElement, objectItem) {
  polygonElement.addEventListener("click", function (event) {
    event.stopPropagation();
    setActiveObject(objectItem.id);
  });
}

function setActiveObject(objectId) {
  activeObjectId = objectId;
  updateActivePolygonClass();
  console.log("Active object:", activeObjectId);
}

function updateActivePolygonClass() {
  const polygonElements = document.querySelectorAll(".object-polygon");

  polygonElements.forEach(function (polygonElement) {
    const isActive = polygonElement.dataset.objectId === activeObjectId;
    polygonElement.classList.toggle("is-active", isActive);
  });
}

function bindPolygonTooltip(polygonElement, objectItem) {
  polygonElement.addEventListener("mouseenter", function (event) {
    showObjectTooltip(objectItem.name, event);
  });

  polygonElement.addEventListener("mousemove", function (event) {
    moveObjectTooltip(event);
  });

  polygonElement.addEventListener("mouseleave", hideObjectTooltip);
}

function showObjectTooltip(objectName, event) {
  const tooltip = document.querySelector("#objectTooltip");

  if (!tooltip) {
    return;
  }

  tooltip.textContent = objectName;
  tooltip.hidden = false;
  moveObjectTooltip(event);
}

function moveObjectTooltip(event) {
  const muralFrame = document.querySelector("#muralFrame");
  const tooltip = document.querySelector("#objectTooltip");

  if (!muralFrame || !tooltip || tooltip.hidden) {
    return;
  }

  const frameRect = muralFrame.getBoundingClientRect();
  const tooltipX = event.clientX - frameRect.left;
  const tooltipY = event.clientY - frameRect.top;

  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
}

function hideObjectTooltip() {
  const tooltip = document.querySelector("#objectTooltip");

  if (!tooltip) {
    return;
  }

  tooltip.hidden = true;
}

window.addEventListener("resize", updateOverlaySize);
document.addEventListener("DOMContentLoaded", initializeApp);
