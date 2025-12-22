/**
 * Types สำหรับระบบคำนวณ OVR FC Online
 * ใช้สำหรับ OVR Calculator และ Best Position Finder
 */

/**
 * ค่า stat และ weight สำหรับการคำนวณ OVR
 */
export interface StatWeight {
    /** ชื่อ stat (Thai) */
    stat: string;
    /** น้ำหนักในการคิด OVR (0-100) */
    weight: number;
}

/**
 * ข้อมูลตำแหน่งและ weights
 */
export interface PositionWeights {
    /** รหัสตำแหน่ง (เช่น "ST", "CAM") */
    position: string;
    /** ชื่อตำแหน่งภาษาไทย */
    thaiName: string;
    /** รายการ stat weights */
    stats: StatWeight[];
}

/**
 * ค่า stats ของนักเตะ
 * key = ชื่อ stat, value = ค่า stat
 */
export interface StatValues {
    [stat: string]: number;
}

/**
 * ผลลัพธ์การคำนวณการอัพเกรด stat
 */
export interface UpgradeImpactResult {
    /** ชื่อ stat */
    stat: string;
    /** น้ำหนัก */
    weight: number;
    /** ค่าเดิม */
    originalValue: number;
    /** ค่าหลังอัพเกรด (+2) */
    upgradedValue: number;
    /** ผลกระทบต่อ OVR */
    ovrContribution: number;
}

/**
 * ผลลัพธ์การคำนวณการอัพเกรดที่มีประสิทธิภาพ
 */
export interface EfficientUpgradeResult {
    /** OVR เมื่ออัพเกรดครบ 5 stats */
    fullUpgradeOVR: number;
    /** OVR แบบปัดลง */
    floorFullUpgrade: number;
    /** จำนวน stats ขั้นต่ำที่ต้องอัพเกรด */
    minUpgradesNeeded: number;
    /** OVR เมื่อใช้จำนวน stats ขั้นต่ำ */
    minUpgradeOVR: number;
    /** จำนวน stats ที่ประหยัดได้ */
    savedUpgrades: number;
    /** รายการ stats ที่แนะนำให้อัพเกรด */
    recommendedStats: string[];
}

/**
 * ผลลัพธ์การวิเคราะห์ตำแหน่งที่ดีที่สุด
 */
export interface PositionAnalysisResult {
    /** รหัสตำแหน่ง */
    position: string;
    /** ชื่อตำแหน่งภาษาไทย */
    thaiName: string;
    /** OVR พื้นฐาน (ไม่มีอัพเกรด) */
    baseOVR: number;
    /** OVR หลังอัพเกรด 5 stats */
    upgradedOVR: number;
    /** Top 5 stats ที่สำคัญสำหรับตำแหน่งนี้ */
    top5Stats: StatWeight[];
}
