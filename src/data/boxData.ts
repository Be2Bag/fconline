/**
 * ข้อมูลกล่องสำหรับ Box Simulator
 * 
 * ==================================================
 * วิธีเพิ่มกล่องใหม่:
 * ==================================================
 * 1. สร้าง object ใหม่ตาม BoxType interface
 * 2. เพิ่มเข้าไปใน ALL_BOXES array
 * 
 * ตัวอย่าง:
 * const NEW_BOX: BoxType = {
 *     id: 'new-box-jan-2026',
 *     name: 'กล่องใหม่',
 *     description: 'คำอธิบาย',
 *     icon: '/box/new.png',
 *     color: '#FF0000',
 *     valueUnit: 'bp',
 *     fcCost: 1000,
 *     rewards: [...],
 * };
 * ==================================================
 */

import type { BoxType, BoxReward } from '@/types';

// Re-export types for backward compatibility
export type { BoxType, BoxReward };

// ===== BP Box December 2025 =====
export const BP_BOX_DEC_2025: BoxType = {
    id: 'bp-box-dec-2025',
    name: 'กล่อง BP (Dec 2025)',
    description: 'ได้รับไอเทม 1 อย่างจากรายการดังนี้',
    icon: '/box/bp.png',
    color: '#FF6B6B',
    valueUnit: 'bp',
    fcCost: 5000,
    expiresAt: '2026.01.04.23H59M',
    purchaseLimit: 300,
    rewards: [
        {
            id: 'bp-20t-80t',
            name: 'การ์ด BP (20T - 80T BP)',
            minValue: 20_000_000_000_000,
            maxValue: 80_000_000_000_000,
            chance: 0.11,
            rarity: 'legendary',
        },
        {
            id: 'bp-12.5t-50t',
            name: 'การ์ด BP (12.5T - 50T BP)',
            minValue: 12_500_000_000_000,
            maxValue: 50_000_000_000_000,
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-7.5t-30t',
            name: 'การ์ด BP (7.5T - 30T BP)',
            minValue: 7_500_000_000_000,
            maxValue: 30_000_000_000_000,
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-5t-20t',
            name: 'การ์ด BP (5T - 20T BP)',
            minValue: 5_000_000_000_000,
            maxValue: 20_000_000_000_000,
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-2.5t-10t',
            name: 'การ์ด BP (2.5T - 10T BP)',
            minValue: 2_500_000_000_000,
            maxValue: 10_000_000_000_000,
            chance: 0.33,
            rarity: 'rare',
        },
        {
            id: 'bp-500b-2t',
            name: 'การ์ด BP (500B - 2T BP)',
            minValue: 500_000_000_000,
            maxValue: 2_000_000_000_000,
            chance: 15.56,
            rarity: 'uncommon',
        },
        {
            id: 'bp-450b-1.8t',
            name: 'การ์ด BP (450B - 1.8T BP)',
            minValue: 450_000_000_000,
            maxValue: 1_800_000_000_000,
            chance: 22.22,
            rarity: 'common',
        },
        {
            id: 'bp-400b-1.6t',
            name: 'การ์ด BP (400B - 1.6T BP)',
            minValue: 400_000_000_000,
            maxValue: 1_600_000_000_000,
            chance: 27.78,
            rarity: 'common',
        },
        {
            id: 'bp-350b-1.4t',
            name: 'การ์ด BP (350B - 1.4T BP)',
            minValue: 350_000_000_000,
            maxValue: 1_400_000_000_000,
            chance: 33.33,
            rarity: 'common',
        },
    ],
};

// ===== Champions Chest December 2025 =====
export const CHAMPIONS_CHEST_DEC_2025: BoxType = {
    id: 'champions-chest-dec-2025',
    name: 'กล่องชิ้นส่วนกุญแจ Champions Chest (Dec 2025)',
    description: 'ได้รับไอเทม 1 อย่างจากรายการดังนี้',
    icon: '/box/key.png',
    color: '#ff6b6b',
    valueUnit: 'count',
    fcCost: 2000,
    expiresAt: '2026.01.04.23H59M',
    rewards: [
        {
            id: 'key-x1000',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x1000',
            minValue: 1000,
            maxValue: 1000,
            chance: 0.10,
            rarity: 'legendary',
        },
        {
            id: 'key-x200',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x200',
            minValue: 200,
            maxValue: 200,
            chance: 1.00,
            rarity: 'epic',
        },
        {
            id: 'key-x10',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x10',
            minValue: 10,
            maxValue: 10,
            chance: 4.99,
            rarity: 'rare',
        },
        {
            id: 'key-x3',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x3',
            minValue: 3,
            maxValue: 3,
            chance: 10.08,
            rarity: 'uncommon',
        },
        {
            id: 'key-x2',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x2',
            minValue: 2,
            maxValue: 2,
            chance: 14.97,
            rarity: 'common',
        },
        {
            id: 'key-x1',
            name: 'ชิ้นส่วนกุญแจ Champions Chest x1',
            minValue: 1,
            maxValue: 1,
            chance: 68.86,
            rarity: 'common',
        },
    ],
};

// ===== All Available Boxes =====
// เพิ่มกล่องใหม่ที่นี่
export const ALL_BOXES: BoxType[] = [
    BP_BOX_DEC_2025,
    CHAMPIONS_CHEST_DEC_2025,
];

// ===== Re-export colors and labels from constants =====
// สำหรับ backward compatibility กับ code ที่ import จากที่นี่
export { RARITY_COLORS, RARITY_LABELS } from '@/constants';

// ===== Re-export functions from services =====
// สำหรับ backward compatibility
export { formatBP, openBox, openMultipleBoxes } from '@/services';
