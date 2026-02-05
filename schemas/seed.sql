-- Seed tier list data
INSERT OR REPLACE INTO tier_list (build_name, class_name, tier, category, source, source_url, season, updated_at) VALUES
('Evade Eagle', 'spiritborn', 'S', 'endgame', 'scarmonit', '/guides/evade-spiritborn', 11, datetime('now')),
('Lunging Strike', 'barbarian', 'S', 'endgame', 'scarmonit', '/guides/lunging-strike-barbarian', 11, datetime('now')),
('HotA', 'barbarian', 'S', 'endgame', 'scarmonit', '/guides/hota-barbarian', 11, datetime('now')),
('Pulverize', 'druid', 'S', 'endgame', 'scarmonit', '/guides/pulverize-druid', 11, datetime('now')),
('Shadowblight', 'necromancer', 'S', 'endgame', 'scarmonit', '/guides/shadowblight-necromancer', 11, datetime('now')),
('Death Trap', 'rogue', 'S', 'endgame', 'scarmonit', '/guides/death-trap-rogue', 11, datetime('now')),
('Crackling Energy', 'sorcerer', 'S', 'endgame', 'scarmonit', '/guides/crackling-energy-sorcerer', 11, datetime('now')),
('Spear of the Heavens', 'paladin', 'S', 'endgame', 'scarmonit', '/guides/spear-of-heavens-paladin', 11, datetime('now')),
('Auradin', 'paladin', 'A', 'endgame', 'scarmonit', '/auradin-guide', 11, datetime('now')),
('Whirlwind', 'barbarian', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Bash', 'barbarian', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Heartseeker', 'rogue', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Rain of Arrows', 'rogue', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Frozen Orb', 'sorcerer', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Hydra', 'sorcerer', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Triple Golem', 'necromancer', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Bone Prison', 'necromancer', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Quill Volley', 'spiritborn', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Payback', 'spiritborn', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Blessed Hammer', 'paladin', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now')),
('Judgment', 'paladin', 'A', 'endgame', 'scarmonit', NULL, 11, datetime('now'));

-- Seed build guides
INSERT OR REPLACE INTO builds (slug, build_name, class_name, tier, season, summary, playstyle, difficulty, skills, gear, aspects, paragon, source, source_url, updated_at) VALUES
('evade-spiritborn', 'Evade Eagle Spiritborn', 'spiritborn', 'S', 11, 'S-Tier Evade Eagle build. Spam Evade with 6 Storm Feathers per cast for insane AoE clear. Easiest build in the game.', 'Evade Spam / Lightning', 1, '["Thunderspike","Armored Hide","Concussive Stomp","Counterattack","Soar","The Seeker"]', '["Wushe Nak Pa","Loyaltys Mantle","Shroud of False Death","Temerity","Flickerstep"]', '["Redirected Force","Conceited","Vehement Brawlers","Unyielding Hits","Might","Disobedience"]', '["Starting Board/Spirit","Viscous Shield/Jagged Plume","Drive/Talon","Convergence/Fulminate","Spiney Skin/Canny"]', 'scarmonit', '/guides/evade-spiritborn', datetime('now')),
('lunging-strike-barbarian', 'Lunging Strike Barbarian', 'barbarian', 'S', 11, 'S-Tier generator build with insane mobility and damage. Lunging Strike chains through packs with massive AoE.', 'Generator / Mobile Melee', 2, '["Lunging Strike","Ground Stomp","War Cry","Challenging Shout","Iron Skin","Wrath of the Berserker"]', '["Battle Trance","Hooves of the Mountain God","Paingorgers Gauntlets","Shard of Verathiel","Ramaladnis"]', '["Aspect of Limitless Rage","Aspect of Ancestral Force","Edgemasters Aspect","Aspect of Might"]', '["Starting Board/Exploit","Warbringer/Might","Carnage/Challenger","Blood Rage/Wrath","Decimator/Imbiber"]', 'scarmonit', '/guides/lunging-strike-barbarian', datetime('now')),
('hota-barbarian', 'HotA Barbarian', 'barbarian', 'S', 11, 'S-Tier slam build. Hammer of the Ancients with Earthquake detonation for massive burst damage.', 'Slam / Burst', 3, '["HotA","Ground Stomp","War Cry","Rallying Cry","Challenging Shout","Wrath of the Berserker"]', '["Mantle of Mountains Fury","100000 Steps","Banished Lords Talisman","Ring of Red Furor","Ramaladnis"]', '["Aspect of Ancestral Force","Aspect of Limitless Rage","Edgemasters Aspect","Aspect of Might"]', '["Starting Board/Exploit","Carnage/Crusher","Blood Rage/Challenger","Bone Breaker/Dominate","Decimator/Wrath"]', 'scarmonit', '/guides/hota-barbarian', datetime('now')),
('pulverize-druid', 'Pulverize Druid', 'druid', 'S', 11, 'S-Tier Werebear Overpower build. Pulverize with guaranteed Overpowers from rot puddles.', 'Werebear / Overpower', 2, '["Pulverize","Claw","Grizzly Rage","Debilitating Roar","Cyclone Armor","Trample"]', '["Rotting Lightbringer","Temerity","Insatiable Fury","Heir of Perdition","Shroud of False Death"]', '["Shockwave Aspect","Ursine Horror Aspect","Rampaging Werebeast","Rabid Bear","Changelings Debt"]', '["Starting Board/Exploit","Inner Beast/Tectonic","Survival Instincts/Fang and Claw","Ancestral Guidance/Dominate","Earthen Devastation/Outmatch"]', 'scarmonit', '/guides/pulverize-druid', datetime('now')),
('shadowblight-necromancer', 'Shadowblight Necromancer', 'necromancer', 'S', 11, 'S-Tier Shadow DoT build. Stack shadow hits for Shadowblight procs with massive sustained damage.', 'Shadow DoT / Corpse', 3, '["Reap","Blight","Corpse Explosion","Corpse Tendrils","Soulrift","Decrepify"]', '["Blood Moon Breeches","Ebonpiercer","Heir of Perdition","Shroud of False Death","The Grandfather"]', '["Blighted Aspect","Cursed Aura","Grasping Veins","Decay Aspect","Damned Aspect","Sacrificial"]', '["Starting Board/Eliminator","Scent of Death/Sacrificial","Blood Begets Blood/Essence","Wither/Gravekeeper","Frailty/Abyssal"]', 'scarmonit', '/guides/shadowblight-necromancer', datetime('now')),
('death-trap-rogue', 'Death Trap Rogue', 'rogue', 'S', 11, 'S-Tier CDR loop build. Death Trap re-arms infinitely with Scoundrels Leathers for permanent uptime.', 'Trap / CDR Loop', 4, '["Death Trap","Concealment","Dash","Dark Shroud","Smoke Grenade","Caltrops"]', '["Scoundrels Leathers","Eyes in the Dark","Beastfall Boots","Harlequin Crest","Ring of Starless Skies"]', '["Apogeic Furor","Tricksters Aspect","Artful Initiative","Opportunists Aspect","Frostbitten","Conceited"]', '["Starting Board/Versatility","Deadly Ambush/Ambush","No Witnesses/Devious","Eldritch Bounty/Explosive","Leyranas Instinct/Canny"]', 'scarmonit', '/guides/death-trap-rogue', datetime('now')),
('crackling-energy-sorcerer', 'Crackling Energy Sorcerer', 'sorcerer', 'S', 11, 'S-Tier lightning chain build. Ball Lightning spam generates CE stacks for massive chain explosions.', 'Lightning / Chain AoE', 2, '["Ball Lightning","Lightning Spear","Teleport","Unstable Currents","Ice Armor","Frost Nova"]', '["Esadoras Overflowing Cameo","Orsivane Mace","Harlequin Crest","Tibaults Will","Ring of Starless Skies"]', '["Charged Flash","Shredding Blades","Bounding Conduit","Disobedience","Abundant Energy","Control"]', '["Starting Board/Charged","Ceaseless Conduit/Destruction","Static Surge/Eliminator","Enchantment Master/Tactician","Burning Instinct/Unleash"]', 'scarmonit', '/guides/crackling-energy-sorcerer', datetime('now')),
('spear-of-heavens-paladin', 'Spear of the Heavens Paladin', 'paladin', 'S', 11, 'S-Tier holy caster build. Judgement marks trigger chain detonation explosions for massive AoE.', 'Holy Caster / Burst', 3, '["Spear of the Heavens","Blessed Hammer","Arbiter of Justice","Fanaticism Aura","Defiance Aura","Falling Star"]', '["Seal of the Second Trumpet","Judicants Glaivehelm","Griswolds Opus","Herald of Zakarum","Shroud of False Death"]', '["Golden Hour","Judicator Aspect","Indomitable Aspect","Holy Punishment","Celestial Strife","Edgemasters"]', '["Starting Board/Law","Castle/Spirit","Relentless/Judicator","Preacher/Honed","Beacon/Resplendence"]', 'scarmonit', '/guides/spear-of-heavens-paladin', datetime('now'));

-- Seed key unique items
INSERT OR REPLACE INTO items (name, item_type, quality, class_restriction, description, updated_at) VALUES
('Harlequin Crest', 'Helm', 'mythic', 'all', '+4 Ranks to all Skills. +20% Damage Reduction.', datetime('now')),
('Shroud of False Death', 'Chest Armor', 'mythic', 'all', '+1 Ranks to all Passives. +160 All Stats. Stealth + 40% Movespeed when not attacking.', datetime('now')),
('Heir of Perdition', 'Helm', 'mythic', 'all', '+20% Crit Chance. +200% Damage to Angels/Demons. +60%[x] Damage.', datetime('now')),
('Ring of Starless Skies', 'Ring', 'mythic', 'all', 'Each consecutive Core Skill cast reduces Resource cost by 8-12%, up to 40-60%.', datetime('now')),
('The Grandfather', 'Two-Handed Sword', 'mythic', 'all', 'Increases Critical Strike Damage by 60-100%.', datetime('now')),
('Melted Heart of Selig', 'Amulet', 'mythic', 'all', '+30% Maximum Resource. Drain Resource instead of dying.', datetime('now')),
('Battle Trance', 'Helm', 'unique', 'barbarian', 'Increase Frenzy max stacks by 2. At max Frenzy, other skills gain 10-20% Attack Speed.', datetime('now')),
('Ramaladnis Magnum Opus', 'Sword', 'unique', 'barbarian', 'Skills using this weapon deal 0.1-0.5% increased damage per point of Fury.', datetime('now')),
('Mantle of Mountains Fury', 'Chest Armor', 'unique', 'barbarian', 'HotA creates Earthquakes. Earthquake damage stacks.', datetime('now')),
('100000 Steps', 'Boots', 'unique', 'barbarian', 'Walking Arsenal passive triggers Earthquake on weapon swap.', datetime('now')),
('Dawnfire', 'Gloves', 'unique', 'paladin', 'Holy Light deals Fire DMG/sec. Each kill grants +50% DMG (Max 500%).', datetime('now')),
('Herald of Zakarum', 'Shield', 'unique', 'paladin', '+40% Block Chance. Gain Strength, Resistance, Armor.', datetime('now')),
('Seal of the Second Trumpet', 'Ring', 'unique', 'paladin', 'Judgement marks chain detonate for massive AoE.', datetime('now')),
('Scoundrels Leathers', 'Chest Armor', 'unique', 'rogue', 'Inner Sight unlimited Energy boosts Movement Speed and damage.', datetime('now')),
('Eyes in the Dark', 'Pants', 'unique', 'rogue', 'Death Trap re-arms until it kills an enemy (non-Boss).', datetime('now')),
('Esadoras Overflowing Cameo', 'Amulet', 'unique', 'sorcerer', 'Collecting Crackling Energy releases lightning nova.', datetime('now')),
('Rotting Lightbringer', 'Staff', 'unique', 'druid', 'Pulverize creates poison rot puddles. Standing in rot guarantees Overpower.', datetime('now')),
('Wushe Nak Pa', 'Gloves', 'unique', 'spiritborn', 'Evade summons 6 Storm Feathers at 140% Lightning damage.', datetime('now')),
('Loyaltys Mantle', 'Chest Armor', 'unique', 'spiritborn', 'Increases Evade charges and Storm Feather damage.', datetime('now')),
('Blood Moon Breeches', 'Pants', 'unique', 'necromancer', 'Minions curse enemies. Cursed enemies take increased Shadow damage.', datetime('now'));

-- Seed meta snapshot
INSERT INTO meta_snapshots (season, patch_version, snapshot_data, analysis, created_at) VALUES
(11, '2.5.3', '{"top_builds":["Evade Eagle","Lunging Strike Barb","Pulverize Druid","Death Trap Rogue","Crackling Energy Sorc","Spear of Heavens Paladin"],"meta_summary":"Season 11 meta dominated by Spiritborn Evade and Barbarian generators. Paladin debut with strong S-tier options.","class_rankings":{"spiritborn":"S","barbarian":"S","paladin":"S","druid":"A+","necromancer":"A","rogue":"A","sorcerer":"A"}}', '{"strongest_class":"Spiritborn","most_played":"Barbarian","new_this_season":"Paladin class, Sanctification system, Divine Intervention mechanic","patch_notes":"2.5.3 balanced Evade cooldown, buffed Paladin auras"}', datetime('now'));
