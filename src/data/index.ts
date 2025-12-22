/**
 * Central export สำหรับ data ทั้งหมด
 * Import จากที่นี่แทนการ import แยกไฟล์
 * 
 * @example
 * import { UPGRADE_DATA, ALL_BOXES, ovrWeights } from '@/data';
 */

// Upgrade data
export {
    UPGRADE_DATA,
    BASE_CHANCE_MAP,
    LEVEL_COLORS,
} from './upgradeChances';

// Box data
export {
    BP_BOX_DEC_2025,
    CHAMPIONS_CHEST_DEC_2025,
    ALL_BOXES,
} from './boxData';

// OVR weights
export {
    ovrWeights,
    positionList,
    getAllStats,
} from './ovrWeights';

// All stats
export {
    allPlayerStats,
    statNameMapping,
} from './allStats';
