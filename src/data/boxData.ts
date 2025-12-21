// ===== Box Data for FC Online Box Opening Simulator =====

export interface BoxReward {
    id: string;
    name: string;
    minValue: number;  // ค่าต่ำสุด (BP)
    maxValue: number;  // ค่าสูงสุด
    chance: number;    // % (0-100)
    rarity: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
}

export interface BoxType {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    valueUnit: 'bp' | 'count';  // 'bp' = format as T/B, 'count' = show as x123
    fcCost: number;  // ราคา FC ต่อกล่อง
    rewards: BoxReward[];
    expiresAt?: string;
    purchaseLimit?: number;
}

// Rarity colors for visual effects
export const RARITY_COLORS: Record<BoxReward['rarity'], { bg: string; glow: string; text: string }> = {
    legendary: { bg: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)', text: '#8B6914' },
    epic: { bg: '#9333EA', glow: 'rgba(147, 51, 234, 0.6)', text: '#FFFFFF' },
    rare: { bg: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)', text: '#FFFFFF' },
    uncommon: { bg: '#22C55E', glow: 'rgba(34, 197, 94, 0.6)', text: '#FFFFFF' },
    common: { bg: '#6B7280', glow: 'rgba(107, 114, 128, 0.4)', text: '#FFFFFF' },
};

export const RARITY_LABELS: Record<BoxReward['rarity'], string> = {
    legendary: '🟠 LEGENDARY',
    epic: '🟣 EPIC',
    rare: '🔵 RARE',
    uncommon: '🟢 UNCOMMON',
    common: '⚪ COMMON',
};

// BP Box December 2025 - Based on user-provided image
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
            minValue: 20_000_000_000_000,  // 20T
            maxValue: 80_000_000_000_000,  // 80T
            chance: 0.11,
            rarity: 'legendary',
        },
        {
            id: 'bp-12.5t-50t',
            name: 'การ์ด BP (12.5T - 50T BP)',
            minValue: 12_500_000_000_000,  // 12.5T
            maxValue: 50_000_000_000_000,  // 50T
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-7.5t-30t',
            name: 'การ์ด BP (7.5T - 30T BP)',
            minValue: 7_500_000_000_000,   // 7.5T
            maxValue: 30_000_000_000_000,  // 30T
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-5t-20t',
            name: 'การ์ด BP (5T - 20T BP)',
            minValue: 5_000_000_000_000,   // 5T
            maxValue: 20_000_000_000_000,  // 20T
            chance: 0.22,
            rarity: 'epic',
        },
        {
            id: 'bp-2.5t-10t',
            name: 'การ์ด BP (2.5T - 10T BP)',
            minValue: 2_500_000_000_000,   // 2.5T
            maxValue: 10_000_000_000_000,  // 10T
            chance: 0.33,
            rarity: 'rare',
        },
        {
            id: 'bp-500b-2t',
            name: 'การ์ด BP (500B - 2T BP)',
            minValue: 500_000_000_000,     // 500B
            maxValue: 2_000_000_000_000,   // 2T
            chance: 15.56,
            rarity: 'uncommon',
        },
        {
            id: 'bp-450b-1.8t',
            name: 'การ์ด BP (450B - 1.8T BP)',
            minValue: 450_000_000_000,     // 450B
            maxValue: 1_800_000_000_000,   // 1.8T
            chance: 22.22,
            rarity: 'common',
        },
        {
            id: 'bp-400b-1.6t',
            name: 'การ์ด BP (400B - 1.6T BP)',
            minValue: 400_000_000_000,     // 400B
            maxValue: 1_600_000_000_000,   // 1.6T
            chance: 27.78,
            rarity: 'common',
        },
        {
            id: 'bp-350b-1.4t',
            name: 'การ์ด BP (350B - 1.4T BP)',
            minValue: 350_000_000_000,     // 350B
            maxValue: 1_400_000_000_000,   // 1.4T
            chance: 33.33,
            rarity: 'common',
        },
    ],
};

// Champions Chest December 2025 - Key Fragments
export const CHAMPIONS_CHEST_DEC_2025: BoxType = {
    id: 'champions-chest-dec-2025',
    name: 'กล่องชิ้นส่วนกุญแจ Champions Chest (Dec 2025)',
    description: 'ได้รับไอเทม 1 อย่างจากรายการดังนี้',
    icon: '/box/key.png',
    color: '#9333EA',
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

// All available boxes
export const ALL_BOXES: BoxType[] = [
    BP_BOX_DEC_2025,
    CHAMPIONS_CHEST_DEC_2025,
];

// ===== Utility Functions =====

/**
 * Format large numbers to readable format (e.g., 1.5T, 500B)
 */
export function formatBP(value: number): string {
    if (value >= 1_000_000_000_000) {
        return `${(value / 1_000_000_000_000).toFixed(1)}T`;
    } else if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(0)}B`;
    } else if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(0)}M`;
    }
    return value.toLocaleString();
}

/**
 * Simulate opening a box based on probability weights
 */
export function openBox(box: BoxType): { reward: BoxReward; actualValue: number } {
    // Create weighted random selection
    const random = Math.random() * 100;
    let cumulativeChance = 0;

    for (const reward of box.rewards) {
        cumulativeChance += reward.chance;
        if (random < cumulativeChance) {
            // Calculate actual value within range
            const range = reward.maxValue - reward.minValue;
            const actualValue = reward.minValue + Math.random() * range;
            return { reward, actualValue: Math.floor(actualValue) };
        }
    }

    // Fallback to last reward (should not happen if probabilities sum to 100)
    const lastReward = box.rewards[box.rewards.length - 1];
    const range = lastReward.maxValue - lastReward.minValue;
    const actualValue = lastReward.minValue + Math.random() * range;
    return { reward: lastReward, actualValue: Math.floor(actualValue) };
}

/**
 * Open multiple boxes at once
 */
export function openMultipleBoxes(box: BoxType, count: number): Array<{ reward: BoxReward; actualValue: number }> {
    const results: Array<{ reward: BoxReward; actualValue: number }> = [];
    for (let i = 0; i < count; i++) {
        results.push(openBox(box));
    }
    return results;
}
