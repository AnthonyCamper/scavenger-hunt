# Wedding GPS Scavenger Hunt

A mobile-first GPS scavenger hunt web app for a joint bachelor + bachelorette party at Lake Anna, VA. Players land on a team-selection screen, pick Guys or Girls, enter their code, and race through four boat-accessible locations with completely different themes.

No build step and no runtime dependencies — everything is static files, and every asset is served locally so the app works with no signal.

---

## Quick Start

```bash
npm install      # only needed to run the tests
npm run serve    # serves the app locally
```

Then open the printed URL. Geolocation needs **HTTPS or localhost** — see Deployment.

---

## ⚠️ Before you go live

1. **Bump `CACHE_VERSION` in `sw.js`** any time you edit `config.js` or any asset. Phones that already opened the link cache the old version aggressively — this is the one step that silently bites you.
2. **Share the right code with the right team.** Guys and Girls have separate passwords; the admin one opens `admin.html`, which lists every answer.
3. **Walk or boat one real location** and tap Check Location. No test substitutes for one live GPS reading at the actual radius.

---

## How to Configure the Hunt

Everything lives in **`config.js`**.

### Passwords

```js
passwords: {
  guys:  "bach2026",
  girls: "offir2026",
  admin: "admin2026",   // opens admin.html
},
```

Passwords are compared case-insensitively and with surrounding spaces trimmed, so a phone that autocapitalises the first letter still works.

### Clues

```js
{
  id: "clue_01",         // unique — don't duplicate
  emoji: "💀",           // shown in the clue header (optional)
  title: "What Remains", // bold headline
  clue: "The riddle text players read.",
  lat: 38.00042,
  lng: -77.73166,
  radius: 90,            // optional override of HIT_RADIUS_METERS
}
```

To add a clue, copy a block, paste it before the closing `]`, and fill it in. Then run `npm test` — the suite checks coordinates are in the Lake Anna area, radii are sane, and no two targets can cross-trigger each other.

### Getting coordinates

1. Open [maps.google.com](https://maps.google.com) on desktop
2. Right-click the exact spot
3. Click the coordinates in the popup to copy
4. Paste as `lat` and `lng`

### Hit radius

Default is `HIT_RADIUS_METERS: 30`. Guide:

| Radius | Use for |
|---|---|
| 15–20m | A specific bench or sign |
| 30m | Most outdoor targets |
| 50m | Large plazas, bridges |
| 90m | Islands — the boat circles land it can't step onto |

**How arrival is judged.** A reading counts as a hit if the player is inside the radius, *or* if their distance minus their GPS error margin falls inside it (capped at 150m of credited error). A poor fix never blocks a player who is genuinely there, and a wildly inaccurate fix can't fake a hit from far away.

---

## Testing

```bash
npm test          # unit tests — logic, config integrity (fast)
npm run test:e2e  # end-to-end in a real Chromium with spoofed GPS
npm run test:all  # both
```

The E2E suite drives a real browser at iPhone dimensions and covers a full four-clue playthrough with mocked coordinates, denied permission, GPS timeout, poor accuracy, wildly inaccurate fixes, reload persistence, tampered save data, Private Browsing with no localStorage, Leaflet failing to load, map tiles failing, offline loading via the service worker, the admin panel, and layout on five device sizes.

E2E needs a Chromium binary. It looks for the Playwright one at `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`; edit the `CHROME` constant in `test/e2e.test.js` if yours lives elsewhere.

---

## Offline behaviour

All assets — Leaflet, confetti, fonts — are vendored into `vendor/`, and a service worker caches the app shell. Once a phone has opened the link, the hunt loads and runs with **zero bars**.

The one thing that needs signal is **satellite map tiles**. Without them the map shows an empty background, but the direction arrow and distance readout still work, and Check Location works entirely offline (GPS is not network).

---

## Secret Organizer Reset

**Tap the bottom-right corner of the hunt screen 5 times quickly** → confirmation → clears progress and returns to team selection.

---

## Admin Clue Review

`admin.html` — password-protected (`passwords.admin`), shows every clue with its coordinates, radius, and a satellite map, plus links out to Google/Apple Maps.

**This is a convenience screen, not real security.** `config.js` is served to every player's browser, so anyone willing to open dev tools can read every answer. Don't share the admin URL, and treat the passwords as a speed bump rather than a lock.

---

## Deployment (Free, with HTTPS)

> **HTTPS is required** — geolocation and service workers are both blocked on plain HTTP.

### Option A: Netlify (easiest)

1. [netlify.com](https://netlify.com) → free account
2. **"Add new site" → "Deploy manually"**
3. Drag the whole project folder onto the upload area (include `vendor/`)
4. You get an `https://your-site.netlify.app` URL instantly

### Option B: Vercel

1. [vercel.com](https://vercel.com) → sign up
2. Import the repo, or run `npx vercel --prod` from the project folder

### Option C: GitHub Pages

1. Push the repo to GitHub
2. **Settings → Pages → Source → Deploy from a branch → main → / (root)**

Don't deploy `node_modules/` or `test/` — they aren't needed at runtime.

---

## Event Day Tips

- **Send the link the night before** so every phone caches the app while it still has signal
- Have players **"Add to Home Screen"** — it launches full-screen and keeps the cache warm
- The app **keeps the screen awake** during the hunt, which drains battery — bring a power bank
- Progress saves automatically; closing the browser and reopening resumes the same clue
- If GPS is slow, tell players to get out from under cover and wait 5–10 seconds
- Finish times are stored per phone under `scavenger_finish_time` in localStorage

---

## File Structure

```
index.html      the player app
admin.html      password-protected clue review
style.css       all styles, all three themes
script.js       UI wiring
logic.js        pure game logic (distance, hit decisions, validation)
config.js       ← YOUR FILE TO EDIT: passwords, clues, copy
sw.js           service worker (bump CACHE_VERSION when editing assets)
manifest.json   home-screen metadata
vendor/         Leaflet, confetti, self-hosted fonts
test/           unit + end-to-end suites
```
