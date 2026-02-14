// Warlock Destruction PvE - Talent Data for TBC Classic 2.4.3
// Source: Vampyr7878/WoW-Talent-Calculator-TBC (authentic 2.4.3 XML) + Wowhead TBC Classic
// Loaded before talent-calc.js (engine)

const _TALENT_RAW = {
    affliction: {
        name: "Affliction",
        talents: [
            { id: "aff1", name: "Suppression", row: 0, col: 1, maxRank: 5, icon: "spell_shadow_unsummonbuilding", desc: "Reduces the chance for enemies to resist your Affliction spells by {2/4/6/8/10}%." },
            { id: "aff2", name: "Improved Corruption", row: 0, col: 2, maxRank: 5, icon: "spell_shadow_abominationexplosion", desc: "Reduces the casting time of your Corruption spell by {0.4/0.8/1.2/1.6/2} sec." },
            { id: "aff3", name: "Improved Curse of Weakness", row: 1, col: 0, maxRank: 2, icon: "spell_shadow_curseofmannoroth", desc: "Increases the effect of your Curse of Weakness by {10/20}%.", requires: 5 },
            { id: "aff4", name: "Improved Drain Soul", row: 1, col: 1, maxRank: 2, icon: "spell_shadow_haunting", desc: "Returns {7/15}% of your maximum mana if the target is killed by you while you drain its soul. In addition, your Affliction spells generate {5/10}% less threat.", requires: 5 },
            { id: "aff5", name: "Improved Life Tap", row: 1, col: 2, maxRank: 2, icon: "spell_shadow_burningspirit", desc: "Increases the amount of Mana awarded by your Life Tap spell by {10/20}%.", requires: 5 },
            { id: "aff6", name: "Soul Siphon", row: 1, col: 3, maxRank: 2, icon: "spell_shadow_lifedrain02", desc: "Increases the amount drained by your Drain Life spell by an additional {2/4}% for each Affliction effect on the target, up to a maximum of {24/60}% additional effect.", requires: 5 },
            { id: "aff7", name: "Improved Curse of Agony", row: 2, col: 0, maxRank: 2, icon: "spell_shadow_curseofsargeras", desc: "Increases the damage done by your Curse of Agony by {5/10}%.", requires: 10 },
            { id: "aff8", name: "Fel Concentration", row: 2, col: 1, maxRank: 5, icon: "spell_shadow_fingerofdeath", desc: "Gives you a {14/28/42/56/70}% chance to avoid interruption caused by damage while channeling the Drain Life, Drain Mana, or Drain Soul spell.", requires: 10 },
            { id: "aff9", name: "Amplify Curse", row: 2, col: 2, maxRank: 1, icon: "spell_shadow_contagion", desc: "Increases the effect of your next Curse of Doom or Curse of Agony by 50%, or your next Curse of Exhaustion by an additional 20%. Lasts 30 sec.", requires: 10 },
            { id: "aff10", name: "Grim Reach", row: 3, col: 0, maxRank: 2, icon: "spell_shadow_callofbone", desc: "Increases the range of your Affliction spells by {10/20}%.", requires: 15 },
            { id: "aff11", name: "Nightfall", row: 3, col: 1, maxRank: 2, icon: "spell_shadow_twilight", desc: "Gives your Corruption and Drain Life spells a {2/4}% chance to cause you to enter a Shadow Trance state after damaging the opponent. The Shadow Trance state reduces the casting time of your next Shadow Bolt spell by 100%.", requires: 15 },
            { id: "aff12", name: "Empowered Corruption", row: 3, col: 3, maxRank: 3, icon: "spell_shadow_abominationexplosion", desc: "Your Corruption spell gains an additional {12/24/36}% of your bonus spell damage effects.", requires: 15 },
            { id: "aff13", name: "Shadow Embrace", row: 4, col: 0, maxRank: 5, icon: "spell_shadow_shadowembrace", desc: "Your Corruption, Curse of Agony, Siphon Life and Seed of Corruption spells also cause the Shadow Embrace effect, which reduces physical damage caused by {1/2/3/4/5}%.", requires: 20 },
            { id: "aff14", name: "Siphon Life", row: 4, col: 1, maxRank: 1, icon: "spell_shadow_requiem", desc: "Transfers 15 health from the target to the caster every 3 sec. Lasts 30 sec.", requires: 20 },
            { id: "aff15", name: "Curse of Exhaustion", row: 4, col: 2, maxRank: 1, icon: "spell_shadow_grimward", desc: "Reduces the target's movement speed by 30% for 12 sec. Only one Curse per Warlock can be active on any one target.", requires: 20, dependsOn: "aff9" },
            { id: "aff16", name: "Shadow Mastery", row: 5, col: 1, maxRank: 5, icon: "spell_shadow_shadetruesight", desc: "Increases the damage dealt or life drained by your Shadow spells by {2/4/6/8/10}%.", requires: 25, dependsOn: "aff14" },
            { id: "aff17", name: "Contagion", row: 6, col: 1, maxRank: 5, icon: "spell_shadow_painfulafflictions", desc: "Increases the damage of Curse of Agony, Corruption and Seed of Corruption by {1/2/3/4/5}% and reduces the chance your Affliction spells will be dispelled by an additional {6/12/18/24/30}%.", requires: 30 },
            { id: "aff18", name: "Dark Pact", row: 6, col: 2, maxRank: 1, icon: "spell_shadow_darkritual", desc: "Drains 305 of your pet's Mana, returning 100% to you.", requires: 30 },
            { id: "aff19", name: "Improved Howl of Terror", row: 7, col: 0, maxRank: 2, icon: "spell_shadow_deathscream", desc: "Reduces the casting time of your Howl of Terror spell by {0.8/1.5} sec.", requires: 35 },
            { id: "aff20", name: "Malediction", row: 7, col: 2, maxRank: 3, icon: "spell_shadow_curseofachimonde", desc: "Increases the damage bonus effect of your Curse of the Elements spell by an additional {1/2/3}%.", requires: 35 },
            { id: "aff21", name: "Unstable Affliction", row: 8, col: 1, maxRank: 1, icon: "spell_shadow_unstableaffliction_3", desc: "Shadow energy slowly destroys the target, causing 660 damage over 18 sec. In addition, if the Unstable Affliction is dispelled it will cause 990 damage to the dispeller and silence them for 5 sec.", requires: 40, dependsOn: "aff17" }
        ]
    },
    demonology: {
        name: "Demonology",
        talents: [
            { id: "demo1", name: "Improved Healthstone", row: 0, col: 0, maxRank: 2, icon: "inv_stone_04", desc: "Increases the amount of Health restored by your Healthstone by {10/20}%." },
            { id: "demo2", name: "Improved Imp", row: 0, col: 1, maxRank: 3, icon: "spell_shadow_summonimp", desc: "Increases the effect of your Imp's Firebolt, Fire Shield, and Blood Pact spells by {10/20/30}%." },
            { id: "demo3", name: "Demonic Embrace", row: 0, col: 2, maxRank: 5, icon: "spell_shadow_metamorphosis", desc: "Increases your total Stamina by {3/6/9/12/15}% but reduces your total Spirit by {1/2/3/4/5}%." },
            { id: "demo4", name: "Improved Health Funnel", row: 1, col: 0, maxRank: 2, icon: "spell_shadow_lifedrain", desc: "Increases the amount of Health transferred by your Health Funnel spell by {10/20}% and reduces the initial health cost by {10/20}%.", requires: 5 },
            { id: "demo5", name: "Improved Voidwalker", row: 1, col: 1, maxRank: 3, icon: "spell_shadow_summonvoidwalker", desc: "Increases the effectiveness of your Voidwalker's Torment, Consume Shadows, Sacrifice and Suffering spells by {10/20/30}%.", requires: 5 },
            { id: "demo6", name: "Fel Intellect", row: 1, col: 2, maxRank: 3, icon: "spell_holy_magicalsentry", desc: "Increases the Intellect of your Imp, Voidwalker, Succubus, Felhunter and Felguard by {5/10/15}% and increases your maximum mana by {1/2/3}%.", requires: 5 },
            { id: "demo7", name: "Improved Succubus", row: 2, col: 0, maxRank: 3, icon: "spell_shadow_summonsuccubus", desc: "Increases the effect of your Succubus' Lash of Pain and Soothing Kiss spells by {10/20/30}%, and increases the duration of your Succubus' Seduction and Lesser Invisibility spells by {10/20/30}%.", requires: 10 },
            { id: "demo8", name: "Fel Domination", row: 2, col: 1, maxRank: 1, icon: "spell_nature_removecurse", desc: "Your next Imp, Voidwalker, Succubus, Felhunter or Felguard Summon spell has its casting time reduced by 5.5 sec and its Mana cost reduced by 50%.", requires: 10 },
            { id: "demo9", name: "Fel Stamina", row: 2, col: 2, maxRank: 3, icon: "spell_shadow_antishadow", desc: "Increases the Stamina of your Imp, Voidwalker, Succubus, Felhunter and Felguard by {5/10/15}% and increases your maximum health by {1/2/3}%.", requires: 10 },
            { id: "demo10", name: "Demonic Aegis", row: 2, col: 3, maxRank: 3, icon: "spell_shadow_ragingscream", desc: "Increases the effectiveness of your Demon Armor and Fel Armor spells by {10/20/30}%.", requires: 10 },
            { id: "demo11", name: "Master Summoner", row: 3, col: 1, maxRank: 2, icon: "spell_shadow_impphaseshift", desc: "Reduces the casting time of your Imp, Voidwalker, Succubus, Felhunter and Felguard Summoning spells by {2/4} sec and the Mana cost by {20/40}%.", requires: 15, dependsOn: "demo8" },
            { id: "demo12", name: "Unholy Power", row: 3, col: 2, maxRank: 5, icon: "spell_shadow_shadowworddominate", desc: "Increases the damage done by your Voidwalker, Succubus, Felhunter and Felguard's melee attacks and your Imp's Firebolt by {4/8/12/16/20}%.", requires: 15 },
            { id: "demo13", name: "Improved Enslave Demon", row: 4, col: 0, maxRank: 2, icon: "spell_shadow_enslavedemon", desc: "Reduces the Attack Speed and Casting Speed penalty of your Enslave Demon spell by {5/10}% and reduces the resist chance by {5/10}%.", requires: 20 },
            { id: "demo14", name: "Demonic Sacrifice", row: 4, col: 1, maxRank: 1, icon: "spell_shadow_psychicscream", desc: "When activated, sacrifices your summoned demon to grant you an effect that lasts 30 min. The effect is canceled if any Demon is summoned. Imp: Increases Fire damage by 15%. Voidwalker: Restores 2% of total health every 4 sec. Succubus: Increases Shadow damage by 15%. Felhunter: Restores 3% of total mana every 4 sec.", requires: 20 },
            { id: "demo15", name: "Master Conjuror", row: 4, col: 3, maxRank: 2, icon: "inv_ammo_firetar", desc: "Increases the bonus Fire damage from Firestones and the Firestone effect by {15/30}% and increases the spell critical strike rating bonus of your Spellstone by {15/30}%.", requires: 20 },
            { id: "demo16", name: "Mana Feed", row: 5, col: 0, maxRank: 3, icon: "spell_shadow_manafeed", desc: "When you gain mana from Drain Mana or Life Tap spells, your pet gains {33/66/100}% of the mana you gain.", requires: 25 },
            { id: "demo17", name: "Master Demonologist", row: 5, col: 2, maxRank: 5, icon: "spell_shadow_shadowpact", desc: "Grants both the Warlock and the summoned demon an effect as long as that demon is active. Imp: Reduces threat caused by {4/8/12/16/20}%. Succubus: Increases all damage caused by {2/4/6/8/10}%. Felguard: Increases all damage by {1/2/3/4/5}% and all resistances.", requires: 25, dependsOn: "demo12" },
            { id: "demo18", name: "Demonic Resilience", row: 6, col: 0, maxRank: 3, icon: "spell_shadow_demonicfortitude", desc: "Reduces the chance you'll be critically hit by melee and spells by {1/2/3}% and reduces all damage your summoned demon takes by {5/10/15}%.", requires: 30 },
            { id: "demo19", name: "Soul Link", row: 6, col: 1, maxRank: 1, icon: "spell_shadow_gathershadows", desc: "When active, 20% of all damage taken by the caster is taken by your Imp, Voidwalker, Succubus, Felhunter, Felguard, or enslaved demon instead. In addition, both the demon and master will inflict 5% more damage.", requires: 30, dependsOn: "demo14" },
            { id: "demo20", name: "Demonic Knowledge", row: 6, col: 2, maxRank: 3, icon: "spell_shadow_improvedvampiricembrace", desc: "Increases your spell damage by an amount equal to {4/8/12}% of the total of your active demon's Stamina plus Intellect.", requires: 30 },
            { id: "demo21", name: "Demonic Tactics", row: 7, col: 1, maxRank: 5, icon: "spell_shadow_demonictactics", desc: "Increases melee and spell critical strike chance for you and your summoned demon by {1/2/3/4/5}%.", requires: 35 },
            { id: "demo22", name: "Summon Felguard", row: 8, col: 1, maxRank: 1, icon: "spell_shadow_summonfelguard", desc: "Summons a Felguard under the command of the Warlock.", requires: 40 }
        ]
    },
    destruction: {
        name: "Destruction",
        talents: [
            { id: "destro1", name: "Improved Shadow Bolt", row: 0, col: 1, maxRank: 5, icon: "spell_shadow_shadowbolt", desc: "Your Shadow Bolt critical strikes increase Shadow damage dealt to the target by {4/8/12/16/20}% until 4 non-periodic damage sources are applied. Effect lasts a maximum of 12 sec." },
            { id: "destro2", name: "Cataclysm", row: 0, col: 2, maxRank: 5, icon: "spell_fire_windsofwoe", desc: "Reduces the Mana cost of your Destruction spells by {1/2/3/4/5}%." },
            { id: "destro3", name: "Bane", row: 1, col: 1, maxRank: 5, icon: "spell_shadow_deathpact", desc: "Reduces the casting time of your Shadow Bolt and Immolate spells by {0.1/0.2/0.3/0.4/0.5} sec and your Soul Fire spell by {0.4/0.8/1.2/1.6/2} sec.", requires: 5 },
            { id: "destro4", name: "Aftermath", row: 1, col: 2, maxRank: 5, icon: "spell_fire_fire", desc: "Gives your Destruction spells a {2/4/6/8/10}% chance to daze the target for 5 sec.", requires: 5 },
            { id: "destro5", name: "Improved Firebolt", row: 2, col: 0, maxRank: 2, icon: "spell_fire_firebolt", desc: "Reduces the casting time of your Imp's Firebolt spell by {0.25/0.5} sec.", requires: 10 },
            { id: "destro6", name: "Improved Lash of Pain", row: 2, col: 1, maxRank: 2, icon: "spell_shadow_curse", desc: "Reduces the cooldown of your Succubus' Lash of Pain spell by {3/6} sec.", requires: 10 },
            { id: "destro7", name: "Devastation", row: 2, col: 2, maxRank: 5, icon: "spell_fire_flameshock", desc: "Increases the critical strike chance of your Destruction spells by {1/2/3/4/5}%.", requires: 10 },
            { id: "destro8", name: "Shadowburn", row: 2, col: 3, maxRank: 1, icon: "spell_shadow_scourgebuild", desc: "Instantly blasts the target for 87 to 100 Shadow damage. If the target dies within 5 sec of Shadowburn, and yields experience or honor, the caster gains a Soul Shard.", requires: 10 },
            { id: "destro9", name: "Intensity", row: 3, col: 0, maxRank: 2, icon: "spell_fire_lavaspawn", desc: "Gives you a {35/70}% chance to resist interruption caused by damage while casting or channeling any Destruction spell.", requires: 15 },
            { id: "destro10", name: "Destructive Reach", row: 3, col: 1, maxRank: 2, icon: "spell_shadow_corpseexplode", desc: "Increases the range of your Destruction spells by {10/20}% and reduces threat caused by Destruction spells by {5/10}%.", requires: 15 },
            { id: "destro11", name: "Improved Searing Pain", row: 3, col: 3, maxRank: 3, icon: "spell_fire_soulburn", desc: "Increases the critical strike chance of your Searing Pain spell by {4/7/10}%.", requires: 15 },
            { id: "destro12", name: "Pyroclasm", row: 4, col: 0, maxRank: 2, icon: "spell_fire_volcano", desc: "Gives your Rain of Fire, Hellfire, and Soul Fire spells a {13/26}% chance to stun the target for 3 sec.", requires: 20, dependsOn: "destro9" },
            { id: "destro13", name: "Improved Immolate", row: 4, col: 1, maxRank: 5, icon: "spell_fire_immolation", desc: "Increases the initial damage of your Immolate spell by {5/10/15/20/25}%.", requires: 20 },
            { id: "destro14", name: "Ruin", row: 4, col: 2, maxRank: 1, icon: "spell_shadow_shadowwordpain", desc: "Increases the critical strike damage bonus of your Destruction spells by 100%.", requires: 20, dependsOn: "destro7" },
            { id: "destro15", name: "Nether Protection", row: 5, col: 0, maxRank: 3, icon: "spell_shadow_netherprotection", desc: "After being hit with a Shadow or Fire spell, you have a {10/20/30}% chance to become immune to Shadow and Fire spells for 4 sec.", requires: 25 },
            { id: "destro16", name: "Emberstorm", row: 5, col: 2, maxRank: 5, icon: "spell_fire_selfdestruct", desc: "Increases the damage done by your Fire spells by {2/4/6/8/10}% and reduces the cast time of your Incinerate spell by {2/4/6/8/10}%.", requires: 25 },
            { id: "destro17", name: "Backlash", row: 6, col: 0, maxRank: 3, icon: "spell_fire_playingwithfire", desc: "Increases your critical strike chance with spells by an additional {1/2/3}% and gives you a {8/16/25}% chance when hit by a physical attack to reduce the cast time of your next Shadow Bolt or Incinerate spell by 100%.", requires: 30 },
            { id: "destro18", name: "Conflagrate", row: 6, col: 1, maxRank: 1, icon: "spell_fire_fireball", desc: "Ignites a target that is already afflicted by your Immolate, dealing 240 to 307 Fire damage and consuming the Immolate spell.", requires: 30, dependsOn: "destro13" },
            { id: "destro19", name: "Soul Leech", row: 6, col: 2, maxRank: 3, icon: "spell_shadow_soulleech_3", desc: "Gives your Shadow Bolt, Shadowburn, Soul Fire, Incinerate, Searing Pain and Conflagrate spells a {10/20/30}% chance to return health equal to 20% of the damage caused.", requires: 30 },
            { id: "destro20", name: "Shadow and Flame", row: 7, col: 1, maxRank: 5, icon: "spell_shadow_shadowandflame", desc: "Your Shadow Bolt and Incinerate spells gain an additional {4/8/12/16/20}% of your bonus spell damage effects.", requires: 35 },
            { id: "destro21", name: "Shadowfury", row: 8, col: 1, maxRank: 1, icon: "spell_shadow_shadowfury", desc: "Shadowfury is unleashed, causing 343 to 408 Shadow damage and stunning all enemies within 8 yds for 2 sec.", requires: 40, dependsOn: "destro20" }
        ]
    }
};

