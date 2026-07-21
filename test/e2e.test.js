/* End-to-end stress test: a real Chromium at iPhone size with spoofed GPS.
   This is the closest thing to standing on the lake that a laptop can do.

   Run with: npm run test:e2e */
const { test, describe, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");

const { chromium } = require("playwright-core");
const { start } = require("./server.js");

global.window = {};
require("../config.js");
const CONFIG = global.window.HUNT_CONFIG;
const LOGIC = require("../logic.js");

const CHROME = path.join(
  os.homedir(),
  ".cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
);

// iPhone 12/13/14 — the most likely device at a lake party.
const IPHONE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

const LAKE_CENTER = { latitude: 38.055, longitude: -77.795 };

let browser;
let origin;
let server;

before(async () => {
  const started = await start();
  server = started.server;
  origin = started.origin;
  browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((r) => server.close(r));
});

// Every page gets watched for uncaught errors; a silent exception on a boat is
// indistinguishable from the app being broken.
function watch(page, errors) {
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // Map tiles are deliberately not reachable in tests.
      if (/arcgisonline|favicon|ERR_INTERNET_DISCONNECTED|Failed to load resource/i.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });
}

async function newSession(opts = {}) {
  const context = await browser.newContext({
    ...IPHONE,
    locale: "en-US",
    timezoneId: "America/New_York",
    permissions: opts.denyGeo ? [] : ["geolocation"],
    geolocation: opts.geolocation || LAKE_CENTER,
    ...opts.contextOptions,
  });
  const errors = [];
  const page = await context.newPage();
  watch(page, errors);
  if (opts.initScript) await page.addInitScript(opts.initScript);
  await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen-landing.active, #screen-hunt.active, #screen-finale.active");
  return { context, page, errors };
}

const activeScreen = (page) =>
  page.evaluate(() => {
    const el = document.querySelector(".screen.active");
    return el ? el.id : null;
  });

const bodyTheme = (page) => page.evaluate(() => document.body.className);

