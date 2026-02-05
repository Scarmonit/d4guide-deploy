/**
 * Seeds the D1 database by posting data through the live /api/d4/ingest endpoint.
 * This avoids needing a D1 API token — the Pages Function has D1 access via bindings.
 */
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://scarmonit.com/api/d4/ingest';
const INGEST_KEY = process.env.INGEST_KEY || 'd4api-scarmonit-2026-ingest';
const GUIDES_DIR = path.resolve(__dirname, '..', 'src', 'guides');

async function postToAPI(type, data) {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': INGEST_KEY
    },
    body: JSON.stringify({ type, data })
  });
  const json = await resp.json();
  if (!json.success) throw new Error(JSON.stringify(json));
  return json;
}

// --- Parse build guides from .njk files ---
function parseGuideFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.njk');

  // Extract build name from h1
  const h1Match = content.match(/<h1[^>]*>([^<]+)/);
  const buildName = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : fileName.replace(/-/g, ' ');

  // Extract class from slug
  const classMap = {
    barbarian: 'barbarian', druid: 'druid', necromancer: 'necromancer',
    rogue: 'rogue', sorcerer: 'sorcerer', spiritborn: 'spiritborn', paladin: 'paladin'
  };
  let className = 'unknown';
  for (const [key] of Object.entries(classMap)) {
    if (fileName.includes(key)) { className = key; break; }
  }

  // Extract summary
  const summaryMatch = content.match(/<div[^>]*id="overview"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500) : '';

  // Extract skills
  const skills = [];
  const skillRe = /<div class="skill-name"[^>]*>([^<]+)/g;
  let m;
  while ((m = skillRe.exec(content)) !== null) skills.push(m[1].trim());

  // Extract gear
  const gear = [];
  const gearRe = /<div class="gear-slot-header"[^>]*><span>([^<]+)/g;
  while ((m = gearRe.exec(content)) !== null) gear.push(m[1].trim());

  // Extract aspects
  const aspects = [];
  const aspectRe = /Aspect of[^<]*/g;
  while ((m = aspectRe.exec(content)) !== null) aspects.push(m[0].trim());

  // Extract paragon boards
  const paragon = [];
  const paragonRe = /<span class="paragon-board-name"[^>]*>([^<]+)/g;
  while ((m = paragonRe.exec(content)) !== null) paragon.push(m[1].trim());

  return {
    slug: fileName,
    build_name: buildName,
    class_name: className,
    tier: 'S',
    season: 11,
    summary,
    playstyle: 'Endgame',
    difficulty: 3,
    strengths: JSON.stringify([]),
    weaknesses: JSON.stringify([]),
    skills: JSON.stringify(skills),
    gear: JSON.stringify(gear),
    aspects: JSON.stringify(aspects),
    tempering: JSON.stringify([]),
    paragon: JSON.stringify(paragon),
    rotation: JSON.stringify([]),
    tips: JSON.stringify([]),
    source: 'local',
    source_url: `/guides/${fileName}`
  };
}

