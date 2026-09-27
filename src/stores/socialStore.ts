import { create } from 'zustand';
import { SocialPost } from '../types';

interface SocialState {
  posts: SocialPost[];
  totalViews: number;
  totalLikes: number;
  followerCount: number;

  // Actions
  publishPost: (
    title: string,
    content: string,
    mediaType: 'photo' | 'video' | 'meme',
    cost: number,
    day: number
  ) => { success: boolean; post: SocialPost; trafficBoostDays: number };
  resetSocial: () => void;
}

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post_init_1',
    title: 'Khai trương xe sinh tố góc phố!',
    content: 'Xoài cát Cần Thơ chín cây, bơ sáp Đắk Lắk dẻo quánh xay cùng sữa tươi béo ngậy. Ghé ủng hộ tụi mình nhé!',
    mediaType: 'photo',
    cost: 0,
    day: 1,
    views: 340,
    likes: 48,
    trafficBoostDays: 1,
    sentiment: 'positive',
  },
];

export const useSocialStore = create<SocialState>((set, get) => ({
  posts: INITIAL_POSTS,
  totalViews: 340,
  totalLikes: 48,
  followerCount: 65,

  publishPost: (title, content, mediaType, cost, day) => {
    // Determine viral chance
    const rand = Math.random();
    let sentiment: 'positive' | 'neutral' | 'viral' | 'backfire' = 'positive';
    let multiplier = 1;
    let boostDays = 1;

    if (rand < 0.15) {
      sentiment = 'viral';
      multiplier = 8 + Math.floor(Math.random() * 10);
      boostDays = 3;
    } else if (rand < 0.8) {
      sentiment = 'positive';
      multiplier = 2 + Math.floor(Math.random() * 3);
      boostDays = 1;
    } else if (rand < 0.95) {
      sentiment = 'neutral';
      multiplier = 1;
      boostDays = 0;
    } else {
      sentiment = 'backfire';
      multiplier = 0.5;
      boostDays = 0;
    }

    const views = Math.round((500 + Math.random() * 1200) * multiplier);
    const likes = Math.round(views * (0.08 + Math.random() * 0.1));
    const newFollowers = Math.round(likes * 0.25);

    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      title,
      content,
      mediaType,
      cost,
      day,
      views,
      likes,
      trafficBoostDays: boostDays,
      sentiment,
    };

    set((state) => ({
      posts: [newPost, ...state.posts],
      totalViews: state.totalViews + views,
      totalLikes: state.totalLikes + likes,
      followerCount: state.followerCount + newFollowers,
    }));

    return { success: true, post: newPost, trafficBoostDays: boostDays };
  },

  resetSocial: () => {
    set({
      posts: INITIAL_POSTS,
      totalViews: 340,
      totalLikes: 48,
      followerCount: 65,
    });
  },
}));
