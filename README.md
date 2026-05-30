# Wedding GPS Scavenger Hunt

A mobile-first GPS scavenger hunt web app for a joint bachelor + bachelorette party. Two teams — Guys vs Girls — race through real-world locations with completely different themes, aesthetics, and vibes.

---

## Quick Start

Open `index.html` in a browser **over HTTPS** (required for geolocation — see Deployment below).

---

## How to Configure the Hunt

Everything lives in **`config.js`**. Open it in any text editor.

### 1. Set the two team passwords

```js
passwords: {
  guys: "brotherhood2025",   // ← change this
  girls: "bridestribe2025",  // ← change this
},
```

Share the Guys password with the groomsmen and the Girls password with the bridesmaids. Simple.

### 2. Add or edit clues

Each clue is an object in the `clues` array:

```js
{
  id: "clue_01",         // unique ID — don't duplicate
  emoji: "🥂",           // shown in the clue card header (optional)
  title: "Short Title",  // bold headline above the clue text
  clue: "The actual riddle text that players read.",
  lat: 40.748817,        // ← GPS coordinates (see below)
  lng: -73.985428,
  radius: 20,            // optional: override hit radius for just this clue (meters)
},
```

To add a clue, copy one of the blocks, paste it before the final `]`, and fill it in.

### 3. Get coordinates from Google Maps

1. Open [maps.google.com](https://maps.google.com) on desktop
2. Right-click exactly where you want the target to be
3. The very first line in the popup shows the coordinates — **click them to copy**
4. Paste the two numbers as `lat` and `lng` in your clue

### 4. Adjust the hit radius

The default is **30 meters** — works well for a specific bench, doorway, or sign. To change it globally:

```js
HIT_RADIUS_METERS: 30,  // change this number
```

To override for a specific clue (e.g. a large open plaza), add `radius: 50` to that clue object.

**Radius guide:**
- `15–20m` — very tight, best for exact spots like a specific bench
- `30m` — default, works well for most outdoor targets
- `50m` — forgiving, good for large plazas or indoor-adjacent spots
- `75–100m` — easy mode, good for groups with non-smartphone-savvy members

---

## Secret Organizer Reset

During the event, if you need to reset a phone (e.g. for testing or if someone's progress gets messed up):

**Tap the bottom-right corner of the screen 5 times quickly** → a "Reset all progress?" confirmation appears.

---

## Deployment (Free, with HTTPS)

> **HTTPS is required.** Browser geolocation is blocked on plain HTTP. All options below provide free HTTPS.

### Option A: Netlify (recommended — easiest)

1. Go to [netlify.com](https://netlify.com) and create a free account
2. From your dashboard, click **"Add new site" → "Deploy manually"**
3. Drag and drop your project folder (containing `index.html`, `style.css`, `script.js`, `config.js`) onto the upload area
4. Done — Netlify gives you an `https://your-site.netlify.app` URL instantly

To update later: drag-and-drop again, or connect it to a GitHub repo for auto-deploy.

### Option B: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login works)
2. Click **"Add New Project"**
3. Import your GitHub repo, or use the Vercel CLI: `npx vercel --prod` from the project folder
4. Done — you get an `https://your-project.vercel.app` URL

### Option C: GitHub Pages

1. Create a GitHub repository and push the project files
2. Go to **Settings → Pages → Source → Deploy from a branch → main → / (root)**
3. Your site is live at `https://yourusername.github.io/repo-name`

---

## Event Day Tips

- **Test each clue location** the day before and confirm the coordinates are right
- **Share the link before the event starts** so everyone can tap it and have it cached
- Keep the phones on **maximum brightness** outdoors — GPS icon + big text matters
- If GPS is slow: tell players to step away from buildings and wait 5–10 seconds
- The app saves progress to the phone automatically — closing the browser and reopening picks up where they left off
- Finish timestamps are saved to localStorage on each phone — open browser dev tools → Application → Local Storage → `scavenger_finish_time` to see who finished first

---

## File Structure

```
index.html    ← the whole app UI
style.css     ← all styles, both themes
script.js     ← all game logic
config.js     ← YOUR FILE TO EDIT: passwords, clues, settings
README.md     ← this file
```

No build step, no Node.js, no dependencies to install. Just static files.
