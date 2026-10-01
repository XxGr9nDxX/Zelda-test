import { Camera, Enemy, EnvironmentProp, GameZone, LootDrop, Particle, PlayerState, Projectile } from '../types/game';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  public render(
    player: PlayerState,
    enemies: Enemy[],
    projectiles: Projectile[],
    props: EnvironmentProp[],
    drops: LootDrop[],
    particles: Particle[],
    camera: Camera,
    zone: GameZone,
    gameTime: number
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0a140f';
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // Screen Shake Offset
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (camera.shakeTime > 0) {
      shakeOffsetX = (Math.random() * 2 - 1) * camera.shakeIntensity;
      shakeOffsetY = (Math.random() * 2 - 1) * camera.shakeIntensity;
    }

    // Camera transform (Center on camera target with zoom)
    ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Render Ground Terrain
    this.renderGround(zone, camera);

    // 2. Build Y-Sortable Render List
    // Everything that has depth is sorted by foot Y-position
    interface Renderable {
      y: number;
      draw: () => void;
    }

    const drawList: Renderable[] = [];

    // Props
    for (const prop of props) {
      drawList.push({
        y: prop.y + prop.ySortOffset,
        draw: () => this.renderProp(prop, gameTime, player),
      });
    }

    // Loot Drops
    for (const drop of drops) {
      drawList.push({
        y: drop.y + 4,
        draw: () => this.renderDrop(drop, gameTime),
      });
    }

    // Enemies
    for (const enemy of enemies) {
      drawList.push({
        y: enemy.y + enemy.radius * 0.8,
        draw: () => this.renderEnemy(enemy, gameTime),
      });
    }

    // Player
    drawList.push({
      y: player.y + player.radius * 0.8,
      draw: () => this.renderPlayer(player, gameTime),
    });

    // Projectiles
    for (const proj of projectiles) {
      drawList.push({
        y: proj.y,
        draw: () => this.renderProjectile(proj),
      });
    }

    // Sort ascending by Y-depth
    drawList.sort((a, b) => a.y - b.y);

    // Execute Y-sorted draw
    for (const item of drawList) {
      item.draw();
    }

    // 3. Render Particles & Slashing Trails
    this.renderParticles(particles);

    // 4. Atmospheric Lighting / Sunbeams / Fog / Vignette
    this.renderAtmosphere(player, zone, gameTime, camera);

    ctx.restore();
  }

  // --- Terrain Rendering ---
  private renderGround(zone: GameZone, camera: Camera) {
    const ctx = this.ctx;
    const w = zone.width;
    const h = zone.height;

    // Base ground color
    if (zone.biome === 'canopy') {
      ctx.fillStyle = '#1b382b'; // deep lush moss green
    } else if (zone.biome === 'ruins') {
      ctx.fillStyle = '#1c2627'; // ancient stone teal
    } else if (zone.biome === 'elder_tree') {
      ctx.fillStyle = '#261c16'; // sacred autumn soil
    } else {
      ctx.fillStyle = '#1e1c2e'; // void mystic grove
    }
    ctx.fillRect(0, 0, w, h);

    // Decorative Ground Pattern (subtle tiles and grass textures)
    ctx.save();
    const tileSize = 80;
    const startX = Math.max(0, Math.floor((camera.x - 600) / tileSize) * tileSize);
    const endX = Math.min(w, Math.ceil((camera.x + 600) / tileSize) * tileSize);
    const startY = Math.max(0, Math.floor((camera.y - 600) / tileSize) * tileSize);
    const endY = Math.min(h, Math.ceil((camera.y + 600) / tileSize) * tileSize);

    ctx.lineWidth = 1;
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        // Tile subtle borders
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.strokeRect(x, y, tileSize, tileSize);

        // Natural variations
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const val = hash - Math.floor(hash);

        if (val > 0.6) {
          // Soft moss or cobblestone patch
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.5, y + tileSize * 0.5, 14, 0, Math.PI * 2);
          ctx.fillStyle = zone.biome === 'canopy' ? 'rgba(74, 222, 128, 0.04)' : 'rgba(148, 163, 184, 0.03)';
          ctx.fill();
        }

        if (val > 0.85) {
          // Tiny ground pebbles or flowers
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.3, y + tileSize * 0.7, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047';
          ctx.fill();
        }
      }
    }

    // World Boundary Borders (Ancient runic boundary stones)
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.restore();
  }

  // --- Shadow Helper ---
  private renderDropShadow(x: number, y: number, radiusX: number, radiusY: number, opacity: number = 0.28) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(5, 10, 8, ${opacity})`;
    ctx.fill();
    ctx.restore();
  }

  // --- Player Rendering (Sylva) ---
  private renderPlayer(player: PlayerState, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    // Drop Shadow under hero
    this.renderDropShadow(0, player.radius * 0.85, player.radius * 1.05, player.radius * 0.45, 0.35);

    // Squash & Stretch
    ctx.scale(player.squashX, player.squashY);

    // Hit flash or invulnerability flicker
    if (player.invulnerableTimer > 0 && Math.floor(gameTime * 20) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    const isFacingLeft = Math.cos(player.facingAngle) < 0;

    // Fluttering Cape / Scarf behind
    ctx.save();
    const capeWiggle = Math.sin(gameTime * 10 + player.walkFrame) * 4;
    ctx.beginPath();
    ctx.moveTo(isFacingLeft ? 4 : -4, -6);
    ctx.quadraticCurveTo(
      (isFacingLeft ? 14 : -14) + capeWiggle,
      4,
      (isFacingLeft ? 18 : -18) + capeWiggle * 1.5,
      12
    );
    ctx.lineTo(isFacingLeft ? 6 : -6, 8);
    ctx.fillStyle = '#059669'; // Emerald forest cloak
    ctx.fill();
    ctx.restore();

    // Body (Adventure Tunic)
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981'; // vibrant emerald
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#065f46';
    ctx.stroke();

    // Leather Belt & Golden Buckle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-player.radius * 0.65, 1, player.radius * 1.3, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2.5, 0.5, 5, 4);

    // Hero Hood & Face
    const eyeOffsetX = Math.cos(player.facingAngle) * 5;
    const eyeOffsetY = Math.sin(player.facingAngle) * 4 - 4;

    // Face / Hood shadow
    ctx.beginPath();
    ctx.arc(0, -5, player.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#047857';
    ctx.fill();

    // Face skin
    ctx.beginPath();
    ctx.arc(eyeOffsetX * 0.3, -5 + eyeOffsetY * 0.2, player.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa'; // warm skin tone
    ctx.fill();

    // Expressive Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeOffsetX * 0.5 - 2.5, -6 + eyeOffsetY * 0.3, 1.4, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX * 0.5 + 2.5, -6 + eyeOffsetY * 0.3, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Feather / Leaf in hood
    ctx.beginPath();
    ctx.ellipse(isFacingLeft ? -6 : 6, -11, 2, 6, isFacingLeft ? -0.5 : 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b'; // golden leaf plume
    ctx.fill();

    // Sword & Swing Rendering
    this.renderPlayerWeapon(player, gameTime);

    ctx.restore();
  }

  // --- Sword & Slash Arc Rendering ---
  private renderPlayerWeapon(player: PlayerState, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();

    const swordDist = player.radius + 6;
    let handAngle = player.facingAngle;

    if (player.isAttacking) {
      // Sweeping slash animation
      const attackProgress = player.attackTimer / 0.18; // duration 0.18s
      const sweepAngle = Math.PI * 0.85;
      const startAngle = player.attackAngle - sweepAngle * 0.5;
      handAngle = startAngle + sweepAngle * (1 - attackProgress);

      // Render glowing slash arc
      ctx.save();
      ctx.beginPath();
      const arcRadius = player.radius + 26;
      ctx.arc(0, 0, arcRadius, startAngle, startAngle + sweepAngle, false);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Inner blade light trail
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius - 4, startAngle, startAngle + sweepAngle, false);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else {
      // Idle breathing sway
      handAngle += Math.sin(gameTime * 4) * 0.08;
    }

    // Sword Blade Position
    const swordX = Math.cos(handAngle) * swordDist;
    const swordY = Math.sin(handAngle) * swordDist;

    ctx.translate(swordX, swordY);
    ctx.rotate(handAngle + Math.PI / 2);

    // Hilt / Guard
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-5, 4, 10, 2.5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1.5, 6, 3, 5);

    // Blade with polished gradient
    const bladeGrad = ctx.createLinearGradient(-3, -20, 3, 4);
    bladeGrad.addColorStop(0, '#f8fafc');
    bladeGrad.addColorStop(0.5, '#cbd5e1');
    bladeGrad.addColorStop(1, '#94a3b8');

    ctx.beginPath();
    ctx.moveTo(0, -22); // Tip
    ctx.lineTo(3.5, 4);
    ctx.lineTo(-3.5, 4);
    ctx.closePath();
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    // Central Fuller line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 4);
    ctx.stroke();

    ctx.restore();
  }

  // --- Enemy Rendering ---
  private renderEnemy(enemy: Enemy, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Drop Shadow
    this.renderDropShadow(0, enemy.radius * 0.8, enemy.radius * 0.95, enemy.radius * 0.45, 0.32);

    // Squash & Stretch
    ctx.scale(enemy.squashX, enemy.squashY);

    // White Hit Flash on Damage
    const isHitFlash = enemy.hitFlashTimer > 0;

    // Boss Telegraph circle indicator on ground
    if (enemy.telegraphTimer && enemy.telegraphTimer > 0 && enemy.telegraphRadius) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, enemy.telegraphRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.type === 'slime') {
      // Forest Slime: Jiggling translucent dome
      const bounce = Math.sin(gameTime * 8) * 2;
      ctx.beginPath();
      ctx.ellipse(0, bounce, enemy.radius, enemy.radius * 0.82, 0, 0, Math.PI * 2);

      if (isHitFlash) {
        ctx.fillStyle = '#ffffff';
      } else {
        const slimeGrad = ctx.createRadialGradient(-4, -6 + bounce, 2, 0, bounce, enemy.radius);
        slimeGrad.addColorStop(0, '#86efac');
        slimeGrad.addColorStop(0.7, '#22c55e');
        slimeGrad.addColorStop(1, '#15803d');
        ctx.fillStyle = slimeGrad;
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#14532d';
      ctx.stroke();

      // Slime Cute Eyes
      if (!isHitFlash) {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(-5, bounce - 1, 2.2, 0, Math.PI * 2);
        ctx.arc(5, bounce - 1, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.3, bounce - 2, 0.8, 0, Math.PI * 2);
        ctx.arc(5.7, bounce - 2, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (enemy.type === 'stalker') {
      // Thorn Goblin / Shadow Stalker
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      if (isHitFlash) {
        ctx.fillStyle = '#ffffff';
      } else {
        const grad = ctx.createRadialGradient(-3, -4, 2, 0, 0, enemy.radius);
        grad.addColorStop(0, '#a855f7'); // Shadow purple
        grad.addColorStop(1, '#581c87');
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#3b0764';
      ctx.stroke();

      // Stalker Horns
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(-6, -enemy.radius * 0.6);
      ctx.lineTo(-12, -enemy.radius - 6);
      ctx.lineTo(-2, -enemy.radius * 0.8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(6, -enemy.radius * 0.6);
      ctx.lineTo(12, -enemy.radius - 6);
      ctx.lineTo(2, -enemy.radius * 0.8);
      ctx.fill();

      // Glowing yellow hunter eyes
      if (!isHitFlash) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (enemy.type === 'shroom') {
      // Spore Shroom Shooter
      ctx.beginPath();
      ctx.arc(0, -4, enemy.radius * 0.9, Math.PI, Math.PI * 2);
      ctx.closePath();
      if (isHitFlash) {
        ctx.fillStyle = '#ffffff';
      } else {
        const grad = ctx.createLinearGradient(0, -enemy.radius, 0, 0);
        grad.addColorStop(0, '#f43f5e'); // Crimson cap
        grad.addColorStop(1, '#9f1239');
        ctx.fillStyle = grad;
      }
      ctx.fill();

      // Mushroom stem
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -4, 8, 10);

      // Spots on cap
      if (!isHitFlash) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -10, 2, 0, Math.PI * 2);
        ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
        ctx.arc(6, -9, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (enemy.type === 'boss_guardian') {
      // Mighty Corrupted Elder Treant Boss
      const breath = Math.sin(gameTime * 3) * 3;
      
      // Giant Wooden Trunk Body
      ctx.beginPath();
      ctx.arc(0, -6 + breath, enemy.radius, 0, Math.PI * 2);
      if (isHitFlash) {
        ctx.fillStyle = '#ffffff';
      } else {
        const trunkGrad = ctx.createRadialGradient(-10, -16, 5, 0, 0, enemy.radius);
        trunkGrad.addColorStop(0, '#78350f');
        trunkGrad.addColorStop(0.7, '#451a03');
        trunkGrad.addColorStop(1, '#270e02');
        ctx.fillStyle = trunkGrad;
      }
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1c0a00';
      ctx.stroke();

      // Antler Branch Horns
      ctx.fillStyle = '#3e1a06';
      ctx.beginPath();
      ctx.moveTo(-16, -enemy.radius * 0.5);
      ctx.lineTo(-38, -enemy.radius - 24);
      ctx.lineTo(-24, -enemy.radius - 8);
      ctx.lineTo(-44, -enemy.radius - 14);
      ctx.lineTo(-10, -enemy.radius * 0.8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(16, -enemy.radius * 0.5);
      ctx.lineTo(38, -enemy.radius - 24);
      ctx.lineTo(24, -enemy.radius - 8);
      ctx.lineTo(44, -enemy.radius - 14);
      ctx.lineTo(10, -enemy.radius * 0.8);
      ctx.fill();

      // Glowing Runic Core in Chest
      const corePulse = Math.sin(gameTime * 6) * 0.2 + 0.8;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 4 + breath, 12 * corePulse, 0, Math.PI * 2);
      ctx.fillStyle = enemy.isEnraged ? '#ef4444' : '#f59e0b';
      ctx.shadowColor = enemy.isEnraged ? '#ef4444' : '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();

      // Boss Glowing Burning Eyes
      ctx.fillStyle = enemy.isEnraged ? '#fee2e2' : '#fef08a';
      ctx.beginPath();
      ctx.arc(-14, -12 + breath, 4.5, 0, Math.PI * 2);
      ctx.arc(14, -12 + breath, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overhead Health Bar (for all enemies except boss which has dedicated HUD)
    if (enemy.type !== 'boss_guardian' && enemy.hp < enemy.maxHp) {
      const barW = enemy.radius * 2;
      const barH = 4;
      const barY = -enemy.radius - 12;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = hpPercent > 0.3 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpPercent, barH);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-barW / 2, barY, barW, barH);
    }

    ctx.restore();
  }

  // --- Environment Props Rendering ---
  private renderProp(prop: EnvironmentProp, gameTime: number, player: PlayerState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(prop.x, prop.y);

    // Distance to player for canopy transparency
    const distToPlayer = Math.hypot(player.x - prop.x, player.y - prop.y);

    if (prop.type === 'tree_oak' || prop.type === 'tree_pine') {
      // Tree Base Shadow
      this.renderDropShadow(0, 8, prop.radius * 1.3, prop.radius * 0.6, 0.38);

      // Wooden Trunk
      ctx.fillStyle = '#5c2c16';
      ctx.fillRect(-7, -10, 14, 20);
      ctx.fillStyle = '#451e0e';
      ctx.fillRect(-2, -10, 4, 20); // Bark ridge

      // Foliage Canopy with subtle wind sway
      const sway = Math.sin(gameTime * 2 + (prop.swayOffset || 0)) * 3;

      // Make foliage semi-transparent if player is hidden behind it
      const isPlayerBehind = distToPlayer < prop.radius + 15 && player.y < prop.y;
      if (isPlayerBehind) {
        ctx.globalAlpha = 0.45;
      }

      ctx.save();
      ctx.translate(sway, 0);

      // Layered vector foliage balls
      const foliageGrad = ctx.createRadialGradient(-10, -50, 10, 0, -45, prop.radius * 1.2);
      if (prop.type === 'tree_oak') {
        foliageGrad.addColorStop(0, '#4ade80');
        foliageGrad.addColorStop(0.6, '#15803d');
        foliageGrad.addColorStop(1, '#052e16');
      } else {
        foliageGrad.addColorStop(0, '#2dd4bf');
        foliageGrad.addColorStop(0.6, '#0f766e');
        foliageGrad.addColorStop(1, '#042f2e');
      }

      ctx.beginPath();
      ctx.arc(0, -45, prop.radius, 0, Math.PI * 2);
      ctx.arc(-14, -38, prop.radius * 0.75, 0, Math.PI * 2);
      ctx.arc(14, -38, prop.radius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = foliageGrad;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.stroke();

      ctx.restore();
    } else if (prop.type === 'tall_grass') {
      if (!prop.isCut) {
        // Swaying cuttable tall grass tuft
        const grassSway = Math.sin(gameTime * 4 + (prop.swayOffset || 0)) * 2;
        this.renderDropShadow(0, 4, 12, 5, 0.2);

        ctx.fillStyle = '#22c55e';
        [-8, -4, 0, 4, 8].forEach((gx, idx) => {
          ctx.beginPath();
          ctx.moveTo(gx, 4);
          ctx.quadraticCurveTo(gx + grassSway, -8 - (idx % 2) * 5, gx + grassSway * 1.5, -14 - (idx % 2) * 4);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = idx % 2 === 0 ? '#4ade80' : '#16a34a';
          ctx.stroke();
        });
      } else {
        // Cut grass stump
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(0, 2, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (prop.type === 'rock_moss') {
      // Mossy Boulder
      this.renderDropShadow(0, 4, prop.radius * 1.1, prop.radius * 0.6, 0.32);

      const rockGrad = ctx.createLinearGradient(-prop.radius, -prop.radius, prop.radius, prop.radius);
      rockGrad.addColorStop(0, '#94a3b8');
      rockGrad.addColorStop(0.7, '#475569');
      rockGrad.addColorStop(1, '#1e293b');

      ctx.beginPath();
      ctx.ellipse(0, -2, prop.radius, prop.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = rockGrad;
      ctx.fill();

      // Moss cap
      ctx.beginPath();
      ctx.arc(-2, -7, prop.radius * 0.55, 0, Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
    } else if (prop.type === 'shrine' || prop.type === 'sunstone_crystal') {
      // Ancient Sunstone Shrine
      this.renderDropShadow(0, 8, 26, 12, 0.4);

      // Stone Pedestal
      ctx.fillStyle = '#334155';
      ctx.fillRect(-18, -4, 36, 14);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-22, 6, 44, 6);

      // Floating Crystal Obelisk
      const floatY = Math.sin(gameTime * 3) * 4 - 20;
      ctx.save();
      ctx.translate(0, floatY);

      const crystalColor = prop.isActivated ? '#38bdf8' : '#fbbf24';

      ctx.shadowColor = crystalColor;
      ctx.shadowBlur = prop.isActivated ? 22 : 12;

      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fillStyle = crystalColor;
      ctx.fill();

      // Inner refraction facet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 14);
      ctx.fill();

      ctx.restore();

      // Interaction Prompt badge when player is near
      if (distToPlayer < 65 && !prop.isActivated) {
        this.renderInteractionBadge(0, -48, 'ACTIVATE');
      }
    } else if (prop.type === 'chest') {
      // Golden Treasure Chest
      this.renderDropShadow(0, 6, 16, 8, 0.35);

      if (!prop.isOpen) {
        // Closed Chest
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-14, -8, 28, 16);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, -8, 28, 16);

        // Gold clasp & keyhole
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-3, -2, 6, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-1, 0, 2, 3);

        if (distToPlayer < 55) {
          this.renderInteractionBadge(0, -22, 'OPEN');
        }
      } else {
        // Open Chest
        ctx.fillStyle = '#713f12';
        ctx.fillRect(-14, -2, 28, 12);
        // Lid tilted back
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-14, -14, 28, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-14, -4, 28, 3);
      }
    } else if (prop.type === 'portal_gate') {
      // Runic Archway
      this.renderDropShadow(0, 12, 36, 14, 0.4);

      ctx.fillStyle = '#334155';
      ctx.fillRect(-30, -45, 14, 55);
      ctx.fillRect(16, -45, 14, 55);
      ctx.fillRect(-30, -55, 60, 14);

      // Portal energy swirl
      const portalPulse = Math.sin(gameTime * 4) * 0.15 + 0.85;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -18, 18 * portalPulse, 28 * portalPulse, 0, 0, Math.PI * 2);
      const portalGrad = ctx.createRadialGradient(0, -18, 2, 0, -18, 28);
      portalGrad.addColorStop(0, '#a5f3fc');
      portalGrad.addColorStop(0.5, '#06b6d4');
      portalGrad.addColorStop(1, '#0e7490');
      ctx.fillStyle = portalGrad;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();

      if (distToPlayer < 65) {
        this.renderInteractionBadge(0, -68, 'ENTER');
      }
    } else if (prop.type === 'ruin_pillar') {
      // Ancient Broken Pillar
      this.renderDropShadow(0, 6, 18, 9, 0.35);

      const stoneGrad = ctx.createLinearGradient(-14, 0, 14, 0);
      stoneGrad.addColorStop(0, '#64748b');
      stoneGrad.addColorStop(0.5, '#475569');
      stoneGrad.addColorStop(1, '#334155');

      ctx.fillStyle = stoneGrad;
      ctx.fillRect(-14, -36, 28, 42);

      // Pillar capital grooves
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-17, -42, 34, 8);
      ctx.fillRect(-16, 4, 32, 6);
    }

    ctx.restore();
  }

  // --- Interaction Prompt Floating Badge ---
  private renderInteractionBadge(x: number, y: number, text: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const padX = 8;
    const txtW = text.length * 6.5;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-txtW / 2 - padX, -10, txtW + padX * 2, 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);

    ctx.restore();
  }

  // --- Loot Drops Rendering ---
  private renderDrop(drop: LootDrop, gameTime: number) {
    const ctx = this.ctx;
    ctx.save();
    const bob = Math.sin(gameTime * 6 + drop.bobTimer) * 3 - 6;
    ctx.translate(drop.x, drop.y + bob);

    // Drop shadow
    this.renderDropShadow(0, -bob + 2, 7, 3, 0.25);

    if (drop.type === 'gem') {
      // Sparkling Emerald Diamond
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 5);
      ctx.fill();
    } else if (drop.type === 'heart') {
      // Recovery Heart
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-3, -2, 3.5, Math.PI, 0, false);
      ctx.arc(3, -2, 3.5, Math.PI, 0, false);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
    } else if (drop.type === 'herb') {
      // Green healing sprig
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Projectiles Rendering ---
  private renderProjectile(proj: Projectile) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(proj.x, proj.y);

    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.shadowColor = proj.trailColor;
    ctx.shadowBlur = 14;
    ctx.fill();

    // Hot radiant center
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  // --- Particles Rendering ---
  private renderParticles(particles: Particle[]) {
    const ctx = this.ctx;

    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'leaf') {
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'spark' || p.type === 'magic_star') {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (p.type === 'afterimage' && p.afterimageData) {
        ctx.translate(p.afterimageData.x, p.afterimageData.y);
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      } else if (p.type === 'floating_text' && p.text) {
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = p.textColor || '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'firefly') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#6ee7b7';
        ctx.shadowColor = '#a7f3d0';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- Dynamic Lighting & Atmosphere ---
  private renderAtmosphere(player: PlayerState, zone: GameZone, gameTime: number, camera: Camera) {
    const ctx = this.ctx;

    // Ambient Lighting Vignette with Lantern Glow around Player
    const lanternRadius = 240;
    const lantern = ctx.createRadialGradient(
      player.x,
      player.y,
      30,
      player.x,
      player.y,
      lanternRadius
    );
    lantern.addColorStop(0, 'rgba(255, 230, 160, 0.08)');
    lantern.addColorStop(0.6, 'rgba(255, 200, 120, 0.02)');
    lantern.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = lantern;
    ctx.beginPath();
    ctx.arc(player.x, player.y, lanternRadius, 0, Math.PI * 2);
    ctx.fill();

    // Soft Godrays / Sunlight filtering through canopy
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rayAngle = 0.55; // Diagonal rays
    const rayCount = 4;
    for (let i = 0; i < rayCount; i++) {
      const rayOffset = ((gameTime * 15 + i * 280) % 1200) - 400;
      const rayX = camera.x + rayOffset;
      const rayY = camera.y - 400;

      const rayGrad = ctx.createLinearGradient(rayX, rayY, rayX + 350, rayY + 700);
      rayGrad.addColorStop(0, 'rgba(255, 245, 210, 0.035)');
      rayGrad.addColorStop(0.5, 'rgba(255, 240, 180, 0.015)');
      rayGrad.addColorStop(1, 'rgba(255, 240, 180, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(rayX, rayY);
      ctx.lineTo(rayX + 90, rayY);
      ctx.lineTo(rayX + 420, rayY + 800);
      ctx.lineTo(rayX + 330, rayY + 800);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
