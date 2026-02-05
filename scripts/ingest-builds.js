/**
 * Build Guide Ingestion Script
 * Parses existing .njk guide files from src/guides/ and extracts
 * structured build data for insertion into the D1 builds table.
 *
 * This script reads local files - no network requests needed.
 *
 * Usage: node scripts/ingest-builds.js
 */

const fs = require('fs');
const path = require('path');
const { d1Execute, d1BatchWithProgress } = require('./d1-client');

const GUIDES_DIR = path.resolve(__dirname, '..', 'src', 'guides');
const CURRENT_SEASON = 11;

/**
 * Read all .njk files from the guides directory.
 * @returns {Array<{slug: string, filename: string, content: string}>}
 */
function loadGuideFiles() {
  if (!fs.existsSync(GUIDES_DIR)) {
    console.warn(`  Guides directory not found: ${GUIDES_DIR}`);
    return [];
  }

  const files = fs.readdirSync(GUIDES_DIR)
    .filter(f => f.endsWith('.njk'))
    .sort();

  console.log(`  Found ${files.length} guide files in ${GUIDES_DIR}`);

  return files.map(filename => {
    const filepath = path.join(GUIDES_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    const slug = filename.replace('.njk', '');
    return { slug, filename, content };
  });
}

/**
 * Extract the front matter from a .njk file.
 * Front matter is between --- delimiters at the start of the file.
 */
function extractFrontMatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[key] = value;
    }
  }

  return fm;
}

/**
 * Extract the build name from the <h1> tag.
 */
function extractBuildName(content) {
  // Match h1 content, ignoring any span tags inside
  const match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return null;

  // Remove HTML tags from the h1 content
  let name = match[1].replace(/<[^>]*>/g, '').trim();
  // Remove common suffixes
  name = name.replace(/\s*(Guide|Build Guide|VERIFIED|S-TIER|A-TIER|B-TIER)$/gi, '').trim();

  return name || null;
}

/**
 * Infer class name from the slug.
 * Slugs follow the pattern: "build-name-classname"
 */
function inferClassName(slug) {
  const classes = ['barbarian', 'druid', 'necromancer', 'rogue', 'sorcerer', 'spiritborn', 'paladin'];
  const slugLower = slug.toLowerCase();

  for (const cls of classes) {
    if (slugLower.endsWith(cls) || slugLower.includes(`-${cls}`)) {
      return cls.charAt(0).toUpperCase() + cls.slice(1);
    }
  }

  return 'Unknown';
}

/**
 * Extract tier from the guide content.
 * Looks for tier badges, build-info-value elements, or subtitle text.
 */
function extractTier(content) {
  // Check for tier in build-info-value
  const tierValueMatch = content.match(/build-info-label[^>]*>Tier<[\s\S]*?build-info-value[^>]*>([^<]*)/i);
  if (tierValueMatch) {
    const tierText = tierValueMatch[1].trim();
    const tierLetter = tierText.match(/([SABCDF])-?Tier/i);
    if (tierLetter) return tierLetter[1].toUpperCase();
  }

  // Check verified badge
  const badgeMatch = content.match(/verified-badge[^>]*>([^<]*)/i);
  if (badgeMatch) {
    const badgeText = badgeMatch[1].trim();
    if (/S-TIER/i.test(badgeText)) return 'S';
    if (/A-TIER/i.test(badgeText)) return 'A';
    if (/B-TIER/i.test(badgeText)) return 'B';
    if (/VERIFIED/i.test(badgeText)) return 'S'; // VERIFIED badge implies top-tier
  }

  // Check subtitle
  const subtitleMatch = content.match(/<p[^>]*class="subtitle"[^>]*>([^<]*)/i);
  if (subtitleMatch) {
    const tierLetter = subtitleMatch[1].match(/([SABCDF])-?Tier/i);
    if (tierLetter) return tierLetter[1].toUpperCase();
  }

  return 'S'; // Default to S-Tier since all our current guides are S-Tier
}

/**
 * Extract playstyle from the build info grid.
 */
