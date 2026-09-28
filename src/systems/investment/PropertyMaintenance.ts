import { HouseProperty } from '../../types/investment';

export class PropertyMaintenance {
  public static calculateRenovationImpact(house: HouseProperty): {
    newCondition: number;
    newMarketValue: number;
    newRentalIncome: number;
  } {
    const newCondition = 100;
    // Renovation boosts market value by 18-25%
    const valueBoost = Math.round(house.currentMarketValue * 0.20);
    const newMarketValue = house.currentMarketValue + valueBoost;
    // Boosts rental income by 25%
    const newRentalIncome = Math.round((house.rentalIncomeMonthly * 1.25) / 50000) * 50000;

    return {
      newCondition,
      newMarketValue,
      newRentalIncome,
    };
  }

  public static decayHouseCondition(house: HouseProperty): HouseProperty {
    // Condition drops by 1-2% every 5 days if rented
    const decay = house.isRented ? 1.5 : 0.8;
    const nextCondition = Math.max(20, Number((house.condition - decay).toFixed(1)));

    return {
      ...house,
      condition: nextCondition,
    };
  }
}
