const fileInput = document.querySelector("#video-file");
const dropzone = document.querySelector("#dropzone");
const sourceInfo = document.querySelector("#source-info");
const sourcePreview = document.querySelector("#source-preview");
const startInput = document.querySelector("#start-time");
const lengthInput = document.querySelector("#clip-length");
const formatInput = document.querySelector("#clip-format");
const createButton = document.querySelector("#create-button");
const connectButton = document.querySelector("#connect-button");
const statusMessage = document.querySelector("#status-message");
const clientIdInput = document.querySelector("#client-id");

let source = null;
let previewUrl = null;
let clipUrl = null;
let accessToken = null;
let busy = false;
let metadataLoadId = 0;

clientIdInput.value = localStorage.getItem("youtubeOAuthClientId") || "";
clientIdInput.addEventListener("change", () => {
  localStorage.setItem("youtubeOAuthClientId", clientIdInput.value.trim());
});

function setStatus(message, kind = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${kind ? ` is-${kind}` : ""}`;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function setBusy(value, message = "") {
  busy = value;
  createButton.disabled = value || !source;
  document.querySelector("#remove-source").disabled = value;
  createButton.querySelector("#create-button-label").textContent = value ? "Working…" : "Clip & upload";
  if (message) setStatus(message, "busy");
}

function setSource(file) {
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    setStatus("Choose a supported video file.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024 * 1024) {
    setStatus("This file is larger than the 5 GB limit.", "error");
    return;
  }
  const loadId = ++metadataLoadId;
  source = { file, duration: 0 };
  fileInput.value = "";
  document.querySelector("#source-name").textContent = file.name;
  document.querySelector("#source-meta").textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · Reading video…`;
  sourceInfo.hidden = false;
  dropzone.hidden = true;
  sourcePreview.hidden = true;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  sourcePreview.src = previewUrl;
  sourcePreview.load();
  startInput.disabled = true;
  lengthInput.disabled = true;
  formatInput.disabled = true;
  createButton.disabled = true;
  document.querySelector("#result-panel").hidden = true;
  setStatus("Reading video locally…", "busy");

  sourcePreview.onloadedmetadata = () => {
    if (loadId !== metadataLoadId) return;
    if (!Number.isFinite(sourcePreview.duration) || sourcePreview.duration <= 0) {
      setStatus("This browser could not read the video's duration.", "error");
      return;
    }
    source.duration = sourcePreview.duration;
    document.querySelector("#source-meta").textContent =
      `${(file.size / (1024 * 1024)).toFixed(1)} MB · ${formatTime(source.duration)}`;
    document.querySelector("#timeline-duration").textContent = formatTime(source.duration);
    lengthInput.max = String(Math.min(180, Math.floor(source.duration) || 180));
    lengthInput.value = String(Math.min(Number(lengthInput.value), Number(lengthInput.max)));
    startInput.max = String(Math.max(0, Math.floor(source.duration - 1)));
    startInput.value = "0";
    sourcePreview.hidden = false;
    startInput.disabled = false;
    lengthInput.disabled = false;
    formatInput.disabled = false;
    createButton.disabled = false;
    updateTimeline();
    setStatus("Video ready. Set a moment and connect YouTube to continue.");
  };
  sourcePreview.onerror = () => {
    if (loadId === metadataLoadId) setStatus("This browser could not open that video. Try MP4, MOV, or WebM.", "error");
  };
}

fileInput.addEventListener("change", () => setSource(fileInput.files[0]));
for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
}
dropzone.addEventListener("drop", (event) => setSource(event.dataTransfer.files[0]));
document.querySelector("#remove-source").addEventListener("click", () => {
  metadataLoadId += 1;
  source = null;
  sourceInfo.hidden = true;
  sourcePreview.pause();
  sourcePreview.removeAttribute("src");
  sourcePreview.load();
  sourcePreview.hidden = true;
  dropzone.hidden = false;
  startInput.disabled = true;
  lengthInput.disabled = true;
  formatInput.disabled = true;
  createButton.disabled = true;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  if (clipUrl) URL.revokeObjectURL(clipUrl);
  clipUrl = null;
  setStatus("Choose a video to get started.");
});

startInput.addEventListener("input", updateTimeline);
lengthInput.addEventListener("input", updateTimeline);
function updateTimeline() {
  if (!source?.duration) return;
  const start = Math.max(0, Math.min(Number(startInput.value) || 0, source.duration));
  const duration = Math.max(1, Number(lengthInput.value) || 1);
  const left = Math.min(100, start / source.duration * 100);
  const width = Math.min(100 - left, duration / source.duration * 100);
  document.querySelector(".timeline-selection").style.left = `${left}%`;
  document.querySelector(".timeline-selection").style.width = `${width}%`;
  document.querySelector(".timeline-playhead").style.left = `${left}%`;
  document.querySelector(".timeline-labels span:first-child").textContent = formatTime(start);
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 0.05) {
      resolve();
      return;
    }
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Could not seek to that moment in the video."));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = time;
  });
}

