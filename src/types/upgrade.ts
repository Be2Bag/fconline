/**
 * Types สำหรับระบบตีบวกนักเตะ FC Online
 * ประกอบด้วย types สำหรับอัตราความสำเร็จ, สถิติ, และผลลัพธ์
 */

/**
 * ข้อมูลระดับการอัพเกรด
 * แต่ละ record แทนการอัพจากระดับหนึ่งไปอีกระดับ
 */
export interface UpgradeLevel {
    /** ระดับเริ่มต้น (เช่น 1 = +1) */
    from: number;
    /** ระดับที่จะอัพไป (เช่น 2 = +2) */
    to: number;
    /** OVR ที่เพิ่มขึ้นในครั้งนี้ */
    ovrGain: number;
    /** OVR รวมที่เพิ่มจาก +1 ถึงระดับนี้ */
    totalOvr: number;
    /** เปอร์เซ็นต์ความสำเร็จ (0-100) */
    chance: number;
}

/**
 * สถิติการตีบวก
 * ใช้สำหรับแสดงผลสรุปการจำลอง
 */
export interface UpgradeStats {
    /** จำนวนครั้งที่ตีบวกทั้งหมด */
    attempts: number;
    /** จำนวนครั้งที่สำเร็จ */
    successes: number;
    /** จำนวนครั้งที่ล้มเหลว */
    failures: number;
    /** ระดับสูงสุดที่เคยถึง */
    highestLevel: number;
}

/**
 * ผลลัพธ์การตีบวกครั้งเดียว
 */
export interface UpgradeResult {
    /** สำเร็จหรือไม่ */
    success: boolean;
    /** ระดับก่อนตีบวก */
    previousLevel: number;
    /** ระดับหลังตีบวก */
    newLevel: number;
    /** เกิด catastrophic drop หรือไม่ */
    isCatastrophic?: boolean;
}

/**
 * สถานะ animation ของการตีบวก
 */
export type UpgradeAnimationState = 'idle' | 'upgrading' | 'success' | 'fail';

/**
 * ช่วงระดับสำหรับกำหนดสี/behavior
 */
export type LevelTier = 'gray' | 'bronze' | 'silver' | 'gold' | 'rainbow';

/**
 * สถานะของวัตถุดิบ (การ์ด) ใน Boost Gauge
 * 0 = ว่าง, 0.5 = ครึ่งใบ, 1 = เต็มใบ
 */
export type CardState = 0 | 0.5 | 1;
