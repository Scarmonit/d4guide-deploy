-- Sync tier_list table with Maxroll data (Season 11)
-- Generated from browser scrape of https://maxroll.gg/d4/tierlists/endgame-tier-list

DELETE FROM tier_list WHERE source = 'maxroll';

-- S TIER
INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, season) VALUES
('Auradin', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/auradin-guide', 11),
('Wing Strikes', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/wing-strikes-paladin-guide', 11),
('Judgement', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/judgement-paladin-guide', 11),
('Evade', 'spiritborn', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/evade-spiritborn-build-guide', 11),
('Death Trap', 'rogue', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/death-trap-rogue-guide', 11),
('Crackling Energy', 'sorcerer', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/crackling-energy-sorcerer-guide', 11),
('Heartseeker', 'rogue', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/heartseeker-rogue-specialized-guide', 11),
('Blessed Hammer', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blessed-hammer-paladin-guide', 11),
('Shield of Retribution', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/shield-of-retribution-paladin-guide', 11),
('Earthquake', 'barbarian', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/leapquake-barbarian-guide', 11),
('Whirlwind', 'barbarian', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/whirlwind-barbarian-guide', 11),
('Lunging Strike', 'barbarian', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/lunging-strike-barbarian-guide', 11),
('HotA', 'barbarian', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/hammer-of-the-ancients-barbarian-guide', 11),
('Pulverize', 'druid', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/pulverize-druid-guide', 11),
('Brandish', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/brandish-paladin-guide', 11),
('Shield Bash', 'paladin', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/shield-bash-paladin-guide', 11),
('Shadowblight', 'necromancer', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/shadowblight-necromancer-guide', 11),
('Companion', 'druid', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/companion-druid-guide', 11),
('Beast Strike', 'spiritborn', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/beast-strike-spiritborn-guide', 11),
('Flurry', 'rogue', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/flurry-rogue-guide', 11),
('Rain of Arrows', 'rogue', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/rain-of-arrows-rogue-guide', 11),
('Blood Wave', 'necromancer', 'S', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blood-wave-necromancer-guide', 11);

-- A TIER
INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, season) VALUES
('Dance of Knives', 'rogue', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/dance-of-knives-rogue-guide', 11),
('Twisting Blades', 'rogue', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/twisting-blades-rogue-guide', 11),
('Boulder', 'druid', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/boulder-druid-guide', 11),
('Hydra', 'sorcerer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/hydra-sorcerer-guide', 11),
('Cataclysm', 'druid', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/cataclysm-druid-build-guide', 11),
('Frozen Orb', 'sorcerer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/frozen-orb-sorcerer-guide', 11),
('Blizzard', 'sorcerer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blizzard-sorcerer-guide', 11),
('Fleshrender', 'druid', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/fleshrender-druid-guide', 11),
('Earth Spike', 'druid', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/earth-spike-druid-guide', 11),
('Divine Lance', 'paladin', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/divine-lance-paladin-guide', 11),
('Zeal', 'paladin', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/zeal-paladin-guide', 11),
('Blessed Shield', 'paladin', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blessed-shield-paladin-guide', 11),
('Shield Charge', 'paladin', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/shield-charge-paladin-guide', 11),
('Crushing Hand', 'spiritborn', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/crushing-hand-spiritborn-guide', 11),
('Quill Volley', 'spiritborn', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/quill-volley-spiritborn-guide', 11),
('Mighty Throw', 'barbarian', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/mighty-throw-barbarian-guide', 11),
('Golem', 'necromancer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/golem-necromancer-guide', 11),
('Bone Spirit', 'necromancer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/bone-spirit-necromancer-guide', 11),
('Minion', 'necromancer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/minion-necromancer-guide', 11),
('Penetrating Shot', 'rogue', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/penetrating-shot-rogue-guide', 11),
('Sever', 'necromancer', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/sever-necromancer-endgame-guide', 11),
('Thorns', 'spiritborn', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/thorns-spiritborn-build-guide', 11),
('Rake', 'spiritborn', 'A', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/rake-spiritborn-guide', 11);

-- B TIER
INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, season) VALUES
('Chain Lightning', 'sorcerer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/chain-lightning-sorcerer-guide', 11),
('Lightning Spear', 'sorcerer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/lightning-spear-sorcerer-guide', 11),
('Meteor', 'sorcerer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/meteor-sorcerer-guide', 11),
('Payback', 'spiritborn', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/payback-spiritborn-build-guide', 11),
('Bone Spear', 'necromancer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/bone-spear-necromancer-guide', 11),
('Shred', 'druid', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/shred-druid-guide', 11),
('Blight', 'necromancer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blight-necromancer-guide', 11),
('Touch of Death', 'spiritborn', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/touch-of-death-spiritborn-guide', 11),
('Ice Shards', 'sorcerer', 'B', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/ice-shards-sorcerer-guide', 11);

-- C TIER
INSERT INTO tier_list (build_name, class_name, tier, category, source, source_url, season) VALUES
('Ball Lightning', 'sorcerer', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/ball-lightning-sorcerer-guide', 11),
('Lightning Storm', 'druid', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/lightning-storm-druid-guide', 11),
('Blood Surge', 'necromancer', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blood-surge-necromancer-guide', 11),
('Fireball', 'sorcerer', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/fireball-sorcerer-guide', 11),
('Incinerate', 'sorcerer', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/incinerate-sorcerer-guide', 11),
('Blood Lance', 'necromancer', 'C', 'endgame', 'maxroll', 'https://maxroll.gg/d4/build-guides/blood-lance-necromancer-guide', 11);
