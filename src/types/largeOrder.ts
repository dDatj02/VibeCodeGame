import { IngredientRequirement, Money } from './index';

export type LargeOrderCustomerType = 
  | 'company'
  | 'school'
  | 'gym'
  | 'event'
  | 'birthday'
  | 'sports'
  | 'reseller';

export interface LargeOrderCustomer {
  id: string;
  name: string;
  type: LargeOrderCustomerType;
  avatar: string;
  reliability: number; // 0 to 100%
  completedOrders: number;
  cancelledOrders: number;
  description: string;
}

export type LargeOrderRiskTier = 'very_low' | 'low' | 'medium' | 'high' | 'extreme';

export interface LargeOrderEventChoice {
  text: string;
  actionType: 'fix_speed' | 'buy_ingredients' | 'add_quantity' | 'ignore';
  cost?: Money;
  extraRevenue?: Money;
  extraQuantity?: number;
  speedChange?: number; // e.g. -0.3 = 30% slower
  effectDescription: string;
}

export interface LargeOrderEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: LargeOrderEventChoice[];
}

export interface LargeOrder {
  id: string;
  customer: LargeOrderCustomer;
  recipeId: string;
  recipeName: string;
  recipeIcon: string;
  quantity: number;
  pricePerItem: Money;
  totalRevenue: Money;
  depositPercent: number; // 0, 0.3, 0.5, 1.0
  depositAmount: Money;
  cancellationRisk: number; // 0.05 to 0.50
  riskTier: LargeOrderRiskTier;
  productionDurationMinutes: number; // In-game minutes
  totalProductionSeconds: number; // Real-time duration based on speed
  remainingProductionSeconds: number;
  progressCount: number;
  speedMultiplier: number;
  requiredIngredients: IngredientRequirement[];
  status: 'offered' | 'producing' | 'confirming' | 'completed' | 'cancelled';
  createdAtDay: number;
  opportunityCostEstimate: Money;
  lostCustomersCount: number;
  isBoosted: boolean;
  activeEvent: LargeOrderEvent | null;
  ingredientCostTotal: Money;
}

export interface LargeOrderHistoryItem {
  id: string;
  customerName: string;
  customerAvatar: string;
  customerType: LargeOrderCustomerType;
  recipeName: string;
  recipeIcon: string;
  quantity: number;
  totalRevenue: Money;
  depositAmount: Money;
  cancellationRisk: number;
  status: 'completed' | 'cancelled';
  actualRevenue: Money;
  wastedCost: Money;
  recoveredAmount: Money;
  netProfitLoss: Money;
  day: number;
  lostCustomersCount: number;
}

export interface LargeOrderResult {
  success: boolean;
  order: LargeOrder;
  revenueReceived: Money;
  depositRetained: Money;
  ingredientCost: Money;
  recoverableAmount: Money;
  netProfitLoss: Money;
  customerSatisfaction: number;
  reliabilityDelta: number;
  reviewComment?: string;
  reviewStars?: number;
}
