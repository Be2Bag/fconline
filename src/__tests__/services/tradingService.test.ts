import { analyzeTrade } from '@/services/tradingService';
import { calculateNetPrice, formatBPAmount } from '@/services/taxService';
import { TAX_CONFIG } from '@/config/tax.config';

describe('trading calculator', () => {
    it.each([
        [0, 0, 1_667_000_000],
        [0.20, 0, 1_471_000_000],
        [0, 0.55, 1_220_000_000],
        [0, 0.60, 1_191_000_000],
        [0.20, 0.55, 1_112_000_000],
        [0.20, 0.60, 1_087_000_000],
    ] as const)('rounds up the break-even sale with SVIP %s and CP %s', (svipDiscount, cpDiscount, expected) => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: null, svipDiscount, cpDiscount });
        if (result.status !== 'ready') throw new Error('Expected valid purchase');
        expect(result.minimumSalePrice).toBe(expected);
        expect(result.netAtMinimum).toBeGreaterThanOrEqual(1_000_000_000);
        expect(result.sale).toBeNull();
    });

    it.each([[0, 0.60], [0.20, 0.40]] as const)('selects the lowest real coupon at SVIP %s', (svipDiscount, cpDiscount) => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 1_200_000_000, svipDiscount, cpDiscount: 0 });
        if (result.status !== 'ready' || result.sale === null) throw new Error('Expected valid sale');
        expect(result.sale.coupon).toEqual({ status: 'available', cpDiscount, netPrice: 1_008_000_000, profit: 8_000_000 });
    });

    it('reports profit, net tax and return on purchase cost', () => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 1_200_000_000, svipDiscount: 0, cpDiscount: 0.60 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.sale.netPrice).toBe(1_008_000_000);
        expect(result.sale.effectiveTax).toBe(192_000_000);
        expect(result.sale.profit).toBe(8_000_000);
        expect(result.sale.roi).toBe(0.8);
    });

    it.each([[1_220_000_000, 0, 0.55], [1_100_000_000, 0.20, 0.60]] as const)('finds the correct higher coupon at sale %s', (salePrice, svipDiscount, expectedCoupon) => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice, svipDiscount, cpDiscount: 0 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.sale.coupon.status).toBe('available');
        expect(result.sale.coupon.cpDiscount).toBe(expectedCoupon);
    });

    it('does not spend a coupon when the sale already covers the cost', () => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 2_000_000_000, svipDiscount: 0, cpDiscount: 0.60 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.sale.coupon).toEqual({ status: 'available', cpDiscount: 0, netPrice: 1_200_000_000, profit: 200_000_000 });
    });

    it('reports exact break-even without inventing a profit or rounding up another step', () => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 1_250_000_000, svipDiscount: 0, cpDiscount: 0.50 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.minimumSalePrice).toBe(1_250_000_000);
        expect(result.sale.profit).toBe(0);
        expect(result.sale.roi).toBe(0);
        expect(result.sale.coupon.cpDiscount).toBe(0.50);
    });

    it('keeps the effective tax equal to the money actually deducted at a decimal boundary', () => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 1_000_000_000, svipDiscount: 0.20, cpDiscount: 0.40 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.sale.effectiveTax).toBe(160_000_000);
        expect(formatBPAmount(result.sale.effectiveTax)).toBe('160M');
        expect(result.sale.effectiveTax + result.sale.netPrice).toBe(1_000_000_000);
    });

    it('reports a sale no available coupon can rescue', () => {
        const result = analyzeTrade({ purchasePrice: 1_000_000_000, salePrice: 1_000_000_000, svipDiscount: 0.20, cpDiscount: 0 });
        if (result.status !== 'ready' || !result.sale) throw new Error('Expected sale');
        expect(result.sale.coupon).toEqual({ status: 'unavailable', cpDiscount: 0.60, netPrice: 920_000_000, shortfall: 80_000_000, minimumSalePrice: 1_087_000_000 });
    });

    it.each([0, -1, NaN, Infinity])('rejects invalid purchase %s', (purchasePrice) => {
        expect(analyzeTrade({ purchasePrice, salePrice: null, svipDiscount: 0, cpDiscount: 0 })).toEqual({ status: 'invalid', reason: 'purchase-price' });
    });
    it.each([0, -1, NaN, Infinity])('rejects invalid sale %s', (salePrice) => {
        expect(analyzeTrade({ purchasePrice: 1_000_000_000, salePrice, svipDiscount: 0, cpDiscount: 0 })).toEqual({ status: 'invalid', reason: 'sale-price' });
    });
    it('rejects amounts beyond the supported numeric range', () => {
        expect(analyzeTrade({ purchasePrice: 10 ** 16, salePrice: null, svipDiscount: 0, cpDiscount: 0 })).toEqual({ status: 'invalid', reason: 'range' });
        expect(analyzeTrade({ purchasePrice: 1e-300, salePrice: 1_000_000_000, svipDiscount: 0, cpDiscount: 0 })).toEqual({ status: 'invalid', reason: 'range' });
    });

    it('never displays a recommendation that receives less than its purchase cost', () => {
        for (const purchasePrice of [0.000001, 0.01, 0.07, 0.33, 0.5, 0.6, 0.91908, 0.9999, 123.456, 999_999, 999_999.999, 1_000_000, 999_999_999, 1_000_000_000, 3_130_000_000]) {
            for (const svip of TAX_CONFIG.SVIP_DISCOUNT_OPTIONS) {
                for (const cp of TAX_CONFIG.CP_DISCOUNT_OPTIONS) {
                    const result = analyzeTrade({ purchasePrice, salePrice: null, svipDiscount: svip.value, cpDiscount: cp.value });
                    if (result.status !== 'ready') throw new Error('Expected valid purchase');
                    const display = formatBPAmount(result.minimumSalePrice);
                    const scale = display.endsWith('B') ? 1_000_000_000 : 1_000_000;
                    const salePrice = Number(display.slice(0, -1)) * scale;
                    expect(calculateNetPrice({ price: salePrice, cpDiscount: cp.value }, { svipDiscount: svip.value }).netPrice).toBeGreaterThanOrEqual(purchasePrice);
                }
            }
        }
    });

    it('formats both large profits and losses using the same M/B units', () => {
        expect(formatBPAmount(-2_400_000_000)).toBe('-2.4B');
        expect(formatBPAmount(-280_000_000)).toBe('-280M');
    });
});
