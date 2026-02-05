/**
 * Tier List Ingestion Script
 * Scrapes the Icy Veins D4 endgame tier list and inserts data into D1.
 *
 * Source: https://www.icy-veins.com/d4/tier-list
 * Fallback: https://www.icy-veins.com/d4/guides/endgame-tier-list/
 *
 * Usage: node scripts/ingest-tierlist.js
 */

const { d1Execute, d1BatchWithProgress } = require('./d1-client');

const TIER_LIST_URLS = [
  'https://www.icy-veins.com/d4/tier-list',
  'https://www.icy-veins.com/d4/guides/endgame-tier-list/',
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const CURRENT_SEASON = 11;

/**
 * Fetch HTML from a URL with retry logic.
 */
async function fetchHTML(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`  Fetching: ${url} (attempt ${attempt + 1})`);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      return await resp.text();
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt === retries) throw err;
      // Wait before retry
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

/**
 * Parse tier list data from Icy Veins HTML.
 *
 * The page uses a table structure where each row represents a tier.
 * Each tier row contains:
 *   - A <td> with class like "s-tier", "a-tier", etc.
 *   - Build cards as <a class="tier-list-build-card"> elements
 *
 * We use multiple regex strategies to handle HTML variations.
 */
function parseTierList(html) {
  const builds = [];

  // Strategy 1: Find tier rows and extract build cards within each
  // Split HTML by tier sections - look for tier indicators
  const tierSectionPattern = /<tr[^>]*>[\s\S]*?<td[^>]*class="[^"]*?(\w)-tier[^"]*?"[^>]*>[\s\S]*?<\/tr>/gi;
  const sections = html.match(tierSectionPattern);

  if (sections && sections.length > 0) {
    console.log(`  Found ${sections.length} tier sections (strategy 1: table rows)`);

    for (const section of sections) {
      // Extract tier letter from td class
      const tierMatch = section.match(/class="[^"]*?(\w)-tier[^"]*?"/i);
      if (!tierMatch) continue;
      const tier = tierMatch[1].toUpperCase();

      // Extract build cards from this section
      const cardPattern = /<a[^>]*?class="[^"]*?tier-list-build-card[^"]*?"[^>]*?data-filter="([^"]*?)"[^>]*?href="([^"]*?)"[^>]*?>[\s\S]*?<span[^>]*?class="[^"]*?card-build-title[^"]*?"[^>]*?>([^<]*?)<\/span>/gi;
      let cardMatch;
      while ((cardMatch = cardPattern.exec(section)) !== null) {
        const className = cardMatch[1].trim();
        const href = cardMatch[2].trim();
        const buildName = cardMatch[3].trim();

        if (buildName && className) {
          builds.push({
            build_name: buildName,
            class_name: className,
            tier,
            source_url: href.startsWith('http') ? href : `https://www.icy-veins.com${href}`,
          });
        }
      }
    }
  }

  // Strategy 2: If strategy 1 found nothing, try a more relaxed approach
  // Look for tier headings followed by build cards
  if (builds.length === 0) {
    console.log('  Strategy 1 yielded no results, trying strategy 2 (relaxed patterns)...');

    // Find all tier indicators (could be in divs, h tags, etc.)
    const tierIndicators = [
      { pattern: /class="[^"]*s-tier[^"]*"/gi, tier: 'S' },
      { pattern: /class="[^"]*a-tier[^"]*"/gi, tier: 'A' },
      { pattern: /class="[^"]*b-tier[^"]*"/gi, tier: 'B' },
      { pattern: /class="[^"]*c-tier[^"]*"/gi, tier: 'C' },
      { pattern: /class="[^"]*d-tier[^"]*"/gi, tier: 'D' },
      { pattern: /class="[^"]*f-tier[^"]*"/gi, tier: 'F' },
    ];

    // Find positions of each tier indicator
    const tierPositions = [];
    for (const { pattern, tier } of tierIndicators) {
      let m;
      while ((m = pattern.exec(html)) !== null) {
        tierPositions.push({ tier, index: m.index });
      }
    }
    tierPositions.sort((a, b) => a.index - b.index);

    if (tierPositions.length > 0) {
      console.log(`  Found ${tierPositions.length} tier indicators`);

      // For each tier position, find build cards until the next tier
      for (let i = 0; i < tierPositions.length; i++) {
        const startIdx = tierPositions[i].index;
        const endIdx = i + 1 < tierPositions.length ? tierPositions[i + 1].index : html.length;
        const segment = html.substring(startIdx, endIdx);
        const tier = tierPositions[i].tier;

        // Look for build cards in this segment
        const cardPattern2 = /<a[^>]*?href="([^"]*?)"[^>]*?data-filter="([^"]*?)"[^>]*?>[\s\S]*?<span[^>]*?card-build-title[^>]*?>([^<]*?)<\/span>/gi;
        let cm;
        while ((cm = cardPattern2.exec(segment)) !== null) {
          const href = cm[1].trim();
          const className = cm[2].trim();
          const buildName = cm[3].trim();
          if (buildName && className) {
            builds.push({
              build_name: buildName,
              class_name: className,
              tier,
              source_url: href.startsWith('http') ? href : `https://www.icy-veins.com${href}`,
            });
          }
        }
      }
    }
  }

  // Strategy 3: Even more relaxed - just find all build cards and infer tier
  if (builds.length === 0) {
    console.log('  Strategy 2 yielded no results, trying strategy 3 (all build cards)...');

    // Find any anchor with build-related classes
    const allCardsPattern = /<a[^>]*?href="([^"]*?d4[^"]*?)"[^>]*?>[^<]*?<[^>]*?>([^<]+)<\/[^>]*?>/gi;
    let acm;
    while ((acm = allCardsPattern.exec(html)) !== null) {
      const href = acm[1].trim();
      const text = acm[2].trim();
      if (text.length > 3 && text.length < 100) {
        builds.push({
          build_name: text,
          class_name: 'Unknown',
          tier: 'Unknown',
          source_url: href.startsWith('http') ? href : `https://www.icy-veins.com${href}`,
        });
      }
    }
  }

  // Deduplicate by build_name
  const seen = new Set();
  const unique = [];
  for (const build of builds) {
    const key = `${build.build_name}|${build.class_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(build);
    }
  }

  return unique;
}

/**
 * Main ingestion function.
 */
async function main() {
  console.log('=== Tier List Ingestion ===');
  console.log(`Season: ${CURRENT_SEASON}`);
  console.log(`Source: Icy Veins\n`);

  // Try each URL until we get data
  let html = null;
  let sourceUrl = null;

  for (const url of TIER_LIST_URLS) {
    try {
      html = await fetchHTML(url);
      sourceUrl = url;
      console.log(`  Fetched ${html.length} bytes from ${url}`);
      break;
    } catch (err) {
      console.warn(`  Failed to fetch ${url}: ${err.message}`);
    }
  }

  if (!html) {
    console.error('ERROR: Could not fetch tier list from any URL. Exiting without modifying data.');
    process.exit(1);
  }

  // Parse the tier list
  const builds = parseTierList(html);
  console.log(`\n  Parsed ${builds.length} builds from tier list`);

  if (builds.length === 0) {
    console.warn('WARNING: No builds parsed from tier list HTML. Exiting without modifying data.');
    console.warn('  This likely means the page structure has changed. Manual inspection required.');
    // Save a snippet of HTML for debugging
    const snippet = html.substring(0, 2000);
    console.warn(`  HTML preview (first 2000 chars):\n${snippet}\n`);
    process.exit(1);
  }

  // Log what we found
  const tierCounts = {};
  for (const b of builds) {
    tierCounts[b.tier] = (tierCounts[b.tier] || 0) + 1;
  }
  console.log('  Tier distribution:', JSON.stringify(tierCounts));

  const classCounts = {};
  for (const b of builds) {
    classCounts[b.class_name] = (classCounts[b.class_name] || 0) + 1;
  }
  console.log('  Class distribution:', JSON.stringify(classCounts));

  // Only proceed with DB operations if we have a reasonable amount of data
  if (builds.length < 5) {
    console.warn(`WARNING: Only ${builds.length} builds found - suspiciously low. Continuing anyway...`);
  }

  // Clear existing tier_list entries for this source and season
  console.log('\n  Clearing old icy-veins tier list entries...');
  await d1Execute(
    'DELETE FROM tier_list WHERE source = ? AND season = ?',
    ['icy-veins', CURRENT_SEASON]
  );

  // Insert new entries
  console.log(`  Inserting ${builds.length} tier list entries...`);
  const statements = builds.map(b => ({
    sql: `INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, season, updated_at)
          VALUES (?, ?, ?, 'endgame', 'icy-veins', ?, ?, datetime('now'))`,
    params: [b.build_name, b.class_name, b.tier, b.source_url, CURRENT_SEASON],
  }));

  const inserted = await d1BatchWithProgress(statements);
  console.log(`\n  Tier list ingestion complete: ${inserted}/${builds.length} entries inserted`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
