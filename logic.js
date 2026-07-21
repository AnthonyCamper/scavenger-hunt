/* ============================================================
   SCAVENGER HUNT — logic.js
   Pure, side-effect-free game logic.

   Loaded by the browser (as window.HuntLogic) and by the test
   suite (as a CommonJS module) so the exact code that runs at
   the lake is the code that gets tested.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HuntLogic = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  // The only teams that can ever log in to the hunt. The config also holds an
  // `admin` password, and it must NOT be reachable from the player login.
  const TEAMS = ["guys", "girls"];

  // How much GPS error we're willing to credit a player with. A phone on open
  // water routinely reports ±30-80m; beyond this a reading is too vague to
  // treat as evidence of arrival, and crediting it would let a boat 400m away
  // trigger a hit.
  const ACCURACY_GRACE_CAP = 150;

  // Above this, we tell the player their signal is weak (but still evaluate).
  const WEAK_SIGNAL_THRESHOLD = 75;

  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  // ─── Distance ─────────────────────────────────────────────────────────────
  function haversine(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ─── Bearing / direction ──────────────────────────────────────────────────
  function bearingTo(lat1, lon1, lat2, lon2) {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function cardinalDir(bearing) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(((bearing % 360) + 360) % 360 / 45) % 8];
  }

  const DIR_ARROWS = { N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖" };
  const DIR_WORDS = {
    N: "north", NE: "northeast", E: "east", SE: "southeast",
    S: "south", SW: "southwest", W: "west", NW: "northwest",
  };

  function dirArrowEmoji(dir) {
    return DIR_ARROWS[dir] || "•";
  }

  function dirWord(dir) {
    return DIR_WORDS[dir] || dir;
  }

  // Point `distMeters` away from (lat, lon) along `bearing` degrees.
  function destPoint(lat, lon, bearing, distMeters) {
    const d = distMeters / EARTH_RADIUS_M;
    const b = toRad(bearing);
    const lat1 = toRad(lat);
    const lon1 = toRad(lon);
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(b) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      );
    return [toDeg(lat2), ((toDeg(lon2) + 540) % 360) - 180];
  }

  // ─── Hit decision ─────────────────────────────────────────────────────────
  // Never refuses to evaluate. A player standing on the target with a poor fix
  // must still be able to finish — that is the whole point of the grace band.
  function evaluateLocation(opts) {
    const radius = Number(opts.radius);
    const distance = Number(opts.distance);
    const rawAcc = Number(opts.accuracy);
    const accuracy = Number.isFinite(rawAcc) && rawAcc > 0 ? rawAcc : 0;

    if (!Number.isFinite(distance) || !Number.isFinite(radius)) {
      return { hit: false, reason: "invalid", weakSignal: false, accuracy };
    }

    if (distance <= radius) {
      return { hit: true, reason: "inside", weakSignal: false, accuracy };
    }

    const credited = Math.min(accuracy, ACCURACY_GRACE_CAP);
    if (distance - credited <= radius) {
      return { hit: true, reason: "within-gps-error", weakSignal: false, accuracy };
    }

    return {
      hit: false,
      reason: "outside",
      weakSignal: accuracy > WEAK_SIGNAL_THRESHOLD,
      accuracy,
    };
  }

  // Miss hints are keyed off the radius so "you're basically on it" always
  // means "just outside the zone", whatever the radius happens to be.
  function missTier(distance, radius) {
    if (distance < radius + 40) return "missNear";
    if (distance < radius + 150) return "missWarm";
    if (distance < radius + 500) return "missCold";
    return "missWayOff";
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return "—";
    return meters < 1000
      ? Math.round(meters) + "m"
      : (meters / 1000).toFixed(1) + "km";
  }

  // ─── Passwords ────────────────────────────────────────────────────────────
  const normalize = (v) => String(v == null ? "" : v).trim().toLowerCase();

  // Checks the password for ONE team. Scoped deliberately: there is no code
  // path from the player login to the admin credential.
  function passwordMatches(config, team, input) {
    if (!TEAMS.includes(team)) return false;
    const expected = config && config.passwords && config.passwords[team];
    if (typeof expected !== "string" || expected === "") return false;
    const attempt = normalize(input);
    if (attempt === "") return false;
    return normalize(expected) === attempt;
  }

  // ─── Save state ───────────────────────────────────────────────────────────
  function validateSave(raw, clueCount) {
    if (typeof raw !== "string" || raw === "") return null;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    if (!TEAMS.includes(parsed.team)) return null;
    const idx = parsed.clueIndex;
    if (!Number.isInteger(idx) || idx < 0) return null;
    // A save pointing past the end means "finished" — clamp rather than reject
    // so a config edit that removes a clue can't strand a finished player.
    return { team: parsed.team, clueIndex: Math.min(idx, clueCount) };
  }

  return {
    TEAMS,
    ACCURACY_GRACE_CAP,
    WEAK_SIGNAL_THRESHOLD,
    haversine,
    bearingTo,
    cardinalDir,
    dirArrowEmoji,
    dirWord,
    destPoint,
    evaluateLocation,
    missTier,
    formatDistance,
    passwordMatches,
    validateSave,
    normalize,
  };
});
