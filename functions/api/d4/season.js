/**
 * Season Info API
 * Returns current season info including countdown timers
 *
 * GET /api/d4/season
 */

// Season schedule - update this when new seasons are announced
// Dates are in UTC
const SEASONS = [
  { season: 11, name: 'Divine Intervention', start: '2026-01-21T17:00:00Z', end: '2026-03-11T17:00:00Z' },
  { season: 12, name: 'TBA', start: '2026-03-11T17:00:00Z', end: '2026-04-22T17:00:00Z' },
  { season: 13, name: 'TBA', start: '2026-04-22T17:00:00Z', end: '2026-06-03T17:00:00Z' },
];

export async function onRequest(context) {
  const now = new Date();

  // Find current and next season
  let currentSeason = null;
  let nextSeason = null;

  for (let i = 0; i < SEASONS.length; i++) {
    const season = SEASONS[i];
    const start = new Date(season.start);
    const end = new Date(season.end);

    if (now >= start && now < end) {
      currentSeason = season;
      nextSeason = SEASONS[i + 1] || null;
      break;
    } else if (now < start && !nextSeason) {
      nextSeason = season;
    }
  }

  // If no current season found (between seasons), use the last known
  if (!currentSeason && SEASONS.length > 0) {
    // Find the most recent past season
    for (let i = SEASONS.length - 1; i >= 0; i--) {
      if (new Date(SEASONS[i].end) <= now) {
        currentSeason = SEASONS[i];
        nextSeason = SEASONS[i + 1] || null;
        break;
      }
    }
    // If still no current, use the first upcoming
    if (!currentSeason) {
      nextSeason = SEASONS[0];
    }
  }

  // Calculate time remaining
  let timeRemaining = null;
  let timeUntilNext = null;
  let seasonEnded = false;

  if (currentSeason) {
    const endDate = new Date(currentSeason.end);
    const diff = endDate - now;

    if (diff > 0) {
      timeRemaining = {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    } else {
      seasonEnded = true;
    }
  }

  if (nextSeason) {
    const startDate = new Date(nextSeason.start);
    const diff = startDate - now;

    if (diff > 0) {
      timeUntilNext = {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    }
  }

  const response = {
    current: currentSeason ? {
      season: currentSeason.season,
      name: currentSeason.name,
      start: currentSeason.start,
      end: currentSeason.end,
      ended: seasonEnded,
      timeRemaining,
    } : null,
    next: nextSeason ? {
      season: nextSeason.season,
      name: nextSeason.name,
      start: nextSeason.start,
      timeUntilStart: timeUntilNext,
    } : null,
    allSeasons: SEASONS,
    serverTime: now.toISOString(),
    success: true,
  };

  return Response.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
    },
  });
}
