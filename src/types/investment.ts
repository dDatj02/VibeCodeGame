import { Money } from './index';

export type PropertyType = 'land' | 'house' | 'gold' | 'commercial';

export type ZoningStatus = 
  | 'verified_clean' 
  | 'planning_clear' 
  | 'road_expansion_risk' 
  | 'redevelopment_zone' 
  | 'unverified';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export type TenantType = 
  | 'food_vendor' 
  | 'local_business' 
  | 'small_shop' 
  | 'storage' 
  | 'family' 
  | 'event_organizer' 
  | 'office';

export interface RentalContract {
  propertyId: string;
  tenantType: TenantType;
  tenantName: string;
  tenantAvatar: string;
  monthlyRent: Money;
  dailyRent: Money;
  durationDays: number;
  daysRemaining: number;
  paymentReliability: number; // 0 to 100
  startDate: number;
  depositAmount: Money;
  isPaidToday?: boolean;
}

export interface InspectionReport {
  verifiedOwner: boolean;
  zoningNotes: string;
  roadRisk: 'none' | 'medium' | 'high';
  structureQuality?: string;
  electricalPlumbing?: string;
  growthForecast: string;
  confidencePercent: number;
}

export interface LandProperty {
  id: string;
  name: string;
  location: string;
  area: number; // m²
  propertyType: 'land';
  icon: string;
  purchasePrice: Money;
  currentMarketValue: Money;
  originalPurchasePrice?: Money;
  estimatedMarketValue: Money;
  zoningStatus: ZoningStatus;
  developmentPotential: 'low' | 'medium' | 'high' | 'exceptional';
  rentalPotentialMonthly: Money;
  rentalDemand: 'low' | 'medium' | 'high';
  isRented: boolean;
  isOwned: boolean;
  isChecked: boolean; // Inspected
  inspectionCost: Money;
  inspectionReport?: InspectionReport;
  riskLevel: RiskLevel;
  purchasedAtDay?: number;
  lastValueUpdateDay?: number;
  activeRentalContract?: RentalContract | null;
  usedForSmoothieShop?: boolean;
  description: string;
}

export interface HouseProperty {
  id: string;
  name: string;
  location: string;
  area: number; // m²
  propertyType: 'house';
  icon: string;
  purchasePrice: Money;
  currentMarketValue: Money;
  originalPurchasePrice?: Money;
  estimatedMarketValue: Money;
  renovationCost: Money;
  maintenanceCost: Money;
  rentalIncomeMonthly: Money;
  rentalDemand: 'low' | 'medium' | 'high';
  condition: number; // 0 - 100%
  isRented: boolean;
  isOwned: boolean;
  isChecked: boolean;
  inspectionCost: Money;
  inspectionReport?: InspectionReport;
  riskLevel: RiskLevel;
  purchasedAtDay?: number;
  lastValueUpdateDay?: number;
  activeRentalContract?: RentalContract | null;
  usedForSmoothieShop?: boolean;
  description: string;
}

export type PropertyItem = LandProperty | HouseProperty;

export interface InvestmentTransaction {
  id: string;
  day: number;
  type: 'buy' | 'sell' | 'rent_income' | 'inspection' | 'renovation' | 'maintenance' | 'event_gain' | 'event_loss';
  propertyId: string;
  propertyName: string;
  propertyType: PropertyType;
  amount: Money; // Positive for cash inflow, negative for expense
  realizedProfit?: Money;
  description: string;
}

export interface InvestmentEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  propertyId?: string;
  affectedType?: 'all' | 'land' | 'house';
  valueDeltaPercent?: number;
  rentalDeltaPercent?: number;
  conditionDelta?: number;
  cashCost?: Money;
}
