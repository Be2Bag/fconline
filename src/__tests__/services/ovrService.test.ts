/**
 * Tests for ovrService
 * ทดสอบฟังก์ชันการคำนวณ OVR
 */

import {
    calculateOVR,
    calculateUpgradedOVR,
    getOptimalUpgrades,
    getEfficientUpgrades,
    analyzePositions,
    formatOVR,
    getUpgradeImpact,
} from '@/services/ovrService';
import type { StatValues, StatWeight } from '@/types';

describe('ovrService', () => {
    // Sample test data
    const sampleStats: StatValues = {
        speed: 90,
        acceleration: 88,
        finishing: 85,
        shotPower: 82,
        longShots: 80,
        positioning: 78,
        volleys: 75,
        penalties: 70,
        dribbling: 85,
        ballControl: 87,
        agility: 82,
        balance: 80,
        reactions: 83,
        composure: 85,
        shortPassing: 80,
        longPassing: 75,
        curve: 78,
        crossing: 72,
        freeKick: 65,
        vision: 77,
        marking: 45,
        standTackle: 40,
        slideTackle: 38,
        interceptions: 42,
        aggression: 65,
        headingAccuracy: 70,
        jumping: 75,
        stamina: 85,
        strength: 78,
    };

    const sampleWeights: StatWeight[] = [
        { stat: 'speed', weight: 15 },
        { stat: 'finishing', weight: 20 },
        { stat: 'positioning', weight: 18 },
        { stat: 'shotPower', weight: 12 },
        { stat: 'dribbling', weight: 15 },
        { stat: 'ballControl', weight: 10 },
        { stat: 'reactions', weight: 10 },
    ];

    describe('calculateOVR', () => {
        it('should calculate OVR correctly from stats and weights', () => {
            const result = calculateOVR(sampleStats, sampleWeights);

            // Manual calculation:
            // (90*15 + 85*20 + 78*18 + 82*12 + 85*15 + 87*10 + 83*10) / 100
            // = (1350 + 1700 + 1404 + 984 + 1275 + 870 + 830) / 100
            // = 8413 / 100 = 84.13
            expect(result).toBeCloseTo(84.13, 2);
        });

        it('should return 0 for empty weights', () => {
            const result = calculateOVR(sampleStats, []);
            expect(result).toBe(0);
        });

        it('should handle missing stats gracefully', () => {
            const incompleteStats: StatValues = { speed: 90 };
            const result = calculateOVR(incompleteStats, sampleWeights);

            // Only speed should contribute
            expect(result).toBeCloseTo((90 * 15) / 100, 2);
        });
    });

    describe('calculateUpgradedOVR', () => {
        it('should calculate OVR with +2 upgrades', () => {
            const baseOvr = calculateOVR(sampleStats, sampleWeights);
            const upgradedOvr = calculateUpgradedOVR(sampleStats, sampleWeights, ['speed', 'finishing']);

            // Upgraded stats should add +2 to speed and finishing
            // Additional contribution: (2*15 + 2*20) / 100 = 70/100 = 0.7
            expect(upgradedOvr).toBeCloseTo(baseOvr + 0.7, 2);
        });

        it('should return same OVR with empty upgrades', () => {
            const baseOvr = calculateOVR(sampleStats, sampleWeights);
            const upgradedOvr = calculateUpgradedOVR(sampleStats, sampleWeights, []);

            expect(upgradedOvr).toBeCloseTo(baseOvr, 2);
        });
    });

    describe('getOptimalUpgrades', () => {
        it('should return optimal stats for a valid position', () => {
            const result = getOptimalUpgrades('ST', 5);

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeLessThanOrEqual(5);

            if (result.length > 0) {
                // Should be sorted by weight descending
                for (let i = 1; i < result.length; i++) {
                    expect(result[i - 1].weight).toBeGreaterThanOrEqual(result[i].weight);
                }
            }
        });

        it('should return empty array for invalid position', () => {
            const result = getOptimalUpgrades('INVALID_POSITION');
            expect(result).toEqual([]);
        });

        it('should respect maxUpgrades parameter', () => {
            const result = getOptimalUpgrades('ST', 3);
            expect(result.length).toBeLessThanOrEqual(3);
        });
    });

    describe('getEfficientUpgrades', () => {
        it('should return efficient upgrade analysis for valid position', () => {
            const result = getEfficientUpgrades(sampleStats, 'ST');

            expect(result).toHaveProperty('fullUpgradeOVR');
            expect(result).toHaveProperty('floorFullUpgrade');
            expect(result).toHaveProperty('minUpgradesNeeded');
            expect(result).toHaveProperty('minUpgradeOVR');
            expect(result).toHaveProperty('savedUpgrades');
            expect(result).toHaveProperty('recommendedStats');

            expect(result.minUpgradesNeeded).toBeGreaterThanOrEqual(0);
            expect(result.minUpgradesNeeded).toBeLessThanOrEqual(5);
            expect(result.savedUpgrades).toBe(5 - result.minUpgradesNeeded);
        });

        it('should return default values for invalid position', () => {
            const result = getEfficientUpgrades(sampleStats, 'INVALID');

            expect(result.fullUpgradeOVR).toBe(0);
            expect(result.minUpgradesNeeded).toBe(0);
        });
    });

    describe('analyzePositions', () => {
        it('should return position analysis sorted by OVR', () => {
            const result = analyzePositions(sampleStats);

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);

            // Should be sorted by upgradedOVR descending
            for (let i = 1; i < result.length; i++) {
                expect(result[i - 1].upgradedOVR).toBeGreaterThanOrEqual(result[i].upgradedOVR);
            }
        });

        it('should include required properties in each result', () => {
            const result = analyzePositions(sampleStats);

            if (result.length > 0) {
                expect(result[0]).toHaveProperty('position');
                expect(result[0]).toHaveProperty('thaiName');
                expect(result[0]).toHaveProperty('baseOVR');
                expect(result[0]).toHaveProperty('upgradedOVR');
                expect(result[0]).toHaveProperty('top5Stats');
            }
        });
    });

    describe('formatOVR', () => {
        it('should format OVR with decimal by default', () => {
            const result = formatOVR(84.567);
            expect(result).toBe('84.57');
        });

        it('should format OVR without decimal when specified', () => {
            const result = formatOVR(84.567, false);
            expect(result).toBe('84');
        });

        it('should handle whole numbers', () => {
            const result = formatOVR(85.00);
            expect(result).toBe('85.00');
        });
    });

    describe('getUpgradeImpact', () => {
        it('should return impact for valid stat and position', () => {
            const result = getUpgradeImpact('speed', 'ST');

            if (result) {
                expect(result).toHaveProperty('impact');
                expect(result).toHaveProperty('weight');
                expect(result.impact).toBeGreaterThanOrEqual(0);
            }
        });

        it('should return null for invalid position', () => {
            const result = getUpgradeImpact('speed', 'INVALID');
            expect(result).toBeNull();
        });

        it('should return null for invalid stat', () => {
            const result = getUpgradeImpact('invalidStat', 'ST');
            expect(result).toBeNull();
        });
    });
});
