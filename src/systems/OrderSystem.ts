import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useCustomerStore } from '../stores/customerStore';
import { useEconomyStore } from '../stores/economyStore';
import { useReviewStore } from '../stores/reviewStore';
import { useShopStore } from '../stores/shopStore';
import { useGameStore } from '../stores/gameStore';
import { audioService } from '../services/AudioService';
import { CUSTOMER_ARCHETYPES } from '../data/customers';

export class OrderSystem {
  public static serveOrder(customerId: string, servedIngredients?: string[]): {
    success: boolean;
    revenue: number;
    tip: number;
    message?: string;
  } {
    const custStore = useCustomerStore.getState();
    const customer = custStore.activeCustomers.find((c) => c.id === customerId);
    if (!customer) {
      return { success: false, revenue: 0, tip: 0, message: 'Khách hàng không tồn tại' };
    }

    const recipeStore = useRecipeStore.getState();
    const recipe = recipeStore.getRecipeById(customer.desiredRecipeId);
    if (!recipe) {
      return { success: false, revenue: 0, tip: 0, message: 'Không tìm thấy công thức' };
    }

    const invStore = useInventoryStore.getState();
    if (!invStore.hasEnoughIngredients(recipe.ingredients)) {
      audioService.playDisappointed();
      useGameStore.getState().showNotification(`Không đủ nguyên liệu để làm ${recipe.name}! Hãy nhập thêm.`, 'error');
      return { success: false, revenue: 0, tip: 0, message: 'Không đủ nguyên liệu' };
    }

    // Consume ingredients
    invStore.consumeIngredients(recipe.ingredients);
    const ingredientCost = invStore.calculateRecipeIngredientCost(recipe.ingredients);

    // Calculate tip based on archetype & wait speed
    const archetype = CUSTOMER_ARCHETYPES.find((a) => a.id === customer.archetypeId);
    const patienceRatio = customer.remainingPatience / customer.maxPatience;
    let tip = 0;

    // Customization compliance check
    let customizationBonus = 0;
    let customizationViolated = false;

    if (servedIngredients && servedIngredients.length > 0) {
      const hasAnySugar = servedIngredients.some((id) => id === 'sugar' || id === 'sugar_regular' || id === 'sugar_less');
      const hasSugarLess = servedIngredients.includes('sugar_less');
      const hasSugarRegular = servedIngredients.includes('sugar_regular') || servedIngredients.includes('sugar');

      const hasIceLess = servedIngredients.includes('ice_less');
      const hasIceRegular = servedIngredients.includes('ice_regular') || servedIngredients.includes('ice');
      const hasAnyIce = hasIceLess || hasIceRegular;

      const hasMilk = servedIngredients.includes('milk');

      // Sugar check
      if (customer.sugarPreference === 'no_sugar') {
        if (!hasAnySugar) customizationBonus += 0.5;
        else customizationViolated = true;
      } else if (customer.sugarPreference === 'less_sugar') {
        if (hasSugarLess) customizationBonus += 0.5;
        else if (hasSugarRegular) customizationViolated = true;
      }

      // Ice check (smoothies always have ice: less_ice vs regular)
      if (customer.icePreference === 'less_ice') {
        if (hasIceLess) customizationBonus += 0.5;
        else if (hasIceRegular) customizationViolated = true;
      } else {
        if (hasIceRegular) customizationBonus += 0.2;
      }

      // Milk check
      if (customer.milkPreference === 'no_milk') {
        if (!hasMilk) customizationBonus += 0.5;
        else customizationViolated = true;
      }
    }

    if (archetype && (Math.random() < archetype.tipChance || customizationBonus > 0) && patienceRatio > 0.35 && !customizationViolated) {
      // 5.000đ to 15.000đ tip (extra bonus if custom request honored)
      const baseTip = 5000 + Math.random() * 10000 + (customizationBonus > 0 ? 5000 : 0);
      tip = Math.round((baseTip * archetype.budgetMultiplier) / 1000) * 1000;
    }

    const totalRevenue = recipe.currentSellingPrice + tip;

    // Credit cash
    useEconomyStore.getState().addCash(totalRevenue);
    custStore.recordSale(totalRevenue, ingredientCost);

    // Play sounds
    audioService.playBlender(0.8);
    setTimeout(() => {
      audioService.playCashRegister();
    }, 400);

    // Calculate satisfaction (1.0 to 5.0)
    const cleanliness = useShopStore.getState().cleanliness;
    const cleanlinessFactor = cleanliness / 100;
    let satisfaction = Math.min(
      5,
      Math.max(1, Number((2.0 + patienceRatio * 2.0 + (cleanlinessFactor - 0.5) * 1.0 + customizationBonus - (customizationViolated ? 1.5 : 0)).toFixed(1)))
    );

    // Chance to write a review (boosted so players see reviews regularly)
    const reviewChance = (satisfaction >= 4.5 || customizationBonus > 0) ? 0.55 : satisfaction <= 2.5 ? 0.7 : 0.4;
    if (Math.random() < reviewChance) {
      this.generateReviewForOrder(customer.name, recipe.name, satisfaction, patienceRatio, cleanliness, customizationViolated);
    }

    // Remove customer
    custStore.serveCustomer(customerId);

    const tipMsg = tip > 0 ? ` (+${tip.toLocaleString('vi-VN')}đ tiền tip!)` : '';
    useGameStore.getState().showNotification(`Đã phục vụ ${recipe.name} cho ${customer.name}${tipMsg}`, 'success');

    return { success: true, revenue: totalRevenue, tip };
  }