function extractPlaystyle(content) {
  const match = content.match(/build-info-label[^>]*>Playstyle<[\s\S]*?build-info-value[^>]*>([^<]*)/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract difficulty rating (1-5) from difficulty pips.
 */
function extractDifficulty(content) {
  // Count filled difficulty pips
  const pips = content.match(/difficulty-pip filled/gi);
  if (pips) return pips.length;

  // Try text-based difficulty
  const match = content.match(/build-info-label[^>]*>Difficulty<[\s\S]*?build-info-value[^>]*>\s*(\w+)/i);
  if (match) {
    const diffMap = { 'easy': 2, 'medium': 3, 'moderate': 3, 'hard': 4, 'very hard': 5, 'extreme': 5 };
    return diffMap[match[1].toLowerCase()] || 3;
  }

  return 3; // Default medium
}

/**
 * Extract the build summary text from the Overview tab.
 */
function extractSummary(content) {
  // Find the Build Summary or Build Overview section
  const summarySection = content.match(/<h2>Build (?:Summary|Overview)<\/h2>\s*<p>([\s\S]*?)<\/p>/i);
  if (summarySection) {
    // Strip HTML entities and tags
    return summarySection[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&rarr;/g, '->')
      .replace(/&mdash;/g, '--')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
  return null;
}

/**
 * Extract strengths from the pros section.
 */
function extractStrengths(content) {
  const prosSection = content.match(/<div class="pros">\s*<h4>Strengths<\/h4>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (!prosSection) return null;

  const items = [];
  const liPattern = /<li>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liPattern.exec(prosSection[1])) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();
    if (text) items.push(text);
  }

  return items.length > 0 ? JSON.stringify(items) : null;
}

/**
 * Extract weaknesses from the cons section.
 */
function extractWeaknesses(content) {
  const consSection = content.match(/<div class="cons">\s*<h4>Weaknesses<\/h4>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (!consSection) return null;

  const items = [];
  const liPattern = /<li>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liPattern.exec(consSection[1])) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();
    if (text) items.push(text);
  }

  return items.length > 0 ? JSON.stringify(items) : null;
}

/**
 * Extract active skills from the Skills tab.
 */
function extractSkills(content) {
  // Find the Skills tab content
  const skillsTab = content.match(/<div id="skills"[\s\S]*?(?=<div id="\w+"[^>]*class="tab-content"|<\/div>\s*<script)/i);
  if (!skillsTab) return null;

  const skills = [];
  const skillCardPattern = /<div class="skill-card">\s*<div class="skill-icon">[^<]*<\/div>\s*<div class="skill-info">\s*<div class="skill-name">([\s\S]*?)<\/div>\s*<p class="skill-desc">([\s\S]*?)<\/p>/gi;

  let match;
  while ((match = skillCardPattern.exec(skillsTab[0])) !== null) {
    const nameRaw = match[1];
    const descRaw = match[2];

    // Extract skill name (remove span tags but keep their text)
    const name = nameRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const desc = descRaw.replace(/<[^>]*>/g, '').replace(/&rarr;/g, '->').replace(/&mdash;/g, '--').trim();

    skills.push({ name, desc });
  }

  // Also extract key passives
  const passiveSection = content.match(/<h2>Key Passives<\/h2>([\s\S]*?)(?=<\/div>\s*<\/div>\s*(?:<div id="|$))/i);
  if (passiveSection) {
    const passives = [];
    const passivePattern = /<li>\s*<strong>([^<]*)<\/strong>\s*[^<]*([\s\S]*?)<\/li>/gi;
    let pm;
    while ((pm = passivePattern.exec(passiveSection[1])) !== null) {
      const name = pm[1].trim();
      const desc = pm[2].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();
      passives.push({ name, desc });
    }
    if (passives.length > 0) {
      skills.push({ type: 'passives', items: passives });
    }
  }

  return skills.length > 0 ? JSON.stringify(skills) : null;
}

/**
 * Extract gear information from the Gear tab.
 */
function extractGear(content) {
  // Find the Gear tab content
  const gearTab = content.match(/<div id="gear"[\s\S]*?(?=<div id="\w+"[^>]*class="tab-content"|<\/div>\s*<script)/i);
  if (!gearTab) return null;

  const gear = [];
  const gearCardPattern = /<div class="gear-slot-card"[^>]*>\s*<div class="gear-slot-header"><span>([^<]*)<\/span><span[^>]*>([^<]*)<\/span><\/div>\s*<div class="unique-effect">([\s\S]*?)<\/div>/gi;

  let match;
  while ((match = gearCardPattern.exec(gearTab[0])) !== null) {
    const slotAndName = match[1].trim();
    const rarity = match[2].trim();
    const effect = match[3].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();

    // Parse "SLOT - Item Name" format
    const slotMatch = slotAndName.match(/^([A-Z0-9\s]+)\s*[-\u2014]\s*(.+)$/);
    const slot = slotMatch ? slotMatch[1].trim() : null;
    const name = slotMatch ? slotMatch[2].trim() : slotAndName;

    gear.push({ slot, name, rarity, effect });
  }

  return gear.length > 0 ? JSON.stringify(gear) : null;
}

/**
 * Extract aspects from the Aspects tab.
 */
function extractAspects(content) {
  // Find the Aspects tab content
  const aspectsTab = content.match(/<div id="aspects"[\s\S]*?(?=<div id="\w+"[^>]*class="tab-content"|<\/div>\s*<script)/i);
  if (!aspectsTab) return null;

  const aspects = [];

  // Look for aspect entries in gear-slot-card or similar
  const aspectPattern = /<div class="gear-slot-header"><span>([^<]*)<\/span><\/div>\s*<div class="unique-effect">([\s\S]*?)<\/div>/gi;

  let match;
  while ((match = aspectPattern.exec(aspectsTab[0])) !== null) {
    const nameRaw = match[1].trim();
    const desc = match[2].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();

    // Parse "Slot - Aspect Name" format
    const parts = nameRaw.split(/\s*[\u2014\u2013-]\s*/);
    const slot = parts.length > 1 ? parts[0].trim() : null;
    const name = parts.length > 1 ? parts.slice(1).join(' ').trim() : nameRaw;

    aspects.push({ slot, name, desc });
  }

  return aspects.length > 0 ? JSON.stringify(aspects) : null;
}

/**
 * Extract tempering priorities from the Aspects tab or Tempering tab.
 */
function extractTempering(content) {
  // Look for Tempering Priorities section
  const temperSection = content.match(/<h2>Tempering Priorities<\/h2>([\s\S]*?)(?=<\/div>\s*<\/div>\s*(?:<div id="|$))/i);
  if (!temperSection) return null;

  const tiers = [];
  // Find tier sections
  const tierPattern = /<div class="tier tier-(\w+)">\s*<h4>([^<]*)<\/h4>\s*<ul>([\s\S]*?)<\/ul>/gi;
  let match;

  while ((match = tierPattern.exec(temperSection[1])) !== null) {
    const tierLevel = match[1].toUpperCase();
    const tierLabel = match[2].trim();
    const items = [];

    const liPattern = /<li>\s*<strong>([^<]*)<\/strong>\s*[^<]*([\s\S]*?)<\/li>/gi;
    let lm;
    while ((lm = liPattern.exec(match[3])) !== null) {
      const name = lm[1].trim();
      const desc = lm[2].replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').replace(/&rarr;/g, '->').trim();
      items.push({ name, desc });
    }

    tiers.push({ tier: tierLevel, label: tierLabel, items });
  }

  return tiers.length > 0 ? JSON.stringify(tiers) : null;
}

/**
 * Extract paragon board information.
 */
function extractParagon(content) {
  const paragonTab = content.match(/<div id="paragon"[\s\S]*?(?=<div id="\w+"[^>]*class="tab-content"|<\/div>\s*<script)/i);
  if (!paragonTab) return null;

  const boards = [];
  const boardPattern = /<div class="paragon-board">\s*<div class="paragon-board-header">\s*<span class="paragon-board-name">([^<]*)<\/span>\s*<span class="paragon-board-order">([^<]*)<\/span>\s*<\/div>\s*<p[^>]*>([^]*?)<\/p>/gi;

  let match;
  while ((match = boardPattern.exec(paragonTab[0])) !== null) {
    const boardName = match[1].trim();
    const order = match[2].trim();
    const descRaw = match[3];

    // Extract glyph name
    const glyphMatch = descRaw.match(/Glyph:\s*<span[^>]*>([^<]*)<\/span>/i);
    const glyphName = glyphMatch ? glyphMatch[1].trim() : null;
    const desc = descRaw.replace(/<[^>]*>/g, '').replace(/&mdash;/g, '--').trim();

    boards.push({ board: boardName, order, glyph: glyphName, desc });
  }

  return boards.length > 0 ? JSON.stringify(boards) : null;
}

/**
 * Extract rotation steps from the Gameplay tab.
 */
function extractRotation(content) {
  const rotationSection = content.match(/<h2>Rotation<\/h2>\s*<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (!rotationSection) return null;

  const steps = [];
  const stepPattern = /<li[^>]*>\s*<p>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = stepPattern.exec(rotationSection[1])) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&rarr;/g, '->')
      .replace(/&mdash;/g, '--')
      .replace(/&amp;/g, '&')
      .trim();
    if (text) steps.push(text);
  }

  return steps.length > 0 ? JSON.stringify(steps) : null;
}

/**
 * Extract gameplay tips from the Gameplay tab.
 */
function extractTips(content) {
  const tips = [];
  const tipPattern = /<div class="tip-card">\s*<strong>([^<]*)<\/strong>\s*<p>([\s\S]*?)<\/p>/gi;

  let match;
  while ((match = tipPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const desc = match[2]
      .replace(/<[^>]*>/g, '')
      .replace(/&rarr;/g, '->')
      .replace(/&mdash;/g, '--')
      .replace(/&amp;/g, '&')
      .trim();
    tips.push({ title, desc });
  }

  return tips.length > 0 ? JSON.stringify(tips) : null;
}

/**
 * Parse a single guide file into a structured build object.
 */
function parseGuide(guide) {
  const { slug, content } = guide;

  const fm = extractFrontMatter(content);
  const buildName = extractBuildName(content) || fm.title?.replace(/\s*\|.*$/, '') || slug;
  const className = inferClassName(slug);
  const tier = extractTier(content);
  const playstyle = extractPlaystyle(content);
  const difficulty = extractDifficulty(content);
  const summary = extractSummary(content);
  const strengths = extractStrengths(content);
  const weaknesses = extractWeaknesses(content);
  const skills = extractSkills(content);
  const gear = extractGear(content);
  const aspects = extractAspects(content);
  const tempering = extractTempering(content);
  const paragon = extractParagon(content);
  const rotation = extractRotation(content);
  const tips = extractTips(content);

  return {
    slug,
    build_name: buildName,
    class_name: className,
    tier,
    season: CURRENT_SEASON,
    summary,
    playstyle,
    difficulty,
    strengths,
    weaknesses,
    skills,
    gear,
    aspects,
    tempering,
    paragon,
    rotation,
    tips,
    source: 'local',
    source_url: `/guides/${slug}`,
  };
}

/**
 * Main ingestion function.
 */
async function main() {
  console.log('=== Build Guide Ingestion ===');
  console.log(`Source: ${GUIDES_DIR}`);
  console.log(`Season: ${CURRENT_SEASON}\n`);

  // Load guide files
  const guides = loadGuideFiles();

  if (guides.length === 0) {
    console.warn('WARNING: No guide files found. Exiting without modifying data.');
    process.exit(0);
  }

  // Parse each guide
  const builds = [];
  for (const guide of guides) {
    console.log(`  Parsing: ${guide.filename}`);
    try {
      const build = parseGuide(guide);
      builds.push(build);

      // Log extracted data summary
      const fields = [
        build.build_name ? 'name' : null,
        build.class_name !== 'Unknown' ? 'class' : null,
        build.summary ? 'summary' : null,
        build.skills ? 'skills' : null,
        build.gear ? 'gear' : null,
        build.aspects ? 'aspects' : null,
        build.paragon ? 'paragon' : null,
        build.rotation ? 'rotation' : null,
        build.tips ? 'tips' : null,
      ].filter(Boolean);
      console.log(`    -> ${build.build_name} (${build.class_name}, ${build.tier}-Tier) [${fields.join(', ')}]`);
    } catch (err) {
      console.error(`    ERROR parsing ${guide.filename}: ${err.message}`);
    }
  }

  if (builds.length === 0) {
    console.warn('WARNING: No builds parsed. Exiting without modifying data.');
    process.exit(0);
  }

  console.log(`\n  Parsed ${builds.length} builds from ${guides.length} guide files`);

  // Insert into D1 using INSERT OR REPLACE (upsert by slug)
  console.log('  Inserting builds into D1...');
  const statements = builds.map(b => ({
    sql: `INSERT OR REPLACE INTO builds
          (slug, build_name, class_name, tier, season, summary, playstyle, difficulty,
           strengths, weaknesses, skills, gear, aspects, tempering, paragon, rotation, tips,
           source, source_url, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    params: [
      b.slug, b.build_name, b.class_name, b.tier, b.season,
      b.summary, b.playstyle, b.difficulty,
      b.strengths, b.weaknesses, b.skills, b.gear, b.aspects, b.tempering,
      b.paragon, b.rotation, b.tips,
      b.source, b.source_url,
    ],
  }));

  const inserted = await d1BatchWithProgress(statements, 5);

  console.log(`\n  Build ingestion complete: ${inserted}/${builds.length} builds inserted`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
