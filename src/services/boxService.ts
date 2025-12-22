/**
 * Service สำหรับระบบเปิดกล่อง
 * รวม business logic ทั้งหมดที่เกี่ยวกับการเปิดกล่อง
 */

import type { BoxType, BoxReward, OpenResult, Rarity } from '@/types';
import { BP_LIMITS, BP_SUFFIXES } from '@/constants';

/**
 * Format ตัวเลข BP ให้อ่านง่าย
 * เช่น 1,500,000,000,000 -> "1.5T"
 * 
 * @param value - มูลค่า BP
 * @returns String ที่ format แล้ว
 */
export function formatBP(value: number): string {
    if (value >= BP_LIMITS.TRILLION) {
        return `${(value / BP_LIMITS.TRILLION).toFixed(1)}${BP_SUFFIXES.TRILLION}`;
    }
    if (value >= BP_LIMITS.BILLION) {
        return `${(value / BP_LIMITS.BILLION).toFixed(1)}${BP_SUFFIXES.BILLION}`;
    }
    if (value >= BP_LIMITS.MILLION) {
        return `${(value / BP_LIMITS.MILLION).toFixed(1)}${BP_SUFFIXES.MILLION}`;
    }
    if (value >= BP_LIMITS.THOUSAND) {
        return `${(value / BP_LIMITS.THOUSAND).toFixed(1)}${BP_SUFFIXES.THOUSAND}`;
    }
    return value.toString();
}

/**
 * สุ่มเลือกรางวัลจากกล่องตามน้ำหนัก probability
 * 
 * @param box - ข้อมูลกล่อง
 * @returns รางวัลที่สุ่มได้
 */
function selectReward(box: BoxType): BoxReward {
    const totalChance = box.rewards.reduce((sum, r) => sum + r.chance, 0);
    let random = Math.random() * totalChance;

    for (const reward of box.rewards) {
        random -= reward.chance;
        if (random <= 0) {
            return reward;
        }
    }

    // Fallback to last reward (shouldn't happen)
    return box.rewards[box.rewards.length - 1];
}

/**
 * สุ่มมูลค่าจริงระหว่าง min และ max
 * 
 * @param min - มูลค่าต่ำสุด
 * @param max - มูลค่าสูงสุด
 * @returns มูลค่าที่สุ่มได้
 */
function randomValue(min: number, max: number): number {
    if (min === max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate unique ID สำหรับ result
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * เปิดกล่อง 1 ครั้ง
 * 
 * @param box - ข้อมูลกล่อง
 * @returns ผลลัพธ์การเปิด
 */
export function openBox(box: BoxType): OpenResult {
    const reward = selectReward(box);
    const actualValue = randomValue(reward.minValue, reward.maxValue);

    return {
        id: generateId(),
        reward,
        actualValue,
        timestamp: Date.now(),
    };
}

/**
 * เปิดกล่องหลายครั้ง
 * 
 * @param box - ข้อมูลกล่อง
 * @param count - จำนวนครั้งที่จะเปิด
 * @returns Array ของผลลัพธ์
 */
export function openMultipleBoxes(box: BoxType, count: number): OpenResult[] {
    const results: OpenResult[] = [];

    for (let i = 0; i < count; i++) {
        results.push(openBox(box));
    }

    return results;
}

/**
 * คำนวณมูลค่ารวมจาก results
 * 
 * @param results - Array ของผลลัพธ์
 * @returns มูลค่ารวม
 */
export function calculateTotalValue(results: OpenResult[]): number {
    return results.reduce((sum, r) => sum + r.actualValue, 0);
}

/**
 * หารางวัลดีที่สุดจาก results
 * 
 * @param results - Array ของผลลัพธ์
 * @returns รางวัลดีที่สุด หรือ null
 */
export function findBestReward(results: OpenResult[]): OpenResult | null {
    if (results.length === 0) return null;

    const rarityOrder: Record<Rarity, number> = {
        legendary: 5,
        epic: 4,
        rare: 3,
        uncommon: 2,
        common: 1,
    };

    return results.reduce((best, current) => {
        const bestRarity = rarityOrder[best.reward.rarity];
        const currentRarity = rarityOrder[current.reward.rarity];

        if (currentRarity > bestRarity) return current;
        if (currentRarity === bestRarity && current.actualValue > best.actualValue) {
            return current;
        }
        return best;
    });
}

/**
 * นับจำนวน rarity แต่ละประเภท
 * 
 * @param results - Array ของผลลัพธ์
 * @returns Record<Rarity, number>
 */
export function countByRarity(results: OpenResult[]): Record<Rarity, number> {
    const counts: Record<Rarity, number> = {
        legendary: 0,
        epic: 0,
        rare: 0,
        uncommon: 0,
        common: 0,
    };

    results.forEach(r => {
        counts[r.reward.rarity]++;
    });

    return counts;
}

/**
 * คำนวณ profit/loss
 * 
 * @param totalEarned - มูลค่าที่ได้รับ
 * @param totalSpent - FC ที่ใช้
 * @param fcToBpRate - อัตราแลกเปลี่ยน FC ต่อ BP (optional)
 * @returns profit/loss value
 */
export function calculateProfitLoss(
    totalEarned: number,
    totalSpent: number,
    fcToBpRate: number = 1
): number {
    return totalEarned - (totalSpent * fcToBpRate);
}