// Standard 0/21/40 Destruction PvE Raiding Build
// Destruction first for Shadow Bolt damage, then Demonology for Demonic Sacrifice
const _RECOMMENDED_RAW = [
    // === Destruction Tree (40 pts) ===
    // Levels 10-14: Improved Shadow Bolt 5/5 (core raid debuff)
    { level: 10, talent: "destro1", tree: "destruction" },
    { level: 11, talent: "destro1", tree: "destruction" },
    { level: 12, talent: "destro1", tree: "destruction" },
    { level: 13, talent: "destro1", tree: "destruction" },
    { level: 14, talent: "destro1", tree: "destruction" },
    // Levels 15-19: Bane 5/5 (faster Shadow Bolt + Immolate cast)
    { level: 15, talent: "destro3", tree: "destruction" },
    { level: 16, talent: "destro3", tree: "destruction" },
    { level: 17, talent: "destro3", tree: "destruction" },
    { level: 18, talent: "destro3", tree: "destruction" },
    { level: 19, talent: "destro3", tree: "destruction" },
    // Levels 20-24: Devastation 5/5 (crit chance for Destruction spells)
    { level: 20, talent: "destro7", tree: "destruction" },
    { level: 21, talent: "destro7", tree: "destruction" },
    { level: 22, talent: "destro7", tree: "destruction" },
    { level: 23, talent: "destro7", tree: "destruction" },
    { level: 24, talent: "destro7", tree: "destruction" },
    // Level 25: Shadowburn 1/1 (instant execute, great for questing)
    { level: 25, talent: "destro8", tree: "destruction" },
    // Levels 26-27: Intensity 2/2 (pushback protection)
    { level: 26, talent: "destro9", tree: "destruction" },
    { level: 27, talent: "destro9", tree: "destruction" },
    // Levels 28-29: Destructive Reach 2/2 (range + threat reduction)
    { level: 28, talent: "destro10", tree: "destruction" },
    { level: 29, talent: "destro10", tree: "destruction" },
    // Level 30: Ruin 1/1 (doubles crit damage — massive DPS increase)
    { level: 30, talent: "destro14", tree: "destruction" },
    // Levels 31-35: Improved Immolate 5/5 (boosts Immolate initial hit)
    { level: 31, talent: "destro13", tree: "destruction" },
    { level: 32, talent: "destro13", tree: "destruction" },
    { level: 33, talent: "destro13", tree: "destruction" },
    { level: 34, talent: "destro13", tree: "destruction" },
    { level: 35, talent: "destro13", tree: "destruction" },
    // Levels 36-40: Emberstorm 5/5 (fire damage + Incinerate cast time)
    { level: 36, talent: "destro16", tree: "destruction" },
    { level: 37, talent: "destro16", tree: "destruction" },
    { level: 38, talent: "destro16", tree: "destruction" },
    { level: 39, talent: "destro16", tree: "destruction" },
    { level: 40, talent: "destro16", tree: "destruction" },
    // Levels 41-43: Backlash 3/3 (spell crit + instant cast proc)
    { level: 41, talent: "destro17", tree: "destruction" },
    { level: 42, talent: "destro17", tree: "destruction" },
    { level: 43, talent: "destro17", tree: "destruction" },
    // Level 44: Conflagrate 1/1 (instant fire nuke, requires Improved Immolate 5/5)
    { level: 44, talent: "destro18", tree: "destruction" },
    // Levels 45-49: Shadow and Flame 5/5 (spell damage scaling for SB + Incinerate)
    { level: 45, talent: "destro20", tree: "destruction" },
    { level: 46, talent: "destro20", tree: "destruction" },
    { level: 47, talent: "destro20", tree: "destruction" },
    { level: 48, talent: "destro20", tree: "destruction" },
    { level: 49, talent: "destro20", tree: "destruction" },
    // === Demonology Tree (21 pts) ===
    // Levels 50-51: Improved Healthstone 2/2 (filler to reach next tier)
    { level: 50, talent: "demo1", tree: "demonology" },
    { level: 51, talent: "demo1", tree: "demonology" },
    // Levels 52-56: Demonic Embrace 5/5 (stamina for Life Tap synergy)
    { level: 52, talent: "demo3", tree: "demonology" },
    { level: 53, talent: "demo3", tree: "demonology" },
    { level: 54, talent: "demo3", tree: "demonology" },
    { level: 55, talent: "demo3", tree: "demonology" },
    { level: 56, talent: "demo3", tree: "demonology" },
    // Levels 57-59: Fel Intellect 3/3 (pet intellect + your mana)
    { level: 57, talent: "demo6", tree: "demonology" },
    { level: 58, talent: "demo6", tree: "demonology" },
    { level: 59, talent: "demo6", tree: "demonology" },
    // Level 60: Fel Domination 1/1 (instant resummon)
    { level: 60, talent: "demo8", tree: "demonology" },
    // Levels 61-63: Fel Stamina 3/3 (pet stamina + your health)
    { level: 61, talent: "demo9", tree: "demonology" },
    { level: 62, talent: "demo9", tree: "demonology" },
    { level: 63, talent: "demo9", tree: "demonology" },
    // Level 64: Demonic Aegis 1/3 (filler to reach 15 pts for tier 4)
    { level: 64, talent: "demo10", tree: "demonology" },
    // Levels 65-66: Master Summoner 2/2 (requires Fel Domination)
    { level: 65, talent: "demo11", tree: "demonology" },
    { level: 66, talent: "demo11", tree: "demonology" },
    // Levels 67-69: Unholy Power 3/5 (pet damage, gets us to 20 Demo pts)
    { level: 67, talent: "demo12", tree: "demonology" },
    { level: 68, talent: "demo12", tree: "demonology" },
    { level: 69, talent: "demo12", tree: "demonology" },
    // Level 70: Demonic Sacrifice 1/1 (sacrifice Imp for +15% Fire damage)
    { level: 70, talent: "demo14", tree: "demonology" }
];

window.TALENT_CALC_CONFIG = {
    trees: [
        { key: 'affliction', gridId: 'aff-grid', arrowId: 'aff-arrows', pointsId: 'aff-points', abbrev: 'Aff' },
        { key: 'demonology', gridId: 'demo-grid', arrowId: 'demo-arrows', pointsId: 'demo-points', abbrev: 'Demo' },
        { key: 'destruction', gridId: 'destro-grid', arrowId: 'destro-arrows', pointsId: 'destro-points', abbrev: 'Destro' }
    ],
    talentData: _TALENT_RAW,
    recommendedOrder: _RECOMMENDED_RAW
};
