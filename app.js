let muralData = null;
let objectData = [];
let activeObjectIds = [];
const DEBUG_POLYGON = true;
const DEBUG_ANCHOR = true;
const MAX_ACTIVE_OBJECTS = 2;
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
    setPolygonTransformOrigin(polygonElement, objectItem, overlayWidth, overlayHeight);
    polygonElement.classList.add("object-polygon");
    bindPolygonTooltip(polygonElement, objectItem);
    bindPolygonActiveState(polygonElement, objectItem);

    if (DEBUG_POLYGON) {
      polygonElement.classList.add("is-debug-visible");
    }

    polygonOverlay.appendChild(polygonElement);
  });
}

function setPolygonTransformOrigin(polygonElement, objectItem, overlayWidth, overlayHeight) {
  const center = objectItem.polygon.reduce(
    function (result, point) {
      result.x += point[0] * overlayWidth;
      result.y += point[1] * overlayHeight;
      return result;
    },
    { x: 0, y: 0 }
  );

  center.x = center.x / objectItem.polygon.length;
  center.y = center.y / objectItem.polygon.length;

  polygonElement.style.transformOrigin = `${center.x}px ${center.y}px`;
}

function bindPolygonActiveState(polygonElement, objectItem) {
  polygonElement.addEventListener("click", function (event) {
    event.stopPropagation();
    setActiveObject(objectItem.id);
  });
}

function setActiveObject(objectId) {
  if (!activeObjectIds.includes(objectId)) {
    activeObjectIds.push(objectId);
  }

  if (activeObjectIds.length > MAX_ACTIVE_OBJECTS) {
    activeObjectIds.shift();
  }

  updateActivePolygonClass();
  updateInfoCard();
  console.log("Active objects:", activeObjectIds);
}

function clearActiveObject() {
  if (activeObjectIds.length === 0) {
    return;
  }

  activeObjectIds = [];
  updateActivePolygonClass();
  updateInfoCard();
  hideObjectTooltip();
  console.log("Active objects cleared.");
}

function updateActivePolygonClass() {
  const polygonElements = document.querySelectorAll(".object-polygon");
  const dimLayer = document.querySelector("#focusDimLayer");
  const muralFrame = document.querySelector("#muralFrame");

  polygonElements.forEach(function (polygonElement) {
    const isActive = activeObjectIds.includes(polygonElement.dataset.objectId);
    polygonElement.classList.toggle("is-active", isActive);
    polygonElement.classList.toggle("is-muted", activeObjectIds.length > 0 && !isActive);
  });

  if (dimLayer) {
    dimLayer.hidden = activeObjectIds.length === 0;
  }

  if (muralFrame) {
    muralFrame.classList.toggle("is-focus-mode", activeObjectIds.length > 0);
  }
}

function updateInfoCard() {
  const cardLayer = document.querySelector("#infoCardLayer");
  const activeObjects = getActiveObjects();

  if (!cardLayer) {
    return;
  }

  cardLayer.innerHTML = "";

  if (activeObjects.length === 0) {
    removeAnchorDebugPoint();
    removeConnectorLine();
    return;
  }

  activeObjects.forEach(function (activeObject) {
    const infoCard = createInfoCard(activeObject);
    cardLayer.appendChild(infoCard);
    positionInfoCard(infoCard, activeObject);
    updateInfoCardAttachPoint(infoCard, activeObject);
  });

  updateAnchorDebugPoint(activeObjects[activeObjects.length - 1]);
  updateConnectorLine(activeObjects[activeObjects.length - 1]);
}

function getActiveObjects() {
  return activeObjectIds
    .map(function (objectId) {
      return objectData.find(function (objectItem) {
        return objectItem.id === objectId;
      });
    })
    .filter(Boolean);
}

function createInfoCard(activeObject) {
  const infoCard = document.createElement("article");
  const categoryElement = document.createElement("p");
  const titleElement = document.createElement("h2");
  const summaryElement = document.createElement("p");

  infoCard.classList.add("info-card");
  infoCard.dataset.objectId = activeObject.id;

  categoryElement.classList.add("info-card__category");
  categoryElement.textContent = activeObject.category;

  titleElement.classList.add("info-card__title");
  titleElement.textContent = activeObject.name;

  summaryElement.classList.add("info-card__summary");
  summaryElement.textContent = activeObject.summary;

  infoCard.appendChild(categoryElement);
  infoCard.appendChild(titleElement);
  infoCard.appendChild(summaryElement);

  return infoCard;
}