  private static generateReviewForOrder(
    authorName: string,
    recipeName: string,
    satisfaction: number,
    patienceRatio: number,
    cleanliness: number,
    customizationViolated: boolean = false
  ) {
    const stars = Math.min(5, Math.max(1, Math.round(satisfaction)));
    let comment = '';
    let aspect: 'quality' | 'speed' | 'price' | 'cleanliness' | 'service' = 'quality';

    if (stars === 5) {
      const positiveComments = [
        `Món ${recipeName} quá đỉnh! Trái cây tươi ngọt đậm đà, không bị ngọt gắt đá. Chắc chắn sẽ ủng hộ dài dài.`,
        `Quán phục vụ nhanh, nước ngon xuất sắc. Vị béo bùi vừa vặn đúng gu của mình luôn!`,
        `Sinh tố chất lượng 5 sao, ly đầy ắp trái cây tươi. Anh chủ rất niềm nở dễ thương!`,
        `Thử ${recipeName} lần đầu mà mê luôn, vừa thơm vừa mát lạnh sảng khoái.`,
      ];
      comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      aspect = 'quality';
      audioService.playFanfare();
    } else if (stars === 4) {
      const fourStarComments = [
        `Ngon, hương vị tươi mát. Điểm trừ nhẹ là quán vỉa hè giờ cao điểm hơi đông một tí.`,
        `${recipeName} rất ổn áp, giá cả hợp lý so với mặt bằng chung. Sẽ ghé lại.`,
        `Uống thanh mát, đúng yêu cầu ít ngọt của mình. Rất ưng bụng.`,
      ];
      comment = fourStarComments[Math.floor(Math.random() * fourStarComments.length)];
      aspect = 'service';
    } else if (stars === 3) {
      const threeStarComments = [
        `Vị tạm ổn nhưng hơi nhiều đá, tan ra bị loãng nhẹ. Mong quán cải thiện.`,
        `Uống bình thường như mọi quán khác, không có gì quá nổi bật.`,
        `Giá hơi nhỉnh một chút so với dung tích ly, nhưng uống cũng được.`,
      ];
      comment = threeStarComments[Math.floor(Math.random() * threeStarComments.length)];
      aspect = 'price';
    } else {
      if (customizationViolated) {
        comment = `Đã dặn kỹ yêu cầu riêng rồi mà quán vẫn làm ẩu (cho nhầm đường/đá/sữa). Rất thất vọng!`;
        aspect = 'service';
      } else if (patienceRatio < 0.25) {
        comment = `Đợi mòn mỏi gần cả tiếng mới có ly ${recipeName}. Phục vụ quá chậm chạp, bực cả mình!`;
        aspect = 'speed';
      } else if (cleanliness < 50) {
        comment = `Quầy bar nhìn hơi bừa bộn, cần chú ý vệ sinh hơn để khách yên tâm.`;
        aspect = 'cleanliness';
      } else {
        comment = `Không hợp khẩu vị chút nào, đá xay còn lợn cợn và thiếu vị ngọt thơm.`;
        aspect = 'quality';
      }
      audioService.playDisappointed();
    }

    useReviewStore.getState().addReview({
      authorName,
      avatar: stars >= 4 ? '😊' : stars === 3 ? '😐' : '😠',
      rating: stars,
      comment,
      day: useGameStore.getState().day,
      recipeName,
      helpfulCount: Math.floor(Math.random() * 5),
      aspect,
    });

    // Notify player that a new review was published
    useGameStore.getState().showNotification(
      `⭐ ${authorName} vừa đánh giá ${stars} sao cho quán!`,
      stars >= 4 ? 'success' : stars === 3 ? 'info' : 'warning'
    );
  }
}
