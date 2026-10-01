import { ArtifactUpgrade, GameZone, PlayerStats } from '../types/game';

export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 6, // 3 full hearts (each heart has 2 halves)
  hp: 6,
  maxStamina: 100,
  stamina: 100,
  maxMana: 100,
  mana: 100,
  speed: 210, // px per sec
  attackDamage: 24,
  magicDamage: 38,
  defense: 0,
  dashSpeed: 520,
  dashDuration: 0.22,
  dashCooldown: 0.65,
};

export const ARTIFACT_UPGRADES: ArtifactUpgrade[] = [
  {
    id: 'sunfire_edge',
    name: 'Sunfire Blade Edge',
    description: 'Increases sword melee damage by +35% and expands arc width.',
    tier: 0,
    maxTier: 3,
    cost: 35,
    icon: '⚔️',
    effect: (stats) => {
      stats.attackDamage = Math.round(stats.attackDamage * 1.35);
    },
  },
  {
    id: 'zephyr_boots',
    name: 'Zephyr Wind Boots',
    description: 'Increases base move speed by +18% and reduces dash cooldown by 25%.',
    tier: 0,
    maxTier: 3,
    cost: 40,
    icon: '👟',
    effect: (stats) => {
      stats.speed = Math.round(stats.speed * 1.18);
      stats.dashCooldown = Math.max(0.3, stats.dashCooldown * 0.75);
    },
  },
  {
    id: 'elder_heart',
    name: 'Verdant Heart Crystal',
    description: 'Permanently grants +2 Max HP (+1 full heart container) and restores health.',
    tier: 0,
    maxTier: 4,
    cost: 50,
    icon: '💖',
    effect: (stats) => {
      stats.maxHp += 2;
      stats.hp = stats.maxHp;
    },
  },
  {
    id: 'spirit_bloom',
    name: 'Solar Spire Blossom',
    description: 'Boosts magic solar burst damage by +40% and increases max mana by +30.',
    tier: 0,
    maxTier: 3,
    cost: 45,
    icon: '🔮',
    effect: (stats) => {
      stats.magicDamage = Math.round(stats.magicDamage * 1.4);
      stats.maxMana += 30;
      stats.mana = stats.maxMana;
    },
  },
  {
    id: 'bark_cuirass',
    name: 'Ironwood Bark Cuirass',
    description: 'Reduces incoming damage by 20% and reduces knockback taken.',
    tier: 0,
    maxTier: 2,
    cost: 60,
    icon: '🛡️',
    effect: (stats) => {
      stats.defense += 4;
    },
  },
];

export const ZONES: Record<number, GameZone> = {
  1: {
    id: 1,
    name: 'The Whispering Canopy',
    biome: 'canopy',
    width: 2200,
    height: 1800,
    ambientLight: 'rgba(230, 255, 235, 0.08)',
    fogColor: 'rgba(8, 25, 18, 0.15)',
    quest: {
      title: 'Awaken the Ancient Stones',
      description: 'Activate the 3 Ancient Sunstone Shrines hidden across the woods to unlock the Ruins Gate.',
      targetCount: 3,
      currentCount: 0,
      isCompleted: false,
    },
  },
  2: {
    id: 2,
    name: 'The Sunken Temple Ruins',
    biome: 'ruins',
    width: 2400,
    height: 2000,
    ambientLight: 'rgba(180, 230, 255, 0.06)',
    fogColor: 'rgba(10, 16, 28, 0.22)',
    quest: {
      title: 'Purge the Shadow Infestation',
      description: 'Defeat 10 Shadow Stalkers and activate the Elder Sanctum Portal.',
      targetCount: 10,
      currentCount: 0,
      isCompleted: false,
    },
  },
  3: {
    id: 3,
    name: 'Heart of the Elder Tree',
    biome: 'elder_tree',
    width: 2000,
    height: 2000,
    ambientLight: 'rgba(255, 210, 140, 0.12)',
    fogColor: 'rgba(24, 12, 8, 0.25)',
    quest: {
      title: 'Defeat the Corrupted Guardian',
      description: 'Slay the mighty Elder Treant to purge the darkness and restore the Grove.',
      targetCount: 1,
      currentCount: 0,
      isCompleted: false,
    },
  },
  4: {
    id: 4,
    name: 'Endless Grove Trials',
    biome: 'endless_grove',
    width: 2400,
    height: 2400,
    ambientLight: 'rgba(210, 180, 255, 0.1)',
    fogColor: 'rgba(18, 12, 32, 0.2)',
    quest: {
      title: 'Endless Survival',
      description: 'Survive consecutive waves of wild beasts and accumulate a high score!',
      targetCount: 999,
      currentCount: 0,
      isCompleted: false,
    },
  },
};
