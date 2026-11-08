/**
 * Tests for taxService
 * ทดสอบฟังก์ชันคำนวณภาษีตลาด
 */

import {
    calculateNetPrice,
    calculateTotalSummary,
    generateItemId,
    createNewPlayerItem,
    formatBPAmount,
    formatBPInput,
    parseBPInput,
    CP_DISCOUNT_OPTIONS,
    MARKET_TAX_RATE,
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
    };

    describe('calculateNetPrice', () => {
        it('ignores an obsolete PC setting when calculating the net price', () => {
            const legacySettings = { svipDiscount: 0.20 as const, pcEnabled: true };
            const result = calculateNetPrice(sampleItem, legacySettings);
            expect(result.netPrice).toBe(76_000);
            expect(result.totalDiscountRate).toBe(0.4);
            expect(result.discountBreakdown).toEqual({ svip: 8_000, cp: 8_000 });
        });

        it('should calculate net price correctly with all discounts', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            // Price = 100,000 BP
            // Tax = 40% = 40,000 BP
            // Discounts = SVIP 20% + CP 20% = 40%
            // Net = 100,000 - 40,000 + 16,000 = 76,000 BP
            expect(result.netPrice).toBe(76_000);
        });

        it('should calculate gross tax correctly', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            expect(result.grossTax).toBe(40_000);
        });

        it('should include discount breakdown', () => {
            const result = calculateNetPrice(sampleItem, sampleSettings);

            expect(result.discountBreakdown.svip).toBe(8_000);
            expect(result.discountBreakdown.cp).toBe(8_000);
        });

        it('should handle no discounts', () => {
            const noDiscountSettings: TaxGlobalSettings = {
                svipDiscount: 0,
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
        };

        const result = calculateNetPrice(highDiscountItem, noOtherDiscountSettings);

        expect(result.netPrice).toBe(80_000);
        expect(result.discountBreakdown.cp).toBe(20_000);
    });


    it.each([
        [0.55, 0, 8_200_000, 2_200_000, 'CP 55%'],
        [0.55, 0.20, 9_000_000, 2_200_000, 'CP 55%'],
        [0.60, 0, 8_400_000, 2_400_000, 'CP 60%'],
        [0.60, 0.20, 9_200_000, 2_400_000, 'CP 60%'],
    ] as const)('calculates CP %s with SVIP %s correctly', (cpDiscount, svipDiscount, netPrice, cpRefund, label) => {
        expect(CP_DISCOUNT_OPTIONS).toContainEqual({ value: cpDiscount, label });
        const result = calculateNetPrice({ ...sampleItem, price: 10_000_000, cpDiscount }, { svipDiscount });
        expect(result.netPrice).toBe(netPrice);
        expect(result.discountBreakdown.cp).toBe(cpRefund);
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
            expect(result.totalNetPrice).toBe(112_000);
            expect(result.discountBreakdown).toEqual({ svip: 12_000, cp: 10_000 });
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
            expect(result.discountBreakdown).not.toHaveProperty('pc');
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

    describe('formatBPAmount', () => {
        it.each([
            [0, '0M'],
            [1_000, '0.001M'],
            [10_000, '0.01M'],
            [800_000_000, '800M'],
            [1_000_000, '1M'],
            [35_400_000, '35.4M'],
            [130_891_375, '130.891M'],
            [999_999_999, '999.999M'],
            [1_000_000_000, '1B'],
            [3_130_000_000, '3.13B'],
            [3_130_999_999, '3.13B'],
            [6_800_000_000, '6.8B'],
            [61.1, '0.0000611M'],
            [1.23456, '0.00000123456M'],
        ])('formats %s as %s', (value, expected) => {
            expect(formatBPAmount(value)).toBe(expected);
        });
    });

    describe('formatBPInput', () => {
        it.each([
            [10_000_000, 'M', '10'],
            [10_000_000, 'B', '0.01'],
            [3_130_000_000, 'B', '3.13'],
            [130_891_375, 'M', '130.891375'],
            [1000, 'M', '0.001'],
            [0.000001, 'M', '0.000000000001'],
            [0, 'M', ''],
            [0, 'B', ''],
        ] as const)('shows %s BP in %s as %s', (price, unit, expected) => {
            expect(formatBPInput(price, unit)).toBe(expected);
        });
    });

    describe('parseBPInput', () => {
        it.each([
            ['10', 'M', 10_000_000],
            ['10', 'B', 10_000_000_000],
            [' 1,000.5 ', 'M', 1_000_500_000],
            ['3.13', 'B', 3_130_000_000],
            ['0.000001', 'M', 1],
            ['', 'M', 0],
            ['.', 'M', 0],
            ['abc', 'M', null],
            ['100abc', 'B', null],
            ['1.2.3', 'M', null],
            ['-100', 'B', null],
            ['Infinity', 'M', null],
            ['9'.repeat(400), 'B', null],
            ['9'.repeat(305), 'B', null],
        ] as const)('parses %s %s as %s BP', (value, unit, expected) => {
            expect(parseBPInput(value, unit)).toBe(expected);
        });
    });

    describe('Constants', () => {
        it('should have correct market tax rate', () => {
            expect(MARKET_TAX_RATE).toBe(0.4);
        });

    });
});