async function loginAs(page, team) {
  await page.click(`#choose-${team}`);
  await page.waitForSelector("#screen-login.active");
  await page.fill("#password-input", CONFIG.passwords[team]);
  await page.click("#login-btn");
  await page.waitForSelector("#screen-hunt.active", { timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────

describe("landing page", () => {
  let session;
  beforeEach(async () => { session = await newSession(); });
  afterEach(async () => { await session.context.close(); });

  test("opens on the landing screen with both teams offered", async () => {
    const { page } = session;
    assert.equal(await activeScreen(page), "screen-landing");
    assert.ok(await page.isVisible("#choose-guys"));
    assert.ok(await page.isVisible("#choose-girls"));
    assert.match(await page.textContent("#choose-guys"), /Team Guys/);
    assert.match(await page.textContent("#choose-girls"), /Team Girls/);
  });

  test("team buttons are comfortably tappable", async () => {
    const { page } = session;
    for (const id of ["#choose-guys", "#choose-girls"]) {
      const box = await page.locator(id).boundingBox();
      assert.ok(box.height >= 44, `${id} is only ${box.height}px tall (Apple minimum is 44)`);
      assert.ok(box.width >= 200, `${id} is only ${box.width}px wide`);
    }
  });

  test("the page never scrolls sideways", async () => {
    const { page } = session;
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    assert.ok(overflow <= 0, `page overflows horizontally by ${overflow}px`);
  });

  test("choosing a team applies that team's theme and shows its login", async () => {
    const { page } = session;
    await page.click("#choose-girls");
    await page.waitForSelector("#screen-login.active");
    assert.equal(await bodyTheme(page), "theme-girls");
    assert.match(await page.textContent("#login-subtitle"), /Team Girls/);

    await page.click("#login-back-btn");
    await page.waitForSelector("#screen-landing.active");
    assert.equal(await bodyTheme(page), "theme-neutral");

    await page.click("#choose-guys");
    await page.waitForSelector("#screen-login.active");
    assert.equal(await bodyTheme(page), "theme-guys");
    assert.match(await page.textContent("#login-subtitle"), /Team Guys/);
  });

  test("back button clears any typed password", async () => {
    const { page } = session;
    await page.click("#choose-guys");
    await page.fill("#password-input", "half-typed-secret");
    await page.click("#login-back-btn");
    await page.click("#choose-guys");
    assert.equal(await page.inputValue("#password-input"), "");
  });

  test("no console or page errors on load", async () => {
    assert.deepEqual(session.errors, []);
  });
});

describe("login security", () => {
  let session;
  beforeEach(async () => { session = await newSession(); });
  afterEach(async () => { await session.context.close(); });

  test("REGRESSION: the admin password cannot log in as either team", async () => {
    const { page, errors } = session;
    for (const team of ["guys", "girls"]) {
      await page.click(`#choose-${team}`);
      await page.waitForSelector("#screen-login.active");
      await page.fill("#password-input", CONFIG.passwords.admin);
      await page.click("#login-btn");
      await page.waitForTimeout(300);
      assert.equal(
        await activeScreen(page),
        "screen-login",
        `admin password logged in as ${team}`
      );
      assert.ok((await page.textContent("#error-msg")).length > 0, "no error shown");
      await page.click("#login-back-btn");
    }
    // The original build threw a TypeError and left a dead screen here.
    assert.deepEqual(errors, [], "admin login must not throw");
  });

  test("one team's password does not open the other team", async () => {
    const { page } = session;
    await page.click("#choose-guys");
    await page.fill("#password-input", CONFIG.passwords.girls);
    await page.click("#login-btn");
    await page.waitForTimeout(250);
    assert.equal(await activeScreen(page), "screen-login");
  });

  test("wrong password shows an error and clears the field", async () => {
    const { page } = session;
    await page.click("#choose-guys");
    await page.fill("#password-input", "definitely-wrong");
    await page.click("#login-btn");
    await page.waitForTimeout(250);
    assert.match(await page.textContent("#error-msg"), /\S/);
    assert.equal(await page.inputValue("#password-input"), "");
  });

  test("password is accepted despite mobile autocapitalisation and stray spaces", async () => {
    const { page } = session;
    const pw = CONFIG.passwords.guys;
    const mangled = `  ${pw.charAt(0).toUpperCase()}${pw.slice(1)}  `;
    await page.click("#choose-guys");
    await page.fill("#password-input", mangled);
    await page.click("#login-btn");
    await page.waitForSelector("#screen-hunt.active", { timeout: 5000 });
    assert.equal(await activeScreen(page), "screen-hunt");
  });

  test("the show/hide password toggle works", async () => {
    const { page } = session;
    await page.click("#choose-guys");
    assert.equal(await page.getAttribute("#password-input", "type"), "password");
    await page.click("#toggle-pw");
    assert.equal(await page.getAttribute("#password-input", "type"), "text");
    await page.click("#toggle-pw");
    assert.equal(await page.getAttribute("#password-input", "type"), "password");
  });

  test("the login input suppresses autocapitalise and autocorrect", async () => {
    const { page } = session;
    await page.click("#choose-guys");
    assert.equal(await page.getAttribute("#password-input", "autocapitalize"), "none");
    assert.equal(await page.getAttribute("#password-input", "autocorrect"), "off");
  });
});

describe("full playthrough with spoofed GPS", () => {
  test("a team can complete all four clues and reach the finale", async () => {
    const session = await newSession();
    const { page, context, errors } = session;
    await loginAs(page, "guys");

    for (let i = 0; i < CONFIG.clues.length; i++) {
      const clue = CONFIG.clues[i];

      assert.equal(
        await page.textContent("#progress-count"),
        `${i + 1} / ${CONFIG.clues.length}`,
        `wrong progress on clue ${i + 1}`
      );
      assert.equal(await page.textContent("#clue-title"), clue.title);

      // Stand exactly on the target with a realistic phone fix.
      await context.setGeolocation({
        latitude: clue.lat,
        longitude: clue.lng,
        accuracy: 25,
      });
      await page.click("#check-btn");
      await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
      await page.click("#next-btn");
      await page.waitForTimeout(400);
    }

    await page.waitForSelector("#screen-finale.active", { timeout: 5000 });
    assert.match(await page.textContent("#finale-title"), /MISSION COMPLETE/i);
    assert.match(await page.textContent("#finale-time"), /Finished:/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the girls team gets its own copy and theme end to end", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "girls");
    assert.equal(await bodyTheme(page), "theme-girls");
    assert.equal(await page.textContent("#team-badge"), CONFIG.themes.girls.name);

    const clue = CONFIG.clues[0];
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    assert.equal(await page.textContent("#hit-title"), CONFIG.themes.girls.hitMessage);
    await context.close();
  });
});

describe("GPS edge cases at the lake", () => {
  test("REGRESSION: a poor fix on the target still completes the clue", async () => {
    // The original build refused any reading with accuracy > 50m, which made
    // the 90m island targets impossible to claim from a boat.
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");
    const clue = CONFIG.clues[0];
    await context.setGeolocation({
      latitude: clue.lat,
      longitude: clue.lng,
      accuracy: 65,
    });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    assert.equal(await page.isVisible("#hit-overlay"), true);
    await context.close();
  });

  test("a boat just outside the island radius is credited for GPS error", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");
    const clue = CONFIG.clues[0];
    const radius = clue.radius ?? CONFIG.HIT_RADIUS_METERS;
    // 60m beyond the edge, with a 70m fix — a real boat circling the shoreline.
    const [lat, lng] = LOGIC.destPoint(clue.lat, clue.lng, 90, radius + 60);
    await context.setGeolocation({ latitude: lat, longitude: lng, accuracy: 70 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    await context.close();
  });

  test("being genuinely far away is a miss with a directional hint", async () => {
    const session = await newSession();
    const { page, context, errors } = session;
    await loginAs(page, "guys");
    const clue = CONFIG.clues[0];
    const [lat, lng] = LOGIC.destPoint(clue.lat, clue.lng, 45, 4000);
    await context.setGeolocation({ latitude: lat, longitude: lng, accuracy: 15 });
    await page.click("#check-btn");
    await page.waitForFunction(
      () => document.getElementById("hint-text").textContent.trim().length > 0,
      null,
      { timeout: 10000 }
    );
    assert.equal(await page.isVisible("#hit-overlay"), false, "must not count as a hit");
    assert.equal(await activeScreen(page), "screen-hunt");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a wildly inaccurate fix far away cannot fake a hit", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");
    const clue = CONFIG.clues[0];
    const [lat, lng] = LOGIC.destPoint(clue.lat, clue.lng, 180, 3000);
    await context.setGeolocation({ latitude: lat, longitude: lng, accuracy: 5000 });
    await page.click("#check-btn");
    await page.waitForFunction(
      () => document.getElementById("hint-text").textContent.trim().length > 0,
      null,
      { timeout: 10000 }
    );
    assert.equal(await page.isVisible("#hit-overlay"), false);
    await context.close();
  });

  test("denied location permission explains how to fix it, without crashing", async () => {
    const session = await newSession({ denyGeo: true });
    const { page, errors, context } = session;
    await loginAs(page, "guys");
    await page.click("#check-btn");
    await page.waitForFunction(
      () => /blocked|Settings/i.test(document.getElementById("hint-text").textContent),
      null,
      { timeout: 10000 }
    );
    const hint = await page.textContent("#hint-text");
    assert.match(hint, /Settings/i, "should tell the player how to re-enable location");
    // Button must return to a usable state, not stay stuck on "Acquiring…".
    assert.equal(await page.isDisabled("#check-btn"), false);
    assert.equal(await page.textContent("#check-btn"), CONFIG.themes.guys.checkButton);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a GPS timeout leaves the button usable and explains itself", async () => {
    const session = await newSession({
      initScript: () => {
        // Force every lookup to time out (error code 3).
        navigator.geolocation.getCurrentPosition = (_ok, fail) =>
          setTimeout(() => fail({ code: 3, message: "timeout" }), 30);
      },
    });
    const { page, errors, context } = session;
    await loginAs(page, "guys");
    await page.click("#check-btn");
    await page.waitForFunction(
      () => /timed out/i.test(document.getElementById("hint-text").textContent),
      null,
      { timeout: 10000 }
    );
    assert.equal(await page.isDisabled("#check-btn"), false);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a device with no geolocation at all degrades gracefully", async () => {
    const session = await newSession({
      initScript: () => {
        Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true });
      },
    });
    const { page, errors, context } = session;
    await loginAs(page, "guys");
    await page.click("#check-btn");
    await page.waitForFunction(
      () => document.getElementById("hint-text").textContent.trim().length > 0,
      null,
      { timeout: 5000 }
    );
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("impatient tapping while a lookup is in flight fires only one request", async () => {
    // A slow fix is exactly when people jab the button repeatedly, so the
    // lookup is held open for the duration of the test.
    const session = await newSession({
      initScript: () => {
        window.__geoCalls = 0;
        navigator.geolocation.getCurrentPosition = () => { window.__geoCalls++; };
      },
    });
    const { page, context, errors } = session;
    await loginAs(page, "guys");

    for (let i = 0; i < 5; i++) {
      await page.click("#check-btn", { force: true }).catch(() => {});
    }
    const calls = await page.evaluate(() => window.__geoCalls);
    assert.equal(calls, 1, `expected exactly 1 geolocation call, got ${calls}`);
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("progress persistence", () => {
  test("closing and reopening the app resumes the same clue", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");

    const clue = CONFIG.clues[0];
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    await page.click("#next-btn");
    await page.waitForTimeout(400);
    assert.equal(await page.textContent("#progress-count"), `2 / ${CONFIG.clues.length}`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#screen-hunt.active", { timeout: 5000 });
    assert.equal(await page.textContent("#progress-count"), `2 / ${CONFIG.clues.length}`);
    assert.equal(await page.textContent("#clue-title"), CONFIG.clues[1].title);
    await context.close();
  });

  test("a tampered save falls back to the landing page instead of breaking", async () => {
    const session = await newSession();
    const { page, errors, context } = session;
    for (const bad of [
      JSON.stringify({ team: "admin", clueIndex: 0 }),
      JSON.stringify({ team: "guys", clueIndex: -5 }),
      JSON.stringify({ team: "guys", clueIndex: 1.5 }),
      "{not json",
      "null",
    ]) {
      await page.evaluate((v) => localStorage.setItem("scavenger_state", v), bad);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForSelector(".screen.active");
      assert.equal(await activeScreen(page), "screen-landing", `bad save accepted: ${bad}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a save pointing past the last clue lands on the finale", async () => {
    const session = await newSession();
    const { page, context } = session;
    await page.evaluate(
      (v) => localStorage.setItem("scavenger_state", v),
      JSON.stringify({ team: "girls", clueIndex: 999 })
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#screen-finale.active", { timeout: 5000 });
    assert.equal(await bodyTheme(page), "theme-girls");
    await context.close();
  });

  test("the app still runs when localStorage is unavailable (Private Browsing)", async () => {
    const session = await newSession({
      initScript: () => {
        const boom = () => { throw new DOMException("QuotaExceededError"); };
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          value: { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 },
        });
      },
    });
    const { page, errors, context } = session;
    assert.equal(await activeScreen(page), "screen-landing");
    await loginAs(page, "guys");
    assert.equal(await activeScreen(page), "screen-hunt", "must still be playable without storage");

    const clue = CONFIG.clues[0];
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("map behaviour", () => {
  test("the target is hidden before the clue is solved, and revealed after", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");

    const clue = CONFIG.clues[0];
    const [lat, lng] = LOGIC.destPoint(clue.lat, clue.lng, 270, 1500);
    await context.setGeolocation({ latitude: lat, longitude: lng, accuracy: 15 });

    await page.click("#map-btn");
    await page.waitForSelector("#map-overlay:not(.hidden)");
    await page.waitForFunction(
      () => !/Locating/i.test(document.getElementById("map-hint-text").textContent),
      null,
      { timeout: 15000 }
    );

    // Direction only — no pin, no radius circle.
    assert.match(await page.textContent("#map-hint-text"), /Head (north|south|east|west)/i);
    assert.equal(await page.locator(".map-pin-icon").count(), 0, "target pin leaked before solving");
    assert.ok(await page.locator(".map-arrow-head").count() > 0, "no direction arrow shown");

    await page.click("#map-close-btn");
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });

    // The hit overlay covers the screen, so the reveal has to be reachable
    // from the overlay itself.
    await page.click("#hit-map-btn");
    await page.waitForSelector("#map-overlay:not(.hidden)");
    await page.waitForTimeout(400);
    assert.ok(await page.locator(".map-pin-icon").count() > 0, "target not revealed after solving");
    assert.equal(await page.locator(".map-arrow-head").count(), 0, "arrow should be gone once solved");
    await context.close();
  });

  test("advancing to the next clue clears the previous target from the map", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");
    const clue = CONFIG.clues[0];
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#map-btn");
    await page.waitForSelector("#map-overlay:not(.hidden)");
    await page.click("#map-close-btn");
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    await page.click("#next-btn");
    await page.waitForTimeout(600);

    await page.click("#map-btn");
    await page.waitForSelector("#map-overlay:not(.hidden)");
    assert.equal(
      await page.locator(".map-pin-icon").count(),
      0,
      "the solved target is still pinned on the next clue's map"
    );
    await context.close();
  });

  test("the map still opens and closes when tiles cannot load", async () => {
    const session = await newSession();
    const { page, context, errors } = session;
    await context.route("**/arcgisonline.com/**", (r) => r.abort());
    await loginAs(page, "guys");
    await page.click("#map-btn");
    await page.waitForSelector("#map-overlay:not(.hidden)");
    await page.waitForTimeout(1500);
    await page.click("#map-close-btn");
    assert.equal(await page.isVisible("#map-overlay"), false);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the app survives Leaflet failing to load entirely", async () => {
    const context = await browser.newContext({
      ...IPHONE,
      permissions: ["geolocation"],
      geolocation: LAKE_CENTER,
    });
    const errors = [];
    const page = await context.newPage();
    watch(page, errors);
    await context.route("**/vendor/leaflet.js", (r) => r.abort());
    await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#screen-landing.active");

    await loginAs(page, "guys");
    await page.click("#map-btn");
    await page.waitForTimeout(400);
    // Map is unavailable, but the hunt itself must keep working.
    assert.match(await page.textContent("#hint-text"), /Check Location/i);

    const clue = CONFIG.clues[0];
    await context.setGeolocation({ latitude: clue.lat, longitude: clue.lng, accuracy: 20 });
    await page.click("#check-btn");
    await page.waitForSelector("#hit-overlay:not(.hidden)", { timeout: 10000 });
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("offline support", () => {
  test("the app loads with the network completely down", async () => {
    const context = await browser.newContext({
      ...IPHONE,
      permissions: ["geolocation"],
      geolocation: LAKE_CENTER,
    });
    const page = await context.newPage();
    await page.goto(`${origin}/index.html`, { waitUntil: "load" });

    // Wait for the service worker to take control.
    await page.waitForFunction(
      () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
      null,
      { timeout: 15000 }
    );

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#screen-landing.active", { timeout: 10000 });

    assert.ok(await page.isVisible("#choose-guys"), "landing did not render offline");
    // Fonts and logic must have come from cache too.
    assert.equal(await page.evaluate(() => typeof window.HuntLogic), "object");
    assert.equal(await page.evaluate(() => typeof window.HUNT_CONFIG), "object");

    await loginAs(page, "guys");
    assert.equal(await activeScreen(page), "screen-hunt");
    await context.close();
  });
});

describe("layout across devices", () => {
  const DEVICES = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "iPhone 14 Pro Max", width: 430, height: 932 },
    { name: "Pixel 7", width: 412, height: 915 },
    { name: "small Android", width: 360, height: 640 },
  ];

  for (const d of DEVICES) {
    test(`${d.name} (${d.width}x${d.height}) renders without overflow`, async () => {
      const context = await browser.newContext({
        viewport: { width: d.width, height: d.height },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        permissions: ["geolocation"],
        geolocation: LAKE_CENTER,
      });
      const errors = [];
      const page = await context.newPage();
      watch(page, errors);
      await page.goto(`${origin}/index.html`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#screen-landing.active");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      assert.ok(overflow <= 0, `landing overflows by ${overflow}px on ${d.name}`);

      // Both team buttons must be on screen without scrolling.
      for (const id of ["#choose-guys", "#choose-girls"]) {
        const box = await page.locator(id).boundingBox();
        assert.ok(box, `${id} not rendered on ${d.name}`);
        assert.ok(box.height >= 44, `${id} too short on ${d.name}: ${box.height}px`);
        assert.ok(
          box.y + box.height <= d.height + 1,
          `${id} falls below the fold on ${d.name} (bottom at ${Math.round(box.y + box.height)}px)`
        );
      }

      await loginAs(page, "guys");
      const clueOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      assert.ok(clueOverflow <= 0, `hunt screen overflows by ${clueOverflow}px on ${d.name}`);
      assert.deepEqual(errors, [], `errors on ${d.name}`);
      await context.close();
    });
  }
});

describe("admin clue review", () => {
  async function openAdmin() {
    const context = await browser.newContext({ ...IPHONE });
    const errors = [];
    const page = await context.newPage();
    watch(page, errors);
    await page.goto(`${origin}/admin.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#gate");
    return { context, page, errors };
  }

  test("the gate rejects a wrong password", async () => {
    const { context, page, errors } = await openAdmin();
    await page.fill("#admin-pw", "nope");
    await page.click("#admin-login-btn");
    await page.waitForTimeout(250);
    assert.equal(await page.isVisible("#admin-panel"), false, "admin panel leaked");
    assert.match(await page.textContent("#gate-error"), /\S/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a team password does not open the admin panel", async () => {
    const { context, page } = await openAdmin();
    for (const pw of [CONFIG.passwords.guys, CONFIG.passwords.girls]) {
      await page.fill("#admin-pw", pw);
      await page.click("#admin-login-btn");
      await page.waitForTimeout(200);
      assert.equal(await page.isVisible("#admin-panel"), false, `${pw} opened admin`);
    }
    await context.close();
  });

  test("the correct password reviews every clue with a working map", async () => {
    const { context, page, errors } = await openAdmin();
    await page.fill("#admin-pw", CONFIG.passwords.admin);
    await page.click("#admin-login-btn");
    await page.waitForSelector("#admin-panel:not(.hidden)", { timeout: 5000 });

    for (let i = 0; i < CONFIG.clues.length; i++) {
      const clue = CONFIG.clues[i];
      assert.equal(await page.textContent("#admin-counter"), `${i + 1} / ${CONFIG.clues.length}`);
      assert.equal(await page.textContent("#detail-title"), clue.title);
      assert.match(await page.textContent("#meta-lat"), new RegExp(String(clue.lat)));
      if (i < CONFIG.clues.length - 1) {
        await page.click("#next-btn");
        await page.waitForTimeout(250);
      }
    }
    assert.ok(await page.locator("#admin-map .leaflet-container, #admin-map.leaflet-container").count() > 0
      || await page.evaluate(() => !!document.querySelector("#admin-map")._leaflet_id),
      "admin map did not initialise");
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe("organiser reset", () => {
  test("five taps in the corner resets back to team selection", async () => {
    const session = await newSession();
    const { page, context } = session;
    await loginAs(page, "guys");
    page.on("dialog", (d) => d.accept());

    for (let i = 0; i < 5; i++) {
      await page.click("#reset-tap-zone", { force: true });
    }
    await page.waitForSelector("#screen-landing.active", { timeout: 5000 });
    assert.equal(await bodyTheme(page), "theme-neutral");
    const saved = await page.evaluate(() => localStorage.getItem("scavenger_state"));
    assert.equal(saved, null, "progress was not cleared");
    await context.close();
  });
});
