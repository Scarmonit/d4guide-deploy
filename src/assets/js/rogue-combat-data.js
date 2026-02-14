// =============================================================================
// WoW TBC Classic (2.4.3) -- Rogue Talent Data
// Sources: Ezekias1337/Burning-Crusade-Talent-Calculator (positions + tooltips)
//          tbctalentcalculator.net (icon names), Wowhead TBC Classic (cross-ref)
// =============================================================================

const _TALENT_RAW = {

// ======================= ASSASSINATION (21 talents) ==========================
assassination: {
  name: "Assassination",
  background: "rogue_assassination",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "ass1",  name: "Improved Eviscerate",  row: 0, col: 0, maxRank: 3, icon: "ability_rogue_eviscerate",     desc: "Increases the damage done by your Eviscerate ability by {5/10/15}%." },
    { id: "ass2",  name: "Remorseless Attacks",   row: 0, col: 1, maxRank: 2, icon: "ability_fiegndead",            desc: "After killing an opponent that yields experience or honor, gives you a {20/40}% increased critical strike chance on your next Sinister Strike, Backstab, Mutilate, Hemorrhage, Ambush, or Ghostly Strike. Lasts 20 sec." },
    { id: "ass3",  name: "Malice",                row: 0, col: 2, maxRank: 5, icon: "ability_racial_bloodrage",     desc: "Increases your critical strike chance by {1/2/3/4/5}%." },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "ass4",  name: "Ruthlessness",          row: 1, col: 0, maxRank: 3, requires: 5, icon: "ability_druid_disembowel",    desc: "Gives your finishing moves a {20/40/60}% chance to add a combo point to your target." },
    { id: "ass5",  name: "Murder",                 row: 1, col: 1, maxRank: 2, requires: 5, icon: "spell_shadow_deathscream",    desc: "Increases all damage caused against Humanoid, Giant, Beast, and Dragonkin targets by {1/2}%." },
    { id: "ass6",  name: "Puncturing Wounds",      row: 1, col: 3, maxRank: 3, requires: 5, icon: "ability_backstab",            desc: "Increases the critical strike chance of your Backstab ability by {10/20/30}%, and the critical strike chance of your Mutilate ability by {5/10/15}%." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "ass7",  name: "Relentless Strikes",    row: 2, col: 0, maxRank: 1, requires: 10, icon: "ability_warrior_decisivestrike", desc: "Your finishing moves have a 20% chance per combo point to restore 25 energy." },
    { id: "ass8",  name: "Improved Expose Armor",  row: 2, col: 1, maxRank: 2, requires: 10, icon: "ability_warrior_riposte",       desc: "Increases the armor reduced by your Expose Armor ability by an additional {25/50}%." },
    { id: "ass9",  name: "Lethality",              row: 2, col: 2, maxRank: 5, requires: 10, icon: "ability_criticalstrike",         desc: "Increases the critical strike damage bonus of your Sinister Strike, Gouge, Backstab, Ghostly Strike, Mutilate, Shiv, and Hemorrhage abilities by {6/12/18/24/30}%.", dependsOn: "ass3" },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "ass10", name: "Vile Poisons",          row: 3, col: 1, maxRank: 5, requires: 15, icon: "ability_rogue_feigndeath",   desc: "Increases the damage dealt by your poisons and Envenom ability by {4/8/12/16/20}% and gives your poisons an additional 8% chance to resist dispel effects." },
    { id: "ass11", name: "Improved Poisons",       row: 3, col: 2, maxRank: 5, requires: 15, icon: "ability_poisons",            desc: "Increases the chance to apply poisons to your target by {2/4/6/8/10}%." },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "ass12", name: "Fleet Footed",           row: 4, col: 0, maxRank: 2, requires: 20, icon: "ability_rogue_fleetfooted",  desc: "Increases your chance to resist movement impairing effects by {5/10}% and increases your movement speed by {8/15}%. This does not stack with other movement speed increasing effects." },
    { id: "ass13", name: "Cold Blood",             row: 4, col: 1, maxRank: 1, requires: 20, icon: "spell_ice_lament",           desc: "When activated, increases the critical strike chance of your next offensive ability by 100%." },
    { id: "ass14", name: "Improved Kidney Shot",   row: 4, col: 2, maxRank: 3, requires: 20, icon: "ability_rogue_kidneyshot",   desc: "While affected by your Kidney Shot ability, the target receives an additional {3/6/9}% damage from all sources." },
    { id: "ass15", name: "Quick Recovery",          row: 4, col: 3, maxRank: 2, requires: 20, icon: "spell_shadow_shadowworddominate", desc: "All healing effects on you are increased by {10/20}%. In addition, your finishing moves cost {40/80}% less Energy when they fail to hit." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "ass16", name: "Seal Fate",              row: 5, col: 1, maxRank: 5, requires: 25, icon: "spell_shadow_chilltouch",    desc: "Your critical strikes from abilities that add combo points have a {20/40/60/80/100}% chance to add an additional combo point.", dependsOn: "ass13" },
    { id: "ass17", name: "Master Poisoner",         row: 5, col: 2, maxRank: 2, requires: 25, icon: "spell_nature_corrosivebreath", desc: "Reduces the chance your poisons will be resisted by {5/10}% and increases your chance to resist Poison effects by an additional {15/30}%." },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "ass18", name: "Vigor",                  row: 6, col: 1, maxRank: 1, requires: 30, icon: "spell_nature_earthbindtotem", desc: "Increases your maximum Energy by 10." },
    { id: "ass19", name: "Deadened Nerves",         row: 6, col: 2, maxRank: 5, requires: 30, icon: "inv_drink_04",               desc: "Decreases all physical damage taken by {1/2/3/4/5}%." },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "ass20", name: "Find Weakness",          row: 7, col: 2, maxRank: 5, requires: 35, icon: "ability_rogue_findweakness", desc: "Your finishing moves increase the damage of all offensive abilities by {2/4/6/8/10}% for 10 sec." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "ass21", name: "Mutilate",               row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_rogue_shadowstrikes", desc: "Instantly attacks with both weapons for an additional 101 with each weapon. Damage is increased by 50% against Poisoned targets. Must be behind the target. Awards 2 combo points.", dependsOn: "ass18" },
  ]
},

