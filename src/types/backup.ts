import { GameSaveDataV1 } from '../services/SaveService';

export interface BackupMetadata {
  day: number;
  shopName: string;
  shopAvatar: string;
  shopLevel: number;
  cash: number;
  netWorth: number;
  propertiesCount: number;
  goldQuantity?: number;
  customersServed: number;
  totalReviews: number;
  averageRating: number;
  goodwill?: number;
  publicSentiment?: number;
  mapReviewSuspended?: boolean;
}

export interface BackupEnvelope {
  format: 'smoothie-hustle-backup';
  version: number;
  createdAt: string;
  gameVersion: string;
  metadata: BackupMetadata;
  saveData: GameSaveDataV1;
  checksum: string;
}

export type BackupErrorType = 
  | 'empty' 
  | 'invalid' 
  | 'corrupted' 
  | 'unsupported_version' 
  | 'migration_failed'
  | 'unknown';

export interface RestoreValidationResult {
  success: boolean;
  errorType?: BackupErrorType;
  errorMessage?: string;
  envelope?: BackupEnvelope;
}
