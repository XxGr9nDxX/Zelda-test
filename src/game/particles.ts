import { Particle, ParticleType } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Friction / Drag
      p.vx *= 0.94;
      p.vy *= 0.94;

      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }

      // Alpha fade out
      const progress = p.life / p.maxLife;
      if (p.type === 'shockwave') {
        p.radius += 240 * dt;
        p.alpha = Math.max(0, 1 - progress);
      } else if (p.type === 'floating_text') {
        p.alpha = Math.max(0, 1 - Math.pow(progress, 2));
      } else if (p.type === 'afterimage') {
        p.alpha = Math.max(0, 0.45 * (1 - progress));
      } else {
        p.alpha = Math.max(0, 1 - progress);
      }
    }
  }

  // --- Emitters ---

  public emitDust(x: number, y: number, count: number = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 35;
      this.particles.push({
        id: Math.random().toString(),
        type: 'smoke',
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 6 - 3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: 'rgba(215, 230, 200, 0.35)',
        alpha: 0.5,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.25,
      });
    }
  }

  public emitLeaves(x: number, y: number, count: number = 8) {
    const leafColors = ['#4ade80', '#22c55e', '#86efac', '#15803d', '#a3e635'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        id: Math.random().toString(),
        type: 'leaf',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        radius: 4 + Math.random() * 3,
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        alpha: 0.9,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
      });
    }
  }

  public emitSparks(x: number, y: number, color: string = '#fde047', count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 160;
      this.particles.push({
        id: Math.random().toString(),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
      });
    }
  }

  public emitMagicStars(x: number, y: number, count: number = 6) {
    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#38bdf8'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        id: Math.random().toString(),
        type: 'magic_star',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  }

  public emitFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    this.particles.push({
      id: Math.random().toString(),
      type: 'floating_text',
      x: x + (Math.random() * 10 - 5),
      y: y - 10,
      vx: (Math.random() - 0.5) * 20,
      vy: -60 - Math.random() * 30, // floats upward
      radius: 0,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.75,
      text,
      textColor: color,
    });
  }

  public emitShockwave(x: number, y: number, color: string = 'rgba(251, 191, 36, 0.7)', initialRadius: number = 10) {
    this.particles.push({
      id: Math.random().toString(),
      type: 'shockwave',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: initialRadius,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.4,
    });
  }

  public emitDashGhost(x: number, y: number, facingAngle: number) {
    this.particles.push({
      id: Math.random().toString(),
      type: 'afterimage',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 16,
      color: '#67e8f9',
      alpha: 0.5,
      life: 0,
      maxLife: 0.2,
      afterimageData: { x, y, facingAngle },
    });
  }

  public emitFireflies(count: number, width: number, height: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: Math.random().toString(),
        type: 'firefly',
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: 2 + Math.random() * 2,
        color: '#a7f3d0',
        alpha: 0.4 + Math.random() * 0.4,
        life: 0,
        maxLife: 8 + Math.random() * 10,
      });
    }
  }
}
