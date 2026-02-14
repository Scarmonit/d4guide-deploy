// Boss - Multi-phase boss enemies with unique abilities and mechanics
class Boss extends Enemy {
    constructor(x, y, bossType = 'skeleton_king', floorLevel = 1) {
        // Call parent with boss type
        super(x, y, bossType, floorLevel);

        this.isBoss = true;
        this.bossType = bossType;
        this.bossData = BOSS_TYPES[bossType] || BOSS_TYPES.skeleton_king;

        // Override with boss-specific stats
        this.initializeBossStats(bossType, floorLevel);

        // Phase system
        this.currentPhase = 1;
        this.maxPhases = this.bossData.phases?.length || 3;
        this.phaseThresholds = this.bossData.phaseThresholds || [1.0, 0.66, 0.33];
        this.phaseTransitioning = false;
        this.phaseTransitionTimer = 0;
        this.invulnerableDuringTransition = true;

        // Abilities
        this.abilities = this.bossData.abilities || [];
        this.abilityCooldowns = {};
        this.currentAbility = null;
        this.abilityCastTimer = 0;
        this.isCasting = false;

        // Initialize cooldowns
        for (const ability of this.abilities) {
            this.abilityCooldowns[ability.id] = 0;
        }

        // Enrage mechanics
        this.enrageTimer = this.bossData.enrageTime || 300; // 5 minutes default
        this.isEnraged = false;
        this.enrageMultiplier = 1.5;

        // Visual effects
        this.scale = this.bossData.scale || 1.5;
        this.glowColor = this.bossData.glowColor || '#ff4444';
        this.glowIntensity = 0;
        this.glowPhase = 0;

        // Boss arena
        this.arenaCenter = { x: x, y: y };
        this.arenaRadius = 8;

        // Summons
        this.summons = [];
        this.maxSummons = this.bossData.maxSummons || 4;

        // Projectiles and effects
        this.projectiles = [];
        this.aoeZones = [];

        // Boss state
        this.isAwakened = false;
        this.awakeningTimer = 0;
        this.introPlayed = false;

        // Combat stats tracking
        this.totalDamageDealt = 0;
        this.hitsTaken = 0;

        // Store timeout IDs for cleanup on death
        this._activeTimeouts = [];
    }

    // Initialize boss-specific stats
    initializeBossStats(bossType, floorLevel) {
        const bossData = BOSS_TYPES[bossType] || BOSS_TYPES.skeleton_king;
        const levelMultiplier = 1 + (floorLevel - 1) * 0.3;

        this.name = bossData.name;
        this.title = bossData.title || '';
        this.color = bossData.color;

        // Boss health scales more aggressively
        this.maxHealth = Math.floor(bossData.health * levelMultiplier);
        this.health = this.maxHealth;

        // Damage
        this.damage = {
            min: Math.floor(bossData.damage.min * levelMultiplier),
            max: Math.floor(bossData.damage.max * levelMultiplier)
        };

        // Defensive stats
        this.armor = Math.floor(bossData.armor * levelMultiplier);
        this.elementalResist = bossData.elementalResist || 0;

        // Attack properties
        this.attackSpeed = bossData.attackSpeed || 0.8;
        this.attackRange = bossData.attackRange || 1.5;
        this.moveSpeed = bossData.moveSpeed || 2.0;
        this.detectionRange = bossData.detectionRange || 12;

        // Experience reward (much higher than normal enemies)
        this.experienceReward = Math.floor(bossData.expReward * levelMultiplier);
    }

    // Awaken the boss (triggered when player enters arena)
    awaken() {
        if (this.isAwakened) return;

        this.isAwakened = true;
        this.awakeningTimer = 2.0; // 2 second awakening animation
        this.aiState = 'awakening';

        // Play intro
        if (!this.introPlayed) {
            this.playIntro();
            this.introPlayed = true;
        }

        console.log(`${this.name}${this.title ? ', ' + this.title : ''} awakens!`);
    }

    // Play boss intro
    playIntro() {
        // Create dramatic intro effect
        if (window.game && window.game.ui) {
            window.game.ui.showBossIntro(this.name, this.title);
        }

        // Trigger boss music
        if (window.audioManager) {
            window.audioManager.playBossMusic(this.bossType);
        }
    }

    // Main update loop
    update(deltaTime, dungeon, player, pathfinder, enemies) {
        if (this.isDead) {
            this.updateDeath(deltaTime);
            return;
        }

        // Awakening animation
        if (this.awakeningTimer > 0) {
            this.awakeningTimer -= deltaTime;
            this.glowIntensity = 1 - (this.awakeningTimer / 2.0);
            if (this.awakeningTimer <= 0) {
                this.aiState = 'pursuing';
            }
            return;
        }

        // Phase transition
        if (this.phaseTransitioning) {
            this.updatePhaseTransition(deltaTime);
            return;
        }

        // Check for phase transitions
        this.checkPhaseTransition();

        // Update enrage timer
        if (!this.isEnraged) {
            this.enrageTimer -= deltaTime;
            if (this.enrageTimer <= 0) {
                this.triggerEnrage();
            }
        }

        // Update cooldowns
        this.updateCooldowns(deltaTime);

        // Update current ability cast
        if (this.isCasting) {
            this.updateAbilityCast(deltaTime, player, dungeon);
            return;
        }

        // Update visual effects
        this.updateVisuals(deltaTime);

        // Update projectiles
        this.updateProjectiles(deltaTime, player, dungeon);

        // Update AoE zones
        this.updateAoeZones(deltaTime, player);

        // Update summons
        this.updateSummons(deltaTime, dungeon, player, pathfinder);

        // Boss AI (override parent for boss-specific behavior)
        this.updateBossAI(deltaTime, dungeon, player, pathfinder);

        // Handle movement
        if (this.isMoving && this.path.length > 0) {
            this.moveAlongPath(deltaTime, dungeon);
        }
    }