async function recordClip(start, duration, format) {
  if (!window.MediaRecorder || typeof sourcePreview.captureStream !== "function") {
    throw new Error("Clip recording requires Google Chrome or Microsoft Edge.");
  }
  const canvas = document.createElement("canvas");
  const vertical = format === "vertical";
  canvas.width = vertical ? 720 : 1280;
  canvas.height = vertical ? 1280 : 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not start the video processor.");

  sourcePreview.pause();
  await seekTo(sourcePreview, start);
  const canvasStream = canvas.captureStream(30);
  const sourceStream = sourcePreview.captureStream();
  const tracks = [
    ...canvasStream.getVideoTracks(),
    ...sourceStream.getAudioTracks()
  ];
  if (!tracks.length) throw new Error("The browser could not capture this video.");
  const stream = new MediaStream(tracks);
  const mimeType = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm"
  ].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("This browser does not support WebM clip recording.");

  let recorder;
  let animationFrame;
  let safetyTimer;
  try {
    recorder = new MediaRecorder(stream, { mimeType });
  } catch {
    throw new Error("The browser could not initialize video recording.");
  }

  const chunks = [];
  const resultPromise = new Promise((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener("error", () => reject(new Error("The browser stopped recording unexpectedly.")), { once: true });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
      if (!blob.size) reject(new Error("The browser did not produce a video clip."));
      else resolve(blob);
    }, { once: true });
  });

  const drawFrame = () => {
    if (sourcePreview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const sourceWidth = sourcePreview.videoWidth;
      const sourceHeight = sourcePreview.videoHeight;
      const outputRatio = canvas.width / canvas.height;
      const sourceRatio = sourceWidth / sourceHeight;
      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      let cropX = 0;
      let cropY = 0;
      if (sourceRatio > outputRatio) {
        cropWidth = sourceHeight * outputRatio;
        cropX = (sourceWidth - cropWidth) / 2;
      } else {
        cropHeight = sourceWidth / outputRatio;
        cropY = (sourceHeight - cropHeight) / 2;
      }
      context.drawImage(
        sourcePreview,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, canvas.width, canvas.height
      );
    }
    if (recorder.state === "recording") {
      animationFrame = requestAnimationFrame(drawFrame);
    }
  };
  const stop = () => {
    if (recorder.state === "recording") recorder.stop();
    sourcePreview.pause();
  };
  const onTimeUpdate = () => {
    if (sourcePreview.currentTime >= start + duration || sourcePreview.ended) stop();
  };

  sourcePreview.addEventListener("timeupdate", onTimeUpdate);
  sourcePreview.addEventListener("ended", stop, { once: true });
  recorder.start(1000);
  drawFrame();
  safetyTimer = setTimeout(stop, (duration + 10) * 1000);
  try {
    await sourcePreview.play();
    const blob = await resultPromise;
    return blob;
  } catch (error) {
    if (recorder.state === "recording") recorder.stop();
    throw error;
  } finally {
    clearTimeout(safetyTimer);
    cancelAnimationFrame(animationFrame);
    sourcePreview.removeEventListener("timeupdate", onTimeUpdate);
    sourcePreview.removeEventListener("ended", stop);
    sourceStream.getTracks().forEach((track) => track.stop());
    canvasStream.getTracks().forEach((track) => track.stop());
  }
}

function requestJson(url, options = {}) {
  return fetch(url, options).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || body.error_description || body.message || `Request failed (${response.status}).`);
    return body;
  });
}

function updateChannelStatus(title, connected) {
  document.querySelector("#channel-label").textContent = connected ? title : "YouTube not connected";
  document.querySelector("#channel-status").textContent = connected
    ? "Connected for this session."
    : "Authorization is required to upload.";
  connectButton.textContent = connected ? "Reconnect" : "Connect";
}

