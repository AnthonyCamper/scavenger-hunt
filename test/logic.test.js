/* Unit tests for the hunt's pure logic. Run with: npm test */
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const L = require("../logic.js");

// config.js assigns to window.HUNT_CONFIG, so give it a window.
global.window = {};
require("../config.js");
const CONFIG = global.window.HUNT_CONFIG;

const approx = (actual, expected, tolerance, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${msg || ""} expected ${actual} to be within ${tolerance} of ${expected}`
  );

// Bearings live on a circle: 359.9999° and 0° are the same heading.
const approxBearing = (actual, expected, tolerance, msg) => {
  const diff = Math.abs((((actual - expected) % 360) + 540) % 360 - 180);
  assert.ok(
    diff <= tolerance,
    `${msg || ""} expected bearing ${actual} to be within ${tolerance}° of ${expected}`
  );
};

describe("haversine", () => {
  test("zero distance to itself", () => {
    assert.equal(L.haversine(38.0, -77.7, 38.0, -77.7), 0);
  });

  test("one degree of latitude is ~111.2km", () => {
    approx(L.haversine(38, -77, 39, -77), 111195, 200);
  });

  test("is symmetric", () => {
    const a = L.haversine(38.00042, -77.73166, 38.11069, -77.88555);
    const b = L.haversine(38.11069, -77.88555, 38.00042, -77.73166);
    approx(a, b, 0.001);
  });

  test("small offsets resolve at metre scale", () => {
    // ~0.0001 deg latitude ≈ 11.1m
    approx(L.haversine(38.0, -77.7, 38.0001, -77.7), 11.1, 0.5);
  });
});

describe("evaluateLocation — the accuracy gate", () => {
  test("inside the radius is a hit", () => {
    const r = L.evaluateLocation({ distance: 10, accuracy: 5, radius: 90 });
    assert.equal(r.hit, true);
    assert.equal(r.reason, "inside");
  });

  test("REGRESSION: on target with poor lake GPS still counts", () => {
    // The original build rejected any reading with accuracy > 50 without ever
    // comparing distance. A boat sitting on a 90m island target with a typical
    // ±60m fix could never complete the clue.
    const r = L.evaluateLocation({ distance: 40, accuracy: 60, radius: 90 });
    assert.equal(r.hit, true, "player on the target must be able to finish");
  });

  test("just outside the radius but within GPS error is a hit", () => {
    const r = L.evaluateLocation({ distance: 120, accuracy: 45, radius: 90 });
    assert.equal(r.hit, true);
    assert.equal(r.reason, "within-gps-error");
  });

  test("clearly outside with a good fix is a miss", () => {
    const r = L.evaluateLocation({ distance: 500, accuracy: 8, radius: 90 });
    assert.equal(r.hit, false);
    assert.equal(r.reason, "outside");
  });

  test("wildly inaccurate readings cannot manufacture a hit", () => {
    // ±5km accuracy 3km away must not credit its way into the zone.
    const r = L.evaluateLocation({ distance: 3000, accuracy: 5000, radius: 90 });
    assert.equal(r.hit, false, "grace must be capped");
  });

  test("grace is capped at ACCURACY_GRACE_CAP exactly", () => {
    const radius = 90;
    const justInside = L.evaluateLocation({
      distance: radius + L.ACCURACY_GRACE_CAP,
      accuracy: 9999,
      radius,
    });
    const justOutside = L.evaluateLocation({
      distance: radius + L.ACCURACY_GRACE_CAP + 1,
      accuracy: 9999,
      radius,
    });
    assert.equal(justInside.hit, true);
    assert.equal(justOutside.hit, false);
  });

  test("missing or bogus accuracy is treated as zero, not as free grace", () => {
    for (const accuracy of [undefined, null, NaN, -10, "abc"]) {
      const r = L.evaluateLocation({ distance: 200, accuracy, radius: 90 });
      assert.equal(r.hit, false, `accuracy=${accuracy} must not grant grace`);
    }
    const onTarget = L.evaluateLocation({ distance: 5, accuracy: undefined, radius: 90 });
    assert.equal(onTarget.hit, true, "still evaluates distance normally");
  });

  test("flags weak signal on a miss without blocking", () => {
    const r = L.evaluateLocation({ distance: 900, accuracy: 120, radius: 90 });
    assert.equal(r.hit, false);
    assert.equal(r.weakSignal, true);
  });

  test("exactly on the radius boundary is a hit", () => {
    assert.equal(L.evaluateLocation({ distance: 90, accuracy: 0, radius: 90 }).hit, true);
  });

  test("garbage distance does not throw or falsely succeed", () => {
    const r = L.evaluateLocation({ distance: NaN, accuracy: 10, radius: 90 });
    assert.equal(r.hit, false);
    assert.equal(r.reason, "invalid");
  });
});

describe("passwordMatches", () => {
  test("accepts the correct team password", () => {
    assert.equal(L.passwordMatches(CONFIG, "guys", CONFIG.passwords.guys), true);
    assert.equal(L.passwordMatches(CONFIG, "girls", CONFIG.passwords.girls), true);
  });

  test("is case-insensitive and trims whitespace (mobile keyboards autocapitalise)", () => {
    const pw = CONFIG.passwords.guys;
    assert.equal(L.passwordMatches(CONFIG, "guys", pw.toUpperCase()), true);
    assert.equal(L.passwordMatches(CONFIG, "guys", `  ${pw}  `), true);
    const capitalised = pw.charAt(0).toUpperCase() + pw.slice(1);
    assert.equal(L.passwordMatches(CONFIG, "guys", capitalised), true);
  });

  test("SECURITY: the admin password cannot log in as a team", () => {
    for (const team of L.TEAMS) {
      assert.equal(
        L.passwordMatches(CONFIG, team, CONFIG.passwords.admin),
        false,
        `admin password must not authenticate team ${team}`
      );
    }
  });

  test("SECURITY: 'admin' is not a selectable team", () => {
    assert.equal(L.passwordMatches(CONFIG, "admin", CONFIG.passwords.admin), false);
    assert.ok(!L.TEAMS.includes("admin"));
  });

  test("one team's password does not open the other team", () => {
    assert.equal(L.passwordMatches(CONFIG, "guys", CONFIG.passwords.girls), false);
    assert.equal(L.passwordMatches(CONFIG, "girls", CONFIG.passwords.guys), false);
  });

  test("rejects empty, blank and non-string input", () => {
    for (const bad of ["", "   ", null, undefined, 0, {}, []]) {
      assert.equal(L.passwordMatches(CONFIG, "guys", bad), false, `rejects ${JSON.stringify(bad)}`);
    }
  });

  test("rejects unknown teams", () => {
    assert.equal(L.passwordMatches(CONFIG, "hackers", "anything"), false);
  });
});

describe("validateSave", () => {
  const count = CONFIG.clues.length;

  test("round-trips a legitimate save", () => {
    const saved = JSON.stringify({ team: "girls", clueIndex: 2 });
    assert.deepEqual(L.validateSave(saved, count), { team: "girls", clueIndex: 2 });
  });

  test("rejects a tampered admin save", () => {
    assert.equal(L.validateSave(JSON.stringify({ team: "admin", clueIndex: 0 }), count), null);
  });

  test("rejects malformed JSON and junk", () => {
    for (const bad of ["", "{", "null", "[]", '"str"', JSON.stringify({ team: "guys" })]) {
      assert.equal(L.validateSave(bad, count), null, `rejects ${bad}`);
    }
  });

  test("rejects non-integer and negative indices", () => {
    for (const idx of [1.5, -1, "2", NaN, Infinity]) {
      assert.equal(
        L.validateSave(JSON.stringify({ team: "guys", clueIndex: idx }), count),
        null,
        `rejects clueIndex=${idx}`
      );
    }
  });

  test("clamps an index past the end to the finale", () => {
    const r = L.validateSave(JSON.stringify({ team: "guys", clueIndex: 999 }), count);
    assert.deepEqual(r, { team: "guys", clueIndex: count });
  });
});

describe("missTier", () => {
  const radius = 90;
  test("tiers scale with the radius", () => {
    assert.equal(L.missTier(radius + 10, radius), "missNear");
    assert.equal(L.missTier(radius + 100, radius), "missWarm");
    assert.equal(L.missTier(radius + 300, radius), "missCold");
    assert.equal(L.missTier(radius + 5000, radius), "missWayOff");
  });

  test("every tier maps to real copy in both themes", () => {
    const tiers = ["missNear", "missWarm", "missCold", "missWayOff"];
    for (const team of L.TEAMS) {
      for (const tier of tiers) {
        const copy = CONFIG.themes[team][tier];
        assert.equal(typeof copy, "string", `${team}.${tier} missing`);
        assert.ok(copy.length > 0, `${team}.${tier} empty`);
      }
    }
  });
});

describe("bearing and direction", () => {
  test("cardinal points map correctly", () => {
    assert.equal(L.cardinalDir(0), "N");
    assert.equal(L.cardinalDir(45), "NE");
    assert.equal(L.cardinalDir(90), "E");
    assert.equal(L.cardinalDir(180), "S");
    assert.equal(L.cardinalDir(270), "W");
    assert.equal(L.cardinalDir(359.9), "N", "wraps past 360");
    assert.equal(L.cardinalDir(360), "N");
  });

  test("due north and due east bearings", () => {
    approxBearing(L.bearingTo(38, -77, 39, -77), 0, 0.5, "north");
    approxBearing(L.bearingTo(38, -77, 38, -76), 90, 0.5, "east");
    approxBearing(L.bearingTo(38, -77, 37, -77), 180, 0.5, "south");
  });

  test("every direction has an arrow and a word", () => {
    for (let b = 0; b < 360; b += 15) {
      const dir = L.cardinalDir(b);
      assert.notEqual(L.dirArrowEmoji(dir), "•", `no arrow for ${dir}`);
      assert.ok(L.dirWord(dir).length > 2, `no word for ${dir}`);
    }
  });

  test("destPoint lands the requested distance away on the requested bearing", () => {
    for (const bearing of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const [lat, lng] = L.destPoint(38.03, -77.79, bearing, 500);
      approx(L.haversine(38.03, -77.79, lat, lng), 500, 1, `distance @${bearing}°`);
      approxBearing(L.bearingTo(38.03, -77.79, lat, lng), bearing, 0.5, `bearing @${bearing}°`);
    }
  });
});

describe("formatDistance", () => {
  test("metres under 1km, kilometres above", () => {
    assert.equal(L.formatDistance(0), "0m");
    assert.equal(L.formatDistance(45.6), "46m");
    assert.equal(L.formatDistance(999), "999m");
    assert.equal(L.formatDistance(1000), "1.0km");
    assert.equal(L.formatDistance(8420), "8.4km");
  });

  test("handles bad input without throwing", () => {
    assert.equal(L.formatDistance(NaN), "—");
  });
});

describe("config integrity — event-day safety net", () => {
  test("clue ids are present and unique", () => {
    const ids = CONFIG.clues.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate clue id");
    ids.forEach((id) => assert.ok(id && typeof id === "string"));
  });

  test("every clue has usable copy and coordinates", () => {
    CONFIG.clues.forEach((c, i) => {
      assert.ok(c.title && c.title.length, `clue ${i} missing title`);
      assert.ok(c.clue && c.clue.length > 20, `clue ${i} missing clue text`);
      assert.ok(Number.isFinite(c.lat) && c.lat >= -90 && c.lat <= 90, `clue ${i} bad lat`);
      assert.ok(Number.isFinite(c.lng) && c.lng >= -180 && c.lng <= 180, `clue ${i} bad lng`);
    });
  });

  test("all targets sit in the Lake Anna area (catches a bad paste)", () => {
    CONFIG.clues.forEach((c, i) => {
      approx(c.lat, 38.05, 0.3, `clue ${i} latitude far from Lake Anna`);
      approx(c.lng, -77.8, 0.3, `clue ${i} longitude far from Lake Anna`);
    });
  });

  test("radii are sane", () => {
    CONFIG.clues.forEach((c, i) => {
      const r = c.radius ?? CONFIG.HIT_RADIUS_METERS;
      assert.ok(r >= 10 && r <= 200, `clue ${i} radius ${r} out of range`);
    });
  });

  test("CRITICAL: no two clues can cross-trigger each other", () => {
    // Two targets whose grace-expanded zones overlap would let one location
    // satisfy two clues, silently skipping a stop.
    for (let i = 0; i < CONFIG.clues.length; i++) {
      for (let j = i + 1; j < CONFIG.clues.length; j++) {
        const a = CONFIG.clues[i];
        const b = CONFIG.clues[j];
        const d = L.haversine(a.lat, a.lng, b.lat, b.lng);
        const ra = (a.radius ?? CONFIG.HIT_RADIUS_METERS) + L.ACCURACY_GRACE_CAP;
        const rb = (b.radius ?? CONFIG.HIT_RADIUS_METERS) + L.ACCURACY_GRACE_CAP;
        assert.ok(
          d > ra + rb,
          `${a.id} and ${b.id} are ${Math.round(d)}m apart but their zones span ${ra + rb}m`
        );
      }
    }
  });

  test("both teams have every copy string the UI reads", () => {
    const required = [
      "name", "loginLabel", "loginPlaceholder", "loginButton", "loginError",
      "checkButton", "checkingButton", "hitMessage", "hitSubtitle", "nextButton",
      "missNear", "missWarm", "missCold", "missWayOff",
      "finaleTitle", "finaleMessage", "progressLabel", "clueLabel",
    ];
    for (const team of L.TEAMS) {
      const theme = CONFIG.themes[team];
      assert.ok(theme, `missing theme for ${team}`);
      for (const key of required) {
        assert.equal(typeof theme[key], "string", `${team}.${key} missing`);
        assert.ok(theme[key].length > 0, `${team}.${key} empty`);
      }
    }
  });

  test("passwords are set, distinct, and not left at a placeholder", () => {
    const { guys, girls, admin } = CONFIG.passwords;
    assert.equal(new Set([guys, girls, admin]).size, 3, "passwords must differ");
    for (const pw of [guys, girls, admin]) {
      assert.ok(typeof pw === "string" && pw.length >= 6, `weak password: ${pw}`);
      assert.ok(!/^(password|changeme|test)$/i.test(pw), `placeholder password: ${pw}`);
    }
  });
});
