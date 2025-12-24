/**
 * Tests for upgradeService
 * ทดสอบฟังก์ชันระบบตีบวก
 */

import {
    getUpgradeInfo,
    getTotalOvrBonus,
    getLevelAfterFailure,
    calculateSuccessRate,
    simulateUpgrade,
    isMaxLevel,
    isMinLevel,
    UPGRADE_DATA,
    BASE_CHANCE_MAP,
} from '@/services/upgradeService';

describe('upgradeService', () => {
    describe('getUpgradeInfo', () => {
        it('should return upgrade info for valid level', () => {
            const result = getUpgradeInfo(1);

            expect(result).not.toBeNull();
            expect(result?.from).toBe(1);
            expect(result?.to).toBe(2);
            expect(result?.chance).toBe(100);
        });

        it('should return correct data for level 5', () => {
            const result = getUpgradeInfo(5);

            expect(result).not.toBeNull();
            expect(result?.from).toBe(5);
            expect(result?.to).toBe(6);
            expect(result?.chance).toBe(26);
        });

        it('should return null for level 13 (max)', () => {
            const result = getUpgradeInfo(13);
            expect(result).toBeNull();
        });

        it('should return null for level 0', () => {
            const result = getUpgradeInfo(0);
            expect(result).toBeNull();
        });
    });

    describe('getTotalOvrBonus', () => {
        it('should return 3 for level 1 (base bonus)', () => {
            const result = getTotalOvrBonus(1);
            expect(result).toBe(3);
        });

        it('should return 0 for level 0 or below', () => {
            expect(getTotalOvrBonus(0)).toBe(0);
            expect(getTotalOvrBonus(-1)).toBe(0);
        });

        it('should return correct bonus for level 5', () => {
            // Level 5 should have totalOvr = 9
            const result = getTotalOvrBonus(5);
            expect(result).toBe(9);
        });

        it('should return correct bonus for max level', () => {
            // Level 13 should have totalOvr = 30
            const result = getTotalOvrBonus(13);
            expect(result).toBe(30);
        });
    });

    describe('getLevelAfterFailure', () => {
        it('should not drop below level 1', () => {
            const result = getLevelAfterFailure(1);
            expect(result.newLevel).toBe(1);
        });

        it('should return level between min and current for low levels', () => {
            // Run multiple times to account for randomness
            for (let i = 0; i < 10; i++) {
                const result = getLevelAfterFailure(3);
                expect(result.newLevel).toBeGreaterThanOrEqual(1);
                expect(result.newLevel).toBeLessThan(3);
            }
        });

        it('should have isCatastrophic property', () => {
            const result = getLevelAfterFailure(5);
            expect(result).toHaveProperty('isCatastrophic');
            expect(typeof result.isCatastrophic).toBe('boolean');
        });

        it('should handle high levels correctly', () => {
            for (let i = 0; i < 10; i++) {
                const result = getLevelAfterFailure(12);
                expect(result.newLevel).toBeGreaterThanOrEqual(1);
                expect(result.newLevel).toBeLessThan(12);
            }
        });
    });

    describe('calculateSuccessRate', () => {
        it('should return 100% for level 1 with full boost', () => {
            const result = calculateSuccessRate(1, 5.0);
            expect(result).toBe(100);
        });

        it('should return half rate with half boost', () => {
            // Level 1 base = 100%, with 2.5 boost = 50%
            const result = calculateSuccessRate(1, 2.5);
            expect(result).toBe(50);
        });

        it('should return 0% with 0 boost', () => {
            const result = calculateSuccessRate(1, 0);
            expect(result).toBe(0);
        });

        it('should calculate correctly for level 5', () => {
            // Level 5 base = 26%, full boost = 26%
            const result = calculateSuccessRate(5, 5.0);
            expect(result).toBe(26);
        });

        it('should cap at 100%', () => {
            // Even with boost > 5, should not exceed 100
            const result = calculateSuccessRate(1, 10);
            expect(result).toBeLessThanOrEqual(100);
        });

        it('should return 0 for invalid level', () => {
            const result = calculateSuccessRate(99, 5.0);
            expect(result).toBe(0);
        });
    });

    describe('simulateUpgrade', () => {
        it('should return success true when upgrade succeeds', () => {
            // Level 1 with full boost should always succeed
            let successCount = 0;
            for (let i = 0; i < 100; i++) {
                const result = simulateUpgrade(1, 5.0);
                if (result.success) successCount++;
            }
            // Should succeed most of the time at 100%
            expect(successCount).toBeGreaterThan(95);
        });

        it('should increase level on success', () => {
            // Level 1 with full boost
            const result = simulateUpgrade(1, 5.0);
            if (result.success) {
                expect(result.newLevel).toBe(2);
            }
        });

        it('should not upgrade beyond max level', () => {
            const result = simulateUpgrade(13, 5.0);
            expect(result.success).toBe(false);
            expect(result.newLevel).toBe(13);
        });

        it('should have required properties', () => {
            const result = simulateUpgrade(5, 5.0);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('previousLevel');
            expect(result).toHaveProperty('newLevel');
            expect(result).toHaveProperty('isCatastrophic');
        });

        it('should have very low success rate at high levels with low boost', () => {
            // Level 12 with 1.0 boost = 0.2% chance
            let successCount = 0;
            for (let i = 0; i < 100; i++) {
                const result = simulateUpgrade(12, 1.0);
                if (result.success) successCount++;
            }
            // Should rarely succeed
            expect(successCount).toBeLessThan(5);
        });
    });

    describe('isMaxLevel', () => {
        it('should return true for level 13', () => {
            expect(isMaxLevel(13)).toBe(true);
        });

        it('should return true for level above 13', () => {
            expect(isMaxLevel(14)).toBe(true);
        });

        it('should return false for level 12', () => {
            expect(isMaxLevel(12)).toBe(false);
        });

        it('should return false for level 1', () => {
            expect(isMaxLevel(1)).toBe(false);
        });
    });

    describe('isMinLevel', () => {
        it('should return true for level 1', () => {
            expect(isMinLevel(1)).toBe(true);
        });

        it('should return true for level 0', () => {
            expect(isMinLevel(0)).toBe(true);
        });

        it('should return false for level 2', () => {
            expect(isMinLevel(2)).toBe(false);
        });
    });

    describe('UPGRADE_DATA constant', () => {
        it('should have 12 entries', () => {
            expect(UPGRADE_DATA).toHaveLength(12);
        });

        it('should have continuous levels from 1 to 12', () => {
            for (let i = 0; i < 12; i++) {
                expect(UPGRADE_DATA[i].from).toBe(i + 1);
                expect(UPGRADE_DATA[i].to).toBe(i + 2);
            }
        });
    });

    describe('BASE_CHANCE_MAP constant', () => {
        it('should have entries for levels 1-12', () => {
            for (let i = 1; i <= 12; i++) {
                expect(BASE_CHANCE_MAP[i]).toBeDefined();
            }
        });

        it('should have 100% for level 1', () => {
            expect(BASE_CHANCE_MAP[1]).toBe(100);
        });

        it('should have 1% for level 12', () => {
            expect(BASE_CHANCE_MAP[12]).toBe(1);
        });
    });
});
