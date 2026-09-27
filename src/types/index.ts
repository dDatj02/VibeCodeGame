export type Money = number;
export type IngredientId = string;
export type RecipeId = string;
export type CustomerArchetypeId = 'student' | 'office_worker' | 'gymer' | 'family' | 'foodie' | 'difficult' | 'loyal';
export type WeatherType = 'sunny' | 'heatwave' | 'rain' | 'storm';
export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening';
export type LoanType = 'bank' | 'fast' | 'private';

export interface Ingredient {
  id: IngredientId;
  name: string;
  nameEn: string;
  category: 'fruit' | 'dairy' | 'sweetener' | 'base';
  icon: string;
  basePrice: number; // per unit (e.g. 10.000đ/kg or box)
  unit: string;
  currentStock: number;
  freshness: number; // 0 - 100%
  shelfLifeDays: number;
  color: string;
}

export interface IngredientRequirement {
  ingredientId: IngredientId;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  ingredients: IngredientRequirement[];
  baseSellingPrice: number;
  currentSellingPrice: number;
  prepTimeSeconds: number;
  quality: number; // 1 - 5
  popularity: number; // 0 - 100%
  unlocked: boolean;
  unlockCost?: number;
  unlockRequirement?: string;
  tag: 'Classic' | 'Signature' | 'Healthy' | 'Special';
  color: string;
}

export interface CustomerArchetype {
  id: CustomerArchetypeId;
  name: string;
  nameEn: string;
  description: string;
  avatar: string;
  patienceSeconds: number;
  budgetMultiplier: number;
  tipChance: number;
  priceSensitivity: number; // 0 (careless) to 1 (extremely sensitive)
  favoriteRecipes: RecipeId[];
  spawnWeight: number;
  color: string;
}

export interface ActiveCustomer {
  id: string;
  archetypeId: CustomerArchetypeId;
  name: string;
  desiredRecipeId: RecipeId;
  spawnTime: number;
  maxPatience: number;
  remainingPatience: number;
  state: 'walking_in' | 'queuing' | 'ordering' | 'waiting_drink' | 'drinking' | 'leaving';
  queuePosition: number;
  icePreference: 'regular' | 'less_ice';
  sugarPreference: 'regular' | 'less_sugar' | 'no_sugar';
  milkPreference?: 'regular' | 'no_milk';
  customNote?: string;
  satisfaction?: number;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  avatar: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  day: number;
  recipeName?: string;
  helpfulCount: number;
  isViral?: boolean;
  aspect: 'quality' | 'speed' | 'price' | 'cleanliness' | 'service';
}

export interface ActiveLoan {
  id: string;
  title: string;
  type: LoanType;
  lenderName: string;
  principal: Money;
  remainingPrincipal: Money;
  interestRate: number; // e.g. 0.08 = 8%
  dailyPayment: Money;
  totalDays: number;
  daysRemaining: number;
  missedPayments: number;
}

export interface LoanProduct {
  id: string;
  title: string;
  type: LoanType;
  lenderName: string;
  description: string;
  principal: Money;
  interestRate: number;
  durationDays: number;
  dailyPayment: Money;
  requiredCreditScore: number;
  riskNotice?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'blender' | 'cooling' | 'seating' | 'decor' | 'power';
  icon: string;
  level: number;
  maxLevel: number;
  currentCost: Money;
  prepSpeedBonus: number; // speed multiplier or -seconds
  qualityBonus: number;
  freshnessRetentionBonus: number;
  cleanlinessBonus: number;
  description: string;
  electricityCostPerDay: Money;
}

export interface Employee {
  id: string;
  name: string;
  role: 'barista' | 'server' | 'cleaner';
  avatar: string;
  salaryPerDay: Money;
  speed: number; // 0-100
  customerService: number; // 0-100
  skill: number; // 0-100
  trait: string;
  traitDescription: string;
  hired: boolean;
  fatigue: number; // 0-100
}

export interface ShopLevelConfig {
  level: number;
  title: string;
  description: string;
  upgradeCost: Money;
  maxQueueCapacity: number;
  dailyRent: Money;
  trafficMultiplier: number;
  spriteKey: string;
}

export interface DailyReport {
  day: number;
  revenue: Money;
  ingredientCost: Money;
  employeeSalaries: Money;
  rent: Money;
  electricity: Money;
  loanPayments: Money;
  penalties: Money;
  maintenance: Money;
  marketingExpenses: Money;
  netProfit: Money;
  startingCash: Money;
  endingCash: Money;
  totalCustomersServed: number;
  customersLost: number;
  averageRating: number;
  newReviewsCount: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'opportunity' | 'crisis' | 'weather' | 'influencer' | 'lender';
  choices: {
    text: string;
    action: () => void;
    cost?: Money;
    effectDescription: string;
  }[];
}

export interface SocialPost {
  id: string;
  title: string;
  content: string;
  mediaType: 'photo' | 'video' | 'meme';
  cost: Money;
  day: number;
  views: number;
  likes: number;
  trafficBoostDays: number;
  sentiment: 'positive' | 'neutral' | 'viral' | 'backfire';
}

export interface DailyQuest {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardCash: Money;
  rewardXp: number;
  completed: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: 'vi' | 'en';
  gameSpeed: 1 | 2 | 3;
}
