import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useCustomerStore } from '../stores/customerStore';
import { useEconomyStore } from '../stores/economyStore';
import { useReviewStore } from '../stores/reviewStore';
import { useShopStore } from '../stores/shopStore';
import { useGameStore } from '../stores/gameStore';
import { audioService } from '../services/AudioService';
import { CUSTOMER_ARCHETYPES } from '../data/customers';
import { IngredientRequirement } from '../types';

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

    // Map served ingredients (or construct default requirements if servedIngredients omitted)
    const requiredItems: IngredientRequirement[] = [];
    
    if (servedIngredients && servedIngredients.length > 0) {
      // 1 cup is always consumed
      requiredItems.push({ ingredientId: 'cup', amount: 1, unit: 'ly' });
      
      const counts: Record<string, number> = {};
      servedIngredients.forEach((ingId) => {
        const stockId = ingId.startsWith('ice') ? 'ice' : ingId.startsWith('sugar') ? 'sugar' : ingId;
        counts[stockId] = (counts[stockId] || 0) + 1;
      });

      Object.entries(counts).forEach(([ingId, amount]) => {
        requiredItems.push({ ingredientId: ingId, amount, unit: 'phần' });
      });
    } else {
      // Fallback default recipe requirements
      requiredItems.push(...recipe.ingredients);
    }

    if (!invStore.hasEnoughIngredients(requiredItems)) {
      audioService.playDisappointed();
      useGameStore.getState().showNotification(`Không đủ nguyên liệu để làm ${recipe.name}! Hãy nhập thêm.`, 'error');
      return { success: false, revenue: 0, tip: 0, message: 'Không đủ nguyên liệu' };
    }

    // Consume exact used ingredients from inventory
    invStore.consumeIngredients(requiredItems);
    const ingredientCost = invStore.calculateRecipeIngredientCost(requiredItems);

    // Evaluate mistakes in ingredients, sugar, ice, milk
    let fruitMistake = false;
    let sugarMistake = false;
    let iceMistake = false;
    let milkMistake = false;
    const mistakeDetails: string[] = [];

    if (servedIngredients && servedIngredients.length > 0) {
      // 1. Check Fruits/Special recipe ingredients
      const requiredFruits = recipe.ingredients
        .filter((i) => i.ingredientId !== 'milk' && i.ingredientId !== 'sugar' && i.ingredientId !== 'ice' && i.ingredientId !== 'cup')
        .map((i) => i.ingredientId);

      const servedFruits = servedIngredients.filter(
        (id) => !id.startsWith('ice') && !id.startsWith('sugar') && id !== 'milk' && id !== 'cup'
      );

      const missingFruit = requiredFruits.some((rf) => !servedFruits.includes(rf));
      const wrongFruit = servedFruits.some((sf) => !requiredFruits.includes(sf));

      if (missingFruit || wrongFruit) {
        fruitMistake = true;
        mistakeDetails.push('làm nhầm / thiếu trái cây chính');
      }

      // 2. Check Sugar preference
      const hasSugarLess = servedIngredients.includes('sugar_less');
      const hasSugarRegular = servedIngredients.includes('sugar_regular') || servedIngredients.includes('sugar');
      const hasAnySugar = hasSugarLess || hasSugarRegular;

      if (customer.sugarPreference === 'no_sugar') {
        if (hasAnySugar) {
          sugarMistake = true;
          mistakeDetails.push('cho đường dù đã dặn 0% đường');
        }
      } else if (customer.sugarPreference === 'less_sugar') {
        if (!hasSugarLess) {
          sugarMistake = true;
          mistakeDetails.push('không làm đúng 50% đường');
        }
      } else { // 'regular' (100%)
        if (!hasSugarRegular) {
          sugarMistake = true;
          mistakeDetails.push('không làm đúng 100% đường chuẩn');
        }
      }

      // 3. Check Ice preference
      const hasIceLess = servedIngredients.includes('ice_less');
      const hasIceRegular = servedIngredients.includes('ice_regular') || servedIngredients.includes('ice');

      if (customer.icePreference === 'less_ice') {
        if (!hasIceLess) {
          iceMistake = true;
          mistakeDetails.push('không làm đúng 50% đá');
        }
      } else { // 'regular' (100%)
        if (!hasIceRegular) {
          iceMistake = true;
          mistakeDetails.push('không làm đúng 100% đá chuẩn');
        }
      }

      // 4. Check Milk preference
      const hasMilk = servedIngredients.includes('milk');
      if (customer.milkPreference === 'no_milk') {
        if (hasMilk) {
          milkMistake = true;
          mistakeDetails.push('lỡ cho sữa tươi dù dặn không sữa');
        }
      } else {
        if (!hasMilk) {
          milkMistake = true;
          mistakeDetails.push('thiếu sữa tươi');
        }
      }
    }

    const hasAnyMistake = fruitMistake || sugarMistake || iceMistake || milkMistake;

    const archetype = CUSTOMER_ARCHETYPES.find((a) => a.id === customer.archetypeId);
    const patienceRatio = customer.remainingPatience / customer.maxPatience;
    let tip = 0;
    let totalRevenue = 0;

    if (hasAnyMistake) {
      // Penalty for mistake: 0 tip, revenue cut by 50%, 100% GUARANTEED 1-STAR BAD REVIEW
      tip = 0;
      totalRevenue = Math.round(recipe.currentSellingPrice * 0.5);
      audioService.playDisappointed();

      // Always publish 1-star review for mistake
      let comment = `Làm sai ly rồi! (${mistakeDetails.join(', ')}). Rất thất vọng, 1 sao cạch mặt quán!`;
      if (fruitMistake) {
        comment = `Tôi gọi ${recipe.name} mà làm sai lộn trái cây nguyên liệu! Uống không ra làm sao cả. 1 sao!`;
      } else if (sugarMistake) {
        comment = `Quán làm sai mức đường của tôi rồi! Đã dặn kỹ mà làm không đúng. 1 sao!`;
      } else if (iceMistake) {
        comment = `Tôi dặn lượng đá khác mà quán làm nhầm đá! Phục vụ quá kém, 1 sao!`;
      } else if (milkMistake) {
        comment = `Tôi dặn không cho sữa mà vẫn làm ẩu cho sữa vào! Quá cẩu thả, 1 sao!`;
      }

      useReviewStore.getState().addReview({
        authorName: customer.name,
        avatar: '😠',
        rating: 1,
        comment,
        day: useGameStore.getState().day,
        recipeName: recipe.name,
        helpfulCount: Math.floor(Math.random() * 4) + 1,
        aspect: fruitMistake ? 'quality' : 'service',
      });

      useGameStore.getState().showNotification(
        `❌ ${customer.name} rất tức giận vì nhận ly sai yêu cầu! Đã để lại đánh giá 1 sao (Trừ 50% tiền món)`,
        'error'
      );
    } else {
      // Perfect order!
      const customizationBonus = 0.5;
      if (archetype && (Math.random() < archetype.tipChance || customizationBonus > 0) && patienceRatio > 0.35) {
        const baseTip = 5000 + Math.random() * 10000 + 5000;
        tip = Math.round((baseTip * archetype.budgetMultiplier) / 1000) * 1000;
      }

      totalRevenue = recipe.currentSellingPrice + tip;

      audioService.playBlender(0.8);
      setTimeout(() => {
        audioService.playCashRegister();
      }, 300);

      // Cleanliness factor & review
      const cleanliness = useShopStore.getState().cleanliness;
      const cleanlinessFactor = cleanliness / 100;
      const satisfaction = Math.min(
        5,
        Math.max(4, Number((3.5 + patienceRatio * 1.0 + (cleanlinessFactor - 0.5) * 0.8).toFixed(1)))
      );

      if (Math.random() < 0.6) {
        this.generateReviewForOrder(customer.name, recipe.name, satisfaction, patienceRatio, cleanliness, false);
      }

      const tipMsg = tip > 0 ? ` (+${tip.toLocaleString('vi-VN')}đ tiền tip!)` : '';
      useGameStore.getState().showNotification(`✨ Đã phục vụ hoàn hảo ${recipe.name} cho ${customer.name}${tipMsg}`, 'success');
    }

    // Credit cash
    useEconomyStore.getState().addCash(totalRevenue);
    custStore.recordSale(totalRevenue, ingredientCost);

    // Remove customer
    custStore.serveCustomer(customerId);

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
        `${recipeName} rất ổn áp, giá cả hợp lý so me với mặt bằng chung. Sẽ ghé lại.`,
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
