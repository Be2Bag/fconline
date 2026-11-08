import { TAX_CONFIG } from '@/config/tax.config';
import type { CPDiscountRate, SVIPDiscountRate } from '@/types/tax';
import type { CouponRecommendation, TradingAnalysis, TradingInput } from '@/types/trading';
import { calculateNetPrice, formatBPAmount } from './taxService';

const coupons = [...TAX_CONFIG.CP_DISCOUNT_OPTIONS].sort((a, b) => a.value - b.value);

function proceeds(price: number, svipDiscount: SVIPDiscountRate, cpDiscount: CPDiscountRate): number {
    return calculateNetPrice({ price, cpDiscount }, { svipDiscount }).netPrice;
}

function displayedPrice(price: number): number {
    const display = formatBPAmount(price);
    return Number(display.slice(0, -1)) * (display.endsWith('B') ? 1_000_000_000 : 1_000_000);
}

function minimumSalePrice(purchasePrice: number, svipDiscount: SVIPDiscountRate, cpDiscount: CPDiscountRate): number {
    const exactPrice = purchasePrice / proceeds(1, svipDiscount, cpDiscount);
    const unit = exactPrice >= 1_000_000_000 ? 1_000_000_000 : exactPrice >= 1_000_000 ? 1_000_000 : 1;
    const step = unit / 10 ** TAX_CONFIG.MAX_DECIMAL_PLACES;
    let price = Math.ceil(exactPrice / step) * step;

    // ตรวจสูตรเดินหน้าอีกครั้งเพื่อไม่ให้การปัดเลขทำให้ขายแล้วขาดทุน
    while (proceeds(displayedPrice(price), svipDiscount, cpDiscount) < purchasePrice) price += step;
    while (price > step && proceeds(displayedPrice(price - step), svipDiscount, cpDiscount) >= purchasePrice) price -= step;
    return price;
}

function recommendCoupon(purchasePrice: number, salePrice: number, svipDiscount: SVIPDiscountRate): CouponRecommendation {
    let highestCoupon: CPDiscountRate = 0;
    for (const option of coupons) {
        highestCoupon = option.value;
        const netPrice = proceeds(salePrice, svipDiscount, option.value);
        if (netPrice >= purchasePrice) {
            return { status: 'available', cpDiscount: option.value, netPrice, profit: netPrice - purchasePrice };
        }
    }
    const netPrice = proceeds(salePrice, svipDiscount, highestCoupon);
    return {
        status: 'unavailable',
        cpDiscount: highestCoupon,
        netPrice,
        shortfall: purchasePrice - netPrice,
        minimumSalePrice: minimumSalePrice(purchasePrice, svipDiscount, highestCoupon),
    };
}

export function analyzeTrade(input: TradingInput): TradingAnalysis {
    const { purchasePrice, salePrice, svipDiscount, cpDiscount } = input;
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) return { status: 'invalid', reason: 'purchase-price' };
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0)) return { status: 'invalid', reason: 'sale-price' };
    if (purchasePrice > Number.MAX_SAFE_INTEGER || (salePrice !== null && salePrice > Number.MAX_SAFE_INTEGER)) {
        return { status: 'invalid', reason: 'range' };
    }
    const rawMinimum = purchasePrice / proceeds(1, svipDiscount, cpDiscount);
    if (rawMinimum > Number.MAX_SAFE_INTEGER) return { status: 'invalid', reason: 'range' };
    const minimum = minimumSalePrice(purchasePrice, svipDiscount, cpDiscount);
    if (minimum > Number.MAX_SAFE_INTEGER) return { status: 'invalid', reason: 'range' };

    const result = {
        status: 'ready',
        minimumSalePrice: minimum,
        netAtMinimum: proceeds(displayedPrice(minimum), svipDiscount, cpDiscount),
    } as const;
    if (salePrice === null) return { ...result, sale: null };

    const tax = calculateNetPrice({ price: salePrice, cpDiscount }, { svipDiscount });
    const profit = tax.netPrice - purchasePrice;
    const roi = (profit / purchasePrice) * 100;
    if (!Number.isFinite(roi)) return { status: 'invalid', reason: 'range' };
    return {
        ...result,
        sale: {
            netPrice: tax.netPrice,
            effectiveTax: salePrice - tax.netPrice,
            profit,
            roi,
            coupon: recommendCoupon(purchasePrice, salePrice, svipDiscount),
        },
    };
}
