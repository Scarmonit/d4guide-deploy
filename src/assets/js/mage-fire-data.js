// =============================================================================
// TBC Classic (2.4.3) Mage Talent Data
// Source: Vampyr7878/WoW-Talent-Caluclator-TBC (grid positions, icons, deps)
//         Cross-referenced with Wowhead TBC Classic & wowisclassic.com
// =============================================================================

const _TALENT_RAW = {

  // =========================================================================
  // ARCANE TREE  (23 talents)
  // =========================================================================
  arcane: {
    name: "Arcane",
    background: "mage_arcane",
    talents: [
      // --- Row 0 (Tier 1) --- requires 0 points
      { id: "arc1",  name: "Arcane Subtlety",          row: 0, col: 0, maxRank: 2, icon: "spell_holy_dispelmagic",
        desc: "Reduces your target's resistance to all your spells by {5/10} and reduces the threat caused by your Arcane spells by {20/40}%." },
      { id: "arc2",  name: "Arcane Focus",             row: 0, col: 1, maxRank: 5, icon: "spell_holy_devotion",
        desc: "Reduces the chance that the opponent can resist your Arcane spells by {2/4/6/8/10}%." },
      { id: "arc3",  name: "Improved Arcane Missiles",  row: 0, col: 2, maxRank: 5, icon: "spell_nature_starfall",
        desc: "Gives you a {20/40/60/80/100}% chance to avoid interruption caused by damage while channeling Arcane Missiles." },

      // --- Row 1 (Tier 2) --- requires 5 points
      { id: "arc4",  name: "Wand Specialization",      row: 1, col: 0, maxRank: 2, icon: "inv_wand_01",
        desc: "Increases your damage with Wands by {13/25}%.", requires: 5 },
      { id: "arc5",  name: "Magic Absorption",         row: 1, col: 1, maxRank: 5, icon: "spell_nature_astralrecalgroup",
        desc: "Increases all resistances by {2/4/6/8/10} and causes all spells you fully resist to restore {1/2/3/4/5}% of your total mana. 1 sec. cooldown.", requires: 5 },
      { id: "arc6",  name: "Arcane Concentration",     row: 1, col: 2, maxRank: 5, icon: "spell_shadow_manaburn",
        desc: "Gives you a {2/4/6/8/10}% chance of entering a Clearcasting state after any damage spell hits a target. The Clearcasting state reduces the mana cost of your next damage spell by 100%.", requires: 5 },

      // --- Row 2 (Tier 3) --- requires 10 points
      { id: "arc7",  name: "Magic Attunement",         row: 2, col: 0, maxRank: 2, icon: "spell_nature_abolishmagic",
        desc: "Increases the effect of your Amplify Magic and Dampen Magic spells by {25/50}%.", requires: 10 },
      { id: "arc8",  name: "Arcane Impact",            row: 2, col: 1, maxRank: 3, icon: "spell_nature_wispsplode",
        desc: "Increases the critical strike chance of your Arcane Explosion and Arcane Blast spells by an additional {2/4/6}%.", requires: 10 },
      { id: "arc9",  name: "Arcane Fortitude",         row: 2, col: 3, maxRank: 1, icon: "spell_arcane_arcaneresilience",
        desc: "Increases your armor by an amount equal to 100% of your Intellect.", requires: 10 },

      // --- Row 3 (Tier 4) --- requires 15 points
      { id: "arc10", name: "Improved Mana Shield",     row: 3, col: 0, maxRank: 2, icon: "spell_shadow_detectlesserinvisibility",
        desc: "Decreases the mana lost per point of damage taken when Mana Shield is active by {10/20}%.", requires: 15 },
      { id: "arc11", name: "Improved Counterspell",    row: 3, col: 1, maxRank: 2, icon: "spell_frost_iceshock",
        desc: "Gives your Counterspell a {50/100}% chance to silence the target for 4 sec.", requires: 15 },
      { id: "arc12", name: "Arcane Meditation",        row: 3, col: 3, maxRank: 3, icon: "spell_shadow_siphonmana",
        desc: "Allows {10/20/30}% of your mana regeneration to continue while casting.", requires: 15 },

      // --- Row 4 (Tier 5) --- requires 20 points
      { id: "arc13", name: "Improved Blink",           row: 4, col: 0, maxRank: 2, icon: "spell_arcane_blink",
        desc: "For 4 sec after casting Blink, your chance to be hit by all attacks and spells is reduced by {13/25}%.", requires: 20 },
      { id: "arc14", name: "Presence of Mind",         row: 4, col: 1, maxRank: 1, icon: "spell_nature_enchantarmor",
        desc: "When activated, your next Mage spell with a casting time less than 10 sec becomes an instant cast spell.", requires: 20 },
      { id: "arc15", name: "Arcane Mind",              row: 4, col: 3, maxRank: 5, icon: "spell_shadow_charm",
        desc: "Increases your total Intellect by {3/6/9/12/15}%.", requires: 20 },

      // --- Row 5 (Tier 6) --- requires 25 points
      { id: "arc16", name: "Prismatic Cloak",          row: 5, col: 0, maxRank: 2, icon: "spell_arcane_prismaticcloak",
        desc: "Reduces all damage taken by {2/4}%.", requires: 25 },
      { id: "arc17", name: "Arcane Instability",       row: 5, col: 1, maxRank: 3, icon: "spell_shadow_teleport",
        desc: "Increases your spell damage and critical strike chance by {1/2/3}%.", requires: 25, dependsOn: "arc14" },
      { id: "arc18", name: "Arcane Potency",           row: 5, col: 2, maxRank: 3, icon: "spell_arcane_arcanepotency",
        desc: "Increases the critical strike chance of any spell cast while Clearcasting by {10/20/30}%.", requires: 25, dependsOn: "arc6" },

      // --- Row 6 (Tier 7) --- requires 30 points
      { id: "arc19", name: "Empowered Arcane Missiles", row: 6, col: 0, maxRank: 3, icon: "spell_nature_starfall",
        desc: "Your Arcane Missiles spell gains an additional {15/30/45}% of your bonus spell damage effects, but mana cost is increased by {2/4/6}%.", requires: 30 },
      { id: "arc20", name: "Arcane Power",             row: 6, col: 1, maxRank: 1, icon: "spell_nature_lightning",
        desc: "When activated, your spells deal 30% more damage while costing 30% more mana to cast. This effect lasts 15 sec.", requires: 30, dependsOn: "arc17" },
      { id: "arc21", name: "Spell Power",              row: 6, col: 2, maxRank: 2, icon: "spell_arcane_arcanetorrent",
        desc: "Increases critical strike damage bonus of all spells by {25/50}%.", requires: 30 },

      // --- Row 7 (Tier 8) --- requires 35 points
      { id: "arc22", name: "Mind Mastery",             row: 7, col: 1, maxRank: 5, icon: "spell_arcane_mindmastery",
        desc: "Increases spell damage by up to {5/10/15/20/25}% of your total Intellect.", requires: 35 },

      // --- Row 8 (Tier 9) --- requires 40 points
      { id: "arc23", name: "Slow",                     row: 8, col: 1, maxRank: 1, icon: "spell_nature_slow",
        desc: "Reduces target's movement speed by 50%, increases the time between ranged attacks by 50% and increases casting time by 50%. Lasts 15 sec. Slow can only affect one target at a time.", requires: 40 }
    ]
  },

  // =========================================================================
  // FIRE TREE  (22 talents)
  // =========================================================================
  fire: {
    name: "Fire",
    background: "mage_fire",
    talents: [
      // --- Row 0 (Tier 1) --- requires 0 points
      { id: "fire1",  name: "Improved Fireball",       row: 0, col: 1, maxRank: 5, icon: "spell_fire_flamebolt",
        desc: "Reduces the casting time of your Fireball spell by {0.1/0.2/0.3/0.4/0.5} sec." },
      { id: "fire2",  name: "Impact",                  row: 0, col: 2, maxRank: 5, icon: "spell_fire_meteorstorm",
        desc: "Gives your Fire spells a {2/4/6/8/10}% chance to stun the target for 2 sec." },

      // --- Row 1 (Tier 2) --- requires 5 points
      { id: "fire3",  name: "Ignite",                  row: 1, col: 0, maxRank: 5, icon: "spell_fire_incinerate",
        desc: "Your critical strikes from Fire damage spells cause the target to burn for an additional {8/16/24/32/40}% of your spell's damage over 4 sec.", requires: 5 },
      { id: "fire4",  name: "Flame Throwing",          row: 1, col: 1, maxRank: 2, icon: "spell_fire_flare",
        desc: "Increases the range of your Fire spells by {3/6} yards.", requires: 5 },
      { id: "fire5",  name: "Improved Fire Blast",     row: 1, col: 2, maxRank: 3, icon: "spell_fire_fireball",
        desc: "Reduces the cooldown of your Fire Blast spell by {0.5/1/1.5} sec.", requires: 5 },

      // --- Row 2 (Tier 3) --- requires 10 points
      { id: "fire6",  name: "Incineration",            row: 2, col: 0, maxRank: 2, icon: "spell_fire_flameshock",
        desc: "Increases the critical strike chance of your Fire Blast and Scorch spells by {2/4}%.", requires: 10 },
      { id: "fire7",  name: "Improved Flamestrike",    row: 2, col: 1, maxRank: 3, icon: "spell_fire_selfdestruct",
        desc: "Increases the critical strike chance of your Flamestrike spell by {5/10/15}%.", requires: 10 },
      { id: "fire8",  name: "Pyroblast",               row: 2, col: 2, maxRank: 1, icon: "spell_fire_fireball02",
        desc: "Hurls an immense fiery boulder that causes 141 to 188 Fire damage and an additional 56 Fire damage over 12 sec.", requires: 10 },
      { id: "fire9",  name: "Burning Soul",            row: 2, col: 3, maxRank: 2, icon: "spell_fire_fire",
        desc: "Gives your Fire spells a {35/70}% chance to not lose casting time when you take damage and reduces the threat caused by your Fire spells by {5/10}%.", requires: 10 },

      // --- Row 3 (Tier 4) --- requires 15 points
      { id: "fire10", name: "Improved Scorch",         row: 3, col: 0, maxRank: 3, icon: "spell_fire_soulburn",
        desc: "Your Scorch spells have a {33/66/100}% chance to cause your target to be vulnerable to Fire damage. This vulnerability increases the Fire damage dealt to your target by 3% and lasts 30 sec. Stacks up to 5 times.", requires: 15 },
      { id: "fire11", name: "Molten Shields",          row: 3, col: 1, maxRank: 2, icon: "spell_fire_firearmor",
        desc: "Causes your Fire Ward to have a {10/20}% chance to reflect Fire spells while active. In addition, your Molten Armor has a {50/100}% chance to affect ranged and spell attacks.", requires: 15 },
      { id: "fire12", name: "Master of Elements",      row: 3, col: 3, maxRank: 3, icon: "spell_fire_masterofelements",
        desc: "Your Fire and Frost spell criticals will refund {10/20/30}% of their base mana cost.", requires: 15 },

      // --- Row 4 (Tier 5) --- requires 20 points
      { id: "fire13", name: "Playing with Fire",       row: 4, col: 0, maxRank: 3, icon: "spell_fire_playingwithfire",
        desc: "Increases all spell damage caused by {1/2/3}% and all spell damage taken by {1/2/3}%.", requires: 20 },
      { id: "fire14", name: "Critical Mass",           row: 4, col: 1, maxRank: 3, icon: "spell_nature_wispheal",
        desc: "Increases the critical strike chance of your Fire spells by {2/4/6}%.", requires: 20 },
      { id: "fire15", name: "Blast Wave",              row: 4, col: 2, maxRank: 1, icon: "spell_holy_excorcism_02",
        desc: "A wave of flame radiates outward from the caster, damaging all enemies caught within the blast for 154 to 187 Fire damage, and Dazing them for 6 sec.", requires: 20, dependsOn: "fire8" },

      // --- Row 5 (Tier 6) --- requires 25 points
      { id: "fire16", name: "Blazing Speed",           row: 5, col: 0, maxRank: 2, icon: "spell_fire_burningspeed",
        desc: "Gives you a {5/10}% chance when hit by a melee or ranged attack to increase your movement speed by 50% and dispel all movement impairing effects. This effect lasts 8 sec.", requires: 25 },
      { id: "fire17", name: "Fire Power",              row: 5, col: 2, maxRank: 5, icon: "spell_fire_immolation",
        desc: "Increases the damage done by your Fire spells by {2/4/6/8/10}%.", requires: 25 },

      // --- Row 6 (Tier 7) --- requires 30 points
      { id: "fire18", name: "Pyromaniac",              row: 6, col: 0, maxRank: 3, icon: "spell_fire_burnout",
        desc: "Increases chance to critically hit and reduces the mana cost of all Fire spells by an additional {1/2/3}%.", requires: 30 },
      { id: "fire19", name: "Combustion",              row: 6, col: 1, maxRank: 1, icon: "spell_fire_sealoffire",
        desc: "When activated, this spell causes each of your Fire damage spell hits to increase your critical strike chance with Fire damage spells by 10%. This effect lasts until you have caused 3 critical strikes with Fire spells.", requires: 30, dependsOn: "fire14" },
      { id: "fire20", name: "Molten Fury",             row: 6, col: 2, maxRank: 2, icon: "spell_fire_moltenblood",
        desc: "Increases damage of all spells against targets with less than 20% health by {10/20}%.", requires: 30 },

      // --- Row 7 (Tier 8) --- requires 35 points
      { id: "fire21", name: "Empowered Fireball",      row: 7, col: 2, maxRank: 5, icon: "spell_fire_flamebolt",
        desc: "Your Fireball spell gains an additional {3/6/9/12/15}% of your bonus spell damage effects.", requires: 35 },

      // --- Row 8 (Tier 9) --- requires 40 points
      { id: "fire22", name: "Dragon's Breath",         row: 8, col: 1, maxRank: 1, icon: "inv_misc_head_dragon_01",
        desc: "Targets in a cone in front of the caster take 370 to 431 Fire damage and are Disoriented for 3 sec. Any direct damaging attack will revive targets. Turns off your attack when used.", requires: 40, dependsOn: "fire19" }
    ]
  },

  // =========================================================================
  // FROST TREE  (22 talents)
  // =========================================================================
  frost: {
    name: "Frost",
    background: "mage_frost",
    talents: [
      // --- Row 0 (Tier 1) --- requires 0 points
      { id: "frost1",  name: "Frost Warding",          row: 0, col: 0, maxRank: 2, icon: "spell_frost_frostward",
        desc: "Increases the armor and resistances given by your Frost Armor and Ice Armor spells by {15/30}%. In addition, gives your Frost Ward a {10/20}% chance to reflect Frost spells and effects while active." },
      { id: "frost2",  name: "Improved Frostbolt",     row: 0, col: 1, maxRank: 5, icon: "spell_frost_frostbolt02",
        desc: "Reduces the casting time of your Frostbolt spell by {0.1/0.2/0.3/0.4/0.5} sec." },
      { id: "frost3",  name: "Elemental Precision",    row: 0, col: 2, maxRank: 3, icon: "spell_ice_magicdamage",
        desc: "Reduces the mana cost and chance targets resist your Frost and Fire spells by {1/2/3}%." },

      // --- Row 1 (Tier 2) --- requires 5 points
      { id: "frost4",  name: "Ice Shards",             row: 1, col: 0, maxRank: 5, icon: "spell_frost_iceshard",
        desc: "Increases the critical strike damage bonus of your Frost spells by {20/40/60/80/100}%.", requires: 5 },
      { id: "frost5",  name: "Frostbite",              row: 1, col: 1, maxRank: 3, icon: "spell_frost_frostarmor",
        desc: "Gives your Chill effects a {5/10/15}% chance to freeze the target for 5 sec.", requires: 5 },
      { id: "frost6",  name: "Improved Frost Nova",    row: 1, col: 2, maxRank: 2, icon: "spell_frost_freezingbreath",
        desc: "Reduces the cooldown of your Frost Nova spell by {2/4} sec.", requires: 5 },
      { id: "frost7",  name: "Permafrost",             row: 1, col: 3, maxRank: 3, icon: "spell_frost_wisp",
        desc: "Increases the duration of your Chill effects by {1/2/3} sec and reduces the target's speed by an additional {4/7/10}%.", requires: 5 },

      // --- Row 2 (Tier 3) --- requires 10 points
      { id: "frost8",  name: "Piercing Ice",           row: 2, col: 0, maxRank: 3, icon: "spell_frost_frostbolt",
        desc: "Increases the damage done by your Frost spells by {2/4/6}%.", requires: 10 },
      { id: "frost9",  name: "Icy Veins",              row: 2, col: 1, maxRank: 1, icon: "spell_frost_coldhearted",
        desc: "Hastens your spellcasting, increasing spell casting speed by 20% and gives you 100% chance to avoid interruption caused by damage while casting. Lasts 20 sec.", requires: 10 },
      { id: "frost10", name: "Improved Blizzard",      row: 2, col: 3, maxRank: 3, icon: "spell_frost_icestorm",
        desc: "Adds a chill effect to your Blizzard spell. This effect lowers the target's movement speed by {30/50/65}%. Lasts 1 sec.", requires: 10 },

      // --- Row 3 (Tier 4) --- requires 15 points
      { id: "frost11", name: "Arctic Reach",           row: 3, col: 0, maxRank: 2, icon: "spell_shadow_darkritual",
        desc: "Increases the range of your Frostbolt, Ice Lance and Blizzard spells and the radius of your Frost Nova and Cone of Cold spells by {10/20}%.", requires: 15 },
      { id: "frost12", name: "Frost Channeling",       row: 3, col: 1, maxRank: 3, icon: "spell_frost_stun",
        desc: "Reduces the mana cost of your Frost spells by {5/10/15}% and reduces the threat caused by your Frost spells by {4/7/10}%.", requires: 15 },
      { id: "frost13", name: "Shatter",                row: 3, col: 2, maxRank: 5, icon: "spell_frost_frostshock",
        desc: "Increases the critical strike chance of all your spells against frozen targets by {10/20/30/40/50}%.", requires: 15, dependsOn: "frost6" },

      // --- Row 4 (Tier 5) --- requires 20 points
      { id: "frost14", name: "Frozen Core",            row: 4, col: 0, maxRank: 3, icon: "spell_frost_frozencore",
        desc: "Reduces the damage taken by Frost and Fire effects by {2/4/6}%.", requires: 20 },
      { id: "frost15", name: "Cold Snap",              row: 4, col: 1, maxRank: 1, icon: "spell_frost_wizardmark",
        desc: "When activated, this spell finishes the cooldown on all Frost spells you recently cast.", requires: 20 },
      { id: "frost16", name: "Improved Cone of Cold",  row: 4, col: 2, maxRank: 3, icon: "spell_frost_glacier",
        desc: "Increases the damage dealt by your Cone of Cold spell by {15/25/35}%.", requires: 20 },

      // --- Row 5 (Tier 6) --- requires 25 points
      { id: "frost17", name: "Ice Floes",              row: 5, col: 0, maxRank: 2, icon: "spell_frost_icefloes",
        desc: "Reduces the cooldown of your Cone of Cold, Cold Snap, Ice Barrier and Ice Block spells by {10/20}%.", requires: 25 },
      { id: "frost18", name: "Winter's Chill",         row: 5, col: 2, maxRank: 5, icon: "spell_frost_chillingblast",
        desc: "Gives your Frost damage spells a {20/40/60/80/100}% chance to apply the Winter's Chill effect, which increases the chance a Frost spell will critically hit the target by 2% for 15 sec. Stacks up to 5 times.", requires: 25 },

      // --- Row 6 (Tier 7) --- requires 30 points
      { id: "frost19", name: "Ice Barrier",            row: 6, col: 1, maxRank: 1, icon: "spell_ice_lament",
        desc: "Instantly shields you, absorbing 438 damage. Lasts 1 min. While the shield holds, spells will not be interrupted.", requires: 30, dependsOn: "frost15" },
      { id: "frost20", name: "Arctic Winds",           row: 6, col: 2, maxRank: 5, icon: "spell_frost_arcticwinds",
        desc: "Increases all Frost damage you cause by {1/2/3/4/5}% and reduces the chance melee and ranged attacks will hit you by {1/2/3/4/5}%.", requires: 30 },

      // --- Row 7 (Tier 8) --- requires 35 points
      { id: "frost21", name: "Empowered Frostbolt",    row: 7, col: 1, maxRank: 4, icon: "spell_frost_frostbolt02",
        desc: "Your Frostbolt spell gains an additional {2/4/6/8}% of your bonus spell damage effects and an additional {1/2/3/4}% chance to critically strike.", requires: 35 },

      // --- Row 8 (Tier 9) --- requires 40 points
      { id: "frost22", name: "Summon Water Elemental", row: 8, col: 1, maxRank: 1, icon: "spell_frost_summonwaterelemental_2",
        desc: "Summon a Water Elemental to fight for the caster for 45 sec.", requires: 40 }
    ]
  }
};


