(() => {
  // ===== Регистрация service worker =====
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", {scope: "/"})
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW register error:", err));
    });
  }

  // ===== Баннер «нет интернета» =====
  const STYLE = `
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 10px 16px;
      background: #b3261e;
      color: #fff;
      font-size: 14px;
      line-height: 1.35;
      text-align: center;
      transform: translateY(-100%);
      transition: transform .25s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
    }
    .offline-banner.is-visible { transform: translateY(0); }
  `;

  const styleEl = document.createElement("style");
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  const banner = document.createElement("div");
  banner.className = "offline-banner";
  banner.setAttribute("role", "status");
  banner.textContent = "Нет подключения к интернету — данные могут быть неактуальны. Уточните у официанта.";

  function mount() {
    if (!banner.isConnected) document.body.appendChild(banner);
  }

  function update() {
    mount();
    if (navigator.onLine) {
      banner.classList.remove("is-visible");
    } else {
      banner.classList.add("is-visible");
    }
  }

  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  if (document.readyState !== "loading") {
    update();
  } else {
    document.addEventListener("DOMContentLoaded", update);
  }
})();