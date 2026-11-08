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
    formatBPAmount,
    formatBPInput,
    parseBPInput,
    CP_DISCOUNT_OPTIONS,
    MARKET_TAX_RATE,
    PC_DISCOUNT_RATE,
} from '@/services/taxService';
import type { TaxPlayerItem, TaxGlobalSettings } from '@/types/tax';

describe('taxService', () => {
    // Sample data
    const sampleItem: TaxPlayerItem = {
        id: 'test-1',
        name: 'Test Player',
        price: 100_000, // BP ใหม่
        cpDiscount: 0.20, // 20% CP
    };

    const sampleSettings: TaxGlobalSettings = {
        svipDiscount: 0.20, // SVIP 20%
        pcEnabled: true, // PC 10%
    };

    describe('calculateNetPrice', () => {
        it('should calculate net price correctly with all discounts', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            // Price = 100,000 BP
            // Tax = 40% = 40,000 BP
            // Discounts = SVIP 20% + PC 10% + CP 20% = 50%
            // Discount amount = 40,000 BP * 50% = 20,000 BP
            // Net = 100,000 BP - 40,000 BP + 20,000 BP = 80,000 BP
            expect(result.netPrice).toBe(80_000);
        });

        it('should calculate gross tax correctly', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            expect(result.grossTax).toBe(40_000);
        });

        it('should include discount breakdown', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            expect(result.discountBreakdown.svip).toBe(8_000);
            expect(result.discountBreakdown.pc).toBe(4_000);
            expect(result.discountBreakdown.cp).toBe(8_000);
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

            expect(result.netPrice).toBe(60_000);
        });

        it('should handle zero price', () => {
            const zeroItem: TaxPlayerItem = { ...sampleItem, price: 0 };
            const result = calculateNetPrice(zeroItem, sampleSettings);

            expect(result.netPrice).toBe(0);
            expect(result.grossTax).toBe(0);
        });
    });


    it('should calculate correctly with 45% CP discount', () => {
        const highDiscountItem: TaxPlayerItem = {
            ...sampleItem,
            cpDiscount: 0.45,
        };
        const noOtherDiscountSettings: TaxGlobalSettings = {
            svipDiscount: 0,
            pcEnabled: false,
        };

        const result = calculateNetPrice(highDiscountItem, noOtherDiscountSettings);

        expect(result.netPrice).toBe(78_000);
        expect(result.discountBreakdown.cp).toBe(18_000);
    });

    it('should include and calculate correctly with 50% CP discount', () => {
        expect(CP_DISCOUNT_OPTIONS).toContainEqual({
            value: 0.50,
            label: 'CP 50%',
        });

        const highDiscountItem: TaxPlayerItem = {
            ...sampleItem,
            cpDiscount: 0.50,
        };
        const noOtherDiscountSettings: TaxGlobalSettings = {
            svipDiscount: 0,
            pcEnabled: false,
        };

        const result = calculateNetPrice(highDiscountItem, noOtherDiscountSettings);

        expect(result.netPrice).toBe(80_000);
        expect(result.discountBreakdown.cp).toBe(20_000);
    });


    describe('calculateTotalSummary', () => {
        it('should sum multiple items correctly', () => {
            const items: TaxPlayerItem[] = [
                { id: '1', name: 'Player 1', price: 100_000, cpDiscount: 0.20 },
                { id: '2', name: 'Player 2', price: 50_000, cpDiscount: 0.10 },
            ];

            const result = calculateTotalSummary(items, sampleSettings);

            expect(result.totalPrice).toBe(150_000);
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
            expect(formatNumber(1000000)).toBe('1,000,000');
        });

        it('should handle decimals', () => {
            expect(formatNumber(1234.56)).toBe('1,234.56');
        });

        it('should not show decimals for whole numbers', () => {
            expect(formatNumber(1000)).toBe('1,000');
        });
    });

    describe('formatBPAmount', () => {
        it.each([
            [0, '0 BP'],
            [1_000, '1,000 BP'],
            [10_000, '10,000 BP'],
            [800_000_000, '800,000,000 BP'],
            [61.1, '61.1 BP'],
            [1.23456, '1.235 BP'],
        ])('formats %s as %s', (value, expected) => {
            expect(formatBPAmount(value)).toBe(expected);
        });
    });

    describe('formatBPInput', () => {
        it('should keep the price in new BP without scaling', () => {
            expect(formatBPInput(1000)).toBe('1000');
        });

        it('should show decimals', () => {
            expect(formatBPInput(61.1)).toBe('61.1');
        });

        it('should return empty string for zero', () => {
            const result = formatBPInput(0);
            expect(result).toBe('');
        });
    });

    describe('parseBPInput', () => {
        it.each([
            ['1000', 1000],
            [' 1,000.5 ', 1000.5],
            ['61.1', 61.1],
            ['0.000001', 0.000001],
            ['', 0],
            ['abc', 0],
            ['100abc', 0],
            ['1.2.3', 0],
            ['-100', 0],
            ['Infinity', 0],
            ['9'.repeat(400), 0],
        ])('parses %s as %s new BP', (value, expected) => {
            expect(parseBPInput(value)).toBe(expected);
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