    // Update ability cooldowns
    updateCooldowns(deltaTime) {
        for (const abilityId in this.abilityCooldowns) {
            if (this.abilityCooldowns[abilityId] > 0) {
                this.abilityCooldowns[abilityId] -= deltaTime;
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime;
        }
    }

    // Boss-specific AI
    updateBossAI(deltaTime, dungeon, player, pathfinder) {
        if (!player || player.isDead || !this.isAwakened) {
            return;
        }

        const distToPlayer = this.distanceTo(player);
        const currentPhaseData = this.getCurrentPhaseData();

        // Try to use abilities
        const abilityUsed = this.tryUseAbility(player, distToPlayer, dungeon);
        if (abilityUsed) return;

        // Phase-specific behavior
        switch (currentPhaseData?.behavior || 'aggressive') {
            case 'aggressive':
                this.behaviorAggressive(deltaTime, dungeon, player, pathfinder, distToPlayer);
                break;
            case 'defensive':
                this.behaviorDefensive(deltaTime, dungeon, player, pathfinder, distToPlayer);
                break;
            case 'summoner':
                this.behaviorSummoner(deltaTime, dungeon, player, pathfinder, distToPlayer);
                break;
            case 'berserk':
                this.behaviorBerserk(deltaTime, dungeon, player, pathfinder, distToPlayer);
                break;
        }
    }

    // Aggressive behavior - chase and attack
    behaviorAggressive(deltaTime, dungeon, player, pathfinder, distToPlayer) {
        if (distToPlayer <= this.attackRange) {
            this.stopMovement();
            this.faceEntity(player);
            if (this.attackCooldown <= 0) {
                this.performAttack(player);
            }
        } else {
            if (!this.isMoving) {
                this.setTarget(Math.floor(player.x), Math.floor(player.y), dungeon, pathfinder);
            }
        }
    }

    // Defensive behavior - keep distance, use ranged abilities
    behaviorDefensive(deltaTime, dungeon, player, pathfinder, distToPlayer) {
        const preferredDistance = 5;

        if (distToPlayer < preferredDistance) {
            // Move away from player
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                const retreatX = Math.floor(this.x + (dx / len) * 4);
                const retreatY = Math.floor(this.y + (dy / len) * 4);
                if (dungeon.isWalkable(retreatX, retreatY) && !this.isMoving) {
                    this.setTarget(retreatX, retreatY, dungeon, pathfinder);
                }
            }
        } else if (distToPlayer > preferredDistance + 2) {
            // Move closer
            if (!this.isMoving) {
                this.setTarget(Math.floor(player.x), Math.floor(player.y), dungeon, pathfinder);
            }
        }
    }

