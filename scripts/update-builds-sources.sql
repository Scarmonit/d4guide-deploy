-- Update builds table with Maxroll source URLs and correct tiers

UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/lunging-strike-barbarian-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'lunging-strike-barbarian';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/hammer-of-the-ancients-barbarian-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'hota-barbarian';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/whirlwind-barbarian-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'whirlwind-barbarian';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/pulverize-druid-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'pulverize-druid';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/shadowblight-necromancer-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'shadowblight-necromancer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/death-trap-rogue-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'death-trap-rogue';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/crackling-energy-sorcerer-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'crackling-energy-sorcerer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/evade-spiritborn-build-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'evade-spiritborn';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/heartseeker-rogue-specialized-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'heartseeker-rogue';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/rain-of-arrows-rogue-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'rain-of-arrows-rogue';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/frozen-orb-sorcerer-guide', tier = 'A', updated_at = datetime('now') WHERE slug = 'frozen-orb-sorcerer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/hydra-sorcerer-guide', tier = 'A', updated_at = datetime('now') WHERE slug = 'hydra-sorcerer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/golem-necromancer-guide', tier = 'A', updated_at = datetime('now') WHERE slug = 'triple-golem-necromancer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/bone-spear-necromancer-guide', tier = 'B', updated_at = datetime('now') WHERE slug = 'bone-prison-necromancer';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/quill-volley-spiritborn-guide', tier = 'A', updated_at = datetime('now') WHERE slug = 'quill-volley-spiritborn';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/payback-spiritborn-build-guide', tier = 'B', updated_at = datetime('now') WHERE slug = 'payback-spiritborn';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/blessed-hammer-paladin-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'blessed-hammer-paladin';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/judgement-paladin-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'judgment-paladin';
UPDATE builds SET source = 'maxroll', source_url = 'https://maxroll.gg/d4/build-guides/auradin-guide', tier = 'S', updated_at = datetime('now') WHERE slug = 'spear-of-heavens-paladin';
UPDATE builds SET source = 'maxroll', source_url = null, tier = 'A', updated_at = datetime('now') WHERE slug = 'bash-barbarian';
