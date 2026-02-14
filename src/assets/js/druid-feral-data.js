// =============================================================================
// WoW TBC Classic (2.4.3) -- Druid Talent Data
// Source: Vampyr7878/WoW-Talent-Caluclator-TBC (GitHub) -- Druid.xml
//         Authentic 2.4.3 grid positions, icons, descriptions
// =============================================================================

const _TALENT_RAW = {

// =========================== BALANCE (21 talents) ============================
balance: {
  name: "Balance",
  background: "druid_balance",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "bal1",  name: "Starlight Wrath",          row: 0, col: 0, maxRank: 5, icon: "spell_nature_abolishmagic",       desc: "Reduces the cast time of your Wrath and Starfire spells by {0.1/0.2/0.3/0.4/0.5} sec." },
    { id: "bal2",  name: "Nature's Grasp",            row: 0, col: 1, maxRank: 1, icon: "spell_nature_natureswrath",       desc: "While active, any time an enemy strikes the caster they have a 35% chance to become afflicted by Entangling Roots (Rank 1). Only useable outdoors. 1 charge. Lasts 45 sec." },
    { id: "bal3",  name: "Improved Nature's Grasp",   row: 0, col: 2, maxRank: 4, icon: "spell_nature_natureswrath",       desc: "Increases the chance for your Nature's Grasp to entangle an enemy by {15/30/45/65}%.", dependsOn: "bal2" },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "bal4",  name: "Control of Nature",         row: 1, col: 0, maxRank: 3, requires: 5, icon: "spell_nature_stranglevines",    desc: "Gives you a {40/70/100}% chance to avoid interruption caused by damage while casting Entangling Roots and Cyclone." },
    { id: "bal5",  name: "Focused Starlight",         row: 1, col: 1, maxRank: 2, requires: 5, icon: "inv_staff_01",                  desc: "Increases the critical strike chance of your Wrath and Starfire spells by {2/4}%." },
    { id: "bal6",  name: "Improved Moonfire",         row: 1, col: 2, maxRank: 2, requires: 5, icon: "spell_nature_starfall",          desc: "Increases the damage and critical strike chance of your Moonfire spell by {5/10}%." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "bal7",  name: "Brambles",                  row: 2, col: 0, maxRank: 3, requires: 10, icon: "spell_nature_thorns",           desc: "Increases damage caused by your Thorns and Entangling Roots spells by {25/50/75}%." },
    { id: "bal8",  name: "Insect Swarm",              row: 2, col: 2, maxRank: 1, requires: 10, icon: "spell_nature_insectswarm",      desc: "The enemy target is swarmed by insects, decreasing their chance to hit by 2% and causing 108 Nature damage over 12 sec." },
    { id: "bal9",  name: "Nature's Reach",            row: 2, col: 3, maxRank: 2, requires: 10, icon: "spell_nature_naturetouchgrow",  desc: "Increases the range of your Balance spells and Faerie Fire (Feral) ability by {10/20}%." },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "bal10", name: "Vengeance",                 row: 3, col: 1, maxRank: 5, requires: 15, icon: "spell_nature_purge",            desc: "Increases the critical strike damage bonus of your Starfire, Moonfire, and Wrath spells by {20/40/60/80/100}%.", dependsOn: "bal5" },
    { id: "bal11", name: "Celestial Focus",           row: 3, col: 2, maxRank: 3, requires: 15, icon: "spell_arcane_starfire",         desc: "Gives your Starfire spell a {5/10/15}% chance to stun the target for 3 sec and increases the chance you'll resist spell interruption when casting your Wrath spell by {25/50/70}%." },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "bal12", name: "Lunar Guidance",            row: 4, col: 0, maxRank: 3, requires: 20, icon: "ability_druid_lunarguidance",   desc: "Increases your spell damage and healing by {8/16/25}% of your total Intellect." },
    { id: "bal13", name: "Nature's Grace",            row: 4, col: 1, maxRank: 1, requires: 20, icon: "spell_nature_naturesblessing",  desc: "All spell criticals grace you with a blessing of nature, reducing the casting time of your next spell by 0.5 sec." },
    { id: "bal14", name: "Moonglow",                  row: 4, col: 2, maxRank: 3, requires: 20, icon: "spell_nature_sentinal",         desc: "Reduces the Mana cost of your Moonfire, Starfire, Wrath, Healing Touch, Regrowth and Rejuvenation spells by {3/6/9}%." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "bal15", name: "Moonfury",                  row: 5, col: 1, maxRank: 5, requires: 25, icon: "spell_nature_moonglow",         desc: "Increases the damage done by your Starfire, Moonfire and Wrath spells by {2/4/6/8/10}%.", dependsOn: "bal13" },
    { id: "bal16", name: "Balance of Power",          row: 5, col: 2, maxRank: 2, requires: 25, icon: "ability_druid_balanceofpower",  desc: "Increases your chance to hit with all spells and reduces the chance you'll be hit by spells by {2/4}%." },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "bal17", name: "Dreamstate",                row: 6, col: 0, maxRank: 3, requires: 30, icon: "ability_druid_dreamstate",      desc: "Regenerate mana equal to {4/7/10}% of your Intellect every 5 sec, even while casting." },
    { id: "bal18", name: "Moonkin Form",              row: 6, col: 1, maxRank: 1, requires: 30, icon: "spell_nature_forceofnature",    desc: "Shapeshift into Moonkin Form. While in this form the armor contribution from items is increased by 400%, attack power is increased by 150% of your level and all party members within 30 yards have their spell critical chance increased by 5%. Melee attacks in this form have a chance on hit to regenerate mana based on attack power. The Moonkin can only cast Balance and Remove Curse spells while shapeshifted.\n\nThe act of shapeshifting frees the caster of Polymorph and Movement Impairing effects." },
    { id: "bal19", name: "Improved Faerie Fire",      row: 6, col: 2, maxRank: 3, requires: 30, icon: "spell_nature_faeriefire",       desc: "Your Faerie Fire spell also increases the chance the target will be hit by melee and ranged attacks by {1/2/3}%." },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "bal20", name: "Wrath of Cenarius",         row: 7, col: 1, maxRank: 5, requires: 35, icon: "ability_druid_twilightswrath",  desc: "Your Starfire spell gains an additional {4/8/12/16/20}% and your Wrath gains an additional {2/4/6/8/10}% of your bonus damage effects." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "bal21", name: "Force of Nature",           row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_druid_forceofnature",   desc: "Summons 3 treants to attack enemy targets for 30 sec." },
  ]
},

