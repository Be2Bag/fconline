/**
 * Service สำหรับคำนวณ OVR
 * รวม business logic ทั้งหมดที่เกี่ยวกับการคำนวณ OVR
 */

import type {
    StatWeight,
    StatValues,
    UpgradeImpactResult,
    EfficientUpgradeResult,
    PositionAnalysisResult,
} from '@/types';
import { APP_CONFIG } from '@/config';

// Import ovrWeights data
// Note: จะต้อง import จาก data file ที่มีอยู่
import { ovrWeights, positionList } from '@/data/ovrWeights';

/**
 * คำนวณ OVR จากค่า stats และ weights
 * สูตร: OVR = Σ(stat_value × weight) / 100
 * 
 * @param stats - ค่า stats ของนักเตะ
 * @param weights - weights สำหรับแต่ละ stat
 * @returns ค่า OVR
 */
export function calculateOVR(stats: StatValues, weights: StatWeight[]): number {
    let totalWeightedValue = 0;

    weights.forEach((w) => {
        const statValue = stats[w.stat] || 0;
        totalWeightedValue += statValue * w.weight;
    });

    return totalWeightedValue / 100;
}

/**
 * คำนวณ OVR หลังจากอัพเกรด stats (+2)
 * 
 * @param stats - ค่า stats เดิม
 * @param weights - weights
 * @param upgradedStats - รายการ stats ที่อัพเกรด
 * @returns ค่า OVR หลังอัพเกรด
 */
export function calculateUpgradedOVR(
    stats: StatValues,
    weights: StatWeight[],
    upgradedStats: string[]
): number {
    const { UPGRADE_VALUE } = APP_CONFIG;
    const upgradedValues = { ...stats };

    upgradedStats.forEach((stat) => {
        if (upgradedValues[stat] !== undefined) {
            upgradedValues[stat] += UPGRADE_VALUE;
        }
    });

    return calculateOVR(upgradedValues, weights);
}

/**
 * หา stats ที่ดีที่สุดในการอัพเกรด (เรียงตาม weight)
 * 
 * @param position - ตำแหน่งนักเตะ
 * @param maxUpgrades - จำนวน stats สูงสุดที่จะ return
 * @returns รายการ stats ที่แนะนำ
 */
export function getOptimalUpgrades(
    position: string,
    maxUpgrades: number = APP_CONFIG.MAX_STAT_UPGRADES
): UpgradeImpactResult[] {
    const positionData = ovrWeights[position];
    if (!positionData) return [];

    // Sort by weight descending
    const sortedStats = [...positionData.stats].sort(
        (a, b) => b.weight - a.weight
    );

    return sortedStats.slice(0, maxUpgrades).map((s) => ({
        stat: s.stat,
        weight: s.weight,
        originalValue: 0,
        upgradedValue: 0,
        ovrContribution: (s.weight * APP_CONFIG.UPGRADE_VALUE) / 100,
    }));
}

/**
 * คำนวณการอัพเกรดที่มีประสิทธิภาพ
 * หาจำนวน upgrades ขั้นต่ำที่ทำให้ได้ floor OVR เท่ากับ full upgrade
 * 
 * @param stats - ค่า stats ของนักเตะ
 * @param position - ตำแหน่ง
 * @returns ผลการวิเคราะห์
 */
export function getEfficientUpgrades(
    stats: StatValues,
    position: string
): EfficientUpgradeResult {
    const positionData = ovrWeights[position];
    if (!positionData) {
        return {
            fullUpgradeOVR: 0,
            floorFullUpgrade: 0,
            minUpgradesNeeded: 0,
            minUpgradeOVR: 0,
            savedUpgrades: 0,
            recommendedStats: [],
        };
    }

    // Sort by weight descending
    const sortedStats = [...positionData.stats].sort(
        (a, b) => b.weight - a.weight
    );

    // Calculate OVR with 5 top upgrades
    const top5Stats = sortedStats.slice(0, 5).map((s) => s.stat);
    const fullUpgradeOVR = calculateUpgradedOVR(
        stats,
        positionData.stats,
        top5Stats
    );
    const floorFullUpgrade = Math.floor(fullUpgradeOVR);

    // Find minimum upgrades needed
    let minUpgradesNeeded = 0;
    let minUpgradeOVR = calculateOVR(stats, positionData.stats);
    const recommendedStats: string[] = [];

    for (let i = 1; i <= 5; i++) {
        const testStats = sortedStats.slice(0, i).map((s) => s.stat);
        const testOVR = calculateUpgradedOVR(stats, positionData.stats, testStats);

        if (Math.floor(testOVR) >= floorFullUpgrade) {
            minUpgradesNeeded = i;
            minUpgradeOVR = testOVR;
            recommendedStats.push(...testStats);
            break;
        }
    }

    // If no break, all 5 are needed
    if (minUpgradesNeeded === 0) {
        minUpgradesNeeded = 5;
        minUpgradeOVR = fullUpgradeOVR;
        recommendedStats.push(...top5Stats);
    }

    return {
        fullUpgradeOVR,
        floorFullUpgrade,
        minUpgradesNeeded,
        minUpgradeOVR,
        savedUpgrades: 5 - minUpgradesNeeded,
        recommendedStats,
    };
}

/**
 * วิเคราะห์ตำแหน่งที่ดีที่สุดสำหรับ stats ที่กำหนด
 * 
 * @param stats - ค่า stats ของนักเตะ
 * @returns รายการตำแหน่งเรียงตาม OVR
 */
export function analyzePositions(stats: StatValues): PositionAnalysisResult[] {
    const results: PositionAnalysisResult[] = [];

    positionList.forEach((pos) => {
        const positionData = ovrWeights[pos];
        if (!positionData) return;

        const baseOVR = calculateOVR(stats, positionData.stats);

        // Get top 5 stats for upgrading
        const sortedStats = [...positionData.stats].sort(
            (a, b) => b.weight - a.weight
        );
        const top5 = sortedStats.slice(0, 5);
        const top5Names = top5.map((s) => s.stat);

        const upgradedOVR = calculateUpgradedOVR(
            stats,
            positionData.stats,
            top5Names
        );

        results.push({
            position: pos,
            thaiName: positionData.thaiName,
            baseOVR,
            upgradedOVR,
            top5Stats: top5,
        });
    });

    // Sort by upgradedOVR descending
    return results.sort((a, b) => b.upgradedOVR - a.upgradedOVR);
}

/**
 * Format OVR สำหรับแสดงผล
 * 
 * @param ovr - ค่า OVR
 * @param showDecimal - แสดงทศนิยมหรือไม่
 * @returns String ที่ format แล้ว
 */
export function formatOVR(ovr: number, showDecimal: boolean = true): string {
    if (showDecimal) {
        return ovr.toFixed(2);
    }
    return Math.floor(ovr).toString();
}

/**
 * หา impact ของการอัพเกรด stat หนึ่ง
 * 
 * @param stat - ชื่อ stat
 * @param position - ตำแหน่ง
 * @returns impact และ weight หรือ null
 */
export function getUpgradeImpact(
    stat: string,
    position: string
): { impact: number; weight: number } | null {
    const positionData = ovrWeights[position];
    if (!positionData) return null;

    const statWeight = positionData.stats.find((s) => s.stat === stat);
    if (!statWeight) return null;

    return {
        impact: (statWeight.weight * APP_CONFIG.UPGRADE_VALUE) / 100,
        weight: statWeight.weight,
    };
}
