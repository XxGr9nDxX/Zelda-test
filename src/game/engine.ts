import { sound } from '../audio/soundManager';
import { ARTIFACT_UPGRADES, INITIAL_PLAYER_STATS, ZONES } from './constants';
import { ParticleSystem } from './particles';
import { GameRenderer } from './renderer';
import {
  ArtifactUpgrade,
  Camera,
  Enemy,
  EnvironmentProp,
  GameZone,
  LootDrop,
  PlayerState,
  Projectile,
} from '../types/game';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public renderer: GameRenderer;
  public particles: ParticleSystem;

  public player: PlayerState;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public props: EnvironmentProp[] = [];
  public drops: LootDrop[] = [];
  public camera: Camera;
  public zone: GameZone;

  public upgrades: ArtifactUpgrade[];
  public gameTime: number = 0;
  public score: number = 0;
  public wave: number = 1;
  public mode: 'story' | 'endless' = 'story';
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  // Boss state
  public activeBoss: Enemy | null = null;

  // Input states
  public inputVector: { x: number; y: number } = { x: 0, y: 0 };
  public keyboardKeys: Set<string> = new Set();
  public nearbyInteractable: string | null = null;

  // Callbacks to React UI
  public onStateChange?: () => void;
  public onOpenShop?: () => void;

  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.renderer = new GameRenderer(canvas, this.ctx);
    this.particles = new ParticleSystem();

    this.upgrades = JSON.parse(JSON.stringify(ARTIFACT_UPGRADES));
    this.zone = JSON.parse(JSON.stringify(ZONES[1]));

    this.player = this.createInitialPlayer();
    this.camera = {
      x: this.player.x,
      y: this.player.y,
      targetX: this.player.x,
      targetY: this.player.y,
      zoom: 1.0,
      shakeTime: 0,
      shakeIntensity: 0,
    };

    this.loadZone(1);
    this.setupWindowListeners();
  }

  private createInitialPlayer(): PlayerState {
    return {
      x: 400,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      facingAngle: 0,
      stats: { ...INITIAL_PLAYER_STATS },
      gems: 25,
      herbs: 3,
      runesCollected: 0,
      requiredRunes: 3,
      isAttacking: false,
      attackTimer: 0,
      attackCombo: 1,
      attackAngle: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldownTimer: 0,
      dashAngle: 0,
      isHurt: false,
      invulnerableTimer: 0,
      squashX: 1,
      squashY: 1,
      footstepTimer: 0,
      walkFrame: 0,
    };
  }

  // --- Zone Generator ---
  public loadZone(zoneId: number) {
    const template = ZONES[zoneId] || ZONES[1];
    this.zone = JSON.parse(JSON.stringify(template));
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.props = [];
    this.activeBoss = null;

    // Center player at entrance
    this.player.x = 350;
    this.player.y = 350;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;

    const w = this.zone.width;
    const h = this.zone.height;

    // Populate ambient fireflies
    this.particles.emitFireflies(25, w, h);

    if (this.zone.biome === 'canopy') {
      // Zone 1: Whispering Canopy (3 Sunstone Shrines to activate)
      this.generateForestProps(w, h);

      // Add 3 Sunstone Shrines
      const shrinePositions = [
        { x: 1600, y: 400 },
        { x: 800, y: 1400 },
        { x: 1800, y: 1500 },
      ];

      shrinePositions.forEach((pos, idx) => {
        this.props.push({
          id: `shrine_${idx + 1}`,
          type: 'sunstone_crystal',
          x: pos.x,
          y: pos.y,
          radius: 24,
          ySortOffset: 8,
          isSolid: true,
          isActivated: false,
          interactionPrompt: 'Touch Sunstone',
          runeIndex: idx + 1,
        });
      });

      // Exit Gate Portal (opens when all 3 shrines active)
      this.props.push({
        id: 'portal_zone2',
        type: 'portal_gate',
        x: w - 180,
        y: h / 2,
        radius: 36,
        ySortOffset: 12,
        isSolid: false,
        isActivated: false,
        interactionPrompt: 'Enter Sunken Ruins',
      });

      // Spawn initial slimes and shrooms
      this.spawnEnemiesInArea('slime', 8, w, h);
      this.spawnEnemiesInArea('shroom', 4, w, h);
    } else if (this.zone.biome === 'ruins') {
      // Zone 2: Sunken Ruins
      this.generateRuinsProps(w, h);

      // Exit Gate Portal to Elder Sanctum
      this.props.push({
        id: 'portal_zone3',
        type: 'portal_gate',
        x: w / 2,
        y: 180,
        radius: 36,
        ySortOffset: 12,
        isSolid: false,
        isActivated: false,
        interactionPrompt: 'Enter Heart of Elder Tree',
      });

      // Spawn Stalkers & Shrooms
      this.spawnEnemiesInArea('stalker', 9, w, h);
      this.spawnEnemiesInArea('slime', 6, w, h);
      this.spawnEnemiesInArea('shroom', 5, w, h);
    } else if (this.zone.biome === 'elder_tree') {
      // Zone 3: Boss Arena (Corrupted Elder Treant)
      this.generateBossArena(w, h);
      this.spawnBoss(w / 2, h / 2);
    } else if (this.zone.biome === 'endless_grove') {
      // Endless Arena
      this.generateForestProps(w, h);
      this.spawnWave(this.wave);
    }

    this.onStateChange?.();
  }

  private generateForestProps(w: number, h: number) {
    // Trees along borders
    for (let x = 60; x < w - 60; x += 120) {
      this.props.push(this.createTree(x, 60));
      this.props.push(this.createTree(x, h - 60));
    }
    for (let y = 60; y < h - 60; y += 120) {
      this.props.push(this.createTree(60, y));
      this.props.push(this.createTree(w - 60, y));
    }

    // Clustered Trees & Rocks inside map
    for (let i = 0; i < 35; i++) {
      const rx = 180 + Math.random() * (w - 360);
      const ry = 180 + Math.random() * (h - 360);
      if (Math.hypot(rx - 400, ry - 400) > 160) {
        this.props.push(this.createTree(rx, ry));
      }
    }

    for (let i = 0; i < 22; i++) {
      const rx = 180 + Math.random() * (w - 360);
      const ry = 180 + Math.random() * (h - 360);
      this.props.push({
        id: `rock_${i}`,
        type: 'rock_moss',
        x: rx,
        y: ry,
        radius: 18 + Math.random() * 8,
        ySortOffset: 6,
        isSolid: true,
      });
    }

    // Cuttable Tall Grass patches
    for (let i = 0; i < 65; i++) {
      this.props.push({
        id: `grass_${i}`,
        type: 'tall_grass',
        x: 120 + Math.random() * (w - 240),
        y: 120 + Math.random() * (h - 240),
        radius: 12,
        ySortOffset: 0,
        isSolid: false,
        isCut: false,
        swayOffset: Math.random() * 10,
      });
    }

    // Golden Chests
    this.props.push({
      id: 'chest_1',
      type: 'chest',
      x: 1100,
      y: 650,
      radius: 18,
      ySortOffset: 6,
      isSolid: true,
      isOpen: false,
    });
    this.props.push({
      id: 'chest_2',
      type: 'chest',
      x: 1750,
      y: 1150,
      radius: 18,
      ySortOffset: 6,
      isSolid: true,
      isOpen: false,
    });
  }

  private generateRuinsProps(w: number, h: number) {
    // Ancient Pillars & Fallen Stone
    for (let i = 0; i < 24; i++) {
      this.props.push({
        id: `pillar_${i}`,
        type: 'ruin_pillar',
        x: 160 + Math.random() * (w - 320),
        y: 160 + Math.random() * (h - 320),
        radius: 20,
        ySortOffset: 8,
        isSolid: true,
      });
    }

    // Shrine for resting and upgrades
    this.props.push({
      id: 'ruin_shrine',
      type: 'shrine',
      x: w / 2,
      y: h / 2,
      radius: 26,
      ySortOffset: 8,
      isSolid: true,
      isActivated: false,
      interactionPrompt: 'Pray at Ancient Shrine',
    });

    // Chests
    this.props.push({
      id: 'ruin_chest',
      type: 'chest',
      x: 350,
      y: h - 350,
      radius: 18,
      ySortOffset: 6,
      isSolid: true,
      isOpen: false,
    });

    // Tall grass patches
    for (let i = 0; i < 40; i++) {
      this.props.push({
        id: `ruin_grass_${i}`,
        type: 'tall_grass',
        x: 120 + Math.random() * (w - 240),
        y: 120 + Math.random() * (h - 240),
        radius: 12,
        ySortOffset: 0,
        isSolid: false,
        isCut: false,
        swayOffset: Math.random() * 10,
      });
    }
  }

  private generateBossArena(w: number, h: number) {
    // Encircling giant ancient roots & trees
    const cx = w / 2;
    const cy = h / 2;
    const arenaRadius = 700;

    for (let a = 0; a < Math.PI * 2; a += 0.22) {
      const rx = cx + Math.cos(a) * arenaRadius;
      const ry = cy + Math.sin(a) * arenaRadius;
      this.props.push(this.createTree(rx, ry));
    }

    // Healing flowers around the arena edge
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 350 + Math.random() * 250;
      this.props.push({
        id: `boss_grass_${i}`,
        type: 'tall_grass',
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        radius: 12,
        ySortOffset: 0,
        isSolid: false,
        isCut: false,
        swayOffset: Math.random() * 10,
      });
    }
  }

  private createTree(x: number, y: number): EnvironmentProp {
    return {
      id: `tree_${Math.random().toString(36).substring(2, 7)}`,
      type: Math.random() > 0.5 ? 'tree_oak' : 'tree_pine',
      x,
      y,
      radius: 28 + Math.random() * 10,
      ySortOffset: 12,
      isSolid: true,
      swayOffset: Math.random() * 10,
    };
  }

  private spawnEnemiesInArea(type: 'slime' | 'stalker' | 'shroom', count: number, w: number, h: number) {
    for (let i = 0; i < count; i++) {
      const ex = 250 + Math.random() * (w - 500);
      const ey = 250 + Math.random() * (h - 500);

      // Don't spawn on top of player spawn
      if (Math.hypot(ex - this.player.x, ey - this.player.y) < 250) {
        continue;
      }

      this.enemies.push(this.createEnemy(type, ex, ey));
    }
  }

  private createEnemy(type: 'slime' | 'stalker' | 'shroom', x: number, y: number): Enemy {
    if (type === 'slime') {
      return {
        id: Math.random().toString(),
        type: 'slime',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 16,
        hp: 35,
        maxHp: 35,
        speed: 85,
        damage: 1, // 1 half-heart
        expValue: 15,
        gemValue: 3,
        state: 'idle',
        stateTimer: Math.random() * 2,
        facingAngle: 0,
        hitFlashTimer: 0,
        squashX: 1,
        squashY: 1,
      };
    } else if (type === 'stalker') {
      return {
        id: Math.random().toString(),
        type: 'stalker',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 18,
        hp: 65,
        maxHp: 65,
        speed: 135,
        damage: 2, // 1 full heart
        expValue: 30,
        gemValue: 6,
        state: 'patrol',
        stateTimer: 2,
        facingAngle: 0,
        hitFlashTimer: 0,
        squashX: 1,
        squashY: 1,
      };
    } else {
      // shroom
      return {
        id: Math.random().toString(),
        type: 'shroom',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 17,
        hp: 45,
        maxHp: 45,
        speed: 55,
        damage: 1,
        expValue: 20,
        gemValue: 4,
        state: 'idle',
        stateTimer: 1.5,
        facingAngle: 0,
        hitFlashTimer: 0,
        squashX: 1,
        squashY: 1,
        projectileCooldown: 2.2,
      };
    }
  }

  private spawnBoss(x: number, y: number) {
    const boss: Enemy = {
      id: 'elder_guardian_boss',
      type: 'boss_guardian',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 46,
      hp: 420,
      maxHp: 420,
      speed: 75,
      damage: 2,
      expValue: 250,
      gemValue: 50,
      state: 'chase',
      stateTimer: 3,
      facingAngle: 0,
      hitFlashTimer: 0,
      squashX: 1,
      squashY: 1,
      bossPhase: 1,
      bossSlamCooldown: 4.5,
      isEnraged: false,
    };
    this.enemies.push(boss);
    this.activeBoss = boss;
    this.triggerScreenShake(0.5, 8);
  }

  public spawnWave(waveNum: number) {
    const w = this.zone.width;
    const h = this.zone.height;
    const count = 5 + waveNum * 3;

    for (let i = 0; i < count; i++) {
      const type = Math.random() > 0.5 ? 'slime' : Math.random() > 0.5 ? 'stalker' : 'shroom';
      this.spawnEnemiesInArea(type, 1, w, h);
    }

    if (waveNum % 3 === 0) {
      this.spawnBoss(w / 2, h / 2);
    }

    this.particles.emitFloatingText(
      this.player.x,
      this.player.y - 40,
      `WAVE ${waveNum} COMMENCED!`,
      '#f59e0b'
    );
  }

  // --- Keyboard Setup ---
  private setupWindowListeners() {
    window.addEventListener('keydown', (e) => {
      this.keyboardKeys.add(e.code);

      if (e.code === 'Space' || e.code === 'KeyJ') {
        this.triggerAttack();
      } else if (e.code === 'ShiftLeft' || e.code === 'KeyK') {
        this.triggerDash();
      } else if (e.code === 'KeyE' || e.code === 'KeyL') {
        this.triggerMagic();
      } else if (e.code === 'KeyQ' || e.code === 'KeyH') {
        this.triggerHeal();
      } else if (e.code === 'KeyF' || e.code === 'Enter') {
        this.triggerInteract();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyboardKeys.delete(e.code);
    });
  }

  // --- Game Loop ---
  public start() {
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;

      if (!this.isPaused && !this.isGameOver) {
        this.update(dt);
      }

      this.renderer.render(
        this.player,
        this.enemies,
        this.projectiles,
        this.props,
        this.drops,
        this.particles.particles,
        this.camera,
        this.zone,
        this.gameTime
      );

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // --- Main Update ---
  private update(dt: number) {
    this.gameTime += dt;

    // 1. Process Player Input & Movement
    this.updatePlayerInput(dt);

    // 2. Update Camera Tracking with Lerp
    this.updateCamera(dt);

    // 3. Update Particles
    this.particles.update(dt);

    // 4. Update Enemies
    this.updateEnemies(dt);

    // 5. Update Projectiles
    this.updateProjectiles(dt);

    // 6. Update Loot Drops & Pickup Range
    this.updateDrops(dt);

    // 7. Check Interaction Proximity
    this.checkNearbyInteractables();

    // 8. Natural Stat Regen (Stamina & Mana)
    if (this.player.stats.stamina < this.player.stats.maxStamina) {
      this.player.stats.stamina = Math.min(
        this.player.stats.maxStamina,
        this.player.stats.stamina + 28 * dt
      );
    }
    if (this.player.stats.mana < this.player.stats.maxMana) {
      this.player.stats.mana = Math.min(
        this.player.stats.maxMana,
        this.player.stats.mana + 14 * dt
      );
    }

    // Squash & Stretch ease back to 1
    this.player.squashX += (1 - this.player.squashX) * 10 * dt;
    this.player.squashY += (1 - this.player.squashY) * 10 * dt;

    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }
    if (this.player.dashCooldownTimer > 0) {
      this.player.dashCooldownTimer -= dt;
    }

    // Camera shake decay
    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
      this.camera.shakeIntensity *= 0.9;
    }
  }

  // --- Player Input Resolution ---
  private updatePlayerInput(dt: number) {
    let moveX = this.inputVector.x;
    let moveY = this.inputVector.y;

    // Keyboard fallback
    if (this.keyboardKeys.has('KeyA') || this.keyboardKeys.has('ArrowLeft')) moveX -= 1;
    if (this.keyboardKeys.has('KeyD') || this.keyboardKeys.has('ArrowRight')) moveX += 1;
    if (this.keyboardKeys.has('KeyW') || this.keyboardKeys.has('ArrowUp')) moveY -= 1;
    if (this.keyboardKeys.has('KeyS') || this.keyboardKeys.has('ArrowDown')) moveY += 1;

    const len = Math.hypot(moveX, moveY);
    if (len > 0.05) {
      const normX = moveX / Math.max(1, len);
      const normY = moveY / Math.max(1, len);
      this.player.facingAngle = Math.atan2(normY, normX);

      if (!this.player.isDashing) {
        this.player.vx = normX * this.player.stats.speed;
        this.player.vy = normY * this.player.stats.speed;

        this.player.footstepTimer += dt;
        this.player.walkFrame += dt * 10;
        if (this.player.footstepTimer > 0.24) {
          this.player.footstepTimer = 0;
          this.particles.emitDust(this.player.x, this.player.y + 12, 2);
        }
      }
    } else {
      if (!this.player.isDashing) {
        this.player.vx *= 0.7;
        this.player.vy *= 0.7;
      }
    }

    // Dash Execution
    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      this.player.vx = Math.cos(this.player.dashAngle) * this.player.stats.dashSpeed;
      this.player.vy = Math.sin(this.player.dashAngle) * this.player.stats.dashSpeed;

      // Emit dash ghost
      this.particles.emitDashGhost(this.player.x, this.player.y, this.player.facingAngle);

      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
        this.player.squashX = 1;
        this.player.squashY = 1;
      }
    }

    // Attack cooldown/timer
    if (this.player.isAttacking) {
      this.player.attackTimer -= dt;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // Move player with collision checks
    const nextX = this.player.x + this.player.vx * dt;
    const nextY = this.player.y + this.player.vy * dt;

    if (!this.isPositionSolid(nextX, this.player.y, this.player.radius)) {
      this.player.x = nextX;
    }
    if (!this.isPositionSolid(this.player.x, nextY, this.player.radius)) {
      this.player.y = nextY;
    }

    // Keep within world bounds
    this.player.x = Math.max(30, Math.min(this.zone.width - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(this.zone.height - 30, this.player.y));
  }

  private isPositionSolid(x: number, y: number, radius: number): boolean {
    // Map edges
    if (x - radius < 10 || x + radius > this.zone.width - 10) return true;
    if (y - radius < 10 || y + radius > this.zone.height - 10) return true;

    // Check solid props
    for (const prop of this.props) {
      if (!prop.isSolid) continue;
      const dist = Math.hypot(x - prop.x, y - (prop.y + prop.ySortOffset));
      if (dist < radius + prop.radius * 0.7) {
        return true;
      }
    }
    return false;
  }

  // --- Camera Lerping ---
  private updateCamera(dt: number) {
    // Lead ahead in facing direction slightly
    const leadDist = 45;
    const targetX = this.player.x + Math.cos(this.player.facingAngle) * leadDist;
    const targetY = this.player.y + Math.sin(this.player.facingAngle) * leadDist;

    // Smooth linear interpolation (lerp)
    const lerpSpeed = 6 * dt;
    this.camera.x += (targetX - this.camera.x) * lerpSpeed;
    this.camera.y += (targetY - this.camera.y) * lerpSpeed;

    // Constrain camera view to map boundaries
    const halfW = this.canvas.width / 2;
    const halfH = this.canvas.height / 2;
    this.camera.x = Math.max(halfW, Math.min(this.zone.width - halfW, this.camera.x));
    this.camera.y = Math.max(halfH, Math.min(this.zone.height - halfH, this.camera.y));
  }

  // --- Combat Action Triggers ---
  public triggerAttack() {
    if (this.player.isAttacking || this.player.isDashing || this.isGameOver) return;

    sound.playSlash();
    this.player.isAttacking = true;
    this.player.attackTimer = 0.18; // duration
    this.player.attackAngle = this.player.facingAngle;

    // Juice: squash & stretch on slash
    this.player.squashX = 1.25;
    this.player.squashY = 0.85;

    // Slight lunge forward
    this.player.x += Math.cos(this.player.facingAngle) * 12;
    this.player.y += Math.sin(this.player.facingAngle) * 12;

    // Hitbox detection (cone sector in front of player)
    const hitRadius = 55;
    const slashRange = hitRadius + this.player.radius;

    // 1. Hit Enemies
    let hitCount = 0;
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist < slashRange + enemy.radius) {
        const angleToEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        let angleDiff = Math.abs(angleToEnemy - this.player.facingAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

        if (angleDiff < Math.PI * 0.55) {
          // HIT!
          hitCount++;
          const isCrit = Math.random() < 0.22;
          const damage = Math.round(
            this.player.stats.attackDamage * (isCrit ? 1.75 : 1.0 + Math.random() * 0.2)
          );
          this.damageEnemy(enemy, damage, isCrit);

          // Knockback
          enemy.vx += Math.cos(this.player.facingAngle) * 220;
          enemy.vy += Math.sin(this.player.facingAngle) * 220;
        }
      }
    }

    if (hitCount > 0) {
      sound.playHit();
      this.triggerScreenShake(0.18, 5);
    }

    // 2. Cut Tall Grass & Drop Loot
    for (const prop of this.props) {
      if (prop.type === 'tall_grass' && !prop.isCut) {
        const dist = Math.hypot(prop.x - this.player.x, prop.y - this.player.y);
        if (dist < slashRange + 15) {
          prop.isCut = true;
          sound.playGrassCut();
          this.particles.emitLeaves(prop.x, prop.y, 8);

          // Random loot drop: 35% gem, 15% heart, 10% herb
          const roll = Math.random();
          if (roll < 0.35) {
            this.spawnDrop('gem', prop.x, prop.y, 1);
          } else if (roll < 0.5 && this.player.stats.hp < this.player.stats.maxHp) {
            this.spawnDrop('heart', prop.x, prop.y, 1);
          } else if (roll < 0.6) {
            this.spawnDrop('herb', prop.x, prop.y, 1);
          }
        }
      }
    }
  }

  public triggerDash() {
    if (
      this.player.isDashing ||
      this.player.dashCooldownTimer > 0 ||
      this.player.stats.stamina < 20 ||
      this.isGameOver
    ) {
      return;
    }

    sound.playDash();
    this.player.stats.stamina -= 20;
    this.player.isDashing = true;
    this.player.dashTimer = this.player.stats.dashDuration;
    this.player.dashCooldownTimer = this.player.stats.dashCooldown;
    this.player.dashAngle = this.player.facingAngle;

    // Temporary invulnerability during roll
    this.player.invulnerableTimer = this.player.stats.dashDuration + 0.08;

    // Juice: Stretch along dash axis
    this.player.squashX = 1.4;
    this.player.squashY = 0.7;

    this.particles.emitDust(this.player.x, this.player.y, 6);
  }

  public triggerMagic() {
    if (this.player.stats.mana < 25 || this.isGameOver) {
      this.particles.emitFloatingText(this.player.x, this.player.y - 20, 'Not enough Mana!', '#94a3b8');
      return;
    }

    sound.playCastMagic();
    this.player.stats.mana -= 25;

    // Spawn 2 radiant Solar Burst projectiles in a forward spread
    [-0.15, 0.15].forEach((spreadAngle) => {
      const angle = this.player.facingAngle + spreadAngle;
      const speed = 420;
      this.projectiles.push({
        id: Math.random().toString(),
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 9,
        damage: this.player.stats.magicDamage,
        isPlayer: true,
        life: 0,
        maxLife: 1.2,
        color: '#fde047',
        trailColor: '#f59e0b',
        penetrating: true,
      });
    });

    this.particles.emitMagicStars(this.player.x, this.player.y, 8);
    this.triggerScreenShake(0.12, 3);
  }

  public triggerHeal() {
    if (this.player.herbs < 2) {
      this.particles.emitFloatingText(this.player.x, this.player.y - 20, 'Need 2 Herbs!', '#f87171');
      return;
    }
    if (this.player.stats.hp >= this.player.stats.maxHp) {
      this.particles.emitFloatingText(this.player.x, this.player.y - 20, 'Full Health!', '#34d399');
      return;
    }

    sound.playHeartPickup();
    this.player.herbs -= 2;
    this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 2); // 1 full heart

    this.particles.emitFloatingText(this.player.x, this.player.y - 25, '+1 HEART', '#22c55e');
    this.particles.emitLeaves(this.player.x, this.player.y, 10);
    this.onStateChange?.();
  }

  public triggerInteract() {
    // Find closest interactable prop within 70px
    let closestProp: EnvironmentProp | null = null;
    let minDist = 75;

    for (const prop of this.props) {
      const dist = Math.hypot(this.player.x - prop.x, this.player.y - prop.y);
      if (dist < minDist) {
        minDist = dist;
        closestProp = prop;
      }
    }

    if (!closestProp) return;

    if (closestProp.type === 'chest' && !closestProp.isOpen) {
      closestProp.isOpen = true;
      sound.playChestOpen();
      this.triggerScreenShake(0.2, 6);

      // Burst of loot
      for (let i = 0; i < 6; i++) {
        this.spawnDrop('gem', closestProp.x, closestProp.y, 5);
      }
      this.spawnDrop('heart', closestProp.x, closestProp.y, 1);
      this.spawnDrop('herb', closestProp.x, closestProp.y, 2);

      this.particles.emitShockwave(closestProp.x, closestProp.y, '#fde047', 15);
      this.particles.emitFloatingText(closestProp.x, closestProp.y - 25, 'TREASURE!', '#fbbf24');
    } else if (closestProp.type === 'sunstone_crystal' && !closestProp.isActivated) {
      closestProp.isActivated = true;
      sound.playChestOpen();
      this.player.runesCollected += 1;
      this.zone.quest.currentCount += 1;

      this.particles.emitShockwave(closestProp.x, closestProp.y, '#38bdf8', 25);
      this.particles.emitFloatingText(
        closestProp.x,
        closestProp.y - 30,
        `SUNSTONE AWAKENED (${this.player.runesCollected}/3)`,
        '#38bdf8'
      );

      if (this.player.runesCollected >= 3) {
        this.zone.quest.isCompleted = true;
        this.particles.emitFloatingText(
          this.player.x,
          this.player.y - 45,
          'RUINS GATE UNLOCKED!',
          '#4ade80'
        );
      }
    } else if (closestProp.type === 'portal_gate') {
      if (this.zone.id === 1) {
        if (this.player.runesCollected < 3) {
          this.particles.emitFloatingText(
            closestProp.x,
            closestProp.y - 30,
            'Gate sealed! Need 3 Sunstones.',
            '#f87171'
          );
        } else {
          this.loadZone(2);
        }
      } else if (this.zone.id === 2) {
        if (this.zone.quest.currentCount < this.zone.quest.targetCount) {
          this.particles.emitFloatingText(
            closestProp.x,
            closestProp.y - 30,
            `Purge remaining stalkers (${this.zone.quest.currentCount}/${this.zone.quest.targetCount})`,
            '#f87171'
          );
        } else {
          this.loadZone(3);
        }
      }
    } else if (closestProp.type === 'shrine') {
      // Open Sanctuary Campfire / Upgrade Shop
      sound.playHeartPickup();
      this.player.stats.hp = this.player.stats.maxHp;
      this.player.stats.mana = this.player.stats.maxMana;
      this.particles.emitFloatingText(this.player.x, this.player.y - 30, 'RESTORED & CAMPFIRE', '#38bdf8');
      this.onOpenShop?.();
    }
  }

  private checkNearbyInteractables() {
    let prompt: string | null = null;
    for (const prop of this.props) {
      const dist = Math.hypot(this.player.x - prop.x, this.player.y - prop.y);
      if (dist < 65) {
        if (prop.type === 'chest' && !prop.isOpen) {
          prompt = 'Open Treasure Chest';
        } else if (prop.type === 'sunstone_crystal' && !prop.isActivated) {
          prompt = 'Touch Sunstone';
        } else if (prop.type === 'portal_gate') {
          prompt = 'Enter Portal';
        } else if (prop.type === 'shrine') {
          prompt = 'Rest & Upgrade';
        }
      }
    }
    this.nearbyInteractable = prompt;
  }

  // --- Enemy AI & Damage ---
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;
      e.squashX += (1 - e.squashX) * 8 * dt;
      e.squashY += (1 - e.squashY) * 8 * dt;

      const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      const angleToPlayer = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      e.facingAngle = angleToPlayer;

      // Friction
      e.vx *= 0.9;
      e.vy *= 0.9;

      if (e.type === 'slime') {
        // Hops toward player
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.stateTimer = 1.4 + Math.random() * 0.8;
          if (distToPlayer < 350) {
            e.vx = Math.cos(angleToPlayer) * 190;
            e.vy = Math.sin(angleToPlayer) * 190;
            e.squashX = 0.7;
            e.squashY = 1.4;
          }
        }
      } else if (e.type === 'stalker') {
        // Aggressive hunter
        if (distToPlayer < 320) {
          e.vx += Math.cos(angleToPlayer) * e.speed * dt * 4;
          e.vy += Math.sin(angleToPlayer) * e.speed * dt * 4;
        }
      } else if (e.type === 'shroom') {
        // Ranged shooter
        if (distToPlayer < 400) {
          if (distToPlayer < 140) {
            // Back up
            e.vx -= Math.cos(angleToPlayer) * e.speed * dt * 3;
            e.vy -= Math.sin(angleToPlayer) * e.speed * dt * 3;
          }

          if (e.projectileCooldown !== undefined) {
            e.projectileCooldown -= dt;
            if (e.projectileCooldown <= 0) {
              e.projectileCooldown = 2.4 + Math.random() * 0.6;
              // Shoot spore
              this.projectiles.push({
                id: Math.random().toString(),
                x: e.x,
                y: e.y,
                vx: Math.cos(angleToPlayer) * 190,
                vy: Math.sin(angleToPlayer) * 190,
                radius: 7,
                damage: 1,
                isPlayer: false,
                life: 0,
                maxLife: 3.5,
                color: '#f43f5e',
                trailColor: '#fda4af',
              });
              this.particles.emitDust(e.x, e.y, 4);
            }
          }
        }
      } else if (e.type === 'boss_guardian') {
        // Boss Logic
        if (e.bossSlamCooldown !== undefined) {
          e.bossSlamCooldown -= dt;
          if (e.bossSlamCooldown <= 0) {
            e.bossSlamCooldown = e.isEnraged ? 3.0 : 4.8;
            // Begin slam telegraph
            e.telegraphTimer = 1.0;
            e.telegraphRadius = 140;
          }
        }

        if (e.telegraphTimer && e.telegraphTimer > 0) {
          e.telegraphTimer -= dt;
          e.vx = 0;
          e.vy = 0;
          if (e.telegraphTimer <= 0) {
            // Slam ground impact!
            sound.playBossSlam();
            this.triggerScreenShake(0.4, 10);
            this.particles.emitShockwave(e.x, e.y, '#ef4444', 30);

            // Damage player if inside radius
            if (distToPlayer < (e.telegraphRadius || 140)) {
              this.damagePlayer(e.isEnraged ? 3 : 2);
            }

            // Spawn 2 slime adds
            if (this.enemies.length < 8) {
              this.enemies.push(this.createEnemy('slime', e.x + 80, e.y));
              this.enemies.push(this.createEnemy('slime', e.x - 80, e.y));
            }
          }
        } else {
          // Pursue player slowly
          e.vx += Math.cos(angleToPlayer) * e.speed * dt * 3;
          e.vy += Math.sin(angleToPlayer) * e.speed * dt * 3;
        }

        // Phase 2 Enrage
        if (!e.isEnraged && e.hp < e.maxHp * 0.5) {
          e.isEnraged = true;
          e.speed = 105;
          sound.playBossSlam();
          this.triggerScreenShake(0.6, 12);
          this.particles.emitFloatingText(e.x, e.y - 50, 'GUARDIAN ENRAGED!', '#ef4444');
        }
      }

      // Move enemy
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Contact damage to player
      if (distToPlayer < e.radius + this.player.radius && !this.player.isDashing) {
        this.damagePlayer(e.damage);
        // Bounce player back
        this.player.vx += Math.cos(angleToPlayer) * 160;
        this.player.vy += Math.sin(angleToPlayer) * 160;
      }
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, isCrit: boolean = false) {
    enemy.hp -= damage;
    enemy.hitFlashTimer = 0.14;
    enemy.squashX = 0.7;
    enemy.squashY = 1.3;

    const textColor = isCrit ? '#facc15' : '#ffffff';
    const textPrefix = isCrit ? 'CRIT! ' : '';
    this.particles.emitFloatingText(
      enemy.x,
      enemy.y - enemy.radius - 5,
      `${textPrefix}${damage}`,
      textColor
    );
    this.particles.emitSparks(enemy.x, enemy.y, isCrit ? '#fde047' : '#ffffff', 8);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    sound.playEnemyDeath();
    this.score += enemy.expValue;

    // Drop emeralds and herbs
    const gemCount = Math.max(1, Math.round(enemy.gemValue / 2));
    for (let i = 0; i < gemCount; i++) {
      this.spawnDrop('gem', enemy.x + (Math.random() * 16 - 8), enemy.y + (Math.random() * 16 - 8), 2);
    }

    if (Math.random() < 0.3) {
      this.spawnDrop('heart', enemy.x, enemy.y, 1);
    }
    if (Math.random() < 0.25) {
      this.spawnDrop('herb', enemy.x, enemy.y, 1);
    }

    this.particles.emitSparks(enemy.x, enemy.y, '#38bdf8', 16);
    this.particles.emitShockwave(enemy.x, enemy.y, 'rgba(255, 255, 255, 0.6)', 10);

    // Track quest progress
    if (this.zone.biome === 'ruins' && enemy.type === 'stalker') {
      this.zone.quest.currentCount += 1;
      if (this.zone.quest.currentCount >= this.zone.quest.targetCount) {
        this.zone.quest.isCompleted = true;
        this.particles.emitFloatingText(this.player.x, this.player.y - 40, 'SANCTUM PORTAL OPENED!', '#38bdf8');
      }
    }

    // Boss victory
    if (enemy.type === 'boss_guardian') {
      this.isVictory = true;
      this.activeBoss = null;
      sound.playChestOpen();
      this.particles.emitShockwave(enemy.x, enemy.y, '#f59e0b', 80);
      this.triggerScreenShake(0.8, 14);
    }

    // Remove from array
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    // Check endless wave cleared
    if (this.mode === 'endless' && this.enemies.length === 0) {
      this.wave += 1;
      this.spawnWave(this.wave);
    }

    this.onStateChange?.();
  }

  // --- Projectile Physics ---
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check collision
      if (p.isPlayer) {
        for (const enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (dist < enemy.radius + p.radius) {
            this.damageEnemy(enemy, p.damage, true);
            sound.playHit();
            this.particles.emitSparks(p.x, p.y, p.color, 8);

            if (!p.penetrating) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else {
        // Enemy projectile hitting player
        const distToPlayer = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (distToPlayer < this.player.radius + p.radius && !this.player.isDashing) {
          this.damagePlayer(p.damage);
          this.particles.emitSparks(p.x, p.y, '#f43f5e', 8);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  // --- Player Damage ---
  private damagePlayer(amount: number) {
    if (this.player.invulnerableTimer > 0 || this.isGameOver) return;

    sound.playPlayerHurt();
    const effectiveDamage = Math.max(1, amount - Math.floor(this.player.stats.defense / 4));
    this.player.stats.hp -= effectiveDamage;
    this.player.invulnerableTimer = 0.85;

    this.triggerScreenShake(0.3, 8);
    this.particles.emitFloatingText(
      this.player.x,
      this.player.y - 25,
      `-${effectiveDamage}`,
      '#ef4444'
    );
    this.particles.emitSparks(this.player.x, this.player.y, '#ef4444', 10);

    if (this.player.stats.hp <= 0) {
      this.player.stats.hp = 0;
      this.isGameOver = true;
      sound.playEnemyDeath();
    }

    this.onStateChange?.();
  }

  // --- Drops & Loot ---
  public spawnDrop(type: 'gem' | 'heart' | 'herb' | 'rune_fragment', x: number, y: number, value: number = 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 50;

    this.drops.push({
      id: Math.random().toString(),
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      value,
      life: 0,
      bobTimer: Math.random() * 10,
    });
  }

  private updateDrops(dt: number) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life += dt;

      // Physics deceleration
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.vx *= 0.88;
      drop.vy *= 0.88;

      // Magnet pull toward player if within 110px
      const dist = Math.hypot(this.player.x - drop.x, this.player.y - drop.y);
      if (dist < 110) {
        const pullSpeed = (110 - dist) * 6;
        const angle = Math.atan2(this.player.y - drop.y, this.player.x - drop.x);
        drop.x += Math.cos(angle) * pullSpeed * dt;
        drop.y += Math.sin(angle) * pullSpeed * dt;
      }

      // Collect item
      if (dist < this.player.radius + 12) {
        if (drop.type === 'gem') {
          sound.playGemPickup();
          this.player.gems += drop.value;
          this.score += drop.value * 10;
          this.particles.emitFloatingText(drop.x, drop.y, `+${drop.value} Gems`, '#34d399');
        } else if (drop.type === 'heart') {
          sound.playHeartPickup();
          this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + drop.value);
          this.particles.emitFloatingText(drop.x, drop.y, `+${drop.value} HP`, '#f87171');
        } else if (drop.type === 'herb') {
          sound.playHeartPickup();
          this.player.herbs += drop.value;
          this.particles.emitFloatingText(drop.x, drop.y, `+${drop.value} Herb`, '#84cc16');
        }

        this.particles.emitSparks(drop.x, drop.y, '#34d399', 6);
        this.drops.splice(i, 1);
        this.onStateChange?.();
      }
    }
  }

  // --- Screen Shake ---
  public triggerScreenShake(duration: number, intensity: number) {
    this.camera.shakeTime = duration;
    this.camera.shakeIntensity = intensity;
  }

  // --- Upgrades / Shop purchase ---
  public buyUpgrade(upgradeId: string): boolean {
    const item = this.upgrades.find((u) => u.id === upgradeId);
    if (!item || item.tier >= item.maxTier || this.player.gems < item.cost) {
      return false;
    }

    sound.playChestOpen();
    this.player.gems -= item.cost;
    item.tier += 1;
    item.cost = Math.round(item.cost * 1.5);
    item.effect(this.player.stats);

    this.particles.emitFloatingText(this.player.x, this.player.y - 30, `UPGRADED: ${item.name}!`, '#fbbf24');
    this.onStateChange?.();
    return true;
  }

  // --- Reset / Retry Game ---
  public resetGame(zoneId: number = 1, mode: 'story' | 'endless' = 'story') {
    this.mode = mode;
    this.isGameOver = false;
    this.isVictory = false;
    this.score = 0;
    this.wave = 1;
    this.player = this.createInitialPlayer();
    this.upgrades = JSON.parse(JSON.stringify(ARTIFACT_UPGRADES));
    this.loadZone(zoneId);
  }
}
