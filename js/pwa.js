const CACHE_VERSION = "v1";

function updateNetworkStatus() {
  let badge = document.getElementById("network-status");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "network-status";
    badge.className = "network-status";
    document.body.appendChild(badge);
  }
  const online = navigator.onLine;
  badge.textContent = online ? "Online" : "Offline";
  badge.classList.toggle("offline", !online);
}

function initPwa() {
  updateNetworkStatus();
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  if ("serviceWorker" in navigator) {
    const swUrl = new URL("../sw.js", import.meta.url);
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn(`Service worker registration failed (${CACHE_VERSION}):`, error);
    });
  }
}

export { initPwa };
