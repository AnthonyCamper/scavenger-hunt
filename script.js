/* ============================================================
   SCAVENGER HUNT — script.js
   ============================================================ */
(function () {
  "use strict";

  // ─── Shorthand helpers ────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const CONFIG = window.HUNT_CONFIG;

  // ─── State ────────────────────────────────────────────────────────────────
  let team = null;       // 'guys' | 'girls'
  let clueIndex = 0;     // current clue (0-based)
  let isChecking = false;
  let resetTapCount = 0;
  let resetTapTimer = null;

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    const saved = tryLoadSave();
    if (saved) {
      team = saved.team;
      clueIndex = saved.clueIndex;
      applyTheme(team);
      if (clueIndex >= CONFIG.clues.length) {
        showFinale(false);
      } else {
        showHunt();
      }
    } else {
      showLogin();
    }
    wireLogin();
    wireHunt();
  }

  // ─── Persistence ──────────────────────────────────────────────────────────
  function save() {
    localStorage.setItem("scavenger_state", JSON.stringify({ team, clueIndex }));
  }

  function tryLoadSave() {
    try {
      const raw = localStorage.getItem("scavenger_state");
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.team || typeof s.clueIndex !== "number") return null;
      if (!CONFIG.passwords[s.team]) return null;
      return s;
    } catch {
      return null;
    }
  }

  function resetProgress() {
    localStorage.removeItem("scavenger_state");
    team = null;
    clueIndex = 0;
    hideHitOverlay();
    showLogin();
  }

  // ─── Theme ────────────────────────────────────────────────────────────────
  function applyTheme(t) {
    document.body.className = t === "girls" ? "theme-girls" : "theme-guys";
    document.querySelector("#meta-theme-color").content =
      t === "girls" ? "#fdf6f9" : "#1a1a1a";
    spawnAmbient(t);
  }

  // ─── Screen routing ───────────────────────────────────────────────────────
  function showLogin() {
    setActive("screen-login");
  }

  function showHunt() {
    setActive("screen-hunt");
    renderClue();
  }

  function showFinale(saveTimestamp = true) {
    if (saveTimestamp) {
      const existing = localStorage.getItem("scavenger_finish_time");
      if (!existing) {
        localStorage.setItem("scavenger_finish_time", new Date().toISOString());
      }
    }
    setActive("screen-finale");
    renderFinale();
    launchConfetti();
  }

  function setActive(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  // ─── Login wiring ─────────────────────────────────────────────────────────
  function wireLogin() {
    const form = $("login-form");
    const input = $("password-input");
    const toggleBtn = $("toggle-pw");

    toggleBtn.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      toggleBtn.textContent = input.type === "password" ? "👁" : "🙈";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      const matchedTeam = Object.keys(CONFIG.passwords).find(
        (k) => CONFIG.passwords[k] === val
      );
      if (matchedTeam) {
        team = matchedTeam;
        clueIndex = 0;
        applyTheme(team);
        updateLoginUI(team);
        save();
        setTimeout(() => showHunt(), 120);
      } else {
        showLoginError();
      }
    });
  }

  function updateLoginUI(t) {
    const th = CONFIG.themes[t];
    $("login-label").textContent = th.loginLabel;
    $("password-input").placeholder = th.loginPlaceholder;
    $("login-btn").textContent = th.loginButton;
    $("login-icon").textContent = t === "girls" ? "💕" : "🎯";
    $("login-title").textContent = t === "girls" ? "The Hunt Is On" : "THE HUNT IS ON";
    $("login-subtitle").textContent = t === "girls"
      ? "You're in, gorgeous. Let's go! ✨"
      : "Access granted. Mission is live.";
  }

  function showLoginError() {
    const th = team ? CONFIG.themes[team] : null;
    const msg = th ? th.loginError : "Wrong code. Try again.";
    const errEl = $("error-msg");
    const inputWrap = $("password-input");
    errEl.textContent = msg;
    inputWrap.classList.remove("shake");
    // Force reflow to restart animation
    void inputWrap.offsetWidth;
    inputWrap.classList.add("shake");
    setTimeout(() => inputWrap.classList.remove("shake"), 500);
    $("password-input").value = "";
    $("password-input").focus();
  }

  // ─── Hunt wiring ──────────────────────────────────────────────────────────
  function wireHunt() {
    $("check-btn").addEventListener("click", handleLocationCheck);
    $("next-btn").addEventListener("click", advanceClue);

    // Secret reset: tap the reset zone 5 times quickly
    $("reset-tap-zone").addEventListener("click", () => {
      resetTapCount++;
      clearTimeout(resetTapTimer);
      if (resetTapCount >= 5) {
        resetTapCount = 0;
        if (confirm("Reset all progress?")) resetProgress();
      } else {
        resetTapTimer = setTimeout(() => { resetTapCount = 0; }, 2000);
      }
    });
  }

  // ─── Clue rendering ───────────────────────────────────────────────────────
  function renderClue() {
    const clue = CONFIG.clues[clueIndex];
    const th = CONFIG.themes[team];
    const total = CONFIG.clues.length;

    $("team-badge").textContent = th.name;
    $("progress-label").textContent = th.progressLabel;
    $("progress-count").textContent = `${clueIndex + 1} / ${total}`;
    $("progress-bar-fill").style.width = `${((clueIndex) / total) * 100}%`;

    $("clue-emoji").textContent = clue.emoji || "📍";
    $("clue-label").textContent = th.clueLabel;
    $("clue-title").textContent = clue.title;
    $("clue-text").textContent = clue.clue;

    $("check-btn").textContent = th.checkButton;
    $("check-btn").classList.remove("loading");
    $("hint-text").textContent = "";

    hideHitOverlay();
    isChecking = false;
  }

  // ─── Location check ───────────────────────────────────────────────────────
  function handleLocationCheck() {
    if (isChecking) return;

    if (!navigator.geolocation) {
      $("hint-text").textContent = "Geolocation is not supported by your browser.";
      return;
    }

    isChecking = true;
    const th = CONFIG.themes[team];
    $("check-btn").textContent = th.checkingButton;
    $("check-btn").classList.add("loading");
    $("hint-text").textContent = "";

    navigator.geolocation.getCurrentPosition(
      onPositionSuccess,
      onPositionError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function onPositionSuccess(pos) {
    isChecking = false;
    const th = CONFIG.themes[team];
    $("check-btn").textContent = th.checkButton;
    $("check-btn").classList.remove("loading");

    const { latitude, longitude, accuracy } = pos.coords;
    const clue = CONFIG.clues[clueIndex];

    // Warn on poor accuracy
    if (accuracy > 50) {
      $("hint-text").textContent =
        `📡 GPS accuracy is ±${Math.round(accuracy)}m — move to open sky and try again.`;
      return;
    }

    const dist = haversine(latitude, longitude, clue.lat, clue.lng);
    const radius = clue.radius ?? CONFIG.HIT_RADIUS_METERS;

    if (dist <= radius) {
      onHit();
    } else {
      onMiss(dist);
    }
  }

  function onPositionError(err) {
    isChecking = false;
    const th = CONFIG.themes[team];
    $("check-btn").textContent = th.checkButton;
    $("check-btn").classList.remove("loading");

    const msgs = {
      1: "📵 Location access was denied. Enable it in your browser settings and reload.",
      2: "📡 Couldn't get your location — try stepping outside or moving to open sky.",
      3: "⏱ Location timed out — try again.",
    };
    $("hint-text").textContent = msgs[err.code] || "Couldn't get your location. Try again.";
  }

  function onHit() {
    const th = CONFIG.themes[team];

    // Haptic
    if (navigator.vibrate) navigator.vibrate([80, 60, 120]);

    // Update progress bar to show this clue done
    const total = CONFIG.clues.length;
    $("progress-bar-fill").style.width = `${((clueIndex + 1) / total) * 100}%`;

    // Show hit overlay
    $("hit-icon").textContent = team === "girls" ? "✦" : "🎯";
    $("hit-title").textContent = th.hitMessage;
    $("hit-subtitle").textContent = th.hitSubtitle;
    $("next-btn").textContent = th.nextButton;
    $("hit-overlay").classList.remove("hidden");

    launchConfetti();
  }

  function onMiss(dist) {
    const th = CONFIG.themes[team];
    let hint;
    if (dist < 50) hint = th.missNear;
    else if (dist < 150) hint = th.missWarm;
    else if (dist < 500) hint = th.missCold;
    else hint = th.missWayOff;
    $("hint-text").textContent = hint;

    if (navigator.vibrate) navigator.vibrate(80);
  }

  function hideHitOverlay() {
    $("hit-overlay").classList.add("hidden");
  }

  // ─── Advance ──────────────────────────────────────────────────────────────
  function advanceClue() {
    clueIndex++;
    save();

    if (clueIndex >= CONFIG.clues.length) {
      showFinale();
    } else {
      // Fade clue card briefly
      const card = $("clue-card");
      card.style.transition = "opacity 0.25s";
      card.style.opacity = "0";
      hideHitOverlay();
      setTimeout(() => {
        renderClue();
        card.style.opacity = "1";
      }, 280);
    }
  }

  // ─── Finale ───────────────────────────────────────────────────────────────
  function renderFinale() {
    const th = CONFIG.themes[team];
    $("finale-icon").textContent = team === "girls" ? "🌸" : "🏆";
    $("finale-title").textContent = th.finaleTitle;
    $("finale-message").textContent = th.finaleMessage;

    const ts = localStorage.getItem("scavenger_finish_time");
    if (ts) {
      const d = new Date(ts);
      $("finale-time").textContent =
        `Finished: ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  }

  // ─── Confetti ─────────────────────────────────────────────────────────────
  function launchConfetti() {
    if (typeof confetti !== "function") return;

    if (team === "girls") {
      // Blush, rose gold, cream — gentle drift, not a burst
      const defaults = {
        particleCount: 35,
        spread: 65,
        startVelocity: 22,
        ticks: 320,
        colors: ["#e8d4c8", "#b8967e", "#ffffff", "#d4b09a", "#c8b8b0"],
        shapes: ["circle"],
        gravity: 0.45,
        scalar: 0.9,
        drift: 0.3,
      };
      confetti({ ...defaults, origin: { x: 0.35, y: 0.5 } });
      setTimeout(() => confetti({ ...defaults, origin: { x: 0.65, y: 0.45 } }), 300);
      setTimeout(() => confetti({ ...defaults, particleCount: 20, origin: { x: 0.5, y: 0.52 } }), 600);
    } else {
      // Bold gold + white burst
      const defaults = {
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        ticks: 250,
        colors: ["#f0b429", "#ffffff", "#ffe08a", "#d49e1f"],
        shapes: ["square", "circle"],
        gravity: 0.8,
      };
      confetti({ ...defaults, origin: { x: 0.25, y: 0.5 } });
      setTimeout(() => confetti({ ...defaults, origin: { x: 0.75, y: 0.45 } }), 150);
      setTimeout(() => confetti({ ...defaults, particleCount: 50, startVelocity: 55, origin: { x: 0.5, y: 0.55 } }), 300);
    }
  }

  // ─── Ambient background ───────────────────────────────────────────────────
  function spawnAmbient(t) {
    if (t !== "girls") return;
    // Floating petals / hearts for girls theme
    const containers = ["ambient-bg", "ambient-bg-hunt", "ambient-bg-finale"];
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
        const delay = -Math.random() * dur;
        petal.style.animationDuration = `${dur}s`;
        petal.style.animationDelay = `${delay}s`;
        el.appendChild(petal);
      }
    });
  }

  // ─── Haversine formula (distance in meters) ───────────────────────────────
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Go ───────────────────────────────────────────────────────────────────
  boot();
})();
