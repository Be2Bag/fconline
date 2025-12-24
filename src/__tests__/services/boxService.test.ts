/**
 * Tests for boxService
 * ทดสอบฟังก์ชันระบบเปิดกล่อง
 */

import {
    formatBP,
    openBox,
    openMultipleBoxes,
    calculateTotalValue,
    findBestReward,
    countByRarity,
    calculateProfitLoss,
} from '@/services/boxService';
import type { BoxType, OpenResult, Rarity } from '@/types';

describe('boxService', () => {
    // Sample box for testing - matches BoxType interface
    const sampleBox: BoxType = {
        id: 'test-box',
        name: 'Test Box',
        description: 'A test box',
        icon: '/test.png',
        color: '#FF0000',
        valueUnit: 'bp',
        fcCost: 100,
        rewards: [
            { id: 'r1', name: 'Legendary Item', rarity: 'legendary', chance: 1, minValue: 1000000000, maxValue: 5000000000 },
            { id: 'r2', name: 'Epic Item', rarity: 'epic', chance: 5, minValue: 100000000, maxValue: 500000000 },
            { id: 'r3', name: 'Rare Item', rarity: 'rare', chance: 14, minValue: 10000000, maxValue: 50000000 },
            { id: 'r4', name: 'Uncommon Item', rarity: 'uncommon', chance: 30, minValue: 1000000, maxValue: 5000000 },
            { id: 'r5', name: 'Common Item', rarity: 'common', chance: 50, minValue: 100000, maxValue: 500000 },
        ],
    };

    describe('formatBP', () => {
        it('should format trillions correctly', () => {
            expect(formatBP(1500000000000)).toBe('1.5T');
            expect(formatBP(1000000000000)).toBe('1.0T');
        });

        it('should format billions correctly', () => {
            expect(formatBP(1500000000)).toBe('1.5B');
            expect(formatBP(1000000000)).toBe('1.0B');
        });

        it('should format millions correctly', () => {
            expect(formatBP(1500000)).toBe('1.5M');
            expect(formatBP(100000000)).toBe('100.0M');
        });

        it('should format thousands correctly', () => {
            expect(formatBP(1500)).toBe('1.5K');
            expect(formatBP(999)).toBe('999');
        });

        it('should return plain number for small values', () => {
            expect(formatBP(500)).toBe('500');
            expect(formatBP(0)).toBe('0');
        });
    });

    describe('openBox', () => {
        it('should return a valid OpenResult', () => {
            const result = openBox(sampleBox);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('reward');
            expect(result).toHaveProperty('actualValue');
            expect(result).toHaveProperty('timestamp');
        });

        it('should return value within reward range', () => {
            const result = openBox(sampleBox);

            expect(result.actualValue).toBeGreaterThanOrEqual(result.reward.minValue);
            expect(result.actualValue).toBeLessThanOrEqual(result.reward.maxValue);
        });

        it('should return reward from box rewards', () => {
            const result = openBox(sampleBox);

            const rewardNames = sampleBox.rewards.map(r => r.name);
            expect(rewardNames).toContain(result.reward.name);
        });

        it('should generate unique IDs', () => {
            const result1 = openBox(sampleBox);
            const result2 = openBox(sampleBox);

            expect(result1.id).not.toBe(result2.id);
        });
    });

    describe('openMultipleBoxes', () => {
        it('should return correct number of results', () => {
            const results = openMultipleBoxes(sampleBox, 10);
            expect(results).toHaveLength(10);
        });

        it('should return empty array for count 0', () => {
            const results = openMultipleBoxes(sampleBox, 0);
            expect(results).toHaveLength(0);
        });

        it('should have unique IDs for each result', () => {
            const results = openMultipleBoxes(sampleBox, 5);
            const ids = results.map(r => r.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(5);
        });
    });

    describe('calculateTotalValue', () => {
        it('should sum all actual values', () => {
            const results: OpenResult[] = [
                { id: '1', reward: sampleBox.rewards[4], actualValue: 100000, timestamp: Date.now() },
                { id: '2', reward: sampleBox.rewards[4], actualValue: 200000, timestamp: Date.now() },
                { id: '3', reward: sampleBox.rewards[4], actualValue: 300000, timestamp: Date.now() },
            ];

            const total = calculateTotalValue(results);
            expect(total).toBe(600000);
        });

        it('should return 0 for empty array', () => {
            const total = calculateTotalValue([]);
            expect(total).toBe(0);
        });
    });

    describe('findBestReward', () => {
        it('should return legendary over epic', () => {
            const results: OpenResult[] = [
                { id: '1', reward: sampleBox.rewards[1], actualValue: 500000000, timestamp: Date.now() }, // Epic
                { id: '2', reward: sampleBox.rewards[0], actualValue: 1000000000, timestamp: Date.now() }, // Legendary
            ];

            const best = findBestReward(results);
            expect(best?.reward.rarity).toBe('legendary');
        });

        it('should return higher value when same rarity', () => {
            const results: OpenResult[] = [
                { id: '1', reward: sampleBox.rewards[4], actualValue: 100000, timestamp: Date.now() },
                { id: '2', reward: sampleBox.rewards[4], actualValue: 500000, timestamp: Date.now() },
            ];

            const best = findBestReward(results);
            expect(best?.actualValue).toBe(500000);
        });

        it('should return null for empty array', () => {
            const best = findBestReward([]);
            expect(best).toBeNull();
        });
    });

    describe('countByRarity', () => {
        it('should count each rarity correctly', () => {
            const results: OpenResult[] = [
                { id: '1', reward: sampleBox.rewards[0], actualValue: 1000000000, timestamp: Date.now() }, // legendary
                { id: '2', reward: sampleBox.rewards[0], actualValue: 2000000000, timestamp: Date.now() }, // legendary
                { id: '3', reward: sampleBox.rewards[1], actualValue: 100000000, timestamp: Date.now() }, // epic
                { id: '4', reward: sampleBox.rewards[4], actualValue: 100000, timestamp: Date.now() }, // common
            ];

            const counts = countByRarity(results);

            expect(counts.legendary).toBe(2);
            expect(counts.epic).toBe(1);
            expect(counts.rare).toBe(0);
            expect(counts.uncommon).toBe(0);
            expect(counts.common).toBe(1);
        });

        it('should return all zeros for empty array', () => {
            const counts = countByRarity([]);

            expect(counts.legendary).toBe(0);
            expect(counts.epic).toBe(0);
            expect(counts.rare).toBe(0);
            expect(counts.uncommon).toBe(0);
            expect(counts.common).toBe(0);
        });
    });

    describe('calculateProfitLoss', () => {
        it('should calculate positive profit', () => {
            const result = calculateProfitLoss(1000000, 500);
            expect(result).toBe(999500);
        });

        it('should calculate negative loss', () => {
            const result = calculateProfitLoss(500, 1000);
            expect(result).toBe(-500);
        });

        it('should apply FC to BP rate', () => {
            // 1000 earned, 100 FC spent, rate = 10000 (1 FC = 10000 BP)
            const result = calculateProfitLoss(1000, 100, 10000);
            expect(result).toBe(1000 - (100 * 10000));
        });

        it('should return earned value when spent is 0', () => {
            const result = calculateProfitLoss(5000, 0);
            expect(result).toBe(5000);
        });
    });
});