// ========================= COMBAT (24 talents) ===============================
combat: {
  name: "Combat",
  background: "rogue_combat",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "com1",  name: "Improved Gouge",          row: 0, col: 0, maxRank: 3, icon: "ability_gouge",              desc: "Increases the effect duration of your Gouge ability by {0.5/1/1.5} sec." },
    { id: "com2",  name: "Improved Sinister Strike", row: 0, col: 1, maxRank: 2, icon: "spell_shadow_ritualofsacrifice", desc: "Reduces the Energy cost of your Sinister Strike ability by {3/5}." },
    { id: "com3",  name: "Lightning Reflexes",       row: 0, col: 2, maxRank: 5, icon: "spell_nature_invisibilty",  desc: "Increases your Dodge chance by {1/2/3/4/5}%." },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "com4",  name: "Improved Slice and Dice",  row: 1, col: 0, maxRank: 3, requires: 5, icon: "ability_rogue_slicedice",  desc: "Increases the duration of your Slice and Dice ability by {15/30/45}%." },
    { id: "com5",  name: "Deflection",               row: 1, col: 1, maxRank: 5, requires: 5, icon: "ability_parry",            desc: "Increases your Parry chance by {1/2/3/4/5}%." },
    { id: "com6",  name: "Precision",                 row: 1, col: 2, maxRank: 5, requires: 5, icon: "ability_marksmanship",     desc: "Increases your chance to hit with melee weapons by {1/2/3/4/5}%." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "com7",  name: "Endurance",                row: 2, col: 0, maxRank: 2, requires: 10, icon: "spell_shadow_shadowward", desc: "Reduces the cooldown of your Sprint and Evasion abilities by {45 sec/1.5 min}." },
    { id: "com8",  name: "Riposte",                  row: 2, col: 1, maxRank: 1, requires: 10, icon: "ability_warrior_challange", desc: "A strike that becomes active after parrying an opponent's attack. This attack deals 150% weapon damage and disarms the target for 6 sec.", dependsOn: "com5" },
    { id: "com9",  name: "Improved Sprint",           row: 2, col: 3, maxRank: 2, requires: 10, icon: "ability_rogue_sprint",    desc: "Gives a {50/100}% chance to remove all movement impairing effects when you activate your Sprint ability." },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "com10", name: "Improved Kick",             row: 3, col: 0, maxRank: 2, requires: 15, icon: "ability_kick",            desc: "Gives your Kick ability a {50/100}% chance to silence the target for 2 sec." },
    { id: "com11", name: "Dagger Specialization",     row: 3, col: 1, maxRank: 5, requires: 15, icon: "inv_weapon_shortblade_05", desc: "Increases your chance to get a critical strike with Daggers by {1/2/3/4/5}%." },
    { id: "com12", name: "Dual Wield Specialization",  row: 3, col: 2, maxRank: 5, requires: 15, icon: "ability_dualwield",      desc: "Increases the damage done by your offhand weapon by {10/20/30/40/50}%.", dependsOn: "com6" },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "com13", name: "Mace Specialization",       row: 4, col: 0, maxRank: 5, requires: 20, icon: "inv_mace_01",            desc: "Increases the damage dealt by your critical strikes with maces by {1/2/3/4/5}%, and gives you a {1/2/3/4/5}% chance to stun your target for 3 sec with a mace." },
    { id: "com14", name: "Blade Flurry",              row: 4, col: 1, maxRank: 1, requires: 20, icon: "ability_warrior_punishingblow", desc: "Increases your attack speed by 20%. In addition, attacks strike an additional nearby opponent. Lasts 15 sec." },
    { id: "com15", name: "Sword Specialization",      row: 4, col: 2, maxRank: 5, requires: 20, icon: "inv_sword_27",           desc: "Gives you a {1/2/3/4/5}% chance to get an extra attack on the same target after dealing damage with your Sword." },
    { id: "com16", name: "Fist Weapon Specialization", row: 4, col: 3, maxRank: 5, requires: 20, icon: "inv_gauntlets_04",      desc: "Increases your chance to get a critical strike with Fist Weapons by {1/2/3/4/5}%." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "com17", name: "Blade Twisting",            row: 5, col: 0, maxRank: 2, requires: 25, icon: "ability_rogue_slicedice", desc: "Gives your Sinister Strike, Backstab, Gouge and Shiv abilities a {10/20}% chance to Daze the target for 8 sec." },
    { id: "com18", name: "Weapon Expertise",          row: 5, col: 1, maxRank: 2, requires: 25, icon: "spell_holy_blessingofstrength", desc: "Increases your expertise by {5/10}.", dependsOn: "com14" },
    { id: "com19", name: "Aggression",                row: 5, col: 2, maxRank: 3, requires: 25, icon: "ability_racial_avatar",   desc: "Increases the damage of your Sinister Strike and Eviscerate abilities by {2/4/6}%." },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "com20", name: "Vitality",                  row: 6, col: 0, maxRank: 2, requires: 30, icon: "inv_helmet_66",           desc: "Increases your total Stamina by {2/4}% and your total Agility by {1/2}%." },
    { id: "com21", name: "Adrenaline Rush",           row: 6, col: 1, maxRank: 1, requires: 30, icon: "spell_shadow_shadowworddominate", desc: "Increases your Energy regeneration rate by 100% for 15 sec." },
    { id: "com22", name: "Nerves of Steel",           row: 6, col: 2, maxRank: 2, requires: 30, icon: "ability_rogue_nervesofsteel", desc: "Increases your chance to resist Stun and Fear effects by an additional {5/10}%." },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "com23", name: "Combat Potency",            row: 7, col: 2, maxRank: 5, requires: 35, icon: "inv_weapon_hand_01",     desc: "Gives your successful off-hand melee attacks a 20% chance to generate {3/6/9/12/15} Energy." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "com24", name: "Surprise Attacks",           row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_rogue_surpriseattack", desc: "Your finishing moves can no longer be dodged, and the damage dealt by your Sinister Strike, Backstab, Shiv and Gouge abilities is increased by 10%.", dependsOn: "com21" },
  ]
},

