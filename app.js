function initializeApp() {
  console.log("Mural AR Demo initialized.");
  showMuralImageWhenAvailable();
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
  });

  muralImage.addEventListener("error", function () {
    muralImage.hidden = true;
    missingMessage.hidden = false;
  });
}

document.addEventListener("DOMContentLoaded", initializeApp);