// ======================== FERAL COMBAT (21 talents) ==========================
feral: {
  name: "Feral Combat",
  background: "druid_feral",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "feral1",  name: "Ferocity",                 row: 0, col: 1, maxRank: 5, icon: "ability_hunter_pet_hyena",        desc: "Reduces the cost of your Maul, Swipe, Claw, Rake and Mangle abilities by {1/2/3/4/5} Rage or Energy." },
    { id: "feral2",  name: "Feral Aggression",          row: 0, col: 2, maxRank: 5, icon: "ability_druid_demoralizingroar",  desc: "Increases the attack power reduction of your Demoralizing Roar by {8/16/24/32/40}% and the damage caused by your Ferocious Bite by {3/6/9/12/15}%." },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "feral3",  name: "Feral Instinct",            row: 1, col: 0, maxRank: 3, requires: 5, icon: "ability_ambush",                  desc: "Increases threat caused in Bear and Dire Bear Form by {5/10/15}% and reduces the chance enemies have to detect you while Prowling." },
    { id: "feral4",  name: "Brutal Impact",             row: 1, col: 1, maxRank: 2, requires: 5, icon: "ability_druid_bash",               desc: "Increases the stun duration of your Bash and Pounce abilities by {0.5/1} sec." },
    { id: "feral5",  name: "Thick Hide",                row: 1, col: 2, maxRank: 3, requires: 5, icon: "inv_misc_pelt_bear_03",            desc: "Increases your Armor contribution from items by {4/7/10}%." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "feral6",  name: "Feral Swiftness",           row: 2, col: 0, maxRank: 2, requires: 10, icon: "spell_nature_spiritwolf",          desc: "Increases your movement speed by {15/30}% while outdoors in Cat Form and increases your chance to dodge while in Cat Form, Bear Form and Dire Bear Form by {2/4}%." },
    { id: "feral7",  name: "Feral Charge",              row: 2, col: 1, maxRank: 1, requires: 10, icon: "ability_hunter_pet_bear",          desc: "Causes you to charge an enemy, immobilizing and interrupting any spell being cast for 4 sec." },
    { id: "feral8",  name: "Sharpened Claws",           row: 2, col: 2, maxRank: 3, requires: 10, icon: "inv_misc_monsterclaw_04",          desc: "Increases your critical strike chance while in Bear, Dire Bear or Cat Form by {2/4/6}%." },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "feral9",  name: "Shredding Attacks",         row: 3, col: 0, maxRank: 2, requires: 15, icon: "spell_shadow_vampiricaura",        desc: "Reduces the energy cost of your Shred ability by {9/18} and the rage cost of your Lacerate ability by {1/2}." },
    { id: "feral10", name: "Predatory Strikes",         row: 3, col: 1, maxRank: 3, requires: 15, icon: "ability_hunter_pet_cat",           desc: "Increases your melee attack power in Cat, Bear, Dire Bear and Moonkin Forms by {50/100/150}% of your level." },
    { id: "feral11", name: "Primal Fury",               row: 3, col: 2, maxRank: 2, requires: 15, icon: "ability_racial_cannibalize",       desc: "Gives you a {50/100}% chance to gain an additional 5 Rage anytime you get a critical strike while in Bear and Dire Bear Form and your critical strikes from Cat Form abilities that add combo points have a {50/100}% chance to add an additional combo point.", dependsOn: "feral8" },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "feral12", name: "Savage Fury",               row: 4, col: 0, maxRank: 2, requires: 20, icon: "ability_druid_ravage",             desc: "Increases the damage caused by your Claw, Rake, and Mangle (Cat) abilities by {10/20}%." },
    { id: "feral13", name: "Faerie Fire (Feral)",       row: 4, col: 2, maxRank: 1, requires: 20, icon: "spell_nature_faeriefire",          desc: "Decrease the armor of the target by 175 for 40 sec. While affected, the target cannot stealth or turn invisible." },
    { id: "feral14", name: "Nurturing Instinct",        row: 4, col: 3, maxRank: 2, requires: 20, icon: "ability_druid_healinginstincts",   desc: "Increases your healing spells by up to {50/100}% of your Agility, and increases healing done to you by {10/20}% while in Cat form." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "feral15", name: "Heart of the Wild",         row: 5, col: 1, maxRank: 5, requires: 25, icon: "spell_holy_blessingofagility",     desc: "Increases your Intellect by {4/8/12/16/20}%. In addition, while in Bear or Dire Bear Form your Stamina is increased by {4/8/12/16/20}% and while in Cat Form your attack power is increased by {2/4/6/8/10}%.", dependsOn: "feral10" },
    { id: "feral16", name: "Survival of the Fittest",   row: 5, col: 2, maxRank: 3, requires: 25, icon: "ability_druid_enrage",             desc: "Increases all attributes by {1/2/3}% and reduces the chance you'll be critically hit by melee attacks by {1/2/3}%." },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "feral17", name: "Primal Tenacity",           row: 6, col: 0, maxRank: 3, requires: 30, icon: "ability_druid_primaltenacity",     desc: "Increases your chance to resist Stun and Fear mechanics by {5/10/15}%." },
    { id: "feral18", name: "Leader of the Pack",        row: 6, col: 1, maxRank: 1, requires: 30, icon: "spell_nature_unyeildingstamina",   desc: "While in Cat, Bear or Dire Bear Form, the Leader of the Pack increases ranged and melee critical chance of all party members within 45 yards by 5%." },
    { id: "feral19", name: "Improved Leader of the Pack", row: 6, col: 2, maxRank: 2, requires: 30, icon: "spell_nature_unyeildingstamina", desc: "Your Leader of the Pack ability also causes affected targets to have a 100% chance to heal themselves for {2/4}% of their total health when they critically hit with a melee or ranged attack. The healing effect cannot occur more than once every 6 sec.", dependsOn: "feral18" },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "feral20", name: "Predatory Instincts",       row: 7, col: 2, maxRank: 5, requires: 35, icon: "ability_druid_predatoryinstincts", desc: "While in Cat Form, Bear Form, or Dire Bear Form, increases your damage from melee critical strikes by {2/4/6/8/10}% and your chance to avoid area effect attacks by {3/6/9/12/15}%." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "feral21", name: "Mangle",                    row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_druid_mangle2",            desc: "Mangle the target, inflicting damage and causing the target to take additional damage from bleed effects for 12 sec. This ability can be used in Cat Form or Dire Bear Form.", dependsOn: "feral18" },
  ]
},