// =============================================================================
// Recommended Build: Fire PvE Raiding (2/48/11)
// Standard TBC Fire Mage raid build with Icy Veins
// Arcane 2: Arcane Subtlety 2/2
// Fire 48: Improved Fireball 5, Ignite 5, Flame Throwing 2, Incineration 2,
//          Pyroblast 1, Burning Soul 2, Improved Scorch 3,
//          Master of Elements 3, Playing with Fire 3, Critical Mass 3,
//          Blast Wave 1, Fire Power 5, Pyromaniac 3, Combustion 1,
//          Molten Fury 2, Empowered Fireball 5, Dragon's Breath 1,
//          Improved Flamestrike 1
// Frost 11: Improved Frostbolt 5, Elemental Precision 3, Icy Veins 1,
//           Ice Shards 2  (alternate: 5 IFB + 3 EP + 1 IV + 2 IS = 11)
// =============================================================================

const _RECOMMENDED_RAW = [
  // Levels 10-14: Improved Fireball 5/5
  { level: 10, talent: "fire1", tree: "fire" },
  { level: 11, talent: "fire1", tree: "fire" },
  { level: 12, talent: "fire1", tree: "fire" },
  { level: 13, talent: "fire1", tree: "fire" },
  { level: 14, talent: "fire1", tree: "fire" },

  // Levels 15-19: Ignite 5/5
  { level: 15, talent: "fire3", tree: "fire" },
  { level: 16, talent: "fire3", tree: "fire" },
  { level: 17, talent: "fire3", tree: "fire" },
  { level: 18, talent: "fire3", tree: "fire" },
  { level: 19, talent: "fire3", tree: "fire" },

  // Levels 20-21: Flame Throwing 2/2
  { level: 20, talent: "fire4", tree: "fire" },
  { level: 21, talent: "fire4", tree: "fire" },

  // Levels 22-23: Incineration 2/2
  { level: 22, talent: "fire6", tree: "fire" },
  { level: 23, talent: "fire6", tree: "fire" },

  // Level 24: Pyroblast 1/1
  { level: 24, talent: "fire8", tree: "fire" },

  // Levels 25-26: Burning Soul 2/2
  { level: 25, talent: "fire9", tree: "fire" },
  { level: 26, talent: "fire9", tree: "fire" },

  // Levels 27-29: Improved Scorch 3/3
  { level: 27, talent: "fire10", tree: "fire" },
  { level: 28, talent: "fire10", tree: "fire" },
  { level: 29, talent: "fire10", tree: "fire" },

  // Levels 30-32: Master of Elements 3/3
  { level: 30, talent: "fire12", tree: "fire" },
  { level: 31, talent: "fire12", tree: "fire" },
  { level: 32, talent: "fire12", tree: "fire" },

  // Levels 33-35: Critical Mass 3/3
  { level: 33, talent: "fire14", tree: "fire" },
  { level: 34, talent: "fire14", tree: "fire" },
  { level: 35, talent: "fire14", tree: "fire" },

  // Levels 36-38: Playing with Fire 3/3
  { level: 36, talent: "fire13", tree: "fire" },
  { level: 37, talent: "fire13", tree: "fire" },
  { level: 38, talent: "fire13", tree: "fire" },

  // Level 39: Blast Wave 1/1
  { level: 39, talent: "fire15", tree: "fire" },

  // Levels 40-44: Fire Power 5/5
  { level: 40, talent: "fire17", tree: "fire" },
  { level: 41, talent: "fire17", tree: "fire" },
  { level: 42, talent: "fire17", tree: "fire" },
  { level: 43, talent: "fire17", tree: "fire" },
  { level: 44, talent: "fire17", tree: "fire" },

  // Levels 45-47: Pyromaniac 3/3
  { level: 45, talent: "fire18", tree: "fire" },
  { level: 46, talent: "fire18", tree: "fire" },
  { level: 47, talent: "fire18", tree: "fire" },

  // Level 48: Combustion 1/1
  { level: 48, talent: "fire19", tree: "fire" },

  // Levels 49-50: Molten Fury 2/2
  { level: 49, talent: "fire20", tree: "fire" },
  { level: 50, talent: "fire20", tree: "fire" },

  // Levels 51-55: Empowered Fireball 5/5
  { level: 51, talent: "fire21", tree: "fire" },
  { level: 52, talent: "fire21", tree: "fire" },
  { level: 53, talent: "fire21", tree: "fire" },
  { level: 54, talent: "fire21", tree: "fire" },
  { level: 55, talent: "fire21", tree: "fire" },

  // Level 56: Dragon's Breath 1/1
  { level: 56, talent: "fire22", tree: "fire" },

  // Level 57: Improved Flamestrike 1/3 (filling remaining Fire)
  { level: 57, talent: "fire7",  tree: "fire" },

  // Now into Frost tree for Icy Veins
  // Levels 58-62: Improved Frostbolt 5/5
  { level: 58, talent: "frost2", tree: "frost" },
  { level: 59, talent: "frost2", tree: "frost" },
  { level: 60, talent: "frost2", tree: "frost" },
  { level: 61, talent: "frost2", tree: "frost" },
  { level: 62, talent: "frost2", tree: "frost" },

  // Levels 63-65: Elemental Precision 3/3
  { level: 63, talent: "frost3", tree: "frost" },
  { level: 64, talent: "frost3", tree: "frost" },
  { level: 65, talent: "frost3", tree: "frost" },

  // Level 66: Icy Veins 1/1
  { level: 66, talent: "frost9", tree: "frost" },

  // Levels 67-68: Ice Shards 2/5 (remaining Frost points)
  { level: 67, talent: "frost4", tree: "frost" },
  { level: 68, talent: "frost4", tree: "frost" },

  // Levels 69-70: Arcane Subtlety 2/2 (threat reduction)
  { level: 69, talent: "arc1",  tree: "arcane" },
  { level: 70, talent: "arc1",  tree: "arcane" }
];


// =============================================================================
// Export configuration
// =============================================================================

window.TALENT_CALC_CONFIG = {
  trees: [
    { key: "arcane", gridId: "arcane-grid", arrowId: "arcane-arrows", pointsId: "arcane-points", abbrev: "ARC" },
    { key: "fire",   gridId: "fire-grid",   arrowId: "fire-arrows",   pointsId: "fire-points",   abbrev: "FIRE" },
    { key: "frost",  gridId: "frost-grid",  arrowId: "frost-arrows",  pointsId: "frost-points",  abbrev: "FROST" }
  ],
  talentData: _TALENT_RAW,
  recommendedOrder: _RECOMMENDED_RAW
};