// ========================= SUBTLETY (22 talents) =============================
subtlety: {
  name: "Subtlety",
  background: "rogue_subtlety",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "sub1",  name: "Master of Deception",     row: 0, col: 1, maxRank: 5, icon: "spell_shadow_charm",        desc: "Reduces the chance enemies have to detect you while in Stealth mode. More effective at higher ranks." },
    { id: "sub2",  name: "Opportunity",              row: 0, col: 2, maxRank: 5, icon: "ability_warrior_warcry",    desc: "Increases the damage dealt when striking from behind with your Backstab, Garrote, Mutilate, and Ambush abilities by {4/8/12/16/20}%." },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "sub3",  name: "Sleight of Hand",          row: 1, col: 0, maxRank: 2, requires: 5, icon: "ability_rogue_feint",       desc: "Reduces the chance you are critically hit by melee and ranged attacks by {1/2}% and increases the threat reduced by your Feint ability by {10/20}%." },
    { id: "sub4",  name: "Dirty Tricks",             row: 1, col: 1, maxRank: 2, requires: 5, icon: "spell_shadow_mindsteal",    desc: "Increases the range of your Blind and Sap abilities by {2/5} yards and reduces the energy cost of your Blind and Sap abilities by {25/50}%." },
    { id: "sub5",  name: "Camouflage",               row: 1, col: 2, maxRank: 5, requires: 5, icon: "ability_stealth",           desc: "Increases your speed while stealthed by {3/6/9/12/15}% and reduces the cooldown of your Stealth ability by {1/2/3/4/5} sec." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "sub6",  name: "Initiative",               row: 2, col: 0, maxRank: 3, requires: 10, icon: "spell_shadow_fumble",      desc: "Gives you a {25/50/75}% chance to add an additional combo point to your target when using your Ambush, Garrote, or Cheap Shot ability." },
    { id: "sub7",  name: "Ghostly Strike",           row: 2, col: 1, maxRank: 1, requires: 10, icon: "spell_shadow_curse",       desc: "A strike that deals 125% weapon damage and increases your chance to dodge by 15% for 7 sec. Awards 1 combo point." },
    { id: "sub8",  name: "Improved Ambush",          row: 2, col: 2, maxRank: 3, requires: 10, icon: "ability_rogue_ambush",     desc: "Increases the critical strike chance of your Ambush ability by {15/30/45}%." },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "sub9",  name: "Setup",                    row: 3, col: 0, maxRank: 3, requires: 15, icon: "spell_nature_mirrorimage", desc: "Gives you a {15/30/45}% chance to add a combo point to your target after dodging their attack or fully resisting one of their spells." },
    { id: "sub10", name: "Elusiveness",              row: 3, col: 1, maxRank: 2, requires: 15, icon: "spell_magic_lesserinvisibilty", desc: "Reduces the cooldown of your Vanish and Blind abilities by {45/90} sec." },
    { id: "sub11", name: "Serrated Blades",          row: 3, col: 2, maxRank: 3, requires: 15, icon: "inv_sword_17",             desc: "Causes your attacks to ignore some of your target's Armor (amount increases with level) and increases the damage dealt by your Rupture ability by {10/20/30}%." },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "sub12", name: "Heightened Senses",        row: 4, col: 0, maxRank: 2, requires: 20, icon: "ability_ambush",           desc: "Increases your Stealth detection and reduces the chance you are hit by spells and ranged attacks by 2%. More effective at higher ranks." },
    { id: "sub13", name: "Preparation",              row: 4, col: 1, maxRank: 1, requires: 20, icon: "spell_shadow_antishadow",  desc: "When activated, this ability immediately finishes the cooldown on your Evasion, Sprint, Vanish, Cold Blood, Adrenaline Rush and Premeditation abilities." },
    { id: "sub14", name: "Dirty Deeds",              row: 4, col: 2, maxRank: 2, requires: 20, icon: "spell_shadow_summonimp",   desc: "Reduces the Energy cost of your Cheap Shot and Garrote abilities by {10/20}. Additionally, your special abilities cause {10/20}% more damage against targets below 35% health." },
    { id: "sub15", name: "Hemorrhage",               row: 4, col: 3, maxRank: 1, requires: 20, icon: "spell_shadow_lifedrain",   desc: "An instant strike that deals 110% weapon damage and causes the target to hemorrhage, increasing any Physical damage dealt to the target by up to 42. Lasts 10 charges or 15 sec. Awards 1 combo point." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "sub16", name: "Master of Subtlety",      row: 5, col: 0, maxRank: 3, requires: 25, icon: "ability_rogue_masterofsubtlety", desc: "Attacks made while stealthed and for 6 seconds after breaking stealth cause an additional {4/7/10}% damage." },
    { id: "sub17", name: "Deadliness",               row: 5, col: 2, maxRank: 5, requires: 25, icon: "inv_weapon_crossbow_11",   desc: "Increases your Attack Power by {2/4/6/8/10}%." },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "sub18", name: "Enveloping Shadows",       row: 6, col: 0, maxRank: 3, requires: 30, icon: "ability_rogue_envelopingshadows", desc: "Increases your chance to avoid area of effect attacks by an additional {5/10/15}%." },
    { id: "sub19", name: "Premeditation",             row: 6, col: 1, maxRank: 1, requires: 30, icon: "spell_shadow_possession",  desc: "When used, adds 2 combo points to your target. You must add to or use those combo points within 10 sec or the combo points are lost.", dependsOn: "sub13" },
    { id: "sub20", name: "Cheat Death",              row: 6, col: 2, maxRank: 3, requires: 30, icon: "ability_rogue_cheatdeath",  desc: "You have a {33/66/100}% chance that an attack which would otherwise kill you will instead reduce you to 10% of your maximum health. In addition, all damage taken will be reduced by up to 90% for 3 sec (modified by resilience). This effect cannot occur more than once per minute." },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "sub21", name: "Sinister Calling",         row: 7, col: 1, maxRank: 5, requires: 35, icon: "ability_rogue_sinistercalling", desc: "Increases your total Agility by {3/6/9/12/15}% and increases the percentage damage bonus of Backstab and Hemorrhage by an additional 1%." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "sub22", name: "Shadowstep",               row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_rogue_shadowstep", desc: "Attempts to step through the shadows and reappear behind your enemy and increases movement speed by 70% for 3 sec. The damage of your next ability is increased by 20% and the threat caused is reduced by 50%. Lasts 10 sec.", dependsOn: "sub19" },
  ]
},

}; // end _TALENT_RAW