connectButton.addEventListener("click", async () => {
  const clientId = clientIdInput.value.trim();
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    setStatus("Enter a valid Google OAuth client ID first.", "error");
    clientIdInput.focus();
    return;
  }
  if (!window.google?.accounts?.oauth2) {
    setStatus("Google sign-in did not load. Check your internet connection and reload.", "error");
    return;
  }
  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    callback: async (tokenResponse) => {
      if (tokenResponse.error || !tokenResponse.access_token) {
        setStatus(`Google authorization failed: ${tokenResponse.error_description || tokenResponse.error || "try again"}.`, "error");
        return;
      }
      accessToken = tokenResponse.access_token;
      try {
        const channel = await requestJson("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const title = channel.items?.[0]?.snippet?.title;
        if (!title) throw new Error("No YouTube channel was found for this Google account.");
        updateChannelStatus(title, true);
        setStatus(`Connected to ${title}. The clip will upload after processing.`);
      } catch (error) {
        accessToken = null;
        updateChannelStatus("", false);
        setStatus(error.message, "error");
      }
    },
    error_callback: (error) => setStatus(`Google sign-in failed: ${error.message || error.type}.`, "error")
  });
  tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
});

function uploadToYoutube(uploadUrl, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", blob.type || "video/webm");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    });
    request.addEventListener("error", () => reject(new Error("Network error while uploading. The clip is available to retry.")));
    request.addEventListener("load", () => {
      let body = {};
      try { body = JSON.parse(request.responseText); } catch {}
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(body.error?.message || `YouTube upload failed (${request.status}). The clip is available to retry.`));
      } else if (!body.id) {
        reject(new Error("YouTube finished the upload but did not return a video ID."));
      } else {
        resolve(body.id);
      }
    }, { once: true });
    request.send(blob);
  });
}

createButton.addEventListener("click", async () => {
  if (busy || !source) return;
  if (!accessToken) {
    setStatus("Connect your YouTube account before creating and uploading a clip.", "error");
    connectButton.focus();
    return;
  }
  const start = Number(startInput.value);
  const duration = Number(lengthInput.value);
  if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) ||
      duration < 1 || duration > 180 || start + duration > source.duration) {
    setStatus("Choose a valid start time and a clip that fits within your video (1–180 seconds).", "error");
    return;
  }
  const titleInput = document.querySelector("#video-title");
  const title = titleInput.value.trim() || source.file.name.replace(/\.[^.]+$/, "").slice(0, 100);
  if (title.length > 100) {
    setStatus("YouTube titles must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  document.querySelector("#result-panel").hidden = true;
  setBusy(true, "Recording the selected clip in your browser…");
  try {
    const blob = await recordClip(start, duration, formatInput.value);
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    clipUrl = URL.createObjectURL(blob);
    const downloadLink = document.querySelector("#download-link");
    downloadLink.href = clipUrl;
    downloadLink.download = `${title.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").slice(0, 90) || "clip"}.webm`;
    document.querySelector("#result-panel").hidden = false;
    document.querySelector("#result-title").textContent = "Clip created — starting upload";
    document.querySelector("#result-description").textContent = "The original video never leaves your browser.";
    setStatus("Preparing the official YouTube upload…", "busy");

    const metadata = {
      snippet: {
        title,
        description: document.querySelector("#video-description").value,
        categoryId: "22"
      },
      status: {
        privacyStatus: document.querySelector("#visibility").value,
        selfDeclaredMadeForKids: document.querySelector("#made-for-kids").checked
      }
    };
    const initialization = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(blob.size),
          "X-Upload-Content-Type": blob.type || "video/webm"
        },
        body: JSON.stringify(metadata)
      }
    );
    if (!initialization.ok) {
      const errorBody = await initialization.json().catch(() => ({}));
      if (initialization.status === 401) {
        accessToken = null;
        updateChannelStatus("", false);
      }
      throw new Error(errorBody.error?.message || `YouTube could not start the upload (${initialization.status}).`);
    }
    const uploadUrl = initialization.headers.get("Location");
    if (!uploadUrl) throw new Error("YouTube did not return an upload URL.");
    setStatus("Uploading your clip to YouTube… 0%", "busy");
    const videoId = await uploadToYoutube(uploadUrl, blob, (progress) => {
      setStatus(`Uploading your clip to YouTube… ${progress}%`, "busy");
    });
    const youtubeLink = document.querySelector("#youtube-link");
    youtubeLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    youtubeLink.hidden = false;
    document.querySelector("#result-title").textContent = "Your clip is on YouTube";
    document.querySelector("#result-description").textContent =
      `${title} · ${document.querySelector("#visibility").selectedOptions[0].textContent.split(" · ")[0]}`;
    setStatus("Upload complete.", "success");
  } catch (error) {
    if (/401|invalid credentials|invalid_grant|token/i.test(error.message)) {
      accessToken = null;
      updateChannelStatus("", false);
    }
    document.querySelector("#result-panel").hidden = false;
    document.querySelector("#result-title").textContent = "Clip created — upload needs attention";
    document.querySelector("#result-description").textContent = error.message;
    document.querySelector("#youtube-link").hidden = true;
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
});
