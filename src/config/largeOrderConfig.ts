// Configuration for Large Order Business Challenge system

export const LARGE_ORDER_UNLOCK_LEVEL = 5;

// Interval between large order generation attempts (in game minutes)
export const LARGE_ORDER_SPAWN_INTERVAL_MINUTES = 180; // Every 3 in-game hours

// Base production time per smoothie (in real seconds before speed bonuses)
export const BASE_PRODUCTION_SECONDS_PER_SMOOTHIE = 0.4;

// Boost speed multiplier
export const BOOST_SPEED_MULTIPLIER = 1.35;
export const BOOST_COST = 50000; // 50.000đ

// Emergency fix cost for blender overheating
export const BLENDER_FIX_COST = 100000; // 100.000đ

// Recovery rate on cancellation
export const RECOVERY_RATE_MIN = 0.20; // 20%
export const RECOVERY_RATE_MAX = 0.35; // 35%