// =============================================================================
// Recommended Combat Swords PvE Raiding Build: 20/41/0
// Assassination (20): Malice 5, Ruthlessness 3, Murder 2, Relentless Strikes 1,
//   Imp Expose Armor 2, Lethality 5, Vile Poisons 2
// Combat (41): Imp SS 2, Lightning Reflexes 3, ISnD 3, Precision 5,
//   Deflection 3, DW Spec 5, Blade Flurry 1, Sword Spec 5, WE 2,
//   Aggression 3, Vitality 2, Adrenaline Rush 1, Combat Potency 5,
//   Surprise Attacks 1
// =============================================================================

const _RECOMMENDED_RAW = [
  // Final build: 20/41/0 Combat Swords
  // Combat (41): Imp SS 2, LR 3, ISnD 3, Precision 5, Deflection 3,
  //   DW Spec 5, Blade Flurry 1, Sword Spec 5, WE 2, Aggression 3,
  //   Vitality 2, AR 1, Combat Potency 5, Surprise Attacks 1
  // Assassination (20): Malice 5, Ruthlessness 3, Murder 2, Relentless Strikes 1,
  //   Imp Expose Armor 2, Lethality 5, Vile Poisons 2

  // --- Levels 10-14: Combat Tier 1 (5 pts to unlock Tier 2) ---
  { level: 10, talent: "com2",  tree: "combat" },   // Improved Sinister Strike 1/2
  { level: 11, talent: "com2",  tree: "combat" },   // Improved Sinister Strike 2/2
  { level: 12, talent: "com3",  tree: "combat" },   // Lightning Reflexes 1/5
  { level: 13, talent: "com3",  tree: "combat" },   // Lightning Reflexes 2/5
  { level: 14, talent: "com3",  tree: "combat" },   // Lightning Reflexes 3/5

  // --- Levels 15-19: Combat Tier 2 (10 pts) ---
  { level: 15, talent: "com4",  tree: "combat" },   // Improved Slice and Dice 1/3
  { level: 16, talent: "com4",  tree: "combat" },   // Improved Slice and Dice 2/3
  { level: 17, talent: "com4",  tree: "combat" },   // Improved Slice and Dice 3/3
  { level: 18, talent: "com6",  tree: "combat" },   // Precision 1/5
  { level: 19, talent: "com6",  tree: "combat" },   // Precision 2/5

  // --- Levels 20-24: Precision + Deflection (15 pts to unlock Tier 4) ---
  { level: 20, talent: "com6",  tree: "combat" },   // Precision 3/5
  { level: 21, talent: "com6",  tree: "combat" },   // Precision 4/5
  { level: 22, talent: "com6",  tree: "combat" },   // Precision 5/5
  { level: 23, talent: "com5",  tree: "combat" },   // Deflection 1/5
  { level: 24, talent: "com5",  tree: "combat" },   // Deflection 2/5

  // --- Levels 25-29: Deflection + DW Spec (20 pts to unlock Tier 5) ---
  { level: 25, talent: "com5",  tree: "combat" },   // Deflection 3/5
  { level: 26, talent: "com12", tree: "combat" },   // Dual Wield Specialization 1/5
  { level: 27, talent: "com12", tree: "combat" },   // Dual Wield Specialization 2/5
  { level: 28, talent: "com12", tree: "combat" },   // Dual Wield Specialization 3/5
  { level: 29, talent: "com12", tree: "combat" },   // Dual Wield Specialization 4/5

  // --- Levels 30-39: DW Spec + Blade Flurry + Sword Spec + Expertise ---
  { level: 30, talent: "com12", tree: "combat" },   // Dual Wield Specialization 5/5
  { level: 31, talent: "com14", tree: "combat" },   // Blade Flurry 1/1
  { level: 32, talent: "com15", tree: "combat" },   // Sword Specialization 1/5
  { level: 33, talent: "com15", tree: "combat" },   // Sword Specialization 2/5
  { level: 34, talent: "com15", tree: "combat" },   // Sword Specialization 3/5
  { level: 35, talent: "com15", tree: "combat" },   // Sword Specialization 4/5
  { level: 36, talent: "com15", tree: "combat" },   // Sword Specialization 5/5
  { level: 37, talent: "com18", tree: "combat" },   // Weapon Expertise 1/2
  { level: 38, talent: "com18", tree: "combat" },   // Weapon Expertise 2/2
  { level: 39, talent: "com19", tree: "combat" },   // Aggression 1/3

  // --- Levels 40-50: Finish Combat (41 total) ---
  { level: 40, talent: "com19", tree: "combat" },   // Aggression 2/3
  { level: 41, talent: "com19", tree: "combat" },   // Aggression 3/3
  { level: 42, talent: "com20", tree: "combat" },   // Vitality 1/2
  { level: 43, talent: "com20", tree: "combat" },   // Vitality 2/2
  { level: 44, talent: "com21", tree: "combat" },   // Adrenaline Rush 1/1
  { level: 45, talent: "com23", tree: "combat" },   // Combat Potency 1/5
  { level: 46, talent: "com23", tree: "combat" },   // Combat Potency 2/5
  { level: 47, talent: "com23", tree: "combat" },   // Combat Potency 3/5
  { level: 48, talent: "com23", tree: "combat" },   // Combat Potency 4/5
  { level: 49, talent: "com23", tree: "combat" },   // Combat Potency 5/5
  { level: 50, talent: "com24", tree: "combat" },   // Surprise Attacks 1/1

  // --- Levels 51-60: Assassination (first 10 pts) ---
  { level: 51, talent: "ass3",  tree: "assassination" }, // Malice 1/5
  { level: 52, talent: "ass3",  tree: "assassination" }, // Malice 2/5
  { level: 53, talent: "ass3",  tree: "assassination" }, // Malice 3/5
  { level: 54, talent: "ass3",  tree: "assassination" }, // Malice 4/5
  { level: 55, talent: "ass3",  tree: "assassination" }, // Malice 5/5
  { level: 56, talent: "ass4",  tree: "assassination" }, // Ruthlessness 1/3
  { level: 57, talent: "ass4",  tree: "assassination" }, // Ruthlessness 2/3
  { level: 58, talent: "ass4",  tree: "assassination" }, // Ruthlessness 3/3
  { level: 59, talent: "ass5",  tree: "assassination" }, // Murder 1/2
  { level: 60, talent: "ass5",  tree: "assassination" }, // Murder 2/2

  // --- Levels 61-70: Assassination (last 10 pts) ---
  { level: 61, talent: "ass7",  tree: "assassination" }, // Relentless Strikes 1/1
  { level: 62, talent: "ass8",  tree: "assassination" }, // Improved Expose Armor 1/2
  { level: 63, talent: "ass8",  tree: "assassination" }, // Improved Expose Armor 2/2
  { level: 64, talent: "ass9",  tree: "assassination" }, // Lethality 1/5
  { level: 65, talent: "ass9",  tree: "assassination" }, // Lethality 2/5
  { level: 66, talent: "ass9",  tree: "assassination" }, // Lethality 3/5
  { level: 67, talent: "ass9",  tree: "assassination" }, // Lethality 4/5
  { level: 68, talent: "ass9",  tree: "assassination" }, // Lethality 5/5
  { level: 69, talent: "ass10", tree: "assassination" }, // Vile Poisons 1/5
  { level: 70, talent: "ass10", tree: "assassination" }, // Vile Poisons 2/5
];


// =============================================================================
// Export
// =============================================================================
window.TALENT_CALC_CONFIG = {
  trees: [
    { key: "assassination", gridId: "assa-grid", arrowId: "assa-arrows", pointsId: "assa-points", abbrev: "Assa" },
    { key: "combat",        gridId: "comb-grid", arrowId: "comb-arrows", pointsId: "comb-points", abbrev: "Comb" },
    { key: "subtlety",      gridId: "subt-grid", arrowId: "subt-arrows", pointsId: "subt-points", abbrev: "Subt" },
  ],
  talentData: _TALENT_RAW,
  recommendedOrder: _RECOMMENDED_RAW,
};
