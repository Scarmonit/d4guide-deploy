// Paladin Ret PvE - Talent Data for TBC Classic 2.4.3
// Loaded before talent-calc.js (engine)

const _TALENT_RAW = {
    holy: {
        name: "Holy",
        talents: [
            { id: "holy1", name: "Divine Strength", row: 0, col: 1, maxRank: 5, icon: "ability_golemthunderclap", desc: "Increases your total Strength by {2/4/6/8/10}%." },
            { id: "holy2", name: "Divine Intellect", row: 0, col: 2, maxRank: 5, icon: "spell_nature_sleep", desc: "Increases your total Intellect by {2/4/6/8/10}%." },
            { id: "holy3", name: "Spiritual Focus", row: 1, col: 1, maxRank: 5, icon: "spell_arcane_blink", desc: "Gives your Flash of Light and Holy Light spells a {14/28/42/56/70}% chance to not lose casting time when you take damage.", requires: 5 },
            { id: "holy4", name: "Improved Seal of Righteousness", row: 1, col: 2, maxRank: 5, icon: "ability_thunderbolt", desc: "Increases the damage done by your Seal of Righteousness and Judgement of Righteousness by {3/6/9/12/15}%.", requires: 5 },
            { id: "holy5", name: "Healing Light", row: 2, col: 0, maxRank: 3, icon: "spell_holy_holybolt", desc: "Increases the amount healed by your Holy Light and Flash of Light spells by {4/8/12}%.", requires: 10 },
            { id: "holy6", name: "Aura Mastery", row: 2, col: 1, maxRank: 1, icon: "spell_holy_auramastery", desc: "Increases the radius of your Auras to 40 yards.", requires: 10 },
            { id: "holy7", name: "Improved Lay on Hands", row: 2, col: 2, maxRank: 2, icon: "spell_holy_layonhands", desc: "Gives the target of your Lay on Hands spell a {15/30}% bonus to their armor value from items for 2 min. In addition, the cooldown for your Lay on Hands spell is reduced by {10/20} min.", requires: 10 },
            { id: "holy8", name: "Unyielding Faith", row: 2, col: 3, maxRank: 2, icon: "spell_holy_unyieldingfaith", desc: "Increases your chance to resist Fear and Disorient effects by an additional {5/10}%.", requires: 10 },
            { id: "holy9", name: "Illumination", row: 3, col: 1, maxRank: 5, icon: "spell_holy_greaterheal", desc: "After getting a critical effect from your Flash of Light, Holy Light, or Holy Shock heal spell, gives you a {20/40/60/80/100}% chance to gain mana equal to 60% of the base cost of the spell.", requires: 15 },
            { id: "holy10", name: "Improved Blessing of Wisdom", row: 3, col: 2, maxRank: 2, icon: "spell_holy_sealofwisdom", desc: "Increases the effect of your Blessing of Wisdom spell by {10/20}%.", requires: 15 },
            { id: "holy11", name: "Pure of Heart", row: 4, col: 0, maxRank: 3, icon: "spell_holy_pureofheart", desc: "Increases your resistance to Curse and Disease effects by {5/10/15}%.", requires: 20 },
            { id: "holy12", name: "Divine Favor", row: 4, col: 1, maxRank: 1, icon: "spell_holy_heal", desc: "When activated, gives your next Flash of Light, Holy Light, or Holy Shock spell a 100% critical effect chance.", requires: 20, dependsOn: "holy9" },
            { id: "holy13", name: "Sanctified Light", row: 4, col: 2, maxRank: 3, icon: "spell_holy_healingaura", desc: "Increases the critical effect chance of your Holy Light spell by {2/4/6}%.", requires: 20 },
            { id: "holy14", name: "Purifying Power", row: 5, col: 0, maxRank: 2, icon: "spell_holy_purifyingpower", desc: "Reduces the mana cost of your Cleanse, Purify and Consecration spells by {5/10}% and increases the critical strike chance of your Exorcism and Holy Wrath spells by {10/20}%.", requires: 25 },
            { id: "holy15", name: "Holy Power", row: 5, col: 2, maxRank: 5, icon: "spell_holy_power", desc: "Increases the critical effect chance of your Holy spells by {1/2/3/4/5}%.", requires: 25 },
            { id: "holy16", name: "Light's Grace", row: 6, col: 0, maxRank: 3, icon: "spell_holy_lightsgrace", desc: "Gives your Holy Light spell a {33/66/100}% chance to reduce the cast time of your next Holy Light spell by 0.5 sec. This effect lasts 15 sec.", requires: 30 },
            { id: "holy17", name: "Holy Shock", row: 6, col: 1, maxRank: 1, icon: "spell_holy_searinglight", desc: "Blasts the target with Holy energy, causing 277 to 300 Holy damage to an enemy, or 351 to 380 healing to an ally.", requires: 30, dependsOn: "holy12" },
            { id: "holy18", name: "Blessed Life", row: 6, col: 2, maxRank: 3, icon: "spell_holy_blessedlife", desc: "All attacks against you have a {4/7/10}% chance to cause half damage.", requires: 30 },
            { id: "holy19", name: "Holy Guidance", row: 7, col: 1, maxRank: 5, icon: "spell_holy_holyguidance", desc: "Increases your spell damage and healing by {7/14/21/28/35}% of your total Intellect.", requires: 35 },
            { id: "holy20", name: "Divine Illumination", row: 8, col: 1, maxRank: 1, icon: "spell_holy_divineillumination", desc: "Reduces the mana cost of all spells by 50% for 15 sec.", requires: 40 }
        ]
    },
    protection: {
        name: "Protection",
        talents: [
            { id: "prot1", name: "Improved Devotion Aura", row: 0, col: 1, maxRank: 5, icon: "spell_holy_devotionaura", desc: "Increases the armor bonus of your Devotion Aura by {8/16/24/32/40}%." },
            { id: "prot2", name: "Redoubt", row: 0, col: 2, maxRank: 5, icon: "ability_defend", desc: "Damaging melee and ranged attacks against you have a 10% chance to increase your chance to block by {6/12/18/24/30}%. Lasts 10 sec or 5 blocks." },
            { id: "prot3", name: "Precision", row: 1, col: 0, maxRank: 3, icon: "ability_rogue_ambush", desc: "Increases your chance to hit with melee weapons and spells by {1/2/3}%.", requires: 5 },
            { id: "prot4", name: "Guardian's Favor", row: 1, col: 1, maxRank: 2, icon: "spell_holy_sealofprotection", desc: "Reduces the cooldown of your Blessing of Protection by {60/120} sec and increases the duration of your Blessing of Freedom by {2/4} sec.", requires: 5 },
            { id: "prot5", name: "Toughness", row: 1, col: 3, maxRank: 5, icon: "spell_holy_devotion", desc: "Increases your armor value from items by {2/4/6/8/10}%.", requires: 5 },
            { id: "prot6", name: "Blessing of Kings", row: 2, col: 0, maxRank: 1, icon: "spell_magic_magearmor", desc: "Places a Blessing on the friendly target, increasing total stats by 10% for 10 min. Players may only have one Blessing on them per Paladin at any one time.", requires: 10 },
            { id: "prot7", name: "Improved Righteous Fury", row: 2, col: 1, maxRank: 3, icon: "spell_holy_sealoffury", desc: "While Righteous Fury is active, all damage taken is reduced by {2/4/6}% and increases the amount of threat generated by your Righteous Fury spell by {16/33/50}%.", requires: 10 },
            { id: "prot8", name: "Shield Specialization", row: 2, col: 2, maxRank: 3, icon: "inv_shield_06", desc: "Increases the amount of damage absorbed by your shield by {10/20/30}%.", requires: 10, dependsOn: "prot2" },
            { id: "prot9", name: "Anticipation", row: 2, col: 3, maxRank: 5, icon: "spell_magic_lesserinvisibilty", desc: "Increases your Defense skill by {4/8/12/16/20}.", requires: 10 },
            { id: "prot10", name: "Stoicism", row: 3, col: 0, maxRank: 2, icon: "spell_holy_stoicism", desc: "Increases your resistance to Stun effects by an additional {5/10}% and reduces the chance your spells will be dispelled by an additional {15/30}%.", requires: 15 },
            { id: "prot11", name: "Improved Hammer of Justice", row: 3, col: 1, maxRank: 3, icon: "spell_holy_sealofmight", desc: "Decreases the cooldown of your Hammer of Justice spell by {5/10/15} sec.", requires: 15 },
            { id: "prot12", name: "Improved Concentration Aura", row: 3, col: 2, maxRank: 3, icon: "spell_holy_mindsooth", desc: "Increases the effect of your Concentration Aura by an additional {5/10/15}% and reduces the duration of any Silence or Interrupt effect used against an affected group member by {10/20/30}%. The duration reduction does not stack with any other effects.", requires: 15 },
            { id: "prot13", name: "Spell Warding", row: 4, col: 0, maxRank: 2, icon: "spell_holy_improvedresistanceauras", desc: "All spell damage taken is reduced by {2/4}%.", requires: 20 },
            { id: "prot14", name: "Blessing of Sanctuary", row: 4, col: 1, maxRank: 1, icon: "spell_nature_lightningshield", desc: "Places a Blessing on the friendly target, reducing damage dealt from all sources by up to 10 for 10 min. In addition, when the target blocks a melee attack the attacker will take 14 Holy damage. Players may only have one Blessing on them per Paladin at any one time.", requires: 20 },
            { id: "prot15", name: "Reckoning", row: 4, col: 2, maxRank: 5, icon: "spell_holy_blessingofstrength", desc: "Gives you a {2/4/6/8/10}% chance after being hit by any damaging attack that the next 4 weapon swings within 8 sec will generate an additional attack.", requires: 20 },
            { id: "prot16", name: "Sacred Duty", row: 5, col: 0, maxRank: 2, icon: "spell_holy_divineintervention", desc: "Increases your total Stamina by {3/6}%, reduces the cooldown of your Divine Shield spell by {30/60} sec and reduces the attack speed penalty by {50/100}%.", requires: 25 },
            { id: "prot17", name: "One-Handed Weapon Specialization", row: 5, col: 2, maxRank: 5, icon: "inv_sword_20", desc: "Increases all damage you deal when a one-handed melee weapon is equipped by {1/2/3/4/5}%.", requires: 25 },
            { id: "prot18", name: "Improved Holy Shield", row: 6, col: 0, maxRank: 2, icon: "spell_holy_blessingofprotection", desc: "Increases damage caused by your Holy Shield by {10/20}% and increases the number of charges of your Holy Shield by {2/4}.", requires: 30, dependsOn: "prot19" },
            { id: "prot19", name: "Holy Shield", row: 6, col: 1, maxRank: 1, icon: "spell_holy_blessingofprotection", desc: "Increases chance to block by 30% for 10 sec and deals 59 Holy damage for each attack blocked while active. Damage caused by Holy Shield causes 35% additional threat. Each block expends a charge. 4 charges.", requires: 30, dependsOn: "prot14" },
            { id: "prot20", name: "Ardent Defender", row: 6, col: 2, maxRank: 5, icon: "spell_holy_ardentdefender", desc: "When you have less than 35% health, all damage taken is reduced by {6/12/18/24/30}%.", requires: 30 },
            { id: "prot21", name: "Combat Expertise", row: 7, col: 2, maxRank: 5, icon: "spell_holy_weaponmastery", desc: "Increases your expertise by {1/2/3/4/5} and your total Stamina by {2/4/6/8/10}%.", requires: 35 },
            { id: "prot22", name: "Avenger's Shield", row: 8, col: 1, maxRank: 1, icon: "spell_holy_avengersshield", desc: "Hurls a holy shield at the enemy, dealing 270 to 331 Holy damage, Dazing them and then jumping to additional nearby enemies. Affects 3 total targets. Lasts 6 sec.", requires: 40, dependsOn: "prot19" }
        ]
    },
    retribution: {
        name: "Retribution",
        talents: [
            { id: "ret1", name: "Improved Blessing of Might", row: 0, col: 1, maxRank: 5, icon: "spell_holy_fistofjustice", desc: "Increases the attack power bonus of your Blessing of Might by {4/8/12/16/20}%." },
            { id: "ret2", name: "Benediction", row: 0, col: 2, maxRank: 5, icon: "spell_frost_windwalkon", desc: "Reduces the mana cost of your Judgement and Seal spells by {3/6/9/12/15}%." },
            { id: "ret3", name: "Improved Judgement", row: 1, col: 0, maxRank: 2, icon: "spell_holy_righteousfury", desc: "Decreases the cooldown of your Judgement spell by {1/2} sec.", requires: 5 },
            { id: "ret4", name: "Improved Seal of the Crusader", row: 1, col: 1, maxRank: 3, icon: "spell_holy_holysmite", desc: "In addition to the normal effect, your Judgement of the Crusader spell will also increase the critical strike chance of all attacks made against that target by an additional {1/2/3}%.", requires: 5 },
            { id: "ret5", name: "Deflection", row: 1, col: 2, maxRank: 5, icon: "ability_parry", desc: "Increases your Parry chance by {1/2/3/4/5}%.", requires: 5 },
            { id: "ret6", name: "Vindication", row: 2, col: 0, maxRank: 3, icon: "spell_holy_vindication", desc: "Gives the Paladin's damaging melee attacks a chance to reduce the target's attributes by {5/10/15}% for 15 sec.", requires: 10 },
            { id: "ret7", name: "Conviction", row: 2, col: 1, maxRank: 5, icon: "spell_holy_retributionaura", desc: "Increases your chance to get a critical strike with melee weapons by {1/2/3/4/5}%.", requires: 10 },
            { id: "ret8", name: "Seal of Command", row: 2, col: 2, maxRank: 1, icon: "ability_warrior_innerrage", desc: "Gives the Paladin a chance to deal additional Holy damage equal to 70% of normal weapon damage. Only one Seal can be active on the Paladin at any one time. Lasts 30 sec. Unleashing this Seal's energy will judge an enemy, instantly causing 46.5 to 55.5 Holy damage, 93 to 102 if the target is stunned or incapacitated.", requires: 10 },
            { id: "ret9", name: "Pursuit of Justice", row: 2, col: 3, maxRank: 3, icon: "spell_holy_persuitofjustice", desc: "Reduces the chance you'll be hit by spells by {1/2/3}% and increases movement and mounted movement speed by {5/10/15}%. This does not stack with other movement speed increasing effects.", requires: 10 },
            { id: "ret10", name: "Eye for an Eye", row: 3, col: 0, maxRank: 2, icon: "spell_holy_eyeforaneye", desc: "All spell criticals against you cause {15/30}% of the damage taken to the caster as well. The damage caused by Eye for an Eye will not exceed 50% of the Paladin's total health.", requires: 15 },
            { id: "ret11", name: "Improved Retribution Aura", row: 3, col: 2, maxRank: 2, icon: "spell_holy_auraoflight", desc: "Increases the damage done by your Retribution Aura by {25/50}%.", requires: 15 },
            { id: "ret12", name: "Crusade", row: 3, col: 3, maxRank: 3, icon: "spell_holy_crusade", desc: "Increases all damage caused against Humanoids, Demons, Undead and Elementals by {1/2/3}%.", requires: 15 },
            { id: "ret13", name: "Two-Handed Weapon Specialization", row: 4, col: 0, maxRank: 3, icon: "inv_hammer_04", desc: "Increases the damage you deal with two-handed melee weapons by {2/4/6}%.", requires: 20 },
            { id: "ret14", name: "Sanctity Aura", row: 4, col: 2, maxRank: 1, icon: "spell_holy_mindvision", desc: "Increases Holy damage done by party members within 30 yards by 10%. Players may only have one Aura on them per Paladin at any one time.", requires: 20 },
            { id: "ret15", name: "Improved Sanctity Aura", row: 4, col: 3, maxRank: 2, icon: "spell_holy_mindvision", desc: "The amount of damage caused by targets affected by Sanctity Aura is increased by {1/2}%.", requires: 20, dependsOn: "ret14" },
            { id: "ret16", name: "Vengeance", row: 5, col: 1, maxRank: 5, icon: "ability_racial_avatar", desc: "Gives you a {1/2/3/4/5}% bonus to Physical and Holy damage you deal for 30 sec after dealing a critical strike from a weapon swing, spell, or ability. This effect stacks up to 3 times.", requires: 25, dependsOn: "ret7" },
            { id: "ret17", name: "Sanctified Judgement", row: 5, col: 2, maxRank: 3, icon: "spell_holy_righteousfury", desc: "Gives your Judgement spell a {33/66/100}% chance to return 80% of the mana cost of the judged seal.", requires: 25 },
            { id: "ret18", name: "Sanctified Seals", row: 6, col: 0, maxRank: 3, icon: "spell_holy_holysmite", desc: "Increases your chance to critically hit with all spells and melee attacks by {1/2/3}% and reduces the chance your Seals will be dispelled by {33/66/100}%.", requires: 30 },
            { id: "ret19", name: "Repentance", row: 6, col: 1, maxRank: 1, icon: "spell_holy_prayerofhealing", desc: "Puts the enemy target in a state of meditation, incapacitating them for up to 6 sec. Any damage caused will awaken the target. Only works against Humanoids.", requires: 30 },
            { id: "ret20", name: "Divine Purpose", row: 6, col: 2, maxRank: 3, icon: "spell_holy_divinepurpose", desc: "Melee and ranged critical strikes against you cause {4/7/10}% less damage.", requires: 30 },
            { id: "ret21", name: "Fanaticism", row: 7, col: 1, maxRank: 5, icon: "spell_holy_fanaticism", desc: "Increases the critical strike chance of all Judgements capable of a critical hit by {3/6/9/12/15}% and reduces threat caused by all actions by {6/12/18/24/30}% except when under the effects of Righteous Fury.", requires: 35, dependsOn: "ret19" },
            { id: "ret22", name: "Crusader Strike", row: 8, col: 1, maxRank: 1, icon: "spell_holy_crusaderstrike", desc: "An instant strike that causes 110% weapon damage and refreshes all Judgements on the target.", requires: 40 }
        ]
    }
};

