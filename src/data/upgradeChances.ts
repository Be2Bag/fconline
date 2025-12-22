/**
 * ข้อมูลอัตราความสำเร็จการตีบวกนักเตะ FC Online
 * อ้างอิงจากข้อมูลล่าสุดของ Garena (อัพเดท พ.ย. 2024)
 * 
 * ==================================================
 * วิธีแก้ไขอัตราตีบวก:
 * ==================================================
 * 1. แก้ไขค่า chance ใน UPGRADE_DATA สำหรับอัตราสำเร็จ
 * 2. แก้ไข BASE_CHANCE_MAP สำหรับอัตราพื้นฐาน (Boost Gauge)
 * 3. แก้ไข LEVEL_COLORS สำหรับสีแต่ละระดับ
 * ==================================================
 */

import type { UpgradeLevel } from '@/types';

// Re-export type for backward compatibility
export type { UpgradeLevel };

/**
 * ข้อมูลการตีบวกทั้งหมด ตั้งแต่ +1 ถึง +13
 * 
 * - from: ระดับเริ่มต้น
 * - to: ระดับที่จะอัพ
 * - ovrGain: OVR ที่เพิ่มในครั้งนี้
 * - totalOvr: OVR รวมที่เพิ่มจาก +1
 * - chance: เปอร์เซ็นต์ความสำเร็จ (เมื่อหลอดเต็ม)
 */
export const UPGRADE_DATA: UpgradeLevel[] = [
    { from: 1, to: 2, ovrGain: 1, totalOvr: 4, chance: 100 },   // +1 → +2
    { from: 2, to: 3, ovrGain: 1, totalOvr: 5, chance: 81 },    // +2 → +3
    { from: 3, to: 4, ovrGain: 2, totalOvr: 7, chance: 64 },    // +3 → +4
    { from: 4, to: 5, ovrGain: 2, totalOvr: 9, chance: 50 },    // +4 → +5
    { from: 5, to: 6, ovrGain: 2, totalOvr: 11, chance: 26 },   // +5 → +6
    { from: 6, to: 7, ovrGain: 3, totalOvr: 14, chance: 15 },   // +6 → +7
    { from: 7, to: 8, ovrGain: 4, totalOvr: 18, chance: 7 },    // +7 → +8
    { from: 8, to: 9, ovrGain: 2, totalOvr: 20, chance: 5 },    // +8 → +9
    { from: 9, to: 10, ovrGain: 2, totalOvr: 22, chance: 4 },   // +9 → +10
    { from: 10, to: 11, ovrGain: 2, totalOvr: 24, chance: 3 },  // +10 → +11
    { from: 11, to: 12, ovrGain: 3, totalOvr: 27, chance: 2 },  // +11 → +12
    { from: 12, to: 13, ovrGain: 3, totalOvr: 30, chance: 1 },  // +12 → +13
];

/**
 * อัตราสำเร็จพื้นฐาน (P_base) สำหรับแต่ละระดับ
 * ค่านี้คือโอกาสติดสูงสุดเมื่อหลอดเต็ม (5.0)
 * 
 * สูตร: P_success = P_base × (Boost Gauge / 5.0)
 */
export const BASE_CHANCE_MAP: Record<number, number> = {
    1: 100,   // +1 → +2: 100%
    2: 81,    // +2 → +3: 81%
    3: 64,    // +3 → +4: 64%
    4: 50,    // +4 → +5: 50%
    5: 26,    // +5 → +6: 26%
    6: 15,    // +6 → +7: 15%
    7: 7,     // +7 → +8: 7%
    8: 5,     // +8 → +9: 5%
    9: 4,     // +9 → +10: 4%
    10: 3,    // +10 → +11: 3%
    11: 2,    // +11 → +12: 2%
    12: 1,    // +12 → +13: 1%
};

/**
 * สีของระดับบวกแต่ละช่วง
 * ใช้สำหรับแสดงสี badge และ effects
 */
export const LEVEL_COLORS: Record<number, string> = {
    1: '#6B7280',   // เทาเข้ม (Gray)
    2: '#CD7F32',   // บรอนซ์ (Bronze)
    3: '#CD7F32',   // บรอนซ์
    4: '#CD7F32',   // บรอนซ์
    5: '#9CA3AF',   // เงิน (Silver)
    6: '#9CA3AF',   // เงิน
    7: '#9CA3AF',   // เงิน
    8: '#EAB308',   // ทอง (Gold)
    9: '#EAB308',   // ทอง
    10: '#A78BFA',  // Rainbow (ม่วงอ่อน)
    11: '#A78BFA',  // Rainbow
    12: '#A78BFA',  // Rainbow
    13: '#A78BFA',  // Rainbow (พร้อมดาว)
};

// ===== Re-export functions from services =====
// สำหรับ backward compatibility กับ code ที่ import จากที่นี่
export {
    getUpgradeInfo,
    getTotalOvrBonus,
    calculateSuccessRate,
} from '@/services';

// Import the new function to create wrapper
import { getLevelAfterFailure as getLevelAfterFailureNew } from '@/services';

/**
 * Wrapper for backward compatibility
 * Original function returned just number, new returns { newLevel, isCatastrophic }
 */
export function getLevelAfterFailure(currentLevel: number): number {
    const result = getLevelAfterFailureNew(currentLevel);
    return result.newLevel;
}

/**
 * Legacy function name: simulateUpgradeWithBoost
 * Returns true/false for backward compatibility
 */
export function simulateUpgradeWithBoost(currentLevel: number, boostGauge: number): boolean {
    // Import here to avoid circular dependency
    const { simulateUpgrade: simulate } = require('@/services');
    const result = simulate(currentLevel, boostGauge);
    return result.success;
}

// Export new simulateUpgrade that returns UpgradeResult object
export { simulateUpgrade } from '@/services';
