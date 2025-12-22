/**
 * ข้อมูลอัตราความสำเร็จการตีบวกนักเตะ FC Online
 * อ้างอิงจากข้อมูลล่าสุดของ Garena (อัพเดท พ.ย. 2024)
 */

export interface UpgradeLevel {
    /** ระดับเริ่มต้น */
    from: number;
    /** ระดับที่จะอัพ */
    to: number;
    /** OVR ที่เพิ่มขึ้นในครั้งนี้ */
    ovrGain: number;
    /** OVR รวมที่เพิ่มจาก +1 */
    totalOvr: number;
    /** เปอร์เซ็นต์ความสำเร็จ */
    chance: number;
}

/**
 * ข้อมูลการตีบวกทั้งหมด ตั้งแต่ +1 ถึง +13
 */
export const UPGRADE_DATA: UpgradeLevel[] = [
    { from: 1, to: 2, ovrGain: 1, totalOvr: 4, chance: 100 },   // +1 → +2: 121 → 122 (+1)
    { from: 2, to: 3, ovrGain: 1, totalOvr: 5, chance: 81 },    // +2 → +3: 122 → 123 (+1)
    { from: 3, to: 4, ovrGain: 2, totalOvr: 7, chance: 64 },    // +3 → +4: 123 → 125 (+2)
    { from: 4, to: 5, ovrGain: 2, totalOvr: 9, chance: 50 },    // +4 → +5: 125 → 127 (+2)
    { from: 5, to: 6, ovrGain: 2, totalOvr: 11, chance: 26 },   // +5 → +6: 127 → 129 (+2)
    { from: 6, to: 7, ovrGain: 3, totalOvr: 14, chance: 15 },   // +6 → +7: 129 → 132 (+3)
    { from: 7, to: 8, ovrGain: 4, totalOvr: 18, chance: 7 },    // +7 → +8: 132 → 136 (+4)
    { from: 8, to: 9, ovrGain: 2, totalOvr: 20, chance: 5 },    // +8 → +9: 136 → 138 (+2) - อ้างอิง FIFAAddict
    { from: 9, to: 10, ovrGain: 2, totalOvr: 22, chance: 4 },   // +9 → +10: 138 → 140 (+2) - อ้างอิง FIFAAddict
    { from: 10, to: 11, ovrGain: 2, totalOvr: 24, chance: 3 },  // +10 → +11: 140 → 142 (+2) - อ้างอิง FIFAAddict
    { from: 11, to: 12, ovrGain: 3, totalOvr: 27, chance: 2 },  // +11 → +12: 142 → 145 (+3) - อ้างอิง FIFAAddict
    { from: 12, to: 13, ovrGain: 3, totalOvr: 30, chance: 1 },  // +12 → +13: 145 → 148 (+3) - อ้างอิง FIFAAddict
];


/**
 * สีของระดับบวกแต่ละช่วง (ตามรูปอ้างอิง)
 */
export const LEVEL_COLORS: { [key: number]: string } = {
    1: '#6B7280',  // เทาเข้ม (Gray)
    2: '#CD7F32',  // บรอนซ์ (Bronze)
    3: '#CD7F32',  // บรอนซ์
    4: '#CD7F32',  // บรอนซ์
    5: '#9CA3AF',  // เงิน (Silver)
    6: '#9CA3AF',  // เงิน
    7: '#9CA3AF',  // เงิน
    8: '#EAB308',  // ทอง (Gold)
    9: '#EAB308',  // ทอง
    10: '#A78BFA', // Rainbow (ม่วงอ่อน)
    11: '#A78BFA', // Rainbow
    12: '#A78BFA', // Rainbow
    13: '#A78BFA', // Rainbow (พร้อมดาว)
};

/**
 * หาข้อมูลการอัพเกรดจากระดับปัจจุบัน
 */
export function getUpgradeInfo(currentLevel: number): UpgradeLevel | null {
    return UPGRADE_DATA.find(d => d.from === currentLevel) || null;
}

/**
 * หา OVR bonus รวมจากระดับ +1 ถึงระดับปัจจุบัน
 * +1 = Base OVR + 3 (ค่าคงที่เพราะลบ +0 ออกจาก UPGRADE_DATA แล้ว)
 */
export function getTotalOvrBonus(level: number): number {
    if (level <= 0) return 0;  // +0 = Base OVR, ไม่มี bonus
    if (level === 1) return 3; // +1 = Base OVR + 3 (ค่าคงที่)
    // หา record ที่ to = level เพื่อดู totalOvr
    const data = UPGRADE_DATA.find(d => d.to === level);
    return data?.totalOvr || 0;
}

/**
 * คำนวณระดับที่จะลดลงเมื่อตีบวกล้มเหลว (ระบบสมจริง)
 * 
 * ทุกระดับมีโอกาส 10% ที่จะเกิด "catastrophic drop" (ลดหนักมาก)
 * 
 * +1: ไม่ลดระดับ (ต่ำสุดแล้ว)
 * +2-+4: ลด 1 ระดับ (catastrophic: ลด 2-3 ระดับ)
 * +5-+7: สุ่มลด 2-3 ระดับ (catastrophic: ลด 4-5 ระดับ)
 * +8-+9: สุ่มลด 3-4 ระดับ (catastrophic: ลด 5-6 ระดับ)
 * +10+: สุ่มลด 4-6 ระดับ (catastrophic: ลด 6-8 ระดับ)
 */
