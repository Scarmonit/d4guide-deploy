/**
 * Maxroll Build Guide Auto-Ingestion Script
 *
 * Fetches the latest tier list and build guides from Maxroll.gg
 * and updates the D1 database with current meta recommendations.
 *
 * This script:
 * 1. Fetches the endgame tier list for current rankings
 * 2. Fetches individual build guide pages for details
 * 3. Parses skills, gear, aspects, paragon info
 * 4. Updates the builds table in D1
 *
 * Run weekly via GitHub Actions to keep guides auto-updated.
 *
 * Usage: node scripts/ingest-maxroll-builds.js
 */

const { d1Execute, d1BatchWithProgress, ingestTierList, ingestBuilds, useIngestAPI } = require('./d1-client');

const TIER_LIST_URL = 'https://maxroll.gg/d4/tierlists/endgame-tier-list';
const BUILD_GUIDE_BASE = 'https://maxroll.gg/d4/build-guides/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const CURRENT_SEASON = 11;

// Rate limiting - be nice to Maxroll's servers
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Fetch a page with retry logic
 */
async function fetchPage(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`  Fetching: ${url}`);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.text();
    } catch (err) {
      console.error(`    Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt < retries - 1) {
        await sleep(3000 * (attempt + 1));
      }
    }
  }
  return null;
}

/**
 * Parse the tier list page to extract all builds with their tiers
 */
function parseTierList(html) {
  const builds = [];

  // Match tier sections and their builds
  // The page has sections like "S Tier", "A Tier", etc.
  const tierPatterns = [
    { tier: 'S', pattern: /S[\s-]*Tier[\s\S]*?(?=A[\s-]*Tier|$)/i },
    { tier: 'A', pattern: /A[\s-]*Tier[\s\S]*?(?=B[\s-]*Tier|$)/i },
    { tier: 'B', pattern: /B[\s-]*Tier[\s\S]*?(?=C[\s-]*Tier|$)/i },
    { tier: 'C', pattern: /C[\s-]*Tier[\s\S]*?(?=D[\s-]*Tier|F[\s-]*Tier|$)/i },
  ];

  // Extract build links with class info
  // Pattern: /d4/build-guides/BUILD-NAME-CLASS-guide
  const buildLinkPattern = /\/d4\/build-guides\/([a-z0-9-]+)-guide/gi;
  const classPattern = /(barbarian|druid|necromancer|rogue|sorcerer|spiritborn|paladin)/i;

  // Find all build links
  let match;
  const allLinks = [];
  while ((match = buildLinkPattern.exec(html)) !== null) {
    const slug = match[1];
    allLinks.push(slug);
  }

  // Deduplicate
  const uniqueLinks = [...new Set(allLinks)];

  // Try to extract tier info from surrounding context
  // This is a simplified approach - we'll assign tiers based on position
  for (const slug of uniqueLinks) {
    // Extract class from slug (e.g., "lunging-strike-barbarian" -> "barbarian")
    const classMatch = slug.match(classPattern);
    const className = classMatch ? classMatch[1].toLowerCase() : 'unknown';

    // Extract build name from slug
    const buildName = slug
      .replace(/-?(barbarian|druid|necromancer|rogue|sorcerer|spiritborn|paladin)$/i, '')
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();

    // Determine tier based on position in HTML (rough heuristic)
    // Better: parse the actual tier sections
    const position = html.indexOf(`/${slug}-guide`);
    let tier = 'A'; // Default

    // Check which tier section this link appears in
    const beforeLink = html.substring(0, position);
    const lastSTier = beforeLink.lastIndexOf('S Tier');
    const lastATier = beforeLink.lastIndexOf('A Tier');
    const lastBTier = beforeLink.lastIndexOf('B Tier');
    const lastCTier = beforeLink.lastIndexOf('C Tier');

    const maxPos = Math.max(lastSTier, lastATier, lastBTier, lastCTier);
    if (maxPos === lastSTier && lastSTier > -1) tier = 'S';
    else if (maxPos === lastATier && lastATier > -1) tier = 'A';
    else if (maxPos === lastBTier && lastBTier > -1) tier = 'B';
    else if (maxPos === lastCTier && lastCTier > -1) tier = 'C';

    builds.push({
      slug: slug,
      build_name: buildName,
      class_name: className,
      tier: tier,
      guide_url: `${BUILD_GUIDE_BASE}${slug}-guide`,
    });
  }

  console.log(`  Found ${builds.length} unique builds in tier list`);
  return builds;
}

/**
 * Parse an individual build guide page for detailed info
 */
function parseBuildGuide(html, buildInfo) {
  const data = {
    ...buildInfo,
    summary: null,
    playstyle: null,
    difficulty: 3,
    skills: [],
    gear: [],
    aspects: [],
    paragon: [],
    rotation: [],
    tips: [],
  };

  // Extract summary/description
  // Look for meta description or intro paragraph
  const metaDesc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
  if (metaDesc) {
    data.summary = metaDesc[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
  }

  // Extract skills from skill tables/sections
  // Pattern varies but usually in a skills section
  const skillMatches = html.matchAll(/<h[23][^>]*>([^<]*(?:Skill|Active)[^<]*)<\/h[23]>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi);
  for (const match of skillMatches) {
    const tableContent = match[2];
    // Extract skill names from table rows
    const skillRows = tableContent.matchAll(/<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>/gi);
    for (const row of skillRows) {
      const skillName = row[1].trim();
      if (skillName && !skillName.includes('Skill') && skillName.length > 2) {
        data.skills.push(skillName);
      }
    }
  }

  // Alternative skill extraction from links
  if (data.skills.length === 0) {
    const skillLinks = html.matchAll(/\/d4\/skills\/[^"]+">([^<]+)</gi);
    for (const match of skillLinks) {
      const skill = match[1].trim();
      if (skill && !data.skills.includes(skill)) {
        data.skills.push(skill);
      }
    }
  }

  // Extract gear/uniques
  const uniqueMatches = html.matchAll(/\/d4\/items\/([^"]+)">([^<]+)</gi);
  const seenGear = new Set();
  for (const match of uniqueMatches) {
    const itemName = match[2].trim();
    if (itemName && !seenGear.has(itemName.toLowerCase())) {
      seenGear.add(itemName.toLowerCase());
      data.gear.push(itemName);
    }
  }

  // Extract aspects
  const aspectMatches = html.matchAll(/\/d4\/aspects\/([^"]+)">([^<]+)</gi);
  const seenAspects = new Set();
  for (const match of aspectMatches) {
    const aspectName = match[2].trim();
    if (aspectName && !seenAspects.has(aspectName.toLowerCase())) {
      seenAspects.add(aspectName.toLowerCase());
      data.aspects.push(aspectName);
    }
  }

  // Extract paragon glyphs
  const glyphMatches = html.matchAll(/\/d4\/paragon\/glyphs\/([^"]+)">([^<]+)</gi);
  const seenGlyphs = new Set();
  for (const match of glyphMatches) {
    const glyphName = match[2].trim();
    if (glyphName && !seenGlyphs.has(glyphName.toLowerCase())) {
      seenGlyphs.add(glyphName.toLowerCase());
      data.paragon.push(glyphName);
    }
  }

  // Extract paragon boards
  const boardMatches = html.matchAll(/\/d4\/paragon\/boards\/([^"]+)">([^<]+)</gi);
  for (const match of boardMatches) {
    const boardName = match[2].trim();
    if (boardName && !data.paragon.includes(boardName)) {
      data.paragon.push(boardName);
    }
  }

  // Determine playstyle from content
  const playstyleKeywords = {
    'generator': 'Generator',
    'spender': 'Spender',
    'dot': 'DoT',
    'minion': 'Minion',
    'summon': 'Summon',
    'melee': 'Melee',
    'ranged': 'Ranged',
    'aoe': 'AoE',
    'single target': 'Single Target',
    'speedfarm': 'Speedfarm',
    'push': 'Push',
  };

  const playstyles = [];
  const lowerHtml = html.toLowerCase();
  for (const [keyword, label] of Object.entries(playstyleKeywords)) {
    if (lowerHtml.includes(keyword)) {
      playstyles.push(label);
    }
  }
  data.playstyle = playstyles.slice(0, 3).join(' / ') || `${data.class_name} Build`;

  return data;
}

/**
 * Convert parsed build data to database format
 */
function buildToDbFormat(build) {
  return {
    slug: build.slug,
    build_name: build.build_name,
    class_name: build.class_name.toLowerCase(),
    tier: build.tier,
    season: CURRENT_SEASON,
    summary: build.summary || `${build.tier}-Tier ${build.build_name} build for ${build.class_name}.`,
    playstyle: build.playstyle,
    difficulty: build.difficulty || 3,
    skills: build.skills.length > 0 ? JSON.stringify(build.skills) : null,
    gear: build.gear.length > 0 ? JSON.stringify(build.gear) : null,
    aspects: build.aspects.length > 0 ? JSON.stringify(build.aspects) : null,
    paragon: build.paragon.length > 0 ? JSON.stringify(build.paragon) : null,
    rotation: build.rotation.length > 0 ? JSON.stringify(build.rotation) : null,
    tips: build.tips.length > 0 ? JSON.stringify(build.tips) : null,
    source: 'maxroll',
    source_url: build.guide_url,
  };
}

/**
 * Insert or update builds in D1
 */
async function upsertBuilds(builds) {
  if (builds.length === 0) {
    console.log('  No builds to insert');
    return 0;
  }

  // Use Ingest API in CI mode
  if (useIngestAPI()) {
    console.log('  Using Ingest API for builds upsert...');
    const result = await ingestBuilds(builds);
    return result.results?.success || builds.length;
  }

  // Local mode: use wrangler/D1 directly
  const statements = builds.map(b => ({
    sql: `INSERT INTO builds (slug, build_name, class_name, tier, season, summary, playstyle, difficulty,
          skills, gear, aspects, paragon, rotation, tips, source, source_url, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(slug) DO UPDATE SET
            build_name = excluded.build_name,
            class_name = excluded.class_name,
            tier = excluded.tier,
            season = excluded.season,
            summary = excluded.summary,
            playstyle = excluded.playstyle,
            difficulty = excluded.difficulty,
            skills = excluded.skills,
            gear = excluded.gear,
            aspects = excluded.aspects,
            paragon = excluded.paragon,
            rotation = excluded.rotation,
            tips = excluded.tips,
            source = excluded.source,
            source_url = excluded.source_url,
            updated_at = datetime('now')`,
    params: [
      b.slug, b.build_name, b.class_name, b.tier, b.season, b.summary, b.playstyle, b.difficulty,
      b.skills, b.gear, b.aspects, b.paragon, b.rotation, b.tips, b.source, b.source_url
    ],
  }));

  return await d1BatchWithProgress(statements, 10);
}

/**
 * Update tier_list table with current rankings
 */
async function updateTierList(builds) {
  // Use Ingest API in CI mode
  if (useIngestAPI()) {
    console.log('  Using Ingest API for tier_list upsert...');
    // Convert builds to tier_list format expected by the API
    const tierListData = builds.map(b => ({
      build_name: b.build_name,
      class_name: b.class_name,
      tier: b.tier,
      category: 'endgame',
      source: 'maxroll',
      source_url: b.source_url,
      season: CURRENT_SEASON,
    }));
    const result = await ingestTierList(tierListData);
    return result.results?.success || builds.length;
  }

  // Local mode: use wrangler/D1 directly
  const statements = builds.map(b => ({
    sql: `INSERT INTO tier_list (slug, build_name, class_name, tier, season, description, playstyle, difficulty, source_url, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(slug) DO UPDATE SET
            tier = excluded.tier,
            season = excluded.season,
            description = excluded.description,
            playstyle = excluded.playstyle,
            source_url = excluded.source_url,
            updated_at = datetime('now')`,
    params: [
      b.slug, b.build_name, b.class_name, b.tier, CURRENT_SEASON,
      b.summary || `${b.tier}-Tier ${b.build_name}`,
      b.playstyle,
      b.difficulty || 3,
      `/guides/${b.slug}`
    ],
  }));

  console.log(`  Updating tier_list with ${statements.length} entries...`);
  return await d1BatchWithProgress(statements, 10);
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('=== Maxroll Build Guide Auto-Ingestion ===');
  console.log(`Season: ${CURRENT_SEASON}`);
  console.log(`Tier List: ${TIER_LIST_URL}\n`);

  // Step 1: Fetch and parse tier list
  console.log('Step 1: Fetching tier list...');
  const tierListHtml = await fetchPage(TIER_LIST_URL);
  if (!tierListHtml) {
    console.error('ERROR: Failed to fetch tier list. Exiting.');
    process.exit(1);
  }

  const builds = parseTierList(tierListHtml);
  if (builds.length === 0) {
    console.error('ERROR: No builds found in tier list. Exiting.');
    process.exit(1);
  }

  // Step 2: Fetch individual build guides (limit to top tiers to be nice to Maxroll)
  console.log('\nStep 2: Fetching individual build guides...');
  const topBuilds = builds.filter(b => b.tier === 'S' || b.tier === 'A');
  console.log(`  Processing ${topBuilds.length} S/A tier builds (skipping B/C to reduce load)`);

  const detailedBuilds = [];
  for (const build of topBuilds) {
    await sleep(DELAY_BETWEEN_REQUESTS);

    const guideHtml = await fetchPage(build.guide_url);
    if (guideHtml) {
      const detailed = parseBuildGuide(guideHtml, build);
      detailedBuilds.push(detailed);
      console.log(`    ${build.build_name}: ${detailed.skills.length} skills, ${detailed.gear.length} gear, ${detailed.aspects.length} aspects`);
    } else {
      // Use basic info if guide fetch failed
      detailedBuilds.push(build);
      console.log(`    ${build.build_name}: Using basic info (guide fetch failed)`);
    }
  }

  // Add B/C tier builds with basic info (no detailed scraping)
  const lowerTierBuilds = builds.filter(b => b.tier !== 'S' && b.tier !== 'A');
  for (const build of lowerTierBuilds) {
    detailedBuilds.push({
      ...build,
      summary: `${build.tier}-Tier ${build.build_name} build.`,
      playstyle: `${build.class_name} Build`,
      skills: [],
      gear: [],
      aspects: [],
      paragon: [],
    });
  }

  // Step 3: Convert to DB format
  console.log('\nStep 3: Preparing database updates...');
  const dbBuilds = detailedBuilds.map(buildToDbFormat);

  // Step 4: Update database
  console.log('\nStep 4: Updating D1 database...');

  console.log('  Updating builds table...');
  const buildCount = await upsertBuilds(dbBuilds);

  console.log('  Updating tier_list table...');
  const tierCount = await updateTierList(dbBuilds);

  // Summary
  console.log('\n=== Maxroll Ingestion Complete ===');
  console.log(`  Total builds processed: ${detailedBuilds.length}`);
  console.log(`  Builds table updated: ${buildCount}`);
  console.log(`  Tier list updated: ${tierCount}`);
  console.log(`  S-Tier: ${detailedBuilds.filter(b => b.tier === 'S').length}`);
  console.log(`  A-Tier: ${detailedBuilds.filter(b => b.tier === 'A').length}`);
  console.log(`  B-Tier: ${detailedBuilds.filter(b => b.tier === 'B').length}`);
  console.log(`  C-Tier: ${detailedBuilds.filter(b => b.tier === 'C').length}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
