// OVR Calculation utilities for FC Online

import { StatWeight, ovrWeights } from "@/data/ovrWeights";

export interface StatValues {
    [stat: string]: number;
}

export interface UpgradeResult {
    stat: string;
    weight: number;
    originalValue: number;
    upgradedValue: number;
    ovrContribution: number;
}

/**
 * Calculate OVR based on stat values and weights
 * Formula: OVR = Σ(stat_value × weight) / 100
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
 * Calculate OVR with +2 upgrades applied
 */
export function calculateUpgradedOVR(
    stats: StatValues,
    weights: StatWeight[],
    upgradedStats: string[]
): number {
    const upgradedValues = { ...stats };

    upgradedStats.forEach((stat) => {
        if (upgradedValues[stat] !== undefined) {
            upgradedValues[stat] += 2;
        }
    });

    return calculateOVR(upgradedValues, weights);
}

/**
 * Get optimal upgrades for maximum OVR
 * Returns the top N stats sorted by weight (highest weight = most impact on OVR)
 */
export function getOptimalUpgrades(
    position: string,
    maxUpgrades: number = 5
): UpgradeResult[] {
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
        ovrContribution: (s.weight * 2) / 100, // +2 upgrade contribution
    }));
}

/**
 * Calculate efficient upgrades - find minimum upgrades needed to reach the same floor OVR
 * Returns recommendation on how many upgrades are actually needed
 */
export interface EfficientUpgradeResult {
    fullUpgradeOVR: number; // OVR with all 5 upgrades
    floorFullUpgrade: number; // floor() of full upgrade OVR
    minUpgradesNeeded: number; // minimum upgrades to achieve same floor
    minUpgradeOVR: number; // OVR with minimum upgrades
    savedUpgrades: number; // how many upgrades can be saved
    recommendedStats: string[]; // which stats to upgrade
}

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

    // Sort by weight descending (best stats to upgrade first)
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

    // Find minimum upgrades needed to achieve same floor
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

    // If no break occurred, all 5 are needed
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
 * Format OVR for display
 */
export function formatOVR(ovr: number, showDecimal: boolean = true): string {
    if (showDecimal) {
        return ovr.toFixed(2);
    }
    return Math.floor(ovr).toString();
}

/**
 * Get upgrade impact for a specific stat
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
        impact: (statWeight.weight * 2) / 100,
        weight: statWeight.weight,
    };
}
