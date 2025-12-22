/**
 * Service สำหรับระบบตีบวกนักเตะ
 * รวม business logic ทั้งหมดที่เกี่ยวกับการตีบวก
 */

import type { UpgradeLevel, UpgradeResult } from '@/types';
import { UPGRADE_CONFIG } from '@/config';

// ===== Data =====
// ข้อมูลนี้ย้ายมาจาก upgradeChances.ts

/**
 * ข้อมูลการตีบวกทั้งหมด ตั้งแต่ +1 ถึง +13
 */
export const UPGRADE_DATA: UpgradeLevel[] = [
    { from: 1, to: 2, ovrGain: 1, totalOvr: 4, chance: 100 },
    { from: 2, to: 3, ovrGain: 1, totalOvr: 5, chance: 81 },
    { from: 3, to: 4, ovrGain: 2, totalOvr: 7, chance: 64 },
    { from: 4, to: 5, ovrGain: 2, totalOvr: 9, chance: 50 },
    { from: 5, to: 6, ovrGain: 2, totalOvr: 11, chance: 26 },
    { from: 6, to: 7, ovrGain: 3, totalOvr: 14, chance: 15 },
    { from: 7, to: 8, ovrGain: 4, totalOvr: 18, chance: 7 },
    { from: 8, to: 9, ovrGain: 2, totalOvr: 20, chance: 5 },
    { from: 9, to: 10, ovrGain: 2, totalOvr: 22, chance: 4 },
    { from: 10, to: 11, ovrGain: 2, totalOvr: 24, chance: 3 },
    { from: 11, to: 12, ovrGain: 3, totalOvr: 27, chance: 2 },
    { from: 12, to: 13, ovrGain: 3, totalOvr: 30, chance: 1 },
];

/**
 * อัตราสำเร็จพื้นฐาน (P_base) สำหรับแต่ละระดับ
 * ค่านี้คือโอกาสติดสูงสุดเมื่อหลอดเต็ม (5.0)
 */
export const BASE_CHANCE_MAP: Record<number, number> = {
    1: 100,
    2: 81,
    3: 64,
    4: 50,
    5: 26,
    6: 15,
    7: 7,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
};

// ===== Functions =====

/**
 * หาข้อมูลการอัพเกรดจากระดับปัจจุบัน
 * 
 * @param currentLevel - ระดับปัจจุบัน (1-12)
 * @returns ข้อมูลการอัพเกรด หรือ null ถ้าไม่พบ
 */
export function getUpgradeInfo(currentLevel: number): UpgradeLevel | null {
    return UPGRADE_DATA.find(d => d.from === currentLevel) || null;
}

/**
 * หา OVR bonus รวมจากระดับ +1 ถึงระดับปัจจุบัน
 * 
 * @param level - ระดับปัจจุบัน
 * @returns OVR bonus รวม
 */
export function getTotalOvrBonus(level: number): number {
    if (level <= 0) return 0;
    if (level === 1) return 3; // +1 = Base OVR + 3 (ค่าคงที่)

    const data = UPGRADE_DATA.find(d => d.to === level);
    return data?.totalOvr || 0;
}

/**
 * คำนวณระดับที่จะลดลงเมื่อตีบวกล้มเหลว
 * 
 * @param currentLevel - ระดับปัจจุบัน
 * @returns ระดับใหม่หลังล้มเหลว
 */