export function getLevelAfterFailure(currentLevel: number): number {
    if (currentLevel <= 0) {
        // +0 ไม่ลดระดับ (เพราะต่ำสุดแล้ว)
        return 0;
    } else if (currentLevel === 1) {
        // +1 ล้มเหลวลดลงไป +0
        return 0;
    }

    // 10% โอกาสเกิด Catastrophic Drop (ลดหนักมาก) ทุกระดับ!
    const isCatastrophic = Math.random() < 0.10;

    if (currentLevel <= 4) {
        // +2, +3, +4
        if (isCatastrophic) {
            // Catastrophic: ลด 2-3 ระดับ
            const drop = Math.random() < 0.5 ? 2 : 3;
            return Math.max(1, currentLevel - drop);
        }
        // ปกติ: ลดลง 1 ระดับ
        return currentLevel - 1;
    } else if (currentLevel <= 7) {
        // +5-+7
        if (isCatastrophic) {
            // Catastrophic: ลด 4-5 ระดับ
            const drop = Math.random() < 0.5 ? 4 : 5;
            return Math.max(1, currentLevel - drop);
        }
        // ปกติ: สุ่มลด 2-3 ระดับ
        const drop = Math.random() < 0.5 ? 2 : 3;
        return Math.max(1, currentLevel - drop);
    } else if (currentLevel <= 9) {
        // +8-+9
        if (isCatastrophic) {
            // Catastrophic: ลด 5-6 ระดับ
            const drop = Math.random() < 0.5 ? 5 : 6;
            return Math.max(1, currentLevel - drop);
        }
        // ปกติ: สุ่มลด 3-4 ระดับ
        const drop = Math.random() < 0.5 ? 3 : 4;
        return Math.max(1, currentLevel - drop);
    } else {
        // +10+
        if (isCatastrophic) {
            // Catastrophic: ลด 6-8 ระดับ (ร่วงหนักมาก!)
            const drop = 6 + Math.floor(Math.random() * 3); // 6, 7, หรือ 8
            return Math.max(1, currentLevel - drop);
        }
        // ปกติ: สุ่มลด 4-6 ระดับ
        const drop = 4 + Math.floor(Math.random() * 3); // 4, 5, หรือ 6
        return Math.max(1, currentLevel - drop);
    }
}

/**
 * จำลองการตีบวก - return true ถ้าสำเร็จ
 */
export function simulateUpgrade(currentLevel: number): boolean {
    const upgradeInfo = getUpgradeInfo(currentLevel);
    if (!upgradeInfo) return false;

    // สุ่มตัวเลข 0-100 แล้วเทียบกับ chance
    const roll = Math.random() * 100;
    return roll < upgradeInfo.chance;
}

/**
 * ===================================================
 * ระบบ Boost Gauge (วัตถุดิบ)
 * ===================================================
 * 
 * สูตร: P_success = P_base × (Boost Gauge / 5.0)
 * - P_base: อัตราสำเร็จพื้นฐาน (ค่าซ่อนในเกม)
 * - Boost Gauge: 0.0 - 5.0 (จำนวนวัตถุดิบที่ใส่)
 */

/**
 * อัตราสำเร็จพื้นฐาน (P_base) สำหรับแต่ละระดับ
 * ค่านี้คือโอกาสติดสูงสุดเมื่อหลอดเต็ม (5.0)
 */
export const BASE_CHANCE_MAP: { [level: number]: number } = {
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
 * คำนวณอัตราสำเร็จจริง (P_success) จาก Boost Gauge
 * 
 * @param currentLevel - ระดับปัจจุบัน (1-12)
 * @param boostGauge - ค่า Boost Gauge (0.0 - 5.0)
 * @returns อัตราสำเร็จจริง (0-100%)
 */
export function calculateSuccessRate(currentLevel: number, boostGauge: number): number {
    const pBase = BASE_CHANCE_MAP[currentLevel] || 0;

    // P_success = P_base × (Boost Gauge / 5.0)
    const pSuccess = pBase * (boostGauge / 5.0);

    // ปัดเป็นทศนิยม 2 ตำแหน่ง และจำกัดไม่เกิน 100%
    return Math.min(100, Math.round(pSuccess * 100) / 100);
}

/**
 * จำลองการตีบวกพร้อม Boost Gauge
 * 
 * @param currentLevel - ระดับปัจจุบัน
 * @param boostGauge - ค่า Boost Gauge (0.0 - 5.0)
 * @returns true ถ้าสำเร็จ, false ถ้าล้มเหลว
 */
export function simulateUpgradeWithBoost(currentLevel: number, boostGauge: number): boolean {
    const successRate = calculateSuccessRate(currentLevel, boostGauge);

    // สุ่มตัวเลข 0-100 แล้วเทียบกับ P_success
    const roll = Math.random() * 100;
    return roll < successRate;
}
