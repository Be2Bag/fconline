/**
 * Central export สำหรับ services ทั้งหมด
 * Import จากที่นี่แทนการ import แยกไฟล์
 * 
 * @example
 * import { simulateUpgrade, openBox, calculateOVR } from '@/services';
 */

// Upgrade Service
export {
    UPGRADE_DATA,
    BASE_CHANCE_MAP,
    getUpgradeInfo,
    getTotalOvrBonus,
    getLevelAfterFailure,
    calculateSuccessRate,
    simulateUpgrade,
    isMaxLevel,
    isMinLevel,
} from './upgradeService';

// Box Service
export {
    formatBP,
    openBox,
    openMultipleBoxes,
    calculateTotalValue,
    findBestReward,
    countByRarity,
    calculateProfitLoss,
} from './boxService';

// OVR Service
export {
    calculateOVR,
    calculateUpgradedOVR,
    getOptimalUpgrades,
    getEfficientUpgrades,
    analyzePositions,
    formatOVR,
    getUpgradeImpact,
} from './ovrService';

// Player Service
export {
    searchPlayers,
    getPlayerImageUrl,
    getPlayerOvr,
    isHashId,
    getDirectImageUrl,
} from './playerService';

// Tax Service
export {
    MARKET_TAX_RATE,
    PC_DISCOUNT_RATE,
    CP_DISCOUNT_OPTIONS,
    SVIP_DISCOUNT_OPTIONS,
    calculateNetPrice,
    calculateTotalSummary,
    generateItemId,
    createNewPlayerItem,
    formatNumber,
    formatShortNumber,
} from './taxService';
