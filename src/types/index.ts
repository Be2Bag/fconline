/**
 * Central export สำหรับ types ทั้งหมด
 * Import จากที่นี่แทนการ import แยกไฟล์
 * 
 * @example
 * import { Player, UpgradeLevel, BoxType } from '@/types';
 */

// Player types
export type {
    Player,
    PlayerPosition,
    PlayerSearchResult,
    PlayerOvrResult,
} from './player';

// Upgrade system types
export type {
    UpgradeLevel,
    UpgradeStats,
    UpgradeResult,
    UpgradeAnimationState,
    LevelTier,
    CardState,
} from './upgrade';

// Box system types
export type {
    Rarity,
    ValueUnit,
    BoxReward,
    BoxType,
    OpenResult,
    BoxStats,
    BoxAnimationState,
    RarityColor,
} from './box';

// OVR calculation types
export type {
    StatWeight,
    PositionWeights,
    StatValues,
    UpgradeImpactResult,
    EfficientUpgradeResult,
    PositionAnalysisResult,
} from './ovr';

// Tax calculator types
export type {
    CPDiscountRate,
    SVIPDiscountRate,
    TaxPlayerItem,
    TaxGlobalSettings,
    TaxCalculationResult,
    TaxTotalSummary,
} from './tax';

// Chat types
export type {
    ChatMessage,
    SendMessagePayload,
    ChatResponse,
} from './chat';
