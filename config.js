// =============================================================================
// SCAVENGER HUNT CONFIGURATION
// Edit this file to customize your hunt. No coding knowledge needed!
// =============================================================================
//
// HOW TO GET COORDINATES FROM GOOGLE MAPS:
//   1. Open Google Maps on desktop (maps.google.com)
//   2. Right-click on the exact spot you want
//   3. The first item in the menu shows the coordinates — click them to copy
//   4. Paste the two numbers as lat and lng below
//
// HOW TO ADD A CLUE:
//   Copy one of the clue objects below (the { ... } block), paste it at the
//   end of the clues array (before the closing ]), and fill in your values.
//
// HOW TO ADJUST THE HIT RADIUS:
//   Change HIT_RADIUS_METERS below. 30 = pretty precise (good for a tight
//   urban spot), 50 = a bit forgiving, 100 = easy mode.
//
// =============================================================================

window.HUNT_CONFIG = {

  // --------------------------------------------------------------------------
  // PASSWORDS
  // --------------------------------------------------------------------------
  passwords: {
    guys: "brotherhood2025",   // Team Guys login password
    girls: "bridestribe2025",  // Team Girls login password
    admin: "review2025",       // Admin clue-review password (change before sharing)
  },

  // --------------------------------------------------------------------------
  // DEFAULT HIT RADIUS (meters) — can also be overridden per clue
  // --------------------------------------------------------------------------
  HIT_RADIUS_METERS: 30,

  // --------------------------------------------------------------------------
  // CLUES
  // Each clue needs:
  //   id        — unique string, used internally
  //   title     — short bold headline shown above the clue text
  //   clue      — the actual riddle / directions (plain text or simple HTML)
  //   lat, lng  — target coordinates (from Google Maps — see instructions above)
  //   radius    — (OPTIONAL) override the default hit radius for this clue only
  //   emoji     — (OPTIONAL) emoji icon shown in the clue card header
  //
  // NOTE ON COORDINATES: These are real Lake Anna landmarks, verified against
  // the anna.uslakes.info gazetteer (coords match exactly). All spots are
  // reachable by boat.
  //
  // ISLAND RADII: The island coordinates are the CENTER of each island (dry
  // land a boat can't reach), so the hit radius must be large enough to fire
  // from the surrounding water — 90m comfortably covers a boat circling the
  // shoreline. The bridge (clue 4) sits over water, so a tighter radius is fine.
  // The four targets are 3–8km apart, so a generous radius can't cross-trigger.
  // --------------------------------------------------------------------------
  clues: [
    {
      id: "clue_01",
      emoji: "💀",
      title: "What Remains",
      clue: "Somewhere near the southern end of this lake there's an island with a name that raises questions. They didn't name it after the view, or a family, or a feeling. They named it for what's left when everything else is stripped away. What is that — and where is it?",
      // Bones Island — southern Lake Anna, Louisa County
      // Source: anna.uslakes.info/POI/Islands/Bones-Island/950725/ — HIGH confidence
      lat: 38.00042,
      lng: -77.73166,
      radius: 90,
    },
    {
      id: "clue_02",
      emoji: "🗺️",
      title: "Read the Name",
      clue: "The next island doesn't hide behind a family name or a pretty word. It described itself, plainly and accurately, in exactly two words. The name is the location. The location is the name. Find the island that just told you where it is.",
      // River Bend Island — mid-southern Lake Anna, Spotsylvania County
      // Source: anna.uslakes.info/POI/Islands/River-Bend-Island/951209/ — HIGH confidence
      lat: 38.03458,
      lng: -77.73749,
      radius: 90,
    },
    {
      id: "clue_03",
      emoji: "🎭",
      title: "Center Stage",
      clue: "There is an island on this lake that named itself after the act of performing for an audience. It is not modest. It is not subtle. It is, in fact, the opposite of hiding. Find the island that has always assumed it was being watched.",
      // Showman Island — mid Lake Anna, Louisa County
      // Source: anna.uslakes.info/POI/Islands/Showman-Island/950157/ — HIGH confidence
      lat: 38.03514,
      lng: -77.79972,
      radius: 90,
    },
    {
      id: "clue_04",
      emoji: "🌉",
      title: "A Day Worth Hollering About",
      clue: "Head north — farther north than any stop so far. Your final target is one of eight named bridges on this lake, and its name is hiding a celebration in plain sight. Split it in two: the sound you make when something's great, and the unit of time it happens on. Get your boat underneath it. Hunt over.",
      // Holladay Bridge — northern Lake Anna, Louisa County
      // Source: anna.uslakes.info/POI/Bridges/Holladay-Bridge/950328/ — HIGH confidence
      lat: 38.11069,
      lng: -77.88555,
      radius: 50,
    },
  ],

  // --------------------------------------------------------------------------
  // COPY STRINGS — themed per team
  // You can edit these if you want to change any of the UI text
  // --------------------------------------------------------------------------
  themes: {
    guys: {
      name: "Team Guys",
      loginLabel: "ENTER ACCESS CODE",
      loginPlaceholder: "Access code...",
      loginButton: "INITIATE MISSION",
      loginError: "ACCESS DENIED. Try again, soldier.",
      checkButton: "CHECK LOCATION",
      checkingButton: "ACQUIRING SIGNAL...",
      hitMessage: "🎯 TARGET ACQUIRED",
      hitSubtitle: "Location confirmed. Outstanding work.",
      nextButton: "NEXT OBJECTIVE →",
      missNear: "🔥 You're basically standing on it!",
      missWarm: "Getting warm — you're close.",
      missCold: "Cold — keep moving, soldier.",
      missWayOff: "Way off. Re-read the briefing.",
      finaleTitle: "MISSION COMPLETE.",
      finaleMessage: "All objectives secured. The groom's crew came through. Tomorrow the real mission begins — standing by his side as he starts the greatest adventure of his life. He's lucky to have you. Now go get a drink, you've earned it.",
      progressLabel: "OBJECTIVE",
      clueLabel: "BRIEFING",
    },
    girls: {
      name: "Team Girls",
      loginLabel: "Enter your password",
      loginPlaceholder: "Password",
      loginButton: "Begin the Hunt",
      loginError: "That's not quite right — please try again.",
      checkButton: "Check My Location",
      checkingButton: "Locating…",
      hitMessage: "You found it!",
      hitSubtitle: "Well done — on to the next one.",
      nextButton: "Next Clue →",
      missNear: "You're right on top of it — look around!",
      missWarm: "Getting closer — keep going.",
      missCold: "Not quite — try a different direction.",
      missWayOff: "Still searching — re-read the clue.",
      finaleTitle: "You made it.",
      finaleMessage: "Every stop on this hunt was a moment from their love story, and now you know it by heart. Tomorrow she walks down the aisle, and you'll be right there beside her. She is so lucky to have a group like you. Now go celebrate — you've more than earned it.",
      progressLabel: "Clue",
      clueLabel: "Your next clue",
    },
  },
};
