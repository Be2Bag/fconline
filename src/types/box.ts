/**
 * Types สำหรับระบบเปิดกล่อง FC Online
 * รองรับกล่อง BP และกล่องกุญแจ Champions Chest
 */

/**
 * ระดับความหายากของรางวัล
 */
export type Rarity = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

/**
 * หน่วยมูลค่าของรางวัล
 */
export type ValueUnit = 'bp' | 'count';

/**
 * รางวัลในกล่อง
 */
export interface BoxReward {
    /** ID เฉพาะของรางวัล */
    id: string;
    /** ชื่อรางวัล (Thai) */
    name: string;
    /** มูลค่าต่ำสุด */
    minValue: number;
    /** มูลค่าสูงสุด */
    maxValue: number;
    /** โอกาสได้ (%) */
    chance: number;
    /** ระดับความหายาก */
    rarity: Rarity;
}

/**
 * ประเภทกล่อง
 */
export interface BoxType {
    /** ID เฉพาะของกล่อง */
    id: string;
    /** ชื่อกล่อง */
    name: string;
    /** คำอธิบาย */
    description: string;
    /** Path รูปไอคอน */
    icon: string;
    /** สีหลักของกล่อง (hex) */
    color: string;
    /** หน่วยมูลค่า */
    valueUnit: ValueUnit;
    /** ราคา FC ต่อกล่อง */
    fcCost: number;
    /** รายการรางวัลทั้งหมด */
    rewards: BoxReward[];
    /** วันหมดอายุ (optional) */
    expiresAt?: string;
    /** จำกัดการซื้อ (optional) */
    purchaseLimit?: number;
}

/**
 * ผลลัพธ์การเปิดกล่อง 1 ครั้ง
 */
export interface OpenResult {
    /** ID เฉพาะของการเปิด */
    id: string;
    /** รางวัลที่ได้ */
    reward: BoxReward;
    /** มูลค่าจริงที่ได้ (สุ่มระหว่าง min-max) */
    actualValue: number;
    /** เวลาที่เปิด (timestamp) */
    timestamp: number;
}

/**
 * สถิติการเปิดกล่อง
 */
export interface BoxStats {
    /** จำนวนกล่องที่เปิดทั้งหมด */
    totalOpened: number;
    /** มูลค่ารวมที่ได้ */
    totalEarned: number;
    /** FC ที่ใช้ไปทั้งหมด */
    totalFCSpent: number;
    /** รางวัลดีที่สุดที่เคยได้ */
    bestReward: OpenResult | null;
    /** นับจำนวนแยกตาม rarity */
    rarityCount: Record<Rarity, number>;
}

/**
 * สถานะ animation ของการเปิดกล่อง
 */
export type BoxAnimationState = 'idle' | 'shaking' | 'opening' | 'revealed';

/**
 * สีสำหรับแต่ละ rarity
 */
export interface RarityColor {
    /** สีพื้นหลัง */
    bg: string;
    /** สี glow effect */
    glow: string;
    /** สีตัวอักษร */
    text: string;
}
