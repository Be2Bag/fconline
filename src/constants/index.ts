/**
 * Central export สำหรับ constants ทั้งหมด
 * Import จากที่นี่แทนการ import แยกไฟล์
 * 
 * @example
 * import { UPGRADE_LEVEL_COLORS, UPGRADE_MESSAGES } from '@/constants';
 */

// Colors
export {
    UPGRADE_LEVEL_COLORS,
    LEVEL_TIER_COLORS,
    getLevelTier,
    RARITY_COLORS,
    APP_COLORS,
    ANIMATION_COLORS,
} from './colors';

// Messages
export {
    UPGRADE_MESSAGES,
    BOX_MESSAGES,
    OVR_MESSAGES,
    POSITION_MESSAGES,
    RARITY_LABELS,
    RARITY_NAMES_TH,
    COMMON_MESSAGES,
} from './messages';

// Limits
export {
    STAT_LIMITS,
    OVR_LIMITS,
    SEARCH_LIMITS,
    BP_LIMITS,
    BP_SUFFIXES,
    ANIMATION_LIMITS,
} from './limits';
