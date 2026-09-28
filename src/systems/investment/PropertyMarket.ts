import { PropertyItem } from '../../types/investment';

export const SELLING_TRANSACTION_FEE_PERCENT = 0.02; // 2% transaction fee

export class PropertyMarket {
  public static calculateSellingProceeds(property: PropertyItem): {
    grossPrice: number;
    fee: number;
    netReceived: number;
    realizedProfit: number;
  } {
    const grossPrice = property.currentMarketValue;
    const fee = Math.round(grossPrice * SELLING_TRANSACTION_FEE_PERCENT);
    const netReceived = grossPrice - fee;
    const purchaseCost = property.originalPurchasePrice || property.purchasePrice;
    const realizedProfit = netReceived - purchaseCost;

    return {
      grossPrice,
      fee,
      netReceived,
      realizedProfit,
    };
  }

  public static simulateMarketDay(properties: PropertyItem[]): PropertyItem[] {
    return properties.map((prop) => {
      // Fluctuate market value slightly (+/- 0.5% to 2% random trend)
      const changeRate = (Math.random() * 0.03) - 0.012; // -1.2% to +1.8%
      const newRawValue = Math.round(prop.currentMarketValue * (1 + changeRate));
      // Round to nearest 100k
      const roundedValue = Math.round(newRawValue / 100000) * 100000;

      return {
        ...prop,
        currentMarketValue: Math.max(Math.round(prop.purchasePrice * 0.5), roundedValue),
      };
    });
  }
}
