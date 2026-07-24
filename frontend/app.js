const video = document.getElementById("video");
const previewImage = document.getElementById("previewImage");
const overlay = document.getElementById("overlay");
const captureCanvas = document.getElementById("captureCanvas");
const emptyState = document.getElementById("emptyState");
const statusPill = document.getElementById("statusPill");
const cameraButton = document.getElementById("cameraButton");
const captureButton = document.getElementById("captureButton");
const liveToggle = document.getElementById("liveToggle");
const fileInput = document.getElementById("fileInput");
const primaryEmotion = document.getElementById("primaryEmotion");
const primaryConfidence = document.getElementById("primaryConfidence");
const faceCount = document.getElementById("faceCount");
const latency = document.getElementById("latency");
const probabilityList = document.getElementById("probabilityList");

const emotions = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"];

let stream = null;
let liveTimer = null;
let isAnalyzing = false;
let activeSource = "none";

function setStatus(message, busy = false) {
  statusPill.textContent = message;
  statusPill.classList.toggle("is-busy", busy);
}

function setEmptyState(visible) {
  emptyState.classList.toggle("is-hidden", !visible);
}

function createProbabilityRows(probabilities = {}) {
  probabilityList.innerHTML = "";

  emotions.forEach((emotion) => {
    const value = Number(probabilities[emotion] || 0);
    const row = document.createElement("div");
    row.className = "probability-row";
    row.innerHTML = `
      <div class="probability-label">
        <span>${emotion}</span>
        <span>${value.toFixed(2)}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.min(value, 100)}%"></div>
      </div>
    `;
    probabilityList.appendChild(row);
  });
}

function resetResults(message = "No face detected") {
  primaryEmotion.textContent = message;
  primaryConfidence.textContent = "Waiting for input";
  faceCount.textContent = "0";
  latency.textContent = "-- ms";
  createProbabilityRows();
  clearOverlay();
}

function clearOverlay() {
  const context = overlay.getContext("2d");
  context.clearRect(0, 0, overlay.width, overlay.height);
}

function sizeOverlayToStage() {
  const rect = overlay.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  overlay.width = Math.round(rect.width * scale);
  overlay.height = Math.round(rect.height * scale);
  return { width: overlay.width, height: overlay.height, scale };
}

function getRenderedMediaBox(naturalWidth, naturalHeight) {
  const rect = overlay.getBoundingClientRect();
  const containerRatio = rect.width / rect.height;
  const mediaRatio = naturalWidth / naturalHeight;

  if (mediaRatio > containerRatio) {
    const width = rect.width;
    const height = width / mediaRatio;
    return { x: 0, y: (rect.height - height) / 2, width, height };
  }

  const height = rect.height;
  const width = height * mediaRatio;
  return { x: (rect.width - width) / 2, y: 0, width, height };
}

function drawDetections(detections, image) {
  const { scale } = sizeOverlayToStage();
  const context = overlay.getContext("2d");
  context.clearRect(0, 0, overlay.width, overlay.height);
  context.scale(scale, scale);

  const mediaBox = getRenderedMediaBox(image.width, image.height);
  const scaleX = mediaBox.width / image.width;
  const scaleY = mediaBox.height / image.height;

  detections.forEach((detection) => {
    const box = detection.box;
    const x = mediaBox.x + box.x * scaleX;
    const y = mediaBox.y + box.y * scaleY;
    const width = box.width * scaleX;
    const height = box.height * scaleY;
    const label = `${detection.emotion} ${detection.confidence.toFixed(1)}%`;

    context.lineWidth = 3;
    context.strokeStyle = "#22c55e";
    context.strokeRect(x, y, width, height);

    context.font = "700 15px system-ui, sans-serif";
    const textWidth = context.measureText(label).width;
    const labelY = Math.max(y - 30, 8);
    context.fillStyle = "#0f766e";
    context.fillRect(x, labelY, textWidth + 18, 26);
    context.fillStyle = "#ffffff";
    context.fillText(label, x + 9, labelY + 18);
  });

  context.setTransform(1, 0, 0, 1, 0, 0);
}

function captureCurrentFrame() {
  const source = activeSource === "upload" ? previewImage : video;
  const width = source.videoWidth || source.naturalWidth;
  const height = source.videoHeight || source.naturalHeight;

  if (!width || !height) {
    throw new Error("No image frame is available yet.");
  }

  captureCanvas.width = width;
  captureCanvas.height = height;
  captureCanvas.getContext("2d").drawImage(source, 0, 0, width, height);
  return captureCanvas.toDataURL("image/jpeg", 0.88);
}

async function analyzeFrame() {
  if (isAnalyzing) return;

  isAnalyzing = true;
  const startedAt = performance.now();
  setStatus("Analyzing", true);

  try {
    const image = captureCurrentFrame();
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Prediction failed.");
    }

    const detections = result.detections || [];
    const topDetection = detections[0];
    faceCount.textContent = String(detections.length);
    latency.textContent = `${Math.round(performance.now() - startedAt)} ms`;

    if (topDetection) {
      primaryEmotion.textContent = topDetection.emotion;
      primaryConfidence.textContent = `${topDetection.confidence.toFixed(2)}% confidence`;
      createProbabilityRows(topDetection.probabilities);
    } else {
      primaryEmotion.textContent = "No face detected";
      primaryConfidence.textContent = "Try brighter, front-facing lighting";
      createProbabilityRows();
    }

    drawDetections(detections, result.image);
    setStatus("Ready");
  } catch (error) {
    setStatus("Error");
    primaryEmotion.textContent = "Prediction failed";
    primaryConfidence.textContent = error.message;
    clearOverlay();
  } finally {
    isAnalyzing = false;
  }
}

async function startCamera() {
  if (stream) {
    stopCamera();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });

    video.srcObject = stream;
    video.classList.remove("is-hidden");
    previewImage.classList.remove("is-visible");
    await video.play();

    activeSource = "camera";
    cameraButton.textContent = "Stop camera";
    captureButton.disabled = false;
    liveToggle.disabled = false;
    setEmptyState(false);
    setStatus("Camera active");
    resetResults();
  } catch (error) {
    setStatus("Camera blocked");
    primaryEmotion.textContent = "Camera unavailable";
    primaryConfidence.textContent = error.message;
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  activeSource = previewImage.classList.contains("is-visible") ? "upload" : "none";
  cameraButton.textContent = "Start camera";
  liveToggle.checked = false;
  liveToggle.disabled = activeSource !== "camera";
  stopLive();
  captureButton.disabled = activeSource === "none";
  setEmptyState(activeSource === "none");
  setStatus("Ready");
}

function startLive() {
  stopLive();
  liveTimer = window.setInterval(analyzeFrame, 900);
  analyzeFrame();
}

function stopLive() {
  if (liveTimer) {
    window.clearInterval(liveTimer);
    liveTimer = null;
  }
}

cameraButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", analyzeFrame);

liveToggle.addEventListener("change", () => {
  if (liveToggle.checked) {
    startLive();
  } else {
    stopLive();
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  stopCamera();
  const url = URL.createObjectURL(file);
  previewImage.onload = () => {
    URL.revokeObjectURL(url);
    activeSource = "upload";
    captureButton.disabled = false;
    liveToggle.disabled = true;
    video.classList.add("is-hidden");
    previewImage.classList.add("is-visible");
    setEmptyState(false);
    setStatus("Image loaded");
    resetResults();
    analyzeFrame();
  };
  previewImage.src = url;
});

window.addEventListener("resize", () => {
  clearOverlay();
});

createProbabilityRows();
