export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerStats {
  maxHp: number; // e.g. 6 (represented as 3 hearts = 6 half-hearts)
  hp: number;
  maxStamina: number;
  stamina: number;
  maxMana: number;
  mana: number;
  speed: number;
  attackDamage: number;
  magicDamage: number;
  defense: number;
  dashSpeed: number;
  dashDuration: number;
  dashCooldown: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facingAngle: number; // in radians
  stats: PlayerStats;
  gems: number;
  herbs: number; // for health potions
  runesCollected: number;
  requiredRunes: number;

  // Combat state
  isAttacking: boolean;
  attackTimer: number;
  attackCombo: number; // 1, 2, 3
  attackAngle: number;
  
  isDashing: boolean;
  dashTimer: number;
  dashCooldownTimer: number;
  dashAngle: number;

  isHurt: boolean;
  invulnerableTimer: number;
  squashX: number;
  squashY: number;

  // Visuals
  footstepTimer: number;
  walkFrame: number;
}

export type EnemyType = 'slime' | 'stalker' | 'shroom' | 'boss_guardian';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  expValue: number;
  gemValue: number;

  // AI & animation
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'windup' | 'recovering';
  stateTimer: number;
  patrolTarget?: Vector2D;
  facingAngle: number;
  hitFlashTimer: number;
  squashX: number;
  squashY: number;

  // Special abilities
  projectileCooldown?: number;
  telegraphTimer?: number;
  telegraphRadius?: number;
  bossPhase?: number;
  bossSlamCooldown?: number;
  isEnraged?: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  life: number;
  maxLife: number;
  color: string;
  trailColor: string;
  penetrating?: boolean;
  burnEffect?: boolean;
}

export type PropType = 
  | 'tree_oak' 
  | 'tree_pine' 
  | 'rock_moss' 
  | 'shrine' 
  | 'chest' 
  | 'tall_grass' 
  | 'ruin_pillar' 
  | 'portal_gate' 
  | 'sunstone_crystal';

export interface EnvironmentProp {
  id: string;
  type: PropType;
  x: number;
  y: number;
  radius: number;
  width?: number;
  height?: number;
  ySortOffset: number;
  isSolid: boolean;
  isCut?: boolean;
  isOpen?: boolean;
  isActivated?: boolean;
  swayOffset?: number;
  interactionPrompt?: string;
  runeIndex?: number;
}

export type DropType = 'gem' | 'heart' | 'herb' | 'rune_fragment';

export interface LootDrop {
  id: string;
  type: DropType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  life: number;
  bobTimer: number;
}

export type ParticleType = 
  | 'leaf' 
  | 'spark' 
  | 'smoke' 
  | 'magic_star' 
  | 'slash_trail' 
  | 'shockwave' 
  | 'afterimage' 
  | 'floating_text' 
  | 'firefly';

export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  rotationSpeed?: number;
  text?: string;
  textColor?: string;
  scale?: number;
  afterimageData?: {
    x: number;
    y: number;
    facingAngle: number;
  };
}

export interface ArtifactUpgrade {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  cost: number;
  icon: string;
  effect: (stats: PlayerStats) => void;
}

export interface GameQuest {
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
}

export interface GameZone {
  id: number;
  name: string;
  biome: 'canopy' | 'ruins' | 'elder_tree' | 'endless_grove';
  width: number;
  height: number;
  ambientLight: string;
  fogColor: string;
  quest: GameQuest;
}

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  zoom: number;
  shakeTime: number;
  shakeIntensity: number;
}
