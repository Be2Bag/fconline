/**
 * Tests for taxService
 * ทดสอบฟังก์ชันคำนวณภาษีตลาด
 */

import {
    calculateNetPrice,
    calculateTotalSummary,
    generateItemId,
    createNewPlayerItem,
    formatNumber,
    formatShortNumber,
    formatBInput,
    parseBInput,
    MARKET_TAX_RATE,
    PC_DISCOUNT_RATE,
} from '@/services/taxService';
import type { TaxPlayerItem, TaxGlobalSettings } from '@/types/tax';

describe('taxService', () => {
    // Sample data
    const sampleItem: TaxPlayerItem = {
        id: 'test-1',
        name: 'Test Player',
        price: 100000000000, // 100B
        cpDiscount: 0.20, // 20% CP
    };

    const sampleSettings: TaxGlobalSettings = {
        svipDiscount: 0.20, // SVIP 20%
        pcEnabled: true, // PC 10%
    };

    describe('calculateNetPrice', () => {
        it('should calculate net price correctly with all discounts', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            // Price = 100B
            // Tax = 40% = 40B
            // Discounts = SVIP 20% + PC 10% + CP 20% = 50%
            // Discount amount = 40B * 50% = 20B
            // Net = 100B - 40B + 20B = 80B
            expect(result.netPrice).toBe(80000000000);
        });

        it('should calculate gross tax correctly', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            // Tax = 40% of 100B = 40B
            expect(result.grossTax).toBe(40000000000);
        });

        it('should include discount breakdown', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            // 40B tax * 20% SVIP = 8B
            expect(result.discountBreakdown.svip).toBe(8000000000);
            // 40B tax * 10% PC = 4B
            expect(result.discountBreakdown.pc).toBe(4000000000);
            // 40B tax * 20% CP = 8B
            expect(result.discountBreakdown.cp).toBe(8000000000);
        });

        it('should handle no discounts', () => {
            const noDiscountSettings: TaxGlobalSettings = {
                svipDiscount: 0,
                pcEnabled: false,
            };
            const noDiscountItem: TaxPlayerItem = {
                ...sampleItem,
                cpDiscount: 0,
            };

            const result = calculateNetPrice(noDiscountItem, noDiscountSettings);

            // Net = 100B - 40B = 60B (no discounts)
            expect(result.netPrice).toBe(60000000000);
        });

        it('should handle zero price', () => {
            const zeroItem: TaxPlayerItem = { ...sampleItem, price: 0 };
            const result = calculateNetPrice(zeroItem, sampleSettings);

            expect(result.netPrice).toBe(0);
            expect(result.grossTax).toBe(0);
        });
    });

    describe('calculateTotalSummary', () => {
        it('should sum multiple items correctly', () => {
            const items: TaxPlayerItem[] = [
                { id: '1', name: 'Player 1', price: 100000000000, cpDiscount: 0.20 },
                { id: '2', name: 'Player 2', price: 50000000000, cpDiscount: 0.10 },
            ];

            const result = calculateTotalSummary(items, sampleSettings);

            expect(result.totalPrice).toBe(150000000000);
            expect(result.itemCount).toBe(2);
        });

        it('should return zeros for empty array', () => {
            const result = calculateTotalSummary([], sampleSettings);

            expect(result.totalPrice).toBe(0);
            expect(result.totalNetPrice).toBe(0);
            expect(result.itemCount).toBe(0);
        });

        it('should have discount breakdown totals', () => {
            const items: TaxPlayerItem[] = [sampleItem];
            const result = calculateTotalSummary(items, sampleSettings);

            expect(result.discountBreakdown).toHaveProperty('svip');
            expect(result.discountBreakdown).toHaveProperty('pc');
            expect(result.discountBreakdown).toHaveProperty('cp');
        });
    });

    describe('generateItemId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateItemId();
            const id2 = generateItemId();

            expect(id1).not.toBe(id2);
        });

        it('should start with "player-"', () => {
            const id = generateItemId();
            expect(id.startsWith('player-')).toBe(true);
        });
    });

    describe('createNewPlayerItem', () => {
        it('should create item with required properties', () => {
            const item = createNewPlayerItem();

            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('cpDiscount');
        });

        it('should have default values', () => {
            const item = createNewPlayerItem();

            expect(item.price).toBe(0);
            expect(item.cpDiscount).toBe(0);
        });

        it('should generate unique IDs', () => {
            const item1 = createNewPlayerItem();
            const item2 = createNewPlayerItem();

            expect(item1.id).not.toBe(item2.id);
        });
    });

    describe('formatNumber', () => {
        it('should format with commas', () => {
            expect(formatNumber(1000000)).toContain('1');
            expect(formatNumber(1000000).length).toBeGreaterThan(1);
        });

        it('should handle decimals', () => {
            const result = formatNumber(1234.56);
            expect(result).toContain('.');
        });

        it('should not show decimals for whole numbers', () => {
            const result = formatNumber(1000);
            // Should not end with .00
            expect(result.endsWith('.00')).toBe(false);
        });
    });

    describe('formatShortNumber', () => {
        it('should format billions with B suffix', () => {
            const result = formatShortNumber(100000000000);
            expect(result).toBe('100B');
        });

        it('should show decimals for non-round numbers', () => {
            const result = formatShortNumber(61100000000);
            expect(result).toBe('61.1B');
        });

        it('should return "0B" for zero', () => {
            const result = formatShortNumber(0);
            expect(result).toBe('0B');
        });
    });

    describe('formatBInput', () => {
        it('should format to billions without B suffix', () => {
            const result = formatBInput(100000000000);
            expect(result).toBe('100');
        });

        it('should show decimals', () => {
            const result = formatBInput(61100000000);
            expect(result).toBe('61.1');
        });

        it('should return empty string for zero', () => {
            const result = formatBInput(0);
            expect(result).toBe('');
        });
    });

    describe('parseBInput', () => {
        it('should parse whole number billions', () => {
            const result = parseBInput('100');
            expect(result).toBe(100000000000);
        });

        it('should parse decimal billions', () => {
            const result = parseBInput('61.1');
            expect(result).toBe(61100000000);
        });

        it('should return 0 for invalid input', () => {
            expect(parseBInput('')).toBe(0);
            expect(parseBInput('abc')).toBe(0);
        });

        it('should not accept negative values', () => {
            const result = parseBInput('-100');
            expect(result).toBe(0);
        });
    });

    describe('Constants', () => {
        it('should have correct market tax rate', () => {
            expect(MARKET_TAX_RATE).toBe(0.4);
        });

        it('should have correct PC discount rate', () => {
            expect(PC_DISCOUNT_RATE).toBe(0.1);
        });
    });
});
