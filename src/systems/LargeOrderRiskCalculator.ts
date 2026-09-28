import { LargeOrderRiskTier } from '../types/largeOrder';

export interface RiskCalculationParams {
  baseReliability: number; // 0 to 100
  depositPercent: number; // 0, 0.3, 0.5, 1.0
  quantity: number;
  isUrgent?: boolean;
  averageRating: number; // 1 to 5
  previousCancellations?: number;
  completedOrders?: number;
}

export class LargeOrderRiskCalculator {
  public static calculateRisk(params: RiskCalculationParams): {
    riskPercent: number; // 0.05 = 5%
    riskTier: LargeOrderRiskTier;
    riskTierLabel: string;
    riskColorClass: string;
    riskBgClass: string;
  } {
    // Base risk inverted from reliability: 90% reliability -> ~10% base risk
    let risk = (100 - params.baseReliability) / 100;

    // Previous history modifiers
    if (params.completedOrders && params.completedOrders > 0) {
      risk -= Math.min(0.08, params.completedOrders * 0.02); // -2% per completed order up to -8%
    }
    if (params.previousCancellations && params.previousCancellations > 0) {
      risk += Math.min(0.20, params.previousCancellations * 0.08); // +8% per past cancel
    }

    // Deposit modifier
    if (params.depositPercent >= 1.0) {
      risk -= 0.20;
    } else if (params.depositPercent >= 0.5) {
      risk -= 0.15;
    } else if (params.depositPercent >= 0.3) {
      risk -= 0.10;
    } else {
      risk += 0.05; // No deposit is risky
    }

    // Quantity size modifier
    if (params.quantity >= 120) {
      risk += 0.10;
    } else if (params.quantity >= 70) {
      risk += 0.05;
    }

    // Urgency modifier
    if (params.isUrgent) {
      risk += 0.05;
    }

    // Shop reputation modifier
    if (params.averageRating >= 4.5) {
      risk -= 0.03;
    } else if (params.averageRating < 3.5) {
      risk += 0.06;
    }

    // Clamp between 3% and 55%
    const finalRisk = Math.max(0.03, Math.min(0.55, Number(risk.toFixed(2))));

    const tier = this.getRiskTier(finalRisk);

    return {
      riskPercent: finalRisk,
      riskTier: tier.tier,
      riskTierLabel: tier.label,
      riskColorClass: tier.colorClass,
      riskBgClass: tier.bgClass,
    };
  }

  public static getRiskTier(riskPercent: number): {
    tier: LargeOrderRiskTier;
    label: string;
    colorClass: string;
    bgClass: string;
  } {
    if (riskPercent <= 0.08) {
      return {
        tier: 'very_low',
        label: '🟢 Rất Thấp (An toàn)',
        colorClass: 'text-emerald-700 font-black',
        bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (riskPercent <= 0.15) {
      return {
        tier: 'low',
        label: '🟡 Thấp (Ổn định)',
        colorClass: 'text-amber-700 font-black',
        bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    if (riskPercent <= 0.25) {
      return {
        tier: 'medium',
        label: '🟠 Trung Bình (Có rủi ro)',
        colorClass: 'text-orange-700 font-black',
        bgClass: 'bg-orange-100 text-orange-800 border-orange-300',
      };
    }
    if (riskPercent <= 0.40) {
      return {
        tier: 'high',
        label: '🔴 Cao (Dễ bị huỷ)',
        colorClass: 'text-rose-700 font-black',
        bgClass: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    return {
      tier: 'extreme',
      label: '💀 Cực Cao (Nguy hiểm)',
      colorClass: 'text-purple-700 font-black',
      bgClass: 'bg-purple-100 text-purple-800 border-purple-300',
    };
  }
}
