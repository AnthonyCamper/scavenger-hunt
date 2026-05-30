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
  // --------------------------------------------------------------------------
  clues: [
    {
      id: "clue_01",
      emoji: "🥂",
      title: "Where It All Began",
      clue: "Every love story needs a first chapter. Head to the spot where these two lovebirds had their very first date — where the drinks were cold, the nerves were real, and neither one wanted the night to end.",
      lat: 40.748817,
      lng: -73.985428,
    },
    {
      id: "clue_02",
      emoji: "🌉",
      title: "Bridge Over Troubled Waters",
      clue: "They've crossed a few bridges together — literally and figuratively. Find the one they crossed on their first anniversary walk, where he finally told her he was falling for her.",
      lat: 40.752726,
      lng: -73.977229,
    },
    {
      id: "clue_03",
      emoji: "☕",
      title: "Their Standing Order",
      clue: "She gets oat milk. He gets black coffee with exactly too much sugar. Head to the café where they've spent more Sunday mornings than they can count.",
      lat: 40.756397,
      lng: -73.987085,
    },
    {
      id: "clue_04",
      emoji: "🎭",
      title: "Date Night Classics",
      clue: "Some couples watch movies at home. These two dress up for it. Find the old theatre where they saw their first film together and still argue about whether it was good.",
      lat: 40.761432,
      lng: -73.982903,
    },
    {
      id: "clue_05",
      emoji: "🌳",
      title: "The Proposal Spot",
      clue: "He practiced that speech four times in the car. She cried immediately. Find the exact bench in the park where a nervous question changed everything forever.",
      lat: 40.764244,
      lng: -73.973688,
      radius: 20,
    },
    {
      id: "clue_06",
      emoji: "🍕",
      title: "Celebration Slices",
      clue: "After the big YES, they called everyone they knew — and then went here for pizza, because love is hungry. Find the place where they toasted their engagement with cheese grease on their hands.",
      lat: 40.758912,
      lng: -73.979540,
    },
    {
      id: "clue_07",
      emoji: "🎶",
      title: "Their Song, Live",
      clue: "The song that plays at their wedding was first heard live at a tiny venue on a random Tuesday. They danced in the back like nobody was watching. Head there now.",
      lat: 40.754330,
      lng: -73.991200,
    },
    {
      id: "clue_08",
      emoji: "💒",
      title: "The Finish Line",
      clue: "Tomorrow they'll stand here and say the words that matter most. Today you've walked the path of their love story. End where it all begins — in front of the venue where two become one.",
      lat: 40.750880,
      lng: -73.995340,
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