// ======================== RESTORATION (20 talents) ===========================
restoration: {
  name: "Restoration",
  background: "druid_restoration",
  talents: [
    // ---- Row 0 (Tier 1) ----
    { id: "dresto1",  name: "Improved Mark of the Wild", row: 0, col: 1, maxRank: 5, icon: "spell_nature_regeneration",          desc: "Increases the effects of your Mark of the Wild and Gift of the Wild spells by {7/14/21/28/35}%." },
    { id: "dresto2",  name: "Furor",                     row: 0, col: 2, maxRank: 5, icon: "spell_holy_blessingofstamina",       desc: "Gives you {20/40/60/80/100}% chance to gain 10 Rage when you shapeshift into Bear and Dire Bear Form or 40 Energy when you shapeshift into Cat Form." },

    // ---- Row 1 (Tier 2, requires 5) ----
    { id: "dresto3",  name: "Naturalist",                row: 1, col: 0, maxRank: 5, requires: 5, icon: "spell_nature_healingtouch",         desc: "Reduces the cast time of your Healing Touch spell by {0.1/0.2/0.3/0.4/0.5} sec and increases the damage you deal with physical attacks in all forms by {2/4/6/8/10}%." },
    { id: "dresto4",  name: "Nature's Focus",            row: 1, col: 1, maxRank: 5, requires: 5, icon: "spell_nature_healingwavegreater",   desc: "Gives you a {14/28/42/56/70}% chance to avoid interruption caused by damage while casting the Healing Touch, Regrowth and Tranquility spells." },
    { id: "dresto5",  name: "Natural Shapeshifter",      row: 1, col: 2, maxRank: 3, requires: 5, icon: "spell_nature_wispsplode",           desc: "Reduces the mana cost of all shapeshifting by {10/20/30}%." },

    // ---- Row 2 (Tier 3, requires 10) ----
    { id: "dresto6",  name: "Intensity",                 row: 2, col: 0, maxRank: 3, requires: 10, icon: "spell_frost_windwalkon",            desc: "Allows {10/20/30}% of your Mana regeneration to continue while casting and causes your Enrage ability to instantly generate {4/7/10} rage." },
    { id: "dresto7",  name: "Subtlety",                  row: 2, col: 1, maxRank: 5, requires: 10, icon: "ability_eyeoftheowl",               desc: "Reduces the threat generated by your spells by {4/8/12/16/20}% and reduces the chance your spells will be dispelled by {6/12/18/24/30}%." },
    { id: "dresto8",  name: "Omen of Clarity",           row: 2, col: 2, maxRank: 1, requires: 10, icon: "spell_nature_crystalball",           desc: "Imbues the Druid with natural energy. Each of the Druid's melee attacks has a chance of causing the caster to enter a Clearcasting state. The Clearcasting state reduces the Mana, Rage or Energy cost of your next damage or healing spell or offensive ability by 100%. Lasts 30 min." },

    // ---- Row 3 (Tier 4, requires 15) ----
    { id: "dresto9",  name: "Tranquil Spirit",           row: 3, col: 1, maxRank: 5, requires: 15, icon: "spell_holy_elunesgrace",            desc: "Reduces the mana cost of your Healing Touch and Tranquility spells by {2/4/6/8/10}%." },
    { id: "dresto10", name: "Improved Rejuvenation",     row: 3, col: 2, maxRank: 3, requires: 15, icon: "spell_nature_rejuvenation",         desc: "Increases the effect of your Rejuvenation spell by {5/10/15}%." },

    // ---- Row 4 (Tier 5, requires 20) ----
    { id: "dresto11", name: "Nature's Swiftness",        row: 4, col: 0, maxRank: 1, requires: 20, icon: "spell_nature_ravenform",            desc: "When activated, your next Nature spell becomes an instant cast spell.", dependsOn: "dresto6" },
    { id: "dresto12", name: "Gift of Nature",            row: 4, col: 1, maxRank: 5, requires: 20, icon: "spell_nature_protectionformnature", desc: "Increases the effect of all healing spells by {2/4/6/8/10}%." },
    { id: "dresto13", name: "Improved Tranquility",      row: 4, col: 3, maxRank: 2, requires: 20, icon: "spell_nature_tranquility",          desc: "Reduces threat caused by Tranquility by {50/100}%." },

    // ---- Row 5 (Tier 6, requires 25) ----
    { id: "dresto14", name: "Empowered Touch",           row: 5, col: 0, maxRank: 2, requires: 25, icon: "ability_druid_empoweredtouch",      desc: "Your Healing Touch spell gains an additional {10/20}% of your bonus healing effects." },
    { id: "dresto15", name: "Improved Regrowth",         row: 5, col: 2, maxRank: 5, requires: 25, icon: "spell_nature_resistnature",         desc: "Increases the critical effect chance of your Regrowth spell by {10/20/30/40/50}%.", dependsOn: "dresto10" },

    // ---- Row 6 (Tier 7, requires 30) ----
    { id: "dresto16", name: "Living Spirit",             row: 6, col: 0, maxRank: 3, requires: 30, icon: "spell_nature_giftofthewaterspirit", desc: "Increases your total Spirit by {5/10/15}%." },
    { id: "dresto17", name: "Swiftmend",                 row: 6, col: 1, maxRank: 1, requires: 30, icon: "inv_relics_idolofrejuvenation",     desc: "Consumes a Rejuvenation or Regrowth effect on a friendly target to instantly heal them an amount equal to 12 sec. of Rejuvenation or 18 sec. of Regrowth.", dependsOn: "dresto12" },
    { id: "dresto18", name: "Natural Perfection",        row: 6, col: 2, maxRank: 3, requires: 30, icon: "ability_druid_naturalperfection",   desc: "Your critical strike chance with all spells is increased by {1/2/3}% and critical strikes against you give you the Natural Perfection effect reducing all damage taken by {2/3/4}%. Stacks up to 3 times. Lasts 8 sec." },

    // ---- Row 7 (Tier 8, requires 35) ----
    { id: "dresto19", name: "Empowered Rejuvenation",    row: 7, col: 1, maxRank: 4, requires: 35, icon: "ability_druid_empoweredrejuvination", desc: "The bonus healing effects of your healing over time spells is increased by {4/8/12/16}%." },

    // ---- Row 8 (Tier 9, requires 40) ----
    { id: "dresto20", name: "Tree of Life",              row: 8, col: 1, maxRank: 1, requires: 40, icon: "ability_druid_treeoflife",           desc: "Shapeshift into the Tree of Life. While in this form you increase healing received by 25% of your total Spirit for all party members within 45 yards, your movement speed is reduced by 20%, and you can only cast Swiftmend, Innervate, Nature's Swiftness, Rebirth, Barkskin, poison removing and healing over time spells, but the mana cost of these spells is reduced by 20%.\n\nThe act of shapeshifting frees the caster of Polymorph and Movement Impairing effects.", dependsOn: "dresto19" },
  ]
},

}; // end _TALENT_RAW


