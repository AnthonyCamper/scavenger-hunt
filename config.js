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
      title: "Zero Hour",
      clue: "Every expedition needs a departure point. Somewhere on the southern shore there's a concrete ramp — a little rough, a little muddy — where boats have been sliding into this lake for decades. It has a name, and that name is a hint. Find the landing.",
      // Pleasants Landing boat launch — southern end of lake
      // Source: pleasantslanding.com + fishing.org — HIGH confidence
      lat: 38.0073,
      lng: -77.7147,
      radius: 40,
    },
    {
      id: "clue_02",
      emoji: "🌊",
      title: "The Edge of the World",
      clue: "Point your bow south and keep going until you physically can't anymore. At the very bottom of this lake, a massive earthen wall holds back every single drop of water you've been floating on all day. Without it, none of this exists. Navigate to the end of the lake — to the thing that made it.",
      // Lake Anna Dam (North Anna Dam) — southern terminus of the lake
      // Source: Wikipedia + damsoftheworld.com — HIGH confidence
      lat: 38.0127,
      lng: -77.7134,
      radius: 45,
    },
    {
      id: "clue_03",
      emoji: "🌉",
      title: "Under the Road",
      clue: "Somewhere in the middle of this lake, a highway crosses right over the water. Cars drive it every day without a second thought — totally unaware there's a lake underneath them. You're going to find that bridge and check in from the water side. Come at it from below. That's the move.",
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
      title: "Shore Leave",
      clue: "The western shore has been hiding a sandy beach this whole time — tucked inside a state park, open to anyone who shows up. Bring the boat in close enough that your GPS puts you on the sand. That's your final check-in. You're done. Now go find a drink.",
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