function getObjectAnchorPoint(activeObject) {
  const polygonOverlay = document.querySelector("#polygonOverlay");

  if (!polygonOverlay || !activeObject.anchor) {
    return null;
  }

  const overlayWidth = Number(polygonOverlay.getAttribute("width"));
  const overlayHeight = Number(polygonOverlay.getAttribute("height"));

  if (!overlayWidth || !overlayHeight) {
    return null;
  }

  return {
    x: activeObject.anchor[0] * overlayWidth,
    y: activeObject.anchor[1] * overlayHeight
  };
}

function updateAnchorDebugPoint(activeObject) {
  const polygonOverlay = document.querySelector("#polygonOverlay");
  const anchorPoint = getObjectAnchorPoint(activeObject);

  if (!polygonOverlay || !anchorPoint) {
    return;
  }

  removeAnchorDebugPoint();

  if (!DEBUG_ANCHOR) {
    return;
  }

  const anchorElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  anchorElement.setAttribute("cx", anchorPoint.x);
  anchorElement.setAttribute("cy", anchorPoint.y);
  anchorElement.setAttribute("r", 5);
  anchorElement.classList.add("anchor-debug-point");
  polygonOverlay.appendChild(anchorElement);
}

function removeAnchorDebugPoint() {
  const anchorElement = document.querySelector(".anchor-debug-point");

  if (anchorElement) {
    anchorElement.remove();
  }
}

function positionInfoCard(infoCard, activeObject) {
  const muralFrame = document.querySelector("#muralFrame");

  if (!muralFrame || !activeObject.cardPosition) {
    return;
  }

  const frameRect = muralFrame.getBoundingClientRect();
  const cardRect = infoCard.getBoundingClientRect();
  const safeGap = 16;
  const rawLeft = activeObject.cardPosition[0] * frameRect.width;
  const rawTop = activeObject.cardPosition[1] * frameRect.height;
  const maxLeft = Math.max(safeGap, frameRect.width - cardRect.width - safeGap);
  const maxTop = Math.max(safeGap, frameRect.height - cardRect.height - safeGap);
  const left = clamp(rawLeft, safeGap, maxLeft);
  const top = clamp(rawTop, safeGap, maxTop);

  infoCard.style.left = `${left}px`;
  infoCard.style.top = `${top}px`;
}

function getInfoCardAttachPoint(infoCard, activeObject) {
  const muralFrame = document.querySelector("#muralFrame");
  const anchorPoint = getObjectAnchorPoint(activeObject);

  if (!muralFrame || !anchorPoint) {
    return null;
  }

  const frameRect = muralFrame.getBoundingClientRect();
  const cardRect = infoCard.getBoundingClientRect();
  const cardLeft = cardRect.left - frameRect.left;
  const cardTop = cardRect.top - frameRect.top;
  const cardWidth = cardRect.width;
  const cardHeight = cardRect.height;
  const cardCenterX = cardLeft + cardWidth / 2;
  const cardCenterY = cardTop + cardHeight / 2;
  const connectFromHorizontalSide = Math.abs(anchorPoint.x - cardCenterX) > Math.abs(anchorPoint.y - cardCenterY);

  if (connectFromHorizontalSide) {
    return {
      x: anchorPoint.x < cardCenterX ? cardLeft : cardLeft + cardWidth,
      y: clamp(anchorPoint.y, cardTop + 12, cardTop + cardHeight - 12)
    };
  }

  return {
    x: clamp(anchorPoint.x, cardLeft + 12, cardLeft + cardWidth - 12),
    y: anchorPoint.y < cardCenterY ? cardTop : cardTop + cardHeight
  };
}

function updateInfoCardAttachPoint(infoCard, activeObject) {
  const attachPoint = getInfoCardAttachPoint(infoCard, activeObject);

  if (!attachPoint) {
    return;
  }

  infoCard.dataset.attachX = attachPoint.x;
  infoCard.dataset.attachY = attachPoint.y;
}