export function getLevelAfterFailure(currentLevel: number): { newLevel: number; isCatastrophic: boolean } {
    const { MIN_LEVEL, CATASTROPHIC_DROP_CHANCE, LEVEL_DROP_RULES } = UPGRADE_CONFIG;

    // +1 หรือต่ำกว่า ไม่ลดระดับ
    if (currentLevel <= MIN_LEVEL) {
        return { newLevel: MIN_LEVEL, isCatastrophic: false };
    }

    // ตรวจสอบ Catastrophic Drop
    const isCatastrophic = Math.random() * 100 < CATASTROPHIC_DROP_CHANCE;

    // หา rule ที่ตรง
    let dropMin: number;
    let dropMax: number;

    if (currentLevel <= LEVEL_DROP_RULES.LOW.maxLevel) {
        dropMin = isCatastrophic ? LEVEL_DROP_RULES.LOW.catastrophicMin : LEVEL_DROP_RULES.LOW.dropMin;
        dropMax = isCatastrophic ? LEVEL_DROP_RULES.LOW.catastrophicMax : LEVEL_DROP_RULES.LOW.dropMax;
    } else if (currentLevel <= LEVEL_DROP_RULES.MID.maxLevel) {
        dropMin = isCatastrophic ? LEVEL_DROP_RULES.MID.catastrophicMin : LEVEL_DROP_RULES.MID.dropMin;
        dropMax = isCatastrophic ? LEVEL_DROP_RULES.MID.catastrophicMax : LEVEL_DROP_RULES.MID.dropMax;
    } else if (currentLevel <= LEVEL_DROP_RULES.HIGH.maxLevel) {
        dropMin = isCatastrophic ? LEVEL_DROP_RULES.HIGH.catastrophicMin : LEVEL_DROP_RULES.HIGH.dropMin;
        dropMax = isCatastrophic ? LEVEL_DROP_RULES.HIGH.catastrophicMax : LEVEL_DROP_RULES.HIGH.dropMax;
    } else {
        dropMin = isCatastrophic ? LEVEL_DROP_RULES.EXTREME.catastrophicMin : LEVEL_DROP_RULES.EXTREME.dropMin;
        dropMax = isCatastrophic ? LEVEL_DROP_RULES.EXTREME.catastrophicMax : LEVEL_DROP_RULES.EXTREME.dropMax;
    }

    // สุ่มจำนวนที่ลด
    const drop = dropMin + Math.floor(Math.random() * (dropMax - dropMin + 1));
    const newLevel = Math.max(MIN_LEVEL, currentLevel - drop);

    return { newLevel, isCatastrophic };
}

/**
 * คำนวณอัตราสำเร็จจริง (P_success) จาก Boost Gauge
 * สูตร: P_success = P_base × (boostGauge / MAX_BOOST)
 * 
 * @param currentLevel - ระดับปัจจุบัน (1-12)
 * @param boostGauge - ค่า Boost Gauge (0.0 - 5.0)
 * @returns อัตราสำเร็จจริง (0-100%)
 */
export function calculateSuccessRate(currentLevel: number, boostGauge: number): number {
    const pBase = BASE_CHANCE_MAP[currentLevel] || 0;
    const { MAX_BOOST } = UPGRADE_CONFIG;

    const pSuccess = pBase * (boostGauge / MAX_BOOST);
    return Math.min(100, Math.round(pSuccess * 100) / 100);
}

/**
 * จำลองการตีบวก
 * 
 * @param currentLevel - ระดับปัจจุบัน
 * @param boostGauge - ค่า Boost Gauge (0.0 - 5.0)
 * @returns ผลลัพธ์การตีบวก
 */
export function simulateUpgrade(currentLevel: number, boostGauge: number): UpgradeResult {
    const { MAX_LEVEL } = UPGRADE_CONFIG;
    const successRate = calculateSuccessRate(currentLevel, boostGauge);

    // ถ้าถึง max level แล้ว
    if (currentLevel >= MAX_LEVEL) {
        return {
            success: false,
            previousLevel: currentLevel,
            newLevel: currentLevel,
            isCatastrophic: false,
        };
    }

    // สุ่มผลลัพธ์
    const roll = Math.random() * 100;
    const success = roll < successRate;

    if (success) {
        return {
            success: true,
            previousLevel: currentLevel,
            newLevel: currentLevel + 1,
            isCatastrophic: false,
        };
    } else {
        const { newLevel, isCatastrophic } = getLevelAfterFailure(currentLevel);
        return {
            success: false,
            previousLevel: currentLevel,
            newLevel,
            isCatastrophic,
        };
    }
}

/**
 * ตรวจสอบว่าถึง level สูงสุดหรือยัง
 */
export function isMaxLevel(level: number): boolean {
    return level >= UPGRADE_CONFIG.MAX_LEVEL;
}

/**
 * ตรวจสอบว่าเป็น level ต่ำสุดหรือไม่
 */
export function isMinLevel(level: number): boolean {
    return level <= UPGRADE_CONFIG.MIN_LEVEL;
}