// --- Tier list seed data ---
function getTierListSeed() {
  return [
    { build_name: 'Evade Eagle', class_name: 'spiritborn', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/evade-spiritborn', season: 11 },
    { build_name: 'Lunging Strike', class_name: 'barbarian', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/lunging-strike-barbarian', season: 11 },
    { build_name: 'HotA', class_name: 'barbarian', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/hota-barbarian', season: 11 },
    { build_name: 'Pulverize', class_name: 'druid', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/pulverize-druid', season: 11 },
    { build_name: 'Shadowblight', class_name: 'necromancer', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/shadowblight-necromancer', season: 11 },
    { build_name: 'Death Trap', class_name: 'rogue', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/death-trap-rogue', season: 11 },
    { build_name: 'Crackling Energy', class_name: 'sorcerer', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/crackling-energy-sorcerer', season: 11 },
    { build_name: 'Spear of the Heavens', class_name: 'paladin', tier: 'S', category: 'endgame', source: 'scarmonit', source_url: '/guides/spear-of-heavens-paladin', season: 11 },
    { build_name: 'Auradin', class_name: 'paladin', tier: 'A', category: 'endgame', source: 'scarmonit', source_url: '/auradin-guide', season: 11 },
    { build_name: 'Whirlwind', class_name: 'barbarian', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Bash', class_name: 'barbarian', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Heartseeker', class_name: 'rogue', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Rain of Arrows', class_name: 'rogue', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Frozen Orb', class_name: 'sorcerer', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Hydra', class_name: 'sorcerer', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Triple Golem', class_name: 'necromancer', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Bone Prison', class_name: 'necromancer', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Quill Volley', class_name: 'spiritborn', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Payback', class_name: 'spiritborn', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Blessed Hammer', class_name: 'paladin', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
    { build_name: 'Judgment', class_name: 'paladin', tier: 'A', category: 'endgame', source: 'scarmonit', season: 11 },
  ];
}

async function main() {
  console.log('=== D4 API Seed via Live Endpoint ===\n');

  // 1. Seed tier list
  console.log('1. Seeding tier list...');
  const tierData = getTierListSeed();
  const tierResult = await postToAPI('tier-list', tierData);
  console.log(`   ✓ Tier list: ${tierResult.processed} entries\n`);

  // 2. Seed builds from local guide files
  console.log('2. Seeding builds from local guides...');
  const guideFiles = fs.readdirSync(GUIDES_DIR).filter(f => f.endsWith('.njk'));
  const builds = guideFiles.map(f => parseGuideFile(path.join(GUIDES_DIR, f)));
  console.log(`   Parsed ${builds.length} guides`);
  const buildResult = await postToAPI('builds', builds);
  console.log(`   ✓ Builds: ${buildResult.processed} entries\n`);

  // 3. Seed some sample items
  console.log('3. Seeding sample items...');
  const sampleItems = [
    { name: 'Harlequin Crest', item_type: 'Helm', quality: 'mythic', class_restriction: 'all', description: 'Gain +4 Ranks to all Skills. +20% Damage Reduction.' },
    { name: 'Shroud of False Death', item_type: 'Chest Armor', quality: 'mythic', class_restriction: 'all', description: '+1 Ranks to all Passives. +160 All Stats. Gain Stealth and 40% Movespeed when not attacking.' },
    { name: 'Heir of Perdition', item_type: 'Helm', quality: 'mythic', class_restriction: 'all', description: '+20% Crit Chance. +200% Damage to Angels/Demons. +60%[x] Damage. Steal Liliths Favor.' },
    { name: 'Ring of Starless Skies', item_type: 'Ring', quality: 'mythic', class_restriction: 'all', description: 'Each consecutive Core Skill cast reduces Resource cost by 8-12%, up to 40-60%.' },
    { name: 'The Grandfather', item_type: 'Two-Handed Sword', quality: 'mythic', class_restriction: 'all', description: 'Increases Critical Strike Damage by 60-100%.' },
    { name: 'Melted Heart of Selig', item_type: 'Amulet', quality: 'mythic', class_restriction: 'all', description: 'Gain +30% Maximum Resource. Instead of dying, drain 3 Resource for every 1% Life you would have lost.' },
    { name: 'Battle Trance', item_type: 'Helm', quality: 'unique', class_restriction: 'barbarian', description: 'Increase Frenzy maximum stacks by 2. While you have maximum Frenzy, your other Skills gain 10-20% increased Attack Speed.' },
    { name: 'Ramaladnis Magnum Opus', item_type: 'One-Handed Sword', quality: 'unique', class_restriction: 'barbarian', description: 'Skills using this weapon deal 0.1-0.5% increased damage per point of Fury you have.' },
    { name: 'Dawnfire', item_type: 'Gloves', quality: 'unique', class_restriction: 'paladin', description: 'Holy Light deals Fire Damage per second. Each kill grants +50% DMG, max 500%.' },
    { name: 'Herald of Zakarum', item_type: 'Shield', quality: 'unique', class_restriction: 'paladin', description: '+40% Block Chance. Gain Strength, Resistance, Armor, and Retribution Chance.' },
    { name: 'Scoundrels Leathers', item_type: 'Chest Armor', quality: 'unique', class_restriction: 'rogue', description: 'While you have unlimited Energy from Inner Sight, your Movement Speed is increased and you deal increased damage.' },
    { name: 'Eyes in the Dark', item_type: 'Pants', quality: 'unique', class_restriction: 'rogue', description: 'Unless it hits a Boss, Death Trap will continue to re-arm itself until it kills an enemy.' },
    { name: 'Esadoras Overflowing Cameo', item_type: 'Amulet', quality: 'unique', class_restriction: 'sorcerer', description: 'Upon collecting Crackling Energy, there is a chance to release a lightning nova dealing Lightning damage.' },
    { name: 'Rotting Lightbringer', item_type: 'Staff', quality: 'unique', class_restriction: 'druid', description: 'Pulverize creates puddles of poisonous rot. Standing in the rot guarantees Overpower on next Pulverize.' },
    { name: 'Wushe Nak Pa', item_type: 'Gloves', quality: 'unique', class_restriction: 'spiritborn', description: 'Evade now summons 6 Storm Feathers at 140% Lightning damage, auto-targeting nearby enemies.' },
    { name: 'Blood Moon Breeches', item_type: 'Pants', quality: 'unique', class_restriction: 'necromancer', description: 'Your Minions have a chance to curse enemies. Cursed enemies take increased Shadow damage.' },
  ];
  const itemResult = await postToAPI('items', sampleItems);
  console.log(`   ✓ Items: ${itemResult.processed} entries\n`);

  // 4. Seed a meta snapshot
  console.log('4. Seeding meta snapshot...');
  const metaResult = await postToAPI('meta', [{
    season: 11,
    patch_version: '2.5.3',
    snapshot_data: JSON.stringify({
      top_builds: ['Evade Eagle', 'Lunging Strike Barb', 'Pulverize Druid', 'Death Trap Rogue'],
      meta_summary: 'Season 11 meta is dominated by Spiritborn Evade builds and Barbarian generators. Paladin class introduced with strong S-tier options.',
      class_rankings: { spiritborn: 'S', barbarian: 'S', paladin: 'S', druid: 'A', necromancer: 'A', rogue: 'A', sorcerer: 'A' }
    }),
    analysis: JSON.stringify({
      strongest_class: 'Spiritborn',
      most_played: 'Barbarian',
      new_this_season: 'Paladin class, Sanctification system, Divine Intervention mechanic'
    })
  }]);
  console.log(`   ✓ Meta: ${metaResult.processed} snapshot(s)\n`);

  console.log('=== Seed complete! ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
