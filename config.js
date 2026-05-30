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
  // NOTE ON COORDINATES: These are real Lake Anna landmarks verified from
  // multiple sources. The Route 208 bridge coords (clue 3) are estimated —
  // drop a pin directly on the bridge in Google Maps to tighten them up
  // before the event. All spots are accessible by boat.
  // --------------------------------------------------------------------------
  clues: [
    {
      id: "clue_01",
      emoji: "⚓",
      title: "Cast Off",
      clue: "Every great adventure has a launchpad. Head to the southern shore where boats slide into the water and the hunt begins — the ramp where strangers become crews and weekends become memories. Find the landing.",
      // Pleasants Landing boat launch — southern end of lake
      // Source: pleasantslanding.com + fishing.org — HIGH confidence
      lat: 38.0073,
      lng: -77.7147,
      radius: 40,
    },
    {
      id: "clue_02",
      emoji: "🌊",
      title: "Held Together",
      clue: "A great dam doesn't fight the water — it holds it. Just like a great partnership doesn't fight the current, it channels it. Navigate to the southern tip of the lake, to the structure that keeps it all from flowing away.",
      // Lake Anna Dam (North Anna Dam) — southern terminus of the lake
      // Source: Wikipedia + damsoftheworld.com — HIGH confidence
      lat: 38.0127,
      lng: -77.7134,
      radius: 45,
    },
    {
      id: "clue_03",
      emoji: "🌉",
      title: "The Crossing",
      clue: "Two shores. One connection. Find the bridge that splits the lake in two — the crossing where the road meets the water. Pass beneath it, pull up alongside it, and let your phone find you right in the middle.",
      // Route 208 causeway bridge — mid-lake crossing
      // ⚠️  VERIFY BEFORE EVENT: open Google Maps, search "New Bridge Road Mineral VA",
      // drop a pin on the bridge deck over water, and replace these coords.
      lat: 38.0750,
      lng: -77.8000,
      radius: 50,
    },
    {
      id: "clue_04",
      emoji: "🏖️",
      title: "The Shore They Choose",
      clue: "At the end of every great journey, you want somewhere worth arriving. Head to the park beach on the western shore — the sandy stretch where families anchor and the water is calm. This is where the hunt ends and the celebration begins.",
      // Lake Anna State Park swimming beach — western shore
      // Source: Wikipedia (38°7'6.96\"N, 77°49'12\"W) + TopoZone — HIGH confidence
      lat: 38.1154,
      lng: -77.8233,
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
      loginLabel: "Enter your secret word 💕",
      loginPlaceholder: "Secret word...",
      loginButton: "Let's go, gorgeous! ✨",
      loginError: "Hmm, that's not it, babe! Try again 💕",
      checkButton: "Check My Location 📍",
      checkingButton: "Finding you... 💫",
      hitMessage: "You found it, gorgeous! 💖",
      hitSubtitle: "Yep, you're absolutely killing this hunt.",
      nextButton: "Next clue, cutie →",
      missNear: "🔥 You're SO close omg!!",
      missWarm: "Getting warmer, honey — keep going! 🌸",
      missCold: "Brrr, not quite! Try another direction 💕",
      missWayOff: "Way off, love — re-read the clue! 🌷",
      finaleTitle: "You did it, beautiful! 🌸",
      finaleMessage: "Every clue was a little piece of their love story — and now you know it by heart. Tomorrow she walks down the aisle, and you'll be right there with her. The bride is so lucky to have a tribe like you. Go celebrate — you've absolutely earned it! 💖✨",
      progressLabel: "Clue",
      clueLabel: "Your next clue 💌",
    },
  },
};
