/**
 * สี Level ตีบวก
 * แก้ไขที่นี่เพื่อเปลี่ยนสีแสดงผลของแต่ละระดับ
 */

import type { Rarity, RarityColor, LevelTier } from '@/types';

/**
 * สีสำหรับแต่ละระดับตีบวก (+1 ถึง +13)
 */
export const UPGRADE_LEVEL_COLORS: Record<number, string> = {
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

/**
 * สีสำหรับแต่ละ tier
 */
export const LEVEL_TIER_COLORS: Record<LevelTier, string> = {
    gray: '#6B7280',
    bronze: '#CD7F32',
    silver: '#9CA3AF',
    gold: '#EAB308',
    rainbow: '#A78BFA',
};

/**
 * หา tier จาก level
 */
export function getLevelTier(level: number): LevelTier {
    if (level <= 1) return 'gray';
    if (level <= 4) return 'bronze';
    if (level <= 7) return 'silver';
    if (level <= 9) return 'gold';
    return 'rainbow';
}

/**
 * สีสำหรับแต่ละ rarity ของกล่อง
 */
export const RARITY_COLORS: Record<Rarity, RarityColor> = {
    legendary: {
        bg: '#FFD700',
        glow: 'rgba(255, 215, 0, 0.6)',
        text: '#8B6914',
    },
    epic: {
        bg: '#9333EA',
        glow: 'rgba(147, 51, 234, 0.6)',
        text: '#FFFFFF',
    },
    rare: {
        bg: '#3B82F6',
        glow: 'rgba(59, 130, 246, 0.6)',
        text: '#FFFFFF',
    },
    uncommon: {
        bg: '#22C55E',
        glow: 'rgba(34, 197, 94, 0.6)',
        text: '#FFFFFF',
    },
    common: {
        bg: '#71717A',
        glow: 'rgba(113, 113, 122, 0.6)',
        text: '#FFFFFF',
    },
};

/**
 * สีหลักของแอพ (CSS variables reference)
 */
export const APP_COLORS = {
    primary: '#FFDE00',
    secondary: '#FF6B6B',
    accent: '#00D4AA',
    black: '#1a1a1a',
    white: '#FFFFF0',
    bg: '#F5F5DC',
    pink: '#FF90E8',
    blue: '#6EB5FF',
    orange: '#FF9F1C',
    green: '#7BF1A8',
} as const;

/**
 * สี Animation
 */
export const ANIMATION_COLORS = {
    success: {
        main: 'rgba(255, 215, 0, 0.7)',    // สีทอง
        glow: 'rgba(255, 215, 0, 0.5)',
    },
    fail: {
        main: 'rgba(239, 68, 68, 0.7)',    // สีแดง
        glow: 'rgba(239, 68, 68, 0.5)',
    },
} as const;