// Recommended Retribution PvE Raid Build: 5/8/48
// Holy: Divine Strength 5/5
// Protection: Improved Devotion Aura 5/5, Precision 3/3
// Retribution: Improved Blessing of Might 5/5, Benediction 5/5,
//   Improved Judgement 2/2, Improved Seal of the Crusader 3/3,
//   Conviction 5/5, Seal of Command 1/1, Crusade 3/3,
//   Two-Handed Weapon Specialization 3/3, Sanctity Aura 1/1,
//   Improved Sanctity Aura 2/2, Vengeance 5/5, Sanctified Judgement 3/3,
//   Sanctified Seals 3/3, Repentance 1/1, Fanaticism 5/5, Crusader Strike 1/1
//
// Leveling order: Go deep Ret first for damage, then pick up Holy/Prot utility.

const _RECOMMENDED_RAW = [
    // Tier 1 Ret (row 0) - Benediction 5/5
    { level: 10, talent: "ret2", tree: "retribution" },
    { level: 11, talent: "ret2", tree: "retribution" },
    { level: 12, talent: "ret2", tree: "retribution" },
    { level: 13, talent: "ret2", tree: "retribution" },
    { level: 14, talent: "ret2", tree: "retribution" },
    // Tier 2 Ret (row 1) - Improved Judgement 2/2, Improved Seal of the Crusader 3/3
    { level: 15, talent: "ret3", tree: "retribution" },
    { level: 16, talent: "ret3", tree: "retribution" },
    { level: 17, talent: "ret4", tree: "retribution" },
    { level: 18, talent: "ret4", tree: "retribution" },
    { level: 19, talent: "ret4", tree: "retribution" },
    // Tier 3 Ret (row 2) - Conviction 5/5, Seal of Command 1/1
    { level: 20, talent: "ret7", tree: "retribution" },
    { level: 21, talent: "ret7", tree: "retribution" },
    { level: 22, talent: "ret7", tree: "retribution" },
    { level: 23, talent: "ret7", tree: "retribution" },
    { level: 24, talent: "ret7", tree: "retribution" },
    { level: 25, talent: "ret8", tree: "retribution" },
    // Tier 4 Ret (row 3) - Crusade 3/3
    { level: 26, talent: "ret12", tree: "retribution" },
    { level: 27, talent: "ret12", tree: "retribution" },
    { level: 28, talent: "ret12", tree: "retribution" },
    // Filler: Improved Blessing of Might (row 0) to reach 20 pts
    { level: 29, talent: "ret1", tree: "retribution" },
    { level: 30, talent: "ret1", tree: "retribution" },
    // Tier 5 Ret (row 4) - Two-Handed Weapon Spec 3/3, Sanctity Aura 1/1, Improved Sanctity Aura 2/2
    { level: 31, talent: "ret13", tree: "retribution" },
    { level: 32, talent: "ret13", tree: "retribution" },
    { level: 33, talent: "ret13", tree: "retribution" },
    { level: 34, talent: "ret14", tree: "retribution" },
    { level: 35, talent: "ret15", tree: "retribution" },
    { level: 36, talent: "ret15", tree: "retribution" },
    // Tier 6 Ret (row 5) - Vengeance 5/5, Sanctified Judgement 3/3
    { level: 37, talent: "ret16", tree: "retribution" },
    { level: 38, talent: "ret16", tree: "retribution" },
    { level: 39, talent: "ret16", tree: "retribution" },
    { level: 40, talent: "ret16", tree: "retribution" },
    { level: 41, talent: "ret16", tree: "retribution" },
    { level: 42, talent: "ret17", tree: "retribution" },
    { level: 43, talent: "ret17", tree: "retribution" },
    { level: 44, talent: "ret17", tree: "retribution" },
    // Tier 7 Ret (row 6) - Sanctified Seals 3/3, Repentance 1/1
    { level: 45, talent: "ret18", tree: "retribution" },
    { level: 46, talent: "ret18", tree: "retribution" },
    { level: 47, talent: "ret18", tree: "retribution" },
    { level: 48, talent: "ret19", tree: "retribution" },
    // Tier 8 Ret (row 7) - Fanaticism 5/5
    { level: 49, talent: "ret21", tree: "retribution" },
    { level: 50, talent: "ret21", tree: "retribution" },
    { level: 51, talent: "ret21", tree: "retribution" },
    { level: 52, talent: "ret21", tree: "retribution" },
    { level: 53, talent: "ret21", tree: "retribution" },
    // Tier 9 Ret (row 8) - Crusader Strike 1/1
    { level: 54, talent: "ret22", tree: "retribution" },
    // Finish Improved Blessing of Might (row 0) - 3 more ranks
    { level: 55, talent: "ret1", tree: "retribution" },
    { level: 56, talent: "ret1", tree: "retribution" },
    { level: 57, talent: "ret1", tree: "retribution" },
    // 48 Ret pts done. Holy: Divine Strength 5/5
    { level: 58, talent: "holy1", tree: "holy" },
    { level: 59, talent: "holy1", tree: "holy" },
    { level: 60, talent: "holy1", tree: "holy" },
    { level: 61, talent: "holy1", tree: "holy" },
    { level: 62, talent: "holy1", tree: "holy" },
    // Protection: Improved Devotion Aura 5/5 (row 0), then Precision 3/3 (row 1)
    { level: 63, talent: "prot1", tree: "protection" },
    { level: 64, talent: "prot1", tree: "protection" },
    { level: 65, talent: "prot1", tree: "protection" },
    { level: 66, talent: "prot1", tree: "protection" },
    { level: 67, talent: "prot1", tree: "protection" },
    { level: 68, talent: "prot3", tree: "protection" },
    { level: 69, talent: "prot3", tree: "protection" },
    { level: 70, talent: "prot3", tree: "protection" }
];

window.TALENT_CALC_CONFIG = {
    trees: [
        { key: "holy", gridId: "holy-grid", arrowId: "holy-arrows", pointsId: "holy-points", abbrev: "Holy" },
        { key: "protection", gridId: "prot-grid", arrowId: "prot-arrows", pointsId: "prot-points", abbrev: "Prot" },
        { key: "retribution", gridId: "ret-grid", arrowId: "ret-arrows", pointsId: "ret-points", abbrev: "Ret" }
    ],
    talentData: _TALENT_RAW,
    recommendedOrder: _RECOMMENDED_RAW
};