// =============================================================================
// Recommended Feral (Cat DPS) PvE Raiding Build: 0/47/14
// Feral (47): Ferocity 5, Feral Instinct 3, Brutal Impact 2, Thick Hide 3,
//   Feral Swiftness 2, Feral Charge 1, Sharpened Claws 3, Shredding Attacks 2,
//   Predatory Strikes 3, Primal Fury 2, Savage Fury 2, Faerie Fire (Feral) 1,
//   Heart of the Wild 5, Survival of the Fittest 3, Leader of the Pack 1,
//   Improved Leader of the Pack 2, Primal Tenacity 1, Predatory Instincts 5,
//   Mangle 1
// Restoration (14): Furor 5, Naturalist 2, Natural Shapeshifter 3,
//   Intensity 3, Omen of Clarity 1
// =============================================================================

const _RECOMMENDED_RAW = [
  // Final build: 0/47/14 Feral Cat DPS

  // --- Levels 10-14: Feral Tier 1 (5 pts) ---
  { level: 10, talent: "feral1",  tree: "feral" },       // Ferocity 1/5
  { level: 11, talent: "feral1",  tree: "feral" },       // Ferocity 2/5
  { level: 12, talent: "feral1",  tree: "feral" },       // Ferocity 3/5
  { level: 13, talent: "feral1",  tree: "feral" },       // Ferocity 4/5
  { level: 14, talent: "feral1",  tree: "feral" },       // Ferocity 5/5

  // --- Levels 15-19: Feral Tier 2 (10 pts) ---
  { level: 15, talent: "feral3",  tree: "feral" },       // Feral Instinct 1/3
  { level: 16, talent: "feral3",  tree: "feral" },       // Feral Instinct 2/3
  { level: 17, talent: "feral3",  tree: "feral" },       // Feral Instinct 3/3
  { level: 18, talent: "feral4",  tree: "feral" },       // Brutal Impact 1/2
  { level: 19, talent: "feral5",  tree: "feral" },       // Thick Hide 1/3

  // --- Levels 20-24: Feral Tier 3 (15 pts) ---
  { level: 20, talent: "feral8",  tree: "feral" },       // Sharpened Claws 1/3
  { level: 21, talent: "feral8",  tree: "feral" },       // Sharpened Claws 2/3
  { level: 22, talent: "feral8",  tree: "feral" },       // Sharpened Claws 3/3
  { level: 23, talent: "feral7",  tree: "feral" },       // Feral Charge 1/1
  { level: 24, talent: "feral6",  tree: "feral" },       // Feral Swiftness 1/2

  // --- Levels 25-29: Feral Tier 4 (20 pts) ---
  { level: 25, talent: "feral10", tree: "feral" },       // Predatory Strikes 1/3
  { level: 26, talent: "feral10", tree: "feral" },       // Predatory Strikes 2/3
  { level: 27, talent: "feral10", tree: "feral" },       // Predatory Strikes 3/3
  { level: 28, talent: "feral11", tree: "feral" },       // Primal Fury 1/2
  { level: 29, talent: "feral11", tree: "feral" },       // Primal Fury 2/2

  // --- Levels 30-34: Feral Tier 5 (25 pts) ---
  { level: 30, talent: "feral12", tree: "feral" },       // Savage Fury 1/2
  { level: 31, talent: "feral12", tree: "feral" },       // Savage Fury 2/2
  { level: 32, talent: "feral13", tree: "feral" },       // Faerie Fire (Feral) 1/1
  { level: 33, talent: "feral9",  tree: "feral" },       // Shredding Attacks 1/2
  { level: 34, talent: "feral9",  tree: "feral" },       // Shredding Attacks 2/2

  // --- Levels 35-39: Feral Tier 6 (30 pts) ---
  { level: 35, talent: "feral15", tree: "feral" },       // Heart of the Wild 1/5
  { level: 36, talent: "feral15", tree: "feral" },       // Heart of the Wild 2/5
  { level: 37, talent: "feral15", tree: "feral" },       // Heart of the Wild 3/5
  { level: 38, talent: "feral15", tree: "feral" },       // Heart of the Wild 4/5
  { level: 39, talent: "feral15", tree: "feral" },       // Heart of the Wild 5/5

  // --- Levels 40-44: Feral Tier 6-7 (35 pts) ---
  { level: 40, talent: "feral16", tree: "feral" },       // Survival of the Fittest 1/3
  { level: 41, talent: "feral16", tree: "feral" },       // Survival of the Fittest 2/3
  { level: 42, talent: "feral16", tree: "feral" },       // Survival of the Fittest 3/3
  { level: 43, talent: "feral18", tree: "feral" },       // Leader of the Pack 1/1
  { level: 44, talent: "feral19", tree: "feral" },       // Improved Leader of the Pack 1/2

  // --- Levels 45-49: Feral Tier 7-8 (40 pts) ---
  { level: 45, talent: "feral19", tree: "feral" },       // Improved Leader of the Pack 2/2
  { level: 46, talent: "feral20", tree: "feral" },       // Predatory Instincts 1/5
  { level: 47, talent: "feral20", tree: "feral" },       // Predatory Instincts 2/5
  { level: 48, talent: "feral20", tree: "feral" },       // Predatory Instincts 3/5
  { level: 49, talent: "feral20", tree: "feral" },       // Predatory Instincts 4/5

  // --- Levels 50-52: Finish Feral core (42 pts in Feral) ---
  { level: 50, talent: "feral20", tree: "feral" },       // Predatory Instincts 5/5
  { level: 51, talent: "feral21", tree: "feral" },       // Mangle 1/1
  { level: 52, talent: "feral6",  tree: "feral" },       // Feral Swiftness 2/2  (fill point)

  // --- Levels 53-57: Restoration Tier 1 (5 Resto pts) ---
  { level: 53, talent: "dresto2", tree: "restoration" }, // Furor 1/5
  { level: 54, talent: "dresto2", tree: "restoration" }, // Furor 2/5
  { level: 55, talent: "dresto2", tree: "restoration" }, // Furor 3/5
  { level: 56, talent: "dresto2", tree: "restoration" }, // Furor 4/5
  { level: 57, talent: "dresto2", tree: "restoration" }, // Furor 5/5

  // --- Levels 58-62: Restoration Tier 2 (10 Resto pts) ---
  { level: 58, talent: "dresto3", tree: "restoration" }, // Naturalist 1/5
  { level: 59, talent: "dresto3", tree: "restoration" }, // Naturalist 2/5
  { level: 60, talent: "dresto5", tree: "restoration" }, // Natural Shapeshifter 1/3
  { level: 61, talent: "dresto5", tree: "restoration" }, // Natural Shapeshifter 2/3
  { level: 62, talent: "dresto5", tree: "restoration" }, // Natural Shapeshifter 3/3

  // --- Levels 63-66: Restoration Tier 3 (14 Resto pts) ---
  { level: 63, talent: "dresto6", tree: "restoration" }, // Intensity 1/3
  { level: 64, talent: "dresto6", tree: "restoration" }, // Intensity 2/3
  { level: 65, talent: "dresto6", tree: "restoration" }, // Intensity 3/3
  { level: 66, talent: "dresto8", tree: "restoration" }, // Omen of Clarity 1/1

  // --- Levels 67-70: Fill remaining Feral (47 total) ---
  { level: 67, talent: "feral5",  tree: "feral" },       // Thick Hide 2/3
  { level: 68, talent: "feral5",  tree: "feral" },       // Thick Hide 3/3
  { level: 69, talent: "feral4",  tree: "feral" },       // Brutal Impact 2/2
  { level: 70, talent: "feral17", tree: "feral" },       // Primal Tenacity 1/3
];


// =============================================================================
// Export
// =============================================================================
window.TALENT_CALC_CONFIG = {
  trees: [
    { key: "balance",     gridId: "bal-grid",   arrowId: "bal-arrows",   pointsId: "bal-points",   abbrev: "Bal" },
    { key: "feral",       gridId: "feral-grid", arrowId: "feral-arrows", pointsId: "feral-points", abbrev: "Feral" },
    { key: "restoration", gridId: "resto-grid", arrowId: "resto-arrows", pointsId: "resto-points", abbrev: "Resto" },
  ],
  talentData: _TALENT_RAW,
  recommendedOrder: _RECOMMENDED_RAW,
};