function updateConnectorLine(activeObject) {
  const polygonOverlay = document.querySelector("#polygonOverlay");
  const infoCard = document.querySelector(`.info-card[data-object-id="${activeObject.id}"]`);
  const anchorPoint = getObjectAnchorPoint(activeObject);

  removeConnectorLine();

  if (!polygonOverlay || !infoCard || !anchorPoint) {
    return;
  }

  const beamPoints = getInfoCardBeamPoints(infoCard, activeObject);

  if (!beamPoints) {
    return;
  }

  const gradientId = `connector-gradient-${activeObject.id}`;
  const gradientElement = createBeamGradient(gradientId, anchorPoint, beamPoints.center);
  const beamCone = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const topEdgeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const bottomEdgeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const anchorGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const cardGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  beamCone.setAttribute(
    "points",
    `${anchorPoint.x},${anchorPoint.y} ${beamPoints.top.x},${beamPoints.top.y} ${beamPoints.bottom.x},${beamPoints.bottom.y}`
  );
  beamCone.setAttribute("fill", `url(#${gradientId})`);
  beamCone.classList.add("connector-light-cone");

  setLinePosition(topEdgeLine, anchorPoint, beamPoints.top);
  topEdgeLine.style.setProperty("--beam-length", getLineLength(anchorPoint, beamPoints.top));
  topEdgeLine.classList.add("connector-edge-line");

  setLinePosition(bottomEdgeLine, anchorPoint, beamPoints.bottom);
  bottomEdgeLine.style.setProperty("--beam-length", getLineLength(anchorPoint, beamPoints.bottom));
  bottomEdgeLine.classList.add("connector-edge-line");

  anchorGlow.setAttribute("cx", anchorPoint.x);
  anchorGlow.setAttribute("cy", anchorPoint.y);
  anchorGlow.setAttribute("r", 5);
  anchorGlow.classList.add("connector-glow-dot");

  cardGlow.setAttribute("cx", beamPoints.center.x);
  cardGlow.setAttribute("cy", beamPoints.center.y);
  cardGlow.setAttribute("r", 5);
  cardGlow.classList.add("connector-glow-dot", "connector-glow-dot--small");

  polygonOverlay.appendChild(gradientElement);
  polygonOverlay.appendChild(beamCone);
  polygonOverlay.appendChild(topEdgeLine);
  polygonOverlay.appendChild(bottomEdgeLine);
  createBeamParticles(polygonOverlay, anchorPoint, beamPoints);
  polygonOverlay.appendChild(anchorGlow);
  polygonOverlay.appendChild(cardGlow);
}

function getInfoCardBeamPoints(infoCard, activeObject) {
  const muralFrame = document.querySelector("#muralFrame");
  const anchorPoint = getObjectAnchorPoint(activeObject);

  if (!muralFrame || !anchorPoint) {
    return null;
  }

  const frameRect = muralFrame.getBoundingClientRect();
  const cardRect = infoCard.getBoundingClientRect();
  const cardLeft = cardRect.left - frameRect.left;
  const cardTop = cardRect.top - frameRect.top;
  const cardWidth = cardRect.width;
  const cardHeight = cardRect.height;
  const cardCenterX = cardLeft + cardWidth / 2;
  const edgeX = anchorPoint.x < cardCenterX ? cardLeft : cardLeft + cardWidth;

  return {
    top: { x: edgeX, y: cardTop },
    center: { x: edgeX, y: cardTop + cardHeight / 2 },
    bottom: { x: edgeX, y: cardTop + cardHeight }
  };
}

function createBeamGradient(gradientId, anchorPoint, centerPoint) {
  const gradientElement = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  const stops = [
    { offset: "0%", color: "rgba(255, 244, 190, 0.55)" },
    { offset: "42%", color: "rgba(255, 218, 120, 0.22)" },
    { offset: "100%", color: "rgba(255, 199, 92, 0.06)" }
  ];

  gradientElement.setAttribute("id", gradientId);
  gradientElement.setAttribute("gradientUnits", "userSpaceOnUse");
  gradientElement.setAttribute("x1", anchorPoint.x);
  gradientElement.setAttribute("y1", anchorPoint.y);
  gradientElement.setAttribute("x2", centerPoint.x);
  gradientElement.setAttribute("y2", centerPoint.y);
  gradientElement.classList.add("connector-gradient");

  stops.forEach(function (stop) {
    const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stopElement.setAttribute("offset", stop.offset);
    stopElement.setAttribute("stop-color", stop.color);
    gradientElement.appendChild(stopElement);
  });

  return gradientElement;
}

