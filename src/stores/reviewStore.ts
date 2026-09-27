import { create } from 'zustand';
import { ReviewItem } from '../types';

interface ReviewState {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewItem[];
  isViralBoostActive: boolean;
  viralDaysLeft: number;
  isCrisisActive: boolean;

  // Actions
  addReview: (review: Omit<ReviewItem, 'id' | 'date'>) => void;
  likeReview: (reviewId: string) => void;
  triggerViralReview: () => void;
  decrementViralDays: () => void;
  resolveCrisis: () => void;
  resetReviews: () => void;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev_1',
    authorName: 'Nguyễn Văn Tuấn',
    avatar: '👨‍💼',
    rating: 5,
    comment: 'Sinh tố bơ sáp siêu ngậy, nhiều sữa béo. Giá rất mềm so với khu này, uống xong tỉnh cả người!',
    date: '3 ngày trước',
    day: 0,
    recipeName: 'Sinh Tố Bơ Sáp',
    helpfulCount: 12,
    aspect: 'quality',
    isViral: true,
  },
  {
    id: 'rev_2',
    authorName: 'Bùi Gia Linh',
    avatar: '🎒',
    rating: 4,
    comment: 'Sinh tố xoài thơm ngọt tự nhiên, không bị gắt đường. Mỗi tội buổi trưa hơi đông phải đợi xíu.',
    date: '5 ngày trước',
    day: 0,
    recipeName: 'Sinh Tố Xoài',
    helpfulCount: 6,
    aspect: 'speed',
  },
  {
    id: 'rev_3',
    authorName: 'Trần Minh Trọng',
    avatar: '🏋️',
    rating: 4,
    comment: 'Anh chủ nhiệt tình, xin ít đường ít đá làm đúng y chang. Ghế nhựa ngồi vỉa hè thoáng mát.',
    date: '1 tuần trước',
    day: 0,
    recipeName: 'Sinh Tố Chuối',
    helpfulCount: 4,
    aspect: 'service',
  },
];

export const useReviewStore = create<ReviewState>((set, get) => ({
  averageRating: 4.3,
  totalReviews: 3,
  reviews: INITIAL_REVIEWS,
  isViralBoostActive: false,
  viralDaysLeft: 0,
  isCrisisActive: false,

  addReview: (review) => {
    const newId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReviewItem: ReviewItem = {
      ...review,
      id: newId,
      date: 'Hôm nay',
    };

    set((state) => {
      const updatedReviews = [newReviewItem, ...state.reviews];
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const newAvg = Number((sum / updatedReviews.length).toFixed(1));
      const isCrisis = newAvg < 2.8;

      return {
        reviews: updatedReviews,
        totalReviews: state.totalReviews + 1,
        averageRating: newAvg,
        isCrisisActive: isCrisis,
      };
    });
  },

  likeReview: (reviewId: string) => {
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      ),
    }));
  },

  triggerViralReview: () => {
    set({
      isViralBoostActive: true,
      viralDaysLeft: 2,
    });
  },

  decrementViralDays: () => {
    set((state) => {
      if (state.viralDaysLeft <= 1) {
        return { isViralBoostActive: false, viralDaysLeft: 0 };
      }
      return { viralDaysLeft: state.viralDaysLeft - 1 };
    });
  },

  resolveCrisis: () => {
    set({ isCrisisActive: false });
  },

  resetReviews: () => {
    set({
      averageRating: 4.3,
      totalReviews: 3,
      reviews: INITIAL_REVIEWS,
      isViralBoostActive: false,
      viralDaysLeft: 0,
      isCrisisActive: false,
    });
  },
}));
