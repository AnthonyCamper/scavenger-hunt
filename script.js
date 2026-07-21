/* ============================================================
   SCAVENGER HUNT — script.js
   UI + wiring. All decision logic lives in logic.js so it can
   be unit tested; this file should stay boring on purpose.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CONFIG = window.HUNT_CONFIG;
  const LOGIC = window.HuntLogic;

  const STORAGE_KEY = "scavenger_state";
  const FINISH_KEY = "scavenger_finish_time";

  // ─── State ────────────────────────────────────────────────────────────────
  let team = null;          // 'guys' | 'girls' — the logged-in team
  let pendingTeam = null;   // team chosen on the landing screen, pre-login
  let clueIndex = 0;
  let isChecking = false;
  let clueSolved = false;   // current clue has been found — safe to show the pin
  let resetTapCount = 0;
  let resetTapTimer = null;
  let wakeLock = null;

  // Map state
  let huntMap = null;
  let targetMarker = null;
  let targetCircle = null;
  let userMarker = null;
  let dirArrow = null;
  let dirArrowHead = null;
  let tilesFailed = false;

  // ─── Storage (never let a private-browsing quota error kill the app) ───────
  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false; // Private Browsing / quota — the hunt continues in memory.
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  }

  function save() {
    storageSet(STORAGE_KEY, JSON.stringify({ team, clueIndex }));
  }

  function resetProgress() {
    storageRemove(STORAGE_KEY);
    storageRemove(FINISH_KEY);
    team = null;
    pendingTeam = null;
    clueIndex = 0;
    hideHitOverlay();
    closeMapOverlay();
    releaseWakeLock();
    showLanding();
  }

  // ─── Theme ────────────────────────────────────────────────────────────────
  const THEME_COLORS = { guys: "#0e0e0e", girls: "#fdf6f9", neutral: "#0e0e0e" };

  function applyTheme(t) {
    const name = t === "girls" ? "girls" : t === "guys" ? "guys" : "neutral";
    document.body.className = `theme-${name}`;
    const meta = $("meta-theme-color");
    if (meta) meta.content = THEME_COLORS[name];
    spawnAmbient(name);
  }

  function accentColor() {
    return team === "girls" ? "#b8967e" : "#f0b429";
  }

  // ─── Screen routing ───────────────────────────────────────────────────────
  function setActive(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = $(id);
    if (el) el.classList.add("active");
  }

  function showLanding() {
    applyTheme(null);
    setActive("screen-landing");
  }

  function showLogin(t) {
    pendingTeam = t;
    applyTheme(t);
    updateLoginUI(t);
    $("error-msg").textContent = "";
    $("password-input").value = "";
    setActive("screen-login");
    // Deliberately not autofocusing: on iOS that yanks the keyboard up and
    // hides the team confirmation the player just tapped.
  }

  function showHunt() {
    setActive("screen-hunt");
    renderClue();
    requestWakeLock();
  }

  function showFinale(saveTimestamp = true) {
    if (saveTimestamp && !storageGet(FINISH_KEY)) {
      storageSet(FINISH_KEY, new Date().toISOString());
    }
    setActive("screen-finale");
    renderFinale();
    releaseWakeLock();
    launchConfetti();
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    if (!CONFIG || !LOGIC) {
      document.body.innerHTML =
        '<div style="padding:2rem;font:16px system-ui;color:#e8e8e8;background:#0e0e0e;height:100%">' +
        "<b>The hunt failed to load.</b><br><br>Close the tab completely and reopen the link.</div>";
      return;
    }

    wireLanding();
    wireLogin();
    wireHunt();

    const saved = LOGIC.validateSave(storageGet(STORAGE_KEY), CONFIG.clues.length);
    if (saved) {
      team = saved.team;
      clueIndex = saved.clueIndex;
      applyTheme(team);
      if (clueIndex >= CONFIG.clues.length) showFinale(false);
      else showHunt();
    } else {
      showLanding();
    }
  }

  // ─── Landing wiring ───────────────────────────────────────────────────────
  function wireLanding() {
    document.querySelectorAll(".team-choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = btn.getAttribute("data-team");
        if (!LOGIC.TEAMS.includes(chosen)) return;
        showLogin(chosen);
      });
    });
  }

  // ─── Login wiring ─────────────────────────────────────────────────────────
  function wireLogin() {
    const form = $("login-form");
    const input = $("password-input");
    const toggleBtn = $("toggle-pw");

    toggleBtn.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      toggleBtn.textContent = showing ? "👁" : "🙈";
      toggleBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });

    $("login-back-btn").addEventListener("click", () => {
      pendingTeam = null;
      $("password-input").value = "";
      $("error-msg").textContent = "";
      showLanding();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Scoped to the team chosen on the landing screen. There is no path from
      // here to the admin credential.
      if (!LOGIC.passwordMatches(CONFIG, pendingTeam, input.value)) {
        showLoginError();
        return;
      }
      team = pendingTeam;
      clueIndex = 0;
      applyTheme(team);
      save();
      input.blur(); // drop the mobile keyboard before transitioning
      setTimeout(showHunt, 120);
    });
  }

  function updateLoginUI(t) {
    const th = CONFIG.themes[t];
    if (!th) return;
    $("login-label").textContent = th.loginLabel;
    $("password-input").placeholder = th.loginPlaceholder;
    $("login-btn").textContent = th.loginButton;
    $("login-icon").textContent = t === "girls" ? "💕" : "🎯";
    $("login-title").textContent = t === "girls" ? "The Hunt Is On" : "THE HUNT IS ON";
    $("login-subtitle").textContent =
      t === "girls" ? "Team Girls — enter your password." : "Team Guys — enter your access code.";
  }

  function showLoginError() {
    const th = pendingTeam ? CONFIG.themes[pendingTeam] : null;
    const errEl = $("error-msg");
    const input = $("password-input");
    errEl.textContent = th ? th.loginError : "Wrong code. Try again.";
    input.classList.remove("shake");
    void input.offsetWidth; // force reflow so the animation restarts
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 500);
    input.value = "";
    input.focus();
    if (navigator.vibrate) navigator.vibrate(60);
  }

  // ─── Hunt wiring ──────────────────────────────────────────────────────────
  function wireHunt() {
    $("check-btn").addEventListener("click", handleLocationCheck);
    $("next-btn").addEventListener("click", advanceClue);
    $("map-btn").addEventListener("click", openMapOverlay);
    $("hit-map-btn").addEventListener("click", openMapOverlay);
    $("map-close-btn").addEventListener("click", closeMapOverlay);
    $("map-locate-btn").addEventListener("click", locateAndOrient);

    $("reset-tap-zone").addEventListener("click", () => {
      resetTapCount++;
      clearTimeout(resetTapTimer);
      if (resetTapCount >= 5) {
        resetTapCount = 0;
        if (confirm("Reset all progress and return to team selection?")) resetProgress();
      } else {
        resetTapTimer = setTimeout(() => { resetTapCount = 0; }, 2000);
      }
    });

    // Re-acquire the screen wake lock when returning from the lock screen.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && $("screen-hunt").classList.contains("active")) {
        requestWakeLock();
      }
    });
  }

  // ─── Screen wake lock (phones locking mid-hunt is a real annoyance) ────────
  function requestWakeLock() {
    if (!("wakeLock" in navigator) || wakeLock) return;
    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        wakeLock = lock;
        lock.addEventListener("release", () => { wakeLock = null; });
      })
      .catch(() => { wakeLock = null; }); // unsupported or denied — harmless
  }

  function releaseWakeLock() {
    if (wakeLock) {
      try { wakeLock.release(); } catch { /* already gone */ }
      wakeLock = null;
    }
  }

  // ─── Map overlay ──────────────────────────────────────────────────────────
  function mapAvailable() {
    return typeof window.L !== "undefined" && window.L && typeof window.L.map === "function";
  }

  function openMapOverlay() {
    if (!mapAvailable()) {
      $("hint-text").textContent =
        "🗺 The map couldn't load. Location checking still works — use Check Location.";
      return;
    }

    $("map-overlay").classList.remove("hidden");

    if (!huntMap) {
      try {
        huntMap = L.map("hunt-map", { zoomControl: true, attributionControl: true });
        const tiles = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Tiles &copy; Esri", maxZoom: 19 }
        );
        tiles.on("tileerror", () => {
          if (tilesFailed) return;
          tilesFailed = true;
          $("map-hint-text").textContent =
            "Map tiles need signal — the arrow and distance below still work offline.";
        });
        tiles.addTo(huntMap);
      } catch {
        huntMap = null;
        closeMapOverlay();
        $("hint-text").textContent =
          "🗺 The map couldn't start. Use Check Location instead — it still works.";
        return;
      }
    }

    const clue = CONFIG.clues[clueIndex];
    $("map-topbar-title").textContent = `${clue.emoji || ""} ${clue.title}`.trim();
    $("map-hint-text").textContent = "Locating you…";

    setTimeout(() => {
      if (!huntMap) return;
      huntMap.invalidateSize();
      huntMap.setView([38.055, -77.795], 12); // whole-lake view while GPS fires
      // Opening the map after solving should show the pin straight away —
      // otherwise the reveal is only ever visible to players who happened to
      // already have the map open.
      if (clueSolved) revealTargetOnMap();
      locateAndOrient();
    }, 60);
  }

  function closeMapOverlay() {
    $("map-overlay").classList.add("hidden");
  }

  function locateAndOrient() {
    if (!huntMap) return;
    if (!navigator.geolocation) {
      $("map-hint-text").textContent = "Location isn't available on this device.";
      return;
    }

    const locateBtn = $("map-locate-btn");
    locateBtn.textContent = "Locating…";
    locateBtn.disabled = true;
    $("map-hint-text").textContent = "Locating you…";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locateBtn.textContent = "Relocate";
        locateBtn.disabled = false;
        if (!huntMap) return;

        const { latitude, longitude, accuracy } = pos.coords;
        const clue = CONFIG.clues[clueIndex];
        const dist = LOGIC.haversine(latitude, longitude, clue.lat, clue.lng);
        const bearing = LOGIC.bearingTo(latitude, longitude, clue.lat, clue.lng);
        const dir = LOGIC.cardinalDir(bearing);
        const radius = clue.radius ?? CONFIG.HIT_RADIUS_METERS;
        const verdict = LOGIC.evaluateLocation({ distance: dist, accuracy, radius });

        // User dot
        if (userMarker) huntMap.removeLayer(userMarker);
        userMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "",
            html: '<div class="map-user-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(huntMap);

        clearDirectionArrow();

        if (!verdict.hit && !clueSolved) {
          const arrowLen = Math.min(dist * 0.3, 120); // never overshoots the target
          const tip = LOGIC.destPoint(latitude, longitude, bearing, arrowLen);
          const accent = accentColor();

          dirArrow = L.polyline([[latitude, longitude], tip], {
            color: accent, weight: 3, dashArray: "8 6", opacity: 0.85,
          }).addTo(huntMap);

          dirArrowHead = L.marker(tip, {
            icon: L.divIcon({
              className: "",
              html: `<div class="map-arrow-head" style="transform:rotate(${bearing}deg);color:${accent}"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }).addTo(huntMap);
        }

        $("map-hint-text").textContent = clueSolved
          ? "Target confirmed — nice work!"
          : verdict.hit
          ? "Right on it — hit Check Location now!"
          : `${LOGIC.dirArrowEmoji(dir)} Head ${LOGIC.dirWord(dir)} — ~${LOGIC.formatDistance(dist)} away`;

        huntMap.setView([latitude, longitude], 15);
      },
      (err) => {
        locateBtn.textContent = "Relocate";
        locateBtn.disabled = false;
        $("map-hint-text").textContent = geoErrorMessage(err, true);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  function clearDirectionArrow() {
    if (dirArrow) { huntMap.removeLayer(dirArrow); dirArrow = null; }
    if (dirArrowHead) { huntMap.removeLayer(dirArrowHead); dirArrowHead = null; }
  }

  // Only after a confirmed hit — before that, the pin would give the answer away.
  function revealTargetOnMap() {
    if (!huntMap) return;
    clearDirectionArrow();

    const clue = CONFIG.clues[clueIndex];
    const radius = clue.radius ?? CONFIG.HIT_RADIUS_METERS;
    const accent = accentColor();

    if (targetMarker) { huntMap.removeLayer(targetMarker); targetMarker = null; }
    if (targetCircle) { huntMap.removeLayer(targetCircle); targetCircle = null; }

    targetCircle = L.circle([clue.lat, clue.lng], {
      radius, color: accent, fillColor: accent, fillOpacity: 0.18, weight: 2,
    }).addTo(huntMap);

    targetMarker = L.marker([clue.lat, clue.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="map-pin-icon">${clue.emoji || "📍"}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    }).addTo(huntMap);

    $("map-hint-text").textContent = "Target confirmed — nice work!";
    if (userMarker) {
      huntMap.fitBounds([userMarker.getLatLng(), [clue.lat, clue.lng]], { padding: [50, 50] });
    } else {
      huntMap.setView([clue.lat, clue.lng], 15);
    }
  }

  // ─── Clue rendering ───────────────────────────────────────────────────────
  function renderClue() {
    const clue = CONFIG.clues[clueIndex];
    const th = CONFIG.themes[team];
    if (!clue || !th) return;
    const total = CONFIG.clues.length;

    $("team-badge").textContent = th.name;
    $("progress-label").textContent = th.progressLabel;
    $("progress-count").textContent = `${clueIndex + 1} / ${total}`;
    $("progress-bar-fill").style.width = `${(clueIndex / total) * 100}%`;

    $("clue-emoji").textContent = clue.emoji || "📍";
    $("clue-label").textContent = th.clueLabel;
    $("clue-title").textContent = clue.title;
    $("clue-text").textContent = clue.clue;

    $("check-btn").textContent = th.checkButton;
    $("check-btn").classList.remove("loading");
    $("check-btn").disabled = false;
    $("hint-text").textContent = "";

    hideHitOverlay();
    isChecking = false;
    clueSolved = false;
  }

  // ─── Location check ───────────────────────────────────────────────────────
  function handleLocationCheck() {
    if (isChecking) return;

    if (!navigator.geolocation) {
      $("hint-text").textContent = "This browser can't do location. Try Safari or Chrome.";
      return;
    }

    isChecking = true;
    const th = CONFIG.themes[team];
    $("check-btn").textContent = th.checkingButton;
    $("check-btn").classList.add("loading");
    $("check-btn").disabled = true;
    $("hint-text").textContent = "";

    navigator.geolocation.getCurrentPosition(onPositionSuccess, onPositionError, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  }

  function restoreCheckButton() {
    const th = CONFIG.themes[team];
    isChecking = false;
    $("check-btn").textContent = th.checkButton;
    $("check-btn").classList.remove("loading");
    $("check-btn").disabled = false;
  }

  function onPositionSuccess(pos) {
    restoreCheckButton();

    const { latitude, longitude, accuracy } = pos.coords;
    const clue = CONFIG.clues[clueIndex];
    const radius = clue.radius ?? CONFIG.HIT_RADIUS_METERS;
    const dist = LOGIC.haversine(latitude, longitude, clue.lat, clue.lng);
    const verdict = LOGIC.evaluateLocation({ distance: dist, accuracy, radius });

    if (verdict.hit) onHit();
    else onMiss(dist, radius, verdict);
  }

  function onPositionError(err) {
    restoreCheckButton();
    $("hint-text").textContent = geoErrorMessage(err, false);
  }

  function geoErrorMessage(err, terse) {
    const code = err && err.code;
    if (code === 1) {
      return terse
        ? "Location denied — enable it in Settings."
        : "📵 Location is blocked. On iPhone: Settings → Safari → Location → Allow, then reload.";
    }
    if (code === 2) {
      return terse
        ? "Couldn't get a fix — try again in open water."
        : "📡 Couldn't get a fix. Move out from under cover and try again.";
    }
    if (code === 3) {
      return terse ? "Timed out — tap Relocate." : "⏱ Location timed out — tap the button again.";
    }
    return terse ? "Couldn't get location." : "Couldn't get your location. Try again.";
  }

  function onHit() {
    const th = CONFIG.themes[team];
    clueSolved = true;
    if (navigator.vibrate) navigator.vibrate([80, 60, 120]);

    const total = CONFIG.clues.length;
    $("progress-bar-fill").style.width = `${((clueIndex + 1) / total) * 100}%`;

    $("hit-icon").textContent = team === "girls" ? "✦" : "🎯";
    $("hit-title").textContent = th.hitMessage;
    $("hit-subtitle").textContent = th.hitSubtitle;
    $("next-btn").textContent = th.nextButton;
    $("hit-overlay").classList.remove("hidden");

    revealTargetOnMap();
    launchConfetti();
  }

  function onMiss(dist, radius, verdict) {
    const th = CONFIG.themes[team];
    let msg = th[LOGIC.missTier(dist, radius)];
    // Weak signal is worth mentioning, but it never blocks the attempt.
    if (verdict && verdict.weakSignal) {
      msg += ` (GPS is fuzzy right now — ±${Math.round(verdict.accuracy)}m.)`;
    }
    $("hint-text").textContent = msg;
    if (navigator.vibrate) navigator.vibrate(80);
  }

  function hideHitOverlay() {
    $("hit-overlay").classList.add("hidden");
  }

  // ─── Advance ──────────────────────────────────────────────────────────────
  function advanceClue() {
    clueIndex++;
    save();
    closeMapOverlay();

    // A new clue means a new target: drop the revealed pin from the last one.
    if (huntMap) {
      if (targetMarker) { huntMap.removeLayer(targetMarker); targetMarker = null; }
      if (targetCircle) { huntMap.removeLayer(targetCircle); targetCircle = null; }
      clearDirectionArrow();
    }

    if (clueIndex >= CONFIG.clues.length) {
      showFinale();
      return;
    }

    const card = $("clue-card");
    card.style.transition = "opacity 0.25s";
    card.style.opacity = "0";
    hideHitOverlay();
    setTimeout(() => {
      renderClue();
      card.style.opacity = "1";
    }, 280);
  }

  // ─── Finale ───────────────────────────────────────────────────────────────
  function renderFinale() {
    const th = CONFIG.themes[team];
    if (!th) return;
    $("finale-icon").textContent = team === "girls" ? "🌸" : "🏆";
    $("finale-title").textContent = th.finaleTitle;
    $("finale-message").textContent = th.finaleMessage;

    const ts = storageGet(FINISH_KEY);
    if (ts) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        $("finale-time").textContent = `Finished: ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    }
  }

  // ─── Confetti ─────────────────────────────────────────────────────────────
  function launchConfetti() {
    if (typeof window.confetti !== "function") return;
    // Respect reduced-motion; a burst of particles is exactly what that setting
    // is asking us not to do.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const presets = {
      girls: {
        particleCount: 35, spread: 65, startVelocity: 22, ticks: 320,
        colors: ["#e8d4c8", "#b8967e", "#ffffff", "#d4b09a", "#c8b8b0"],
        shapes: ["circle"], gravity: 0.45, scalar: 0.9, drift: 0.3,
      },
      guys: {
        particleCount: 80, spread: 70, startVelocity: 45, ticks: 250,
        colors: ["#f0b429", "#ffffff", "#ffe08a", "#d49e1f"],
        shapes: ["square", "circle"], gravity: 0.8,
      },
    };
    const d = presets[team === "girls" ? "girls" : "guys"];

    try {
      confetti({ ...d, origin: { x: 0.25, y: 0.5 } });
      setTimeout(() => confetti({ ...d, origin: { x: 0.75, y: 0.45 } }), 200);
      setTimeout(() => confetti({ ...d, particleCount: Math.round(d.particleCount * 0.6), origin: { x: 0.5, y: 0.55 } }), 400);
    } catch {
      /* confetti is decoration — never let it break the hunt */
    }
  }

  // ─── Ambient background ───────────────────────────────────────────────────
  function spawnAmbient(themeName) {
    const containers = ["ambient-bg", "ambient-bg-hunt", "ambient-bg-finale", "ambient-bg-landing"];
    if (themeName !== "girls") {
      containers.forEach((cid) => { const el = $(cid); if (el) el.innerHTML = ""; });
      return;
    }

    const symbols = ["✦", "·", "✧", "◦", "✦", "·"];
    containers.forEach((cid) => {
      const el = $(cid);
      if (!el) return;
      el.innerHTML = "";
      for (let i = 0; i < 10; i++) {
        const petal = document.createElement("span");
        petal.className = "petal";
        petal.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.fontSize = `${0.7 + Math.random() * 0.8}rem`;
        const dur = 8 + Math.random() * 10;
        petal.style.animationDuration = `${dur}s`;
        petal.style.animationDelay = `${-Math.random() * dur}s`;
        el.appendChild(petal);
      }
    });
  }

  // ─── Service worker (offline shell) ───────────────────────────────────────
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // isSecureContext is the real gate: it covers https, localhost AND
    // 127.0.0.1, which a hostname check misses.
    if (!window.isSecureContext) return;
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline caching is a bonus, not a requirement */
    });
  }

  // ─── Go ───────────────────────────────────────────────────────────────────
  // Vendor scripts are deferred, so wait for the document to finish parsing —
  // otherwise Leaflet isn't defined yet.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { boot(); registerServiceWorker(); });
  } else {
    boot();
    registerServiceWorker();
  }
})();
