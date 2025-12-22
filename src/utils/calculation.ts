/**
 * OVR Calculation utilities for FC Online
 * 
 * ไฟล์นี้ยังคงอยู่เพื่อ backward compatibility
 * แนะนำให้ใช้ import จาก @/services หรือ @/types แทน
 */

// Re-export types from @/types
export type { StatValues, EfficientUpgradeResult } from '@/types';

// Re-export StatWeight from ovrWeights for backward compatibility
export type { StatWeight } from '@/data/ovrWeights';

// Re-export UpgradeImpactResult as UpgradeResult for backward compatibility
export type { UpgradeImpactResult as UpgradeResult } from '@/types';

// Re-export functions from @/services
export {
    calculateOVR,
    calculateUpgradedOVR,
    getOptimalUpgrades,
    getEfficientUpgrades,
    formatOVR,
    getUpgradeImpact,
} from '@/services';