    // Summoner behavior - stay back and summon minions
    behaviorSummoner(deltaTime, dungeon, player, pathfinder, distToPlayer) {
        // Keep moderate distance
        if (distToPlayer < 4) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
                const retreatX = Math.floor(this.x + (dx / len) * 3);
                const retreatY = Math.floor(this.y + (dy / len) * 3);
                if (dungeon.isWalkable(retreatX, retreatY) && !this.isMoving) {
                    this.setTarget(retreatX, retreatY, dungeon, pathfinder);
                }
            }
        }

        // Melee attack if player gets close
        if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
            this.performAttack(player);
        }
    }

    // Berserk behavior - fast, aggressive, no regard for safety
    behaviorBerserk(deltaTime, dungeon, player, pathfinder, distToPlayer) {
        // Move faster in berserk mode
        const originalSpeed = this.moveSpeed;
        this.moveSpeed *= 1.5;

        if (distToPlayer <= this.attackRange) {
            this.stopMovement();
            this.faceEntity(player);
            if (this.attackCooldown <= 0) {
                this.performAttack(player);
                this.attackCooldown *= 0.7; // Attack faster in berserk
            }
        } else {
            if (!this.isMoving) {
                this.setTarget(Math.floor(player.x), Math.floor(player.y), dungeon, pathfinder);
            }
        }

        this.moveSpeed = originalSpeed;
    }

    // Try to use an ability
    tryUseAbility(player, distToPlayer, dungeon) {
        const availableAbilities = this.getAvailableAbilities(distToPlayer);
        if (availableAbilities.length === 0) return false;

        // Pick ability based on priority and random chance
        for (const ability of availableAbilities) {
            if (Math.random() < (ability.useChance || 0.3)) {
                this.startAbility(ability, player, dungeon);
                return true;
            }
        }

        return false;
    }

    // Get abilities that can be used right now
    getAvailableAbilities(distToPlayer) {
        const currentPhase = this.currentPhase;
        return this.abilities.filter(ability => {
            // Check cooldown
            if (this.abilityCooldowns[ability.id] > 0) return false;

            // Check phase requirement
            if (ability.minPhase && currentPhase < ability.minPhase) return false;
            if (ability.maxPhase && currentPhase > ability.maxPhase) return false;

            // Check range
            if (ability.minRange && distToPlayer < ability.minRange) return false;
            if (ability.maxRange && distToPlayer > ability.maxRange) return false;

            // Check health threshold
            if (ability.healthThreshold) {
                const healthPercent = this.health / this.maxHealth;
                if (healthPercent > ability.healthThreshold) return false;
            }

            return true;
        }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    // Start casting an ability
    startAbility(ability, player, dungeon) {
        this.currentAbility = ability;
        this.isCasting = true;
        this.abilityCastTimer = ability.castTime || 0;
        this.stopMovement();

        // Face target if needed
        if (ability.faceTarget) {
            this.faceEntity(player);
        }

        // Visual indicator
        this.glowColor = ability.color || this.bossData.glowColor;
        this.glowIntensity = 0.5;

        console.log(`${this.name} begins casting ${ability.name}!`);

        // Instant cast abilities
        if (ability.castTime === 0) {
            this.executeAbility(ability, player, dungeon);
        }
    }

    // Update ability cast
    updateAbilityCast(deltaTime, player, dungeon) {
        this.abilityCastTimer -= deltaTime;
        this.glowIntensity = 0.5 + Math.sin(Date.now() / 100) * 0.3;

        if (this.abilityCastTimer <= 0) {
            this.executeAbility(this.currentAbility, player, dungeon);
        }
    }

    // Execute the ability
    executeAbility(ability, player, dungeon) {
        this.isCasting = false;
        this.abilityCooldowns[ability.id] = ability.cooldown || 10;
        this.glowIntensity = 0;

        console.log(`${this.name} uses ${ability.name}!`);

        // Execute ability effect based on type
        switch (ability.type) {
            case 'damage':
                this.abilityDamage(ability, player);
                break;
            case 'aoe':
                this.abilityAoE(ability, player, dungeon);
                break;
            case 'projectile':
                this.abilityProjectile(ability, player);
                break;
            case 'summon':
                this.abilitySummon(ability, dungeon);
                break;
            case 'charge':
                this.abilityCharge(ability, player, dungeon);
                break;
            case 'buff':
                this.abilityBuff(ability);
                break;
            case 'ground':
                this.abilityGround(ability, player, dungeon);
                break;
            case 'nova':
                this.abilityNova(ability, player);
                break;
        }

        this.currentAbility = null;
    }

    // Direct damage ability
    abilityDamage(ability, player) {
        const damage = this.calculateAbilityDamage(ability);
        const actualDamage = player.takeDamage(damage, { name: this.name, damageType: ability.damageType || 'physical' });
        this.totalDamageDealt += actualDamage;

        if (window.combatEffects) {
            window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
            window.combatEffects.spawnBloodParticles(player.x, player.y, 3);
        }
    }

    // Area of Effect ability
    abilityAoE(ability, player, dungeon) {
        const centerX = ability.targetSelf ? this.x : player.x;
        const centerY = ability.targetSelf ? this.y : player.y;
        const radius = ability.radius || 3;
        const duration = ability.duration || 0;

        // Create AoE zone if it persists
        if (duration > 0) {
            this.aoeZones.push({
                x: centerX,
                y: centerY,
                radius: radius,
                damage: this.calculateAbilityDamage(ability),
                duration: duration,
                tickRate: ability.tickRate || 1,
                tickTimer: 0,
                color: ability.color || '#ff4400',
                type: ability.aoeType || 'fire'
            });
        }

        // Instant damage if in range
        const distToPlayer = this.distanceTo(player);
        if (distToPlayer <= radius) {
            const damage = this.calculateAbilityDamage(ability);
            const actualDamage = player.takeDamage(damage, { name: this.name, damageType: ability.damageType || 'fire' });
            this.totalDamageDealt += actualDamage;

            if (window.combatEffects) {
                window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
            }
        }

        // Visual effect
        if (window.combatEffects) {
            window.combatEffects.addAoEEffect(centerX, centerY, radius, ability.color);
        }
    }

    // Projectile ability
    abilityProjectile(ability, player) {
        const projectileCount = ability.count || 1;
        const spread = ability.spread || 0;

        for (let i = 0; i < projectileCount; i++) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const len = Math.sqrt(dx * dx + dy * dy);

            let dirX = dx / len;
            let dirY = dy / len;

            // Apply spread
            if (spread > 0 && projectileCount > 1) {
                const angle = Math.atan2(dy, dx);
                const spreadAngle = (i - (projectileCount - 1) / 2) * (spread / projectileCount);
                const newAngle = angle + spreadAngle;
                dirX = Math.cos(newAngle);
                dirY = Math.sin(newAngle);
            }

            this.projectiles.push({
                x: this.x,
                y: this.y,
                dirX: dirX,
                dirY: dirY,
                speed: ability.projectileSpeed || 8,
                damage: this.calculateAbilityDamage(ability),
                size: ability.projectileSize || 0.3,
                color: ability.color || '#ff0000',
                maxDistance: ability.range || 15,
                traveled: 0,
                piercing: ability.piercing || false
            });
        }
    }

    // Summon ability
    abilitySummon(ability, dungeon) {
        const summonType = ability.summonType || 'skeleton';
        const count = ability.count || 2;

        // Remove oldest summons if at cap
        while (this.summons.length + count > this.maxSummons) {
            const oldest = this.summons.shift();
            if (oldest) oldest.isDead = true;
        }

        for (let i = 0; i < count; i++) {
            // Find valid spawn position near boss
            let spawnX, spawnY;
            let attempts = 0;
            do {
                const angle = Math.random() * Math.PI * 2;
                const dist = 2 + Math.random() * 2;
                spawnX = Math.floor(this.x + Math.cos(angle) * dist);
                spawnY = Math.floor(this.y + Math.sin(angle) * dist);
                attempts++;
            } while (!dungeon.isWalkable(spawnX, spawnY) && attempts < 20);

            if (attempts < 20) {
                const summon = new Enemy(spawnX, spawnY, summonType, this.floorLevel);
                summon.isSummon = true;
                summon.masterBoss = this;
                this.summons.push(summon);

                console.log(`${this.name} summons a ${summon.name}!`);
            }
        }
    }

    // Charge ability
    abilityCharge(ability, player, dungeon) {
        const chargeSpeed = ability.chargeSpeed || 15;
        const chargeDamage = this.calculateAbilityDamage(ability);

        // Calculate charge direction
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Store charge data
        this.isCharging = true;
        this.chargeDir = { x: dx / len, y: dy / len };
        this.chargeSpeed = chargeSpeed;
        this.chargeDamage = chargeDamage;
        this.chargeDistance = ability.range || 10;
        this.chargeTraveled = 0;

        console.log(`${this.name} charges!`);
    }

    // Self-buff ability
    abilityBuff(ability) {
        const duration = ability.duration || 10;

        if (ability.buffType === 'damage') {
            this.damage.min *= ability.multiplier || 1.5;
            this.damage.max *= ability.multiplier || 1.5;
        } else if (ability.buffType === 'speed') {
            this.moveSpeed *= ability.multiplier || 1.5;
            this.attackSpeed *= ability.multiplier || 1.3;
        } else if (ability.buffType === 'defense') {
            this.armor += ability.value || 10;
        } else if (ability.buffType === 'heal') {
            const healAmount = Math.floor(this.maxHealth * (ability.healPercent || 0.1));
            this.health = Math.min(this.maxHealth, this.health + healAmount);

            if (window.combatEffects) {
                window.combatEffects.showDamageNumber(this.x, this.y, healAmount, true, '#44ff44');
            }
        }

        // Schedule buff removal (store timeout ID for cleanup on death)
        const timeoutId = setTimeout(() => {
            // Remove from active timeouts
            const index = this._activeTimeouts.indexOf(timeoutId);
            if (index > -1) this._activeTimeouts.splice(index, 1);
            // Only remove buff if boss is still alive
            if (!this.isDead) {
                this.removeBuff(ability);
            }
        }, duration * 1000);
        this._activeTimeouts.push(timeoutId);

        console.log(`${this.name} gains ${ability.name}!`);
    }

    // Remove buff
    removeBuff(ability) {
        if (ability.buffType === 'damage') {
            this.damage.min /= ability.multiplier || 1.5;
            this.damage.max /= ability.multiplier || 1.5;
        } else if (ability.buffType === 'speed') {
            this.moveSpeed /= ability.multiplier || 1.5;
            this.attackSpeed /= ability.multiplier || 1.3;
        } else if (ability.buffType === 'defense') {
            this.armor -= ability.value || 10;
        }
    }

    // Ground effect ability (creates hazard zones)
    abilityGround(ability, player, dungeon) {
        const count = ability.count || 3;
        const radius = ability.radius || 2;
        const duration = ability.duration || 5;

        for (let i = 0; i < count; i++) {
            // Random position near player
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 3;
            const zoneX = player.x + Math.cos(angle) * dist;
            const zoneY = player.y + Math.sin(angle) * dist;

            // Delay before damage starts (store timeout ID for cleanup on death)
            const timeoutId = setTimeout(() => {
                // Remove from active timeouts
                const index = this._activeTimeouts.indexOf(timeoutId);
                if (index > -1) this._activeTimeouts.splice(index, 1);
                // Only create AoE zone if boss is still alive
                if (!this.isDead) {
                    this.aoeZones.push({
                        x: zoneX,
                        y: zoneY,
                        radius: radius,
                        damage: this.calculateAbilityDamage(ability) * 0.3,
                        duration: duration,
                        tickRate: ability.tickRate || 0.5,
                        tickTimer: 0,
                        color: ability.color || '#ff4400',
                        type: ability.groundType || 'fire'
                    });
                }
            }, ability.delay ? ability.delay * (i + 1) * 1000 : 0);
            this._activeTimeouts.push(timeoutId);
        }
    }

    // Nova ability (damage all around boss)
    abilityNova(ability, player) {
        const radius = ability.radius || 5;
        const distToPlayer = this.distanceTo(player);

        if (distToPlayer <= radius) {
            const damage = this.calculateAbilityDamage(ability);
            // Damage falls off with distance
            const falloff = 1 - (distToPlayer / radius) * 0.5;
            const actualDamage = player.takeDamage(Math.floor(damage * falloff), { name: this.name, damageType: ability.damageType || 'magic' });
            this.totalDamageDealt += actualDamage;

            if (window.combatEffects) {
                window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
            }
        }

        // Visual effect
        if (window.combatEffects) {
            window.combatEffects.addNovaEffect(this.x, this.y, radius, ability.color);
        }
    }

    // Calculate ability damage with modifiers
    calculateAbilityDamage(ability) {
        let baseDamage = ability.damage || (this.damage.min + this.damage.max) / 2;

        // Apply enrage modifier
        if (this.isEnraged) {
            baseDamage *= this.enrageMultiplier;
        }

        // Apply phase modifier
        const phaseData = this.getCurrentPhaseData();
        if (phaseData?.damageMultiplier) {
            baseDamage *= phaseData.damageMultiplier;
        }

        return Math.floor(baseDamage);
    }

    // Update projectiles
    updateProjectiles(deltaTime, player, dungeon) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Move projectile
            proj.x += proj.dirX * proj.speed * deltaTime;
            proj.y += proj.dirY * proj.speed * deltaTime;
            proj.traveled += proj.speed * deltaTime;

            // Check collision with player
            const distToPlayer = Math.sqrt(
                Math.pow(proj.x - player.x, 2) + Math.pow(proj.y - player.y, 2)
            );

            if (distToPlayer < proj.size + 0.5) {
                const actualDamage = player.takeDamage(proj.damage, { name: this.name, damageType: proj.damageType || 'magic' });
                this.totalDamageDealt += actualDamage;

                if (window.combatEffects) {
                    window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
                    window.combatEffects.spawnBloodParticles(player.x, player.y, 3);
                }

                if (!proj.piercing) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Check collision with walls
            if (!dungeon.isWalkable(Math.floor(proj.x), Math.floor(proj.y))) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Remove if traveled max distance
            if (proj.traveled >= proj.maxDistance) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    // Update AoE zones
    updateAoeZones(deltaTime, player) {
        for (let i = this.aoeZones.length - 1; i >= 0; i--) {
            const zone = this.aoeZones[i];

            zone.duration -= deltaTime;
            zone.tickTimer -= deltaTime;

            // Apply damage on tick
            if (zone.tickTimer <= 0) {
                zone.tickTimer = zone.tickRate;

                const distToPlayer = Math.sqrt(
                    Math.pow(zone.x - player.x, 2) + Math.pow(zone.y - player.y, 2)
                );

                if (distToPlayer <= zone.radius) {
                    const actualDamage = player.takeDamage(zone.damage, { name: this.name + ' (AoE)', damageType: zone.type || 'fire' });
                    this.totalDamageDealt += actualDamage;

                    if (window.combatEffects) {
                        window.combatEffects.showDamageNumber(player.x, player.y, actualDamage, false);
                    }
                }
            }

            // Remove expired zones
            if (zone.duration <= 0) {
                this.aoeZones.splice(i, 1);
            }
        }
    }

    // Update summons
    updateSummons(deltaTime, dungeon, player, pathfinder) {
        for (let i = this.summons.length - 1; i >= 0; i--) {
            const summon = this.summons[i];

            if (summon.isFullyDead()) {
                this.summons.splice(i, 1);
                continue;
            }

            summon.update(deltaTime, dungeon, player, pathfinder, []);
        }
    }

    // Update visual effects
    updateVisuals(deltaTime) {
        this.glowPhase += deltaTime * 3;

        if (!this.isCasting) {
            this.glowIntensity = 0.3 + Math.sin(this.glowPhase) * 0.2;
        }

        // Enrage visuals
        if (this.isEnraged) {
            this.glowColor = '#ff0000';
            this.glowIntensity = 0.5 + Math.sin(this.glowPhase * 2) * 0.3;
        }
    }

    // Check for phase transition
    checkPhaseTransition() {
        const healthPercent = this.health / this.maxHealth;

        for (let phase = this.maxPhases; phase > this.currentPhase; phase--) {
            const threshold = this.phaseThresholds[phase - 1];
            if (healthPercent <= threshold) {
                this.startPhaseTransition(phase);
                break;
            }
        }
    }

    // Start phase transition
    startPhaseTransition(newPhase) {
        this.phaseTransitioning = true;
        this.phaseTransitionTimer = 2.0;
        this.nextPhase = newPhase;
        this.stopMovement();

        // Clear active effects
        this.projectiles = [];
        this.aoeZones = [];

        console.log(`${this.name} is transitioning to phase ${newPhase}!`);
    }

    // Update phase transition
    updatePhaseTransition(deltaTime) {
        this.phaseTransitionTimer -= deltaTime;
        this.glowIntensity = 1.0;
        this.glowColor = '#ffffff';

        if (this.phaseTransitionTimer <= 0) {
            this.completePhaseTransition();
        }
    }

    // Complete phase transition
    completePhaseTransition() {
        this.currentPhase = this.nextPhase;
        this.phaseTransitioning = false;
        this.onPhaseChange();

        console.log(`${this.name} enters phase ${this.currentPhase}!`);
    }

    // Called when phase changes
    onPhaseChange() {
        const phaseData = this.getCurrentPhaseData();

        if (phaseData) {
            // Apply phase stat modifiers
            if (phaseData.speedMultiplier) {
                this.moveSpeed *= phaseData.speedMultiplier;
            }
            if (phaseData.attackSpeedMultiplier) {
                this.attackSpeed *= phaseData.attackSpeedMultiplier;
            }

            // Heal on phase change if configured
            if (phaseData.healOnTransition) {
                const healAmount = Math.floor(this.maxHealth * phaseData.healOnTransition);
                this.health = Math.min(this.maxHealth, this.health + healAmount);
            }
        }

        // Visual notification
        if (window.game && window.game.ui) {
            window.game.ui.showBossPhaseChange(this.name, this.currentPhase);
        }
    }

    // Get current phase data
    getCurrentPhaseData() {
        if (this.bossData.phases && this.bossData.phases[this.currentPhase - 1]) {
            return this.bossData.phases[this.currentPhase - 1];
        }
        return null;
    }

    // Trigger enrage
    triggerEnrage() {
        this.isEnraged = true;
        this.damage.min *= this.enrageMultiplier;
        this.damage.max *= this.enrageMultiplier;
        this.attackSpeed *= 1.3;
        this.moveSpeed *= 1.2;

        console.log(`${this.name} becomes ENRAGED!`);

        if (window.game && window.game.ui) {
            window.game.ui.showBossEnrage(this.name);
        }
    }

    // Face an entity
    faceEntity(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            this.facing = { x: dx / len, y: dy / len };
        }
    }

    // Override take damage for phase invulnerability
    takeDamage(amount, attacker = null) {
        if (this.phaseTransitioning && this.invulnerableDuringTransition) {
            // Show immune indicator
            if (window.combatEffects) {
                window.combatEffects.showDamageNumber(this.x, this.y, 'Immune', false, '#aaaaaa');
            }
            return 0;
        }

        this.hitsTaken++;
        return super.takeDamage(amount, attacker);
    }

    // Boss death
    die() {
        this.isDead = true;
        this.deathTimer = 3.0; // Longer death animation for bosses
        this.stopMovement();

        // Clear all active timeouts to prevent race conditions
        for (const timeoutId of this._activeTimeouts) {
            clearTimeout(timeoutId);
        }
        this._activeTimeouts = [];

        // Kill all summons
        for (const summon of this.summons) {
            summon.isDead = true;
        }
        this.summons = [];

        // Clear effects
        this.projectiles = [];
        this.aoeZones = [];

        // Play death effects
        if (window.combatEffects) {
            window.combatEffects.addBossDeathEffect(this.x, this.y, this.glowColor);
        }

        // Victory music/UI
        if (window.audioManager) {
            window.audioManager.playVictoryMusic();
        }

        if (window.game && window.game.ui) {
            window.game.ui.showBossDefeated(this.name, this.title);
        }

        console.log(`${this.name}${this.title ? ', ' + this.title : ''} has been defeated!`);
    }

    // Generate boss loot
    generateLoot() {
        const loot = [];
        const bossLoot = this.bossData.lootTable || [];

        for (const lootEntry of bossLoot) {
            if (Math.random() < lootEntry.chance) {
                if (lootEntry.type === 'gold') {
                    const amount = Math.floor(
                        lootEntry.min + Math.random() * (lootEntry.max - lootEntry.min + 1)
                    );
                    loot.push({ type: 'gold', amount: amount * this.floorLevel });
                } else if (lootEntry.type === 'equipment') {
                    loot.push({
                        type: 'equipment',
                        rarity: this.rollLootRarity(lootEntry.rarity),
                        guaranteed: lootEntry.guaranteed || false
                    });
                } else if (lootEntry.type === 'unique') {
                    loot.push({
                        type: 'unique',
                        itemId: lootEntry.itemId
                    });
                }
            }
        }

        // Guaranteed drops
        if (this.bossData.guaranteedDrops) {
            for (const drop of this.bossData.guaranteedDrops) {
                loot.push(drop);
            }
        }

        return loot;
    }

    // Roll loot rarity
    rollLootRarity(rarityWeights) {
        const roll = Math.random();
        let cumulative = 0;

        for (const rarity in rarityWeights) {
            cumulative += rarityWeights[rarity];
            if (roll < cumulative) return rarity;
        }

        return 'rare';
    }

    // Render boss (called by renderer)
    render(ctx, tileSize, offsetX, offsetY) {
        const screenX = this.x * tileSize + offsetX;
        const screenY = this.y * tileSize + offsetY;
        const size = tileSize * this.scale;

        // Glow effect
        if (this.glowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.glowIntensity * 0.5;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(screenX + size / 2, screenY + size / 2, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Boss body
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Hit flash
        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // Draw boss (larger than normal enemies)
        ctx.fillRect(
            screenX - (size - tileSize) / 2,
            screenY - (size - tileSize) / 2,
            size,
            size
        );

        // Crown/indicator for boss
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(screenX + tileSize / 2, screenY - 10);
        ctx.lineTo(screenX + tileSize / 2 - 8, screenY);
        ctx.lineTo(screenX + tileSize / 2 + 8, screenY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Render projectiles
        for (const proj of this.projectiles) {
            const projX = proj.x * tileSize + offsetX;
            const projY = proj.y * tileSize + offsetY;
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(projX + tileSize / 2, projY + tileSize / 2, proj.size * tileSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render AoE zones
        for (const zone of this.aoeZones) {
            const zoneX = zone.x * tileSize + offsetX;
            const zoneY = zone.y * tileSize + offsetY;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = zone.color;
            ctx.beginPath();
            ctx.arc(zoneX + tileSize / 2, zoneY + tileSize / 2, zone.radius * tileSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Render boss health bar
    renderHealthBar(ctx, x, y, width, height) {
        const healthPercent = this.health / this.maxHealth;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);

        // Health fill (color changes with phase)
        const phaseColors = ['#cc0000', '#ff6600', '#ffcc00'];
        ctx.fillStyle = phaseColors[Math.min(this.currentPhase - 1, phaseColors.length - 1)];
        ctx.fillRect(x, y, width * healthPercent, height);

        // Phase markers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 1; i < this.phaseThresholds.length; i++) {
            const markerX = x + width * this.phaseThresholds[i];
            ctx.beginPath();
            ctx.moveTo(markerX, y);
            ctx.lineTo(markerX, y + height);
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Boss name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x + width / 2, y - 5);

        // Enrage indicator
        if (this.isEnraged) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('ENRAGED', x + width / 2, y - 20);
        }
    }
}

// ==================== BOSS TYPE DEFINITIONS ====================

const BOSS_TYPES = {
    // ========== CATHEDRAL BOSSES (Floors 1-4) ==========
    skeleton_king: {
        name: 'Leoric',
        title: 'The Skeleton King',
        health: 800,
        damage: { min: 15, max: 25 },
        armor: 8,
        moveSpeed: 2.0,
        attackSpeed: 0.9,
        attackRange: 1.5,
        detectionRange: 12,
        color: '#8b4513',
        glowColor: '#ffcc00',
        scale: 1.8,
        expReward: 500,
        enrageTime: 300,
        maxSummons: 6,
        phaseThresholds: [1.0, 0.7, 0.35],
        phases: [
            { behavior: 'aggressive', damageMultiplier: 1.0 },
            { behavior: 'summoner', damageMultiplier: 1.2, speedMultiplier: 1.1 },
            { behavior: 'berserk', damageMultiplier: 1.5, speedMultiplier: 1.3, attackSpeedMultiplier: 1.4 }
        ],
        abilities: [
            {
                id: 'royal_strike',
                name: 'Royal Strike',
                type: 'damage',
                damage: 40,
                castTime: 0.5,
                cooldown: 5,
                maxRange: 2,
                color: '#ffcc00',
                useChance: 0.4,
                faceTarget: true
            },
            {
                id: 'summon_skeletons',
                name: 'Rise, My Minions!',
                type: 'summon',
                summonType: 'skeleton',
                count: 3,
                castTime: 1.5,
                cooldown: 20,
                minPhase: 2,
                useChance: 0.6,
                color: '#aaaaaa'
            },
            {
                id: 'bone_storm',
                name: 'Bone Storm',
                type: 'nova',
                damage: 35,
                radius: 4,
                castTime: 1.0,
                cooldown: 15,
                minPhase: 2,
                useChance: 0.3,
                color: '#d4c4a0'
            },
            {
                id: 'kings_wrath',
                name: "King's Wrath",
                type: 'charge',
                damage: 60,
                chargeSpeed: 12,
                range: 8,
                castTime: 0.8,
                cooldown: 12,
                minPhase: 3,
                useChance: 0.5,
                color: '#ff4400'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 100, max: 200 },
            { type: 'equipment', chance: 1.0, rarity: { magic: 0.4, rare: 0.5, legendary: 0.1 } },
            { type: 'equipment', chance: 0.5, rarity: { rare: 0.7, legendary: 0.3 } }
        ],
        guaranteedDrops: [
            { type: 'healthPotion', amount: 3 }
        ]
    },

    butcher: {
        name: 'The Butcher',
        title: 'Fresh Meat',
        health: 1000,
        damage: { min: 25, max: 40 },
        armor: 5,
        moveSpeed: 2.5,
        attackSpeed: 0.7,
        attackRange: 1.8,
        detectionRange: 10,
        color: '#8b0000',
        glowColor: '#ff0000',
        scale: 2.0,
        expReward: 600,
        enrageTime: 240,
        maxSummons: 0,
        phaseThresholds: [1.0, 0.6, 0.25],
        phases: [
            { behavior: 'aggressive', damageMultiplier: 1.0 },
            { behavior: 'aggressive', damageMultiplier: 1.3, speedMultiplier: 1.2 },
            { behavior: 'berserk', damageMultiplier: 1.8, speedMultiplier: 1.5, attackSpeedMultiplier: 1.5, healOnTransition: 0.1 }
        ],
        abilities: [
            {
                id: 'cleave',
                name: 'Meat Cleaver',
                type: 'aoe',
                damage: 45,
                radius: 2,
                targetSelf: true,
                castTime: 0.6,
                cooldown: 6,
                useChance: 0.5,
                color: '#cc0000'
            },
            {
                id: 'charge',
                name: 'Brutal Charge',
                type: 'charge',
                damage: 70,
                chargeSpeed: 15,
                range: 10,
                castTime: 0.5,
                cooldown: 10,
                useChance: 0.4,
                minRange: 4,
                color: '#ff0000'
            },
            {
                id: 'hook',
                name: 'Meat Hook',
                type: 'projectile',
                damage: 30,
                projectileSpeed: 12,
                range: 8,
                castTime: 0.3,
                cooldown: 8,
                minRange: 3,
                useChance: 0.4,
                color: '#666666'
            },
            {
                id: 'blood_frenzy',
                name: 'Blood Frenzy',
                type: 'buff',
                buffType: 'damage',
                multiplier: 1.5,
                duration: 8,
                castTime: 1.0,
                cooldown: 30,
                healthThreshold: 0.4,
                useChance: 0.8,
                color: '#ff4444'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 150, max: 300 },
            { type: 'equipment', chance: 1.0, rarity: { magic: 0.3, rare: 0.5, legendary: 0.2 } },
            { type: 'equipment', chance: 0.6, rarity: { rare: 0.6, legendary: 0.4 } }
        ],
        guaranteedDrops: [
            { type: 'healthPotion', amount: 5 }
        ]
    },

    // ========== CATACOMBS BOSSES (Floors 5-8) ==========
    blood_raven: {
        name: 'Blood Raven',
        title: 'The Corrupted Archer',
        health: 700,
        damage: { min: 20, max: 35 },
        armor: 4,
        moveSpeed: 3.0,
        attackSpeed: 1.2,
        attackRange: 8,
        detectionRange: 15,
        color: '#660066',
        glowColor: '#cc00cc',
        scale: 1.5,
        expReward: 700,
        enrageTime: 300,
        maxSummons: 8,
        phaseThresholds: [1.0, 0.65, 0.30],
        phases: [
            { behavior: 'defensive', damageMultiplier: 1.0 },
            { behavior: 'summoner', damageMultiplier: 1.2 },
            { behavior: 'aggressive', damageMultiplier: 1.5, speedMultiplier: 1.4 }
        ],
        abilities: [
            {
                id: 'arrow_volley',
                name: 'Arrow Volley',
                type: 'projectile',
                damage: 25,
                count: 5,
                spread: 0.8,
                projectileSpeed: 10,
                range: 12,
                castTime: 0.8,
                cooldown: 8,
                useChance: 0.5,
                color: '#cc00cc'
            },
            {
                id: 'raise_dead',
                name: 'Raise Dead',
                type: 'summon',
                summonType: 'zombie',
                count: 4,
                castTime: 1.5,
                cooldown: 25,
                useChance: 0.5,
                color: '#4a6b4a'
            },
            {
                id: 'shadow_step',
                name: 'Shadow Step',
                type: 'buff',
                buffType: 'speed',
                multiplier: 2.0,
                duration: 3,
                castTime: 0,
                cooldown: 15,
                healthThreshold: 0.5,
                useChance: 0.6,
                color: '#330033'
            },
            {
                id: 'death_cloud',
                name: 'Death Cloud',
                type: 'ground',
                damage: 15,
                count: 4,
                radius: 2,
                duration: 6,
                tickRate: 0.5,
                delay: 0.3,
                castTime: 1.0,
                cooldown: 18,
                minPhase: 2,
                useChance: 0.4,
                color: '#330066',
                groundType: 'poison'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 200, max: 400 },
            { type: 'equipment', chance: 1.0, rarity: { magic: 0.3, rare: 0.5, legendary: 0.2 } },
            { type: 'equipment', chance: 0.7, rarity: { rare: 0.5, legendary: 0.5 } }
        ]
    },

    arch_lich: {
        name: 'Malachar',
        title: 'The Arch Lich',
        health: 600,
        damage: { min: 30, max: 50 },
        armor: 2,
        moveSpeed: 1.5,
        attackSpeed: 1.0,
        attackRange: 10,
        detectionRange: 14,
        color: '#4400aa',
        glowColor: '#8800ff',
        scale: 1.7,
        expReward: 850,
        enrageTime: 360,
        maxSummons: 10,
        elementalResist: 30,
        phaseThresholds: [1.0, 0.6, 0.25],
        phases: [
            { behavior: 'defensive', damageMultiplier: 1.0 },
            { behavior: 'summoner', damageMultiplier: 1.3 },
            { behavior: 'defensive', damageMultiplier: 1.6, healOnTransition: 0.15 }
        ],
        abilities: [
            {
                id: 'death_bolt',
                name: 'Death Bolt',
                type: 'projectile',
                damage: 45,
                projectileSpeed: 8,
                range: 12,
                castTime: 0.5,
                cooldown: 3,
                useChance: 0.6,
                color: '#8800ff'
            },
            {
                id: 'soul_drain',
                name: 'Soul Drain',
                type: 'damage',
                damage: 35,
                castTime: 1.5,
                cooldown: 12,
                maxRange: 6,
                useChance: 0.4,
                color: '#00ff88'
            },
            {
                id: 'raise_undead',
                name: 'Army of the Dead',
                type: 'summon',
                summonType: 'skeleton',
                count: 5,
                castTime: 2.0,
                cooldown: 30,
                useChance: 0.5,
                minPhase: 2,
                color: '#d4c4a0'
            },
            {
                id: 'frost_nova',
                name: 'Frost Nova',
                type: 'nova',
                damage: 40,
                radius: 5,
                castTime: 0.8,
                cooldown: 15,
                minPhase: 2,
                useChance: 0.4,
                color: '#88ccff'
            },
            {
                id: 'dark_ritual',
                name: 'Dark Ritual',
                type: 'buff',
                buffType: 'heal',
                healPercent: 0.2,
                castTime: 2.5,
                cooldown: 45,
                healthThreshold: 0.3,
                useChance: 0.9,
                color: '#00ff00'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 250, max: 500 },
            { type: 'equipment', chance: 1.0, rarity: { rare: 0.6, legendary: 0.4 } },
            { type: 'equipment', chance: 0.8, rarity: { rare: 0.4, legendary: 0.6 } }
        ]
    },

    // ========== CAVES BOSSES (Floors 9-12) ==========
    andariel: {
        name: 'Andariel',
        title: 'Maiden of Anguish',
        health: 1200,
        damage: { min: 35, max: 55 },
        armor: 10,
        moveSpeed: 2.8,
        attackSpeed: 1.1,
        attackRange: 2,
        detectionRange: 12,
        color: '#006600',
        glowColor: '#00ff00',
        scale: 2.0,
        expReward: 1000,
        enrageTime: 300,
        maxSummons: 4,
        phaseThresholds: [1.0, 0.7, 0.4, 0.15],
        phases: [
            { behavior: 'aggressive', damageMultiplier: 1.0 },
            { behavior: 'aggressive', damageMultiplier: 1.2, speedMultiplier: 1.1 },
            { behavior: 'summoner', damageMultiplier: 1.4 },
            { behavior: 'berserk', damageMultiplier: 2.0, speedMultiplier: 1.5, attackSpeedMultiplier: 1.5 }
        ],
        abilities: [
            {
                id: 'poison_spray',
                name: 'Poison Spray',
                type: 'projectile',
                damage: 30,
                count: 7,
                spread: 1.2,
                projectileSpeed: 7,
                range: 10,
                castTime: 0.6,
                cooldown: 8,
                useChance: 0.5,
                color: '#00ff00'
            },
            {
                id: 'toxic_cloud',
                name: 'Toxic Cloud',
                type: 'ground',
                damage: 20,
                count: 5,
                radius: 2.5,
                duration: 8,
                tickRate: 0.5,
                delay: 0.2,
                castTime: 1.0,
                cooldown: 15,
                useChance: 0.4,
                color: '#00aa00',
                groundType: 'poison'
            },
            {
                id: 'venom_claw',
                name: 'Venom Claw',
                type: 'damage',
                damage: 65,
                castTime: 0.4,
                cooldown: 5,
                maxRange: 2.5,
                useChance: 0.5,
                color: '#88ff88'
            },
            {
                id: 'summon_spiders',
                name: 'Summon Spiders',
                type: 'summon',
                summonType: 'spider',
                count: 4,
                castTime: 1.0,
                cooldown: 25,
                minPhase: 3,
                useChance: 0.5,
                color: '#4a3728'
            },
            {
                id: 'poison_nova',
                name: 'Poison Nova',
                type: 'nova',
                damage: 50,
                radius: 6,
                castTime: 1.2,
                cooldown: 20,
                minPhase: 2,
                useChance: 0.4,
                color: '#00ff44'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 400, max: 700 },
            { type: 'equipment', chance: 1.0, rarity: { rare: 0.5, legendary: 0.5 } },
            { type: 'equipment', chance: 0.9, rarity: { rare: 0.3, legendary: 0.7 } }
        ]
    },

    // ========== HELL BOSSES (Floors 13-16) ==========
    diablo: {
        name: 'Diablo',
        title: 'Lord of Terror',
        health: 2000,
        damage: { min: 50, max: 80 },
        armor: 15,
        moveSpeed: 2.5,
        attackSpeed: 1.0,
        attackRange: 2.5,
        detectionRange: 15,
        color: '#cc0000',
        glowColor: '#ff4400',
        scale: 2.5,
        expReward: 2000,
        enrageTime: 360,
        maxSummons: 6,
        elementalResist: 50,
        phaseThresholds: [1.0, 0.75, 0.5, 0.25],
        phases: [
            { behavior: 'aggressive', damageMultiplier: 1.0 },
            { behavior: 'aggressive', damageMultiplier: 1.2, speedMultiplier: 1.1 },
            { behavior: 'defensive', damageMultiplier: 1.4, healOnTransition: 0.1 },
            { behavior: 'berserk', damageMultiplier: 2.0, speedMultiplier: 1.4, attackSpeedMultiplier: 1.3 }
        ],
        abilities: [
            {
                id: 'fire_breath',
                name: 'Fire Breath',
                type: 'projectile',
                damage: 60,
                count: 9,
                spread: 1.0,
                projectileSpeed: 12,
                range: 10,
                castTime: 1.0,
                cooldown: 10,
                useChance: 0.5,
                color: '#ff4400'
            },
            {
                id: 'lightning_hose',
                name: 'Lightning Hose',
                type: 'projectile',
                damage: 35,
                count: 12,
                spread: 0.3,
                projectileSpeed: 15,
                range: 15,
                piercing: true,
                castTime: 0.5,
                cooldown: 8,
                useChance: 0.4,
                color: '#ffff00'
            },
            {
                id: 'fire_ring',
                name: 'Ring of Fire',
                type: 'aoe',
                damage: 70,
                radius: 4,
                targetSelf: true,
                castTime: 1.5,
                cooldown: 15,
                useChance: 0.4,
                color: '#ff2200'
            },
            {
                id: 'firestorm',
                name: 'Firestorm',
                type: 'ground',
                damage: 40,
                count: 8,
                radius: 2,
                duration: 6,
                tickRate: 0.5,
                delay: 0.15,
                castTime: 1.5,
                cooldown: 20,
                minPhase: 2,
                useChance: 0.5,
                color: '#ff6600',
                groundType: 'fire'
            },
            {
                id: 'bone_prison',
                name: 'Bone Prison',
                type: 'ground',
                damage: 10,
                count: 6,
                radius: 1,
                duration: 4,
                tickRate: 1.0,
                delay: 0,
                castTime: 0.8,
                cooldown: 25,
                minPhase: 2,
                useChance: 0.3,
                color: '#d4c4a0',
                groundType: 'bone'
            },
            {
                id: 'summon_demons',
                name: 'Summon Demons',
                type: 'summon',
                summonType: 'demon',
                count: 3,
                castTime: 2.0,
                cooldown: 35,
                minPhase: 3,
                useChance: 0.6,
                color: '#cc3333'
            },
            {
                id: 'apocalypse',
                name: 'Apocalypse',
                type: 'nova',
                damage: 100,
                radius: 8,
                castTime: 2.5,
                cooldown: 45,
                minPhase: 4,
                useChance: 0.7,
                color: '#ff0000'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 800, max: 1500 },
            { type: 'equipment', chance: 1.0, rarity: { legendary: 1.0 } },
            { type: 'equipment', chance: 1.0, rarity: { rare: 0.3, legendary: 0.7 } },
            { type: 'equipment', chance: 0.8, rarity: { legendary: 1.0 } }
        ],
        guaranteedDrops: [
            { type: 'healthPotion', amount: 10 },
            { type: 'manaPotion', amount: 10 }
        ]
    },

    baal: {
        name: 'Baal',
        title: 'Lord of Destruction',
        health: 2500,
        damage: { min: 60, max: 90 },
        armor: 12,
        moveSpeed: 2.2,
        attackSpeed: 0.9,
        attackRange: 3,
        detectionRange: 16,
        color: '#0066cc',
        glowColor: '#00aaff',
        scale: 2.5,
        expReward: 2500,
        enrageTime: 420,
        maxSummons: 8,
        elementalResist: 40,
        phaseThresholds: [1.0, 0.8, 0.6, 0.4, 0.2],
        phases: [
            { behavior: 'defensive', damageMultiplier: 1.0 },
            { behavior: 'aggressive', damageMultiplier: 1.15 },
            { behavior: 'summoner', damageMultiplier: 1.3 },
            { behavior: 'aggressive', damageMultiplier: 1.5, speedMultiplier: 1.2 },
            { behavior: 'berserk', damageMultiplier: 2.0, speedMultiplier: 1.5, attackSpeedMultiplier: 1.4, healOnTransition: 0.1 }
        ],
        abilities: [
            {
                id: 'festering_appendages',
                name: 'Festering Appendages',
                type: 'projectile',
                damage: 50,
                count: 6,
                spread: 1.5,
                projectileSpeed: 8,
                range: 12,
                castTime: 0.8,
                cooldown: 7,
                useChance: 0.5,
                color: '#00aaff'
            },
            {
                id: 'mana_rift',
                name: 'Mana Rift',
                type: 'aoe',
                damage: 45,
                radius: 5,
                targetSelf: false,
                duration: 5,
                tickRate: 0.5,
                castTime: 1.0,
                cooldown: 15,
                useChance: 0.4,
                color: '#0088cc'
            },
            {
                id: 'cold_snap',
                name: 'Cold Snap',
                type: 'nova',
                damage: 55,
                radius: 6,
                castTime: 0.6,
                cooldown: 12,
                useChance: 0.4,
                color: '#aaddff'
            },
            {
                id: 'incineration',
                name: 'Incineration',
                type: 'ground',
                damage: 35,
                count: 10,
                radius: 2,
                duration: 8,
                tickRate: 0.4,
                delay: 0.1,
                castTime: 1.5,
                cooldown: 20,
                minPhase: 2,
                useChance: 0.5,
                color: '#ff8800',
                groundType: 'fire'
            },
            {
                id: 'summon_minions',
                name: 'Summon Minions',
                type: 'summon',
                summonType: 'imp',
                count: 5,
                castTime: 1.5,
                cooldown: 25,
                minPhase: 3,
                useChance: 0.6,
                color: '#dd4422'
            },
            {
                id: 'decrepify',
                name: 'Decrepify',
                type: 'damage',
                damage: 40,
                castTime: 1.0,
                cooldown: 20,
                maxRange: 10,
                useChance: 0.3,
                color: '#666666'
            },
            {
                id: 'destruction_wave',
                name: 'Destruction Wave',
                type: 'nova',
                damage: 120,
                radius: 10,
                castTime: 3.0,
                cooldown: 60,
                minPhase: 5,
                useChance: 0.8,
                color: '#ff00ff'
            }
        ],
        lootTable: [
            { type: 'gold', chance: 1.0, min: 1000, max: 2000 },
            { type: 'equipment', chance: 1.0, rarity: { legendary: 1.0 } },
            { type: 'equipment', chance: 1.0, rarity: { legendary: 1.0 } },
            { type: 'equipment', chance: 0.9, rarity: { legendary: 1.0 } }
        ],
        guaranteedDrops: [
            { type: 'healthPotion', amount: 15 },
            { type: 'manaPotion', amount: 15 }
        ]
    }
};

// Boss spawn configuration per floor
const BOSS_SPAWN_CONFIG = {
    cathedral: {
        normalBoss: 'skeleton_king',
        finalBoss: 'butcher',
        spawnFloors: [4] // Boss spawns on floor 4
    },
    catacombs: {
        normalBoss: 'blood_raven',
        finalBoss: 'arch_lich',
        spawnFloors: [8] // Boss spawns on floor 8
    },
    caves: {
        normalBoss: 'andariel',
        finalBoss: 'andariel',
        spawnFloors: [12] // Boss spawns on floor 12
    },
    hell: {
        normalBoss: 'diablo',
        finalBoss: 'baal',
        spawnFloors: [16] // Final boss on floor 16
    }
};