function setLinePosition(lineElement, startPoint, endPoint) {
  lineElement.setAttribute("x1", startPoint.x);
  lineElement.setAttribute("y1", startPoint.y);
  lineElement.setAttribute("x2", endPoint.x);
  lineElement.setAttribute("y2", endPoint.y);
}

function createBeamParticles(polygonOverlay, startPoint, beamPoints) {
  const particleSettings = [
    { t: 0.16, spread: -0.62, r: 1.5, opacity: 0.68 },
    { t: 0.20, spread: -0.18, r: 1.2, opacity: 0.74 },
    { t: 0.24, spread: 0.34, r: 1.7, opacity: 0.7 },
    { t: 0.30, spread: -0.46, r: 1.1, opacity: 0.62 },
    { t: 0.34, spread: 0.04, r: 1.8, opacity: 0.66 },
    { t: 0.38, spread: 0.58, r: 1.2, opacity: 0.56 },
    { t: 0.44, spread: -0.72, r: 1.4, opacity: 0.5 },
    { t: 0.48, spread: -0.18, r: 1.0, opacity: 0.52 },
    { t: 0.52, spread: 0.28, r: 1.6, opacity: 0.48 },
    { t: 0.56, spread: 0.74, r: 1.1, opacity: 0.42 },
    { t: 0.62, spread: -0.54, r: 1.5, opacity: 0.38 },
    { t: 0.66, spread: -0.06, r: 1.0, opacity: 0.4 },
    { t: 0.70, spread: 0.44, r: 1.3, opacity: 0.34 },
    { t: 0.76, spread: -0.28, r: 1.1, opacity: 0.3 },
    { t: 0.80, spread: 0.16, r: 1.5, opacity: 0.28 },
    { t: 0.84, spread: 0.64, r: 1.0, opacity: 0.24 },
    { t: 0.90, spread: -0.42, r: 1.2, opacity: 0.2 },
    { t: 0.94, spread: 0.36, r: 0.9, opacity: 0.18 }
  ];

  particleSettings.forEach(function (particle) {
    const particleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const centerX = startPoint.x + (beamPoints.center.x - startPoint.x) * particle.t;
    const centerY = startPoint.y + (beamPoints.center.y - startPoint.y) * particle.t;
    const topX = startPoint.x + (beamPoints.top.x - startPoint.x) * particle.t;
    const topY = startPoint.y + (beamPoints.top.y - startPoint.y) * particle.t;
    const bottomX = startPoint.x + (beamPoints.bottom.x - startPoint.x) * particle.t;
    const bottomY = startPoint.y + (beamPoints.bottom.y - startPoint.y) * particle.t;
    const halfWidthX = (bottomX - topX) / 2;
    const halfWidthY = (bottomY - topY) / 2;
    const x = centerX + halfWidthX * particle.spread;
    const y = centerY + halfWidthY * particle.spread;

    particleElement.setAttribute("cx", x);
    particleElement.setAttribute("cy", y);
    particleElement.setAttribute("r", particle.r);
    particleElement.style.opacity = particle.opacity;
    particleElement.classList.add("connector-particle");
    polygonOverlay.appendChild(particleElement);
  });
}

function getLineLength(startPoint, endPoint) {
  const deltaX = endPoint.x - startPoint.x;
  const deltaY = endPoint.y - startPoint.y;
  return `${Math.sqrt(deltaX * deltaX + deltaY * deltaY)}px`;
}

function removeConnectorLine() {
  document
    .querySelectorAll(
      ".connector-line, .connector-edge-line, .connector-light-cone, .connector-gradient, .connector-glow-dot, .connector-particle"
    )
    .forEach(function (element) {
      element.remove();
    });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

document.addEventListener("click", function (event) {
  const polygonOverlay = document.querySelector("#polygonOverlay");
  const infoCardLayer = document.querySelector("#infoCardLayer");

  if (
    !polygonOverlay ||
    polygonOverlay.contains(event.target) ||
    (infoCardLayer && infoCardLayer.contains(event.target))
  ) {
    return;
  }

  clearActiveObject();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    clearActiveObject();
  }
});

window.addEventListener("resize", updateOverlaySize);
document.addEventListener("DOMContentLoaded", initializeApp);
