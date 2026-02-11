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

// ===== BP Box January 2026 =====


// ===== Champions Chest January 2026 =====


// ===== BP Box February 2026 =====
export const BP_BOX_FEB_2026: BoxType = {
    id: 'bp-box-feb-2026',
    name: 'กล่อง BP (Feb 2026)',
    description: 'ได้รับไอเทม 1 อย่างจากรายการดังนี้',
    icon: '/box/bp.png',
    color: '#FF6B6B',
    valueUnit: 'bp',
    fcCost: 5000,
    expiresAt: '2026.03.01.23H59M',
    rewards: [
        {
            id: 'bp-8t-38t',
            name: 'การ์ด BP (8T - 38T BP) x1',
            minValue: 8_000_000_000_000,
            maxValue: 38_000_000_000_000,
            chance: 1.55,
            rarity: 'legendary',
        },
        {
            id: 'bp-4t-13t',
            name: 'การ์ด BP (4T - 13T BP) x1',
            minValue: 4_000_000_000_000,
            maxValue: 13_000_000_000_000,
            chance: 3.11,
            rarity: 'epic',
        },
        {
            id: 'bp-650b-3t',
            name: 'การ์ด BP (650B - 3T BP) x1',
            minValue: 650_000_000_000,
            maxValue: 3_000_000_000_000,
            chance: 47.67,
            rarity: 'uncommon',
        },
        {
            id: 'bp-600b-2.4t',
            name: 'การ์ด BP (600B - 2.4T BP) x1',
            minValue: 600_000_000_000,
            maxValue: 2_400_000_000_000,
            chance: 47.67,
            rarity: 'common',
        },
    ],
};

// ===== Champions Chest February 2026 =====
export const CHAMPIONS_CHEST_FEB_2026: BoxType = {
    id: 'champions-chest-feb-2026',
    name: 'กล่องชิ้นส่วนกุญแจ Champions Chest (Feb 2026)',
    description: 'ได้รับไอเทม 1 อย่างจากรายการดังนี้',
    icon: '/box/key.png',
    color: '#ff6b6b',
    valueUnit: 'count',
    fcCost: 2000,
    expiresAt: '2026.03.01.23H59M',
    rewards: [
        {
            id: 'key-x1000',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x1000',
            minValue: 1000,
            maxValue: 1000,
            chance: 0.15,
            rarity: 'legendary',
        },
        {
            id: 'key-x100',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x100',
            minValue: 100,
            maxValue: 100,
            chance: 0.30,
            rarity: 'epic',
        },
        {
            id: 'key-x10',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x10',
            minValue: 10,
            maxValue: 10,
            chance: 1.49,
            rarity: 'rare',
        },
        {
            id: 'key-x3',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x3',
            minValue: 3,
            maxValue: 3,
            chance: 2.97,
            rarity: 'uncommon',
        },
        {
            id: 'key-x2',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x2',
            minValue: 2,
            maxValue: 2,
            chance: 5.94,
            rarity: 'common',
        },
        {
            id: 'key-x1',
            name: 'ชิ้นส่วนกุญแจ Champions Chest (Feb 2026) x1',
            minValue: 1,
            maxValue: 1,
            chance: 89.15,
            rarity: 'common',
        },
    ],
};

// ===== All Available Boxes =====
// เพิ่มกล่องใหม่ที่นี่
export const ALL_BOXES: BoxType[] = [
    BP_BOX_FEB_2026,
    CHAMPIONS_CHEST_FEB_2026,
];

// ===== Re-export colors and labels from constants =====
// สำหรับ backward compatibility กับ code ที่ import จากที่นี่
export { RARITY_COLORS, RARITY_LABELS } from '@/constants';

// ===== Re-export functions from services =====
// สำหรับ backward compatibility
export { formatBP, openBox, openMultipleBoxes } from '@/services';
