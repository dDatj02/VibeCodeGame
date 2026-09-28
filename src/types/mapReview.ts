export type ReplySentiment = 'positive' | 'neutral' | 'negative';
export type AnalysisLevel = 'high' | 'medium' | 'low';

export interface ReplyAnalysisResult {
  replyText: string;
  createdAt: number;
  sentiment: ReplySentiment;
  politeness: AnalysisLevel;
  empathy: AnalysisLevel;
  defensive: boolean;
  toxicity: AnalysisLevel;
  isAiAnalyzed?: boolean;
}

export interface ReplyGameplayEffect {
  goodwillEffect: number; // e.g. +5 or -12
  publicSentimentEffect: number; // e.g. +4 or -10
  reportChance: number; // 0 to 1
  viralChance: number; // 0 to 1
  trafficBonusPercent: number; // e.g. +12 or -10
  toneTitle: string; // e.g. "Lịch sự & Cầu thị"
  explanation: string;
}

export interface OwnerReplyOption {
  id: string;
  text: string;
  sentiment: ReplySentiment;
  toneTitle: string;
  goodwillEffect: number;
  publicSentimentEffect: number;
  reportChance: number;
  viralChance: number;
  trafficBonusPercent: number;
  explanation: string;
}

export interface MapReviewModeration {
  reportCount: number; // Current active reports (0 to 5)
  reportThreshold: number; // Default 5
  totalReports: number; // Lifetime total reports
  suspensionCount: number; // Lifetime suspensions
  isSuspended: boolean;
  suspensionStartedAtDay?: number;
  appealAttempts: number;
  failedAppeals: number;
  itRecoveryCost: number; // 500,000 VND base + failedAppeals * 250,000 VND
  activeBuzzType?: 'positive' | 'negative' | null;
  buzzDaysLeft: number;
  buzzTrafficModifier: number; // e.g. +15 for +15%, -10 for -10%
  buzzDescription: string;
}

export interface ModerationCheckResult {
  triggered: boolean;
  suspensionChance: number; // percentage (e.g. 35)
  isSuspended: boolean;
  reportsReset: boolean;
  message: string;
}

export interface ReplyResult {
  success: boolean;
  goodwillChange: number;
  publicSentimentChange: number;
  wasReported: boolean;
  newReportCount: number;
  viralTriggered: boolean;
  viralMessage?: string;
  moderationResult?: ModerationCheckResult;
  analysis?: ReplyAnalysisResult;
  gameplayEffect?: ReplyGameplayEffect;
}
