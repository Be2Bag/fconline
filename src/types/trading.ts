import type { CPDiscountRate, SVIPDiscountRate } from './tax';

export interface TradingInput {
    purchasePrice: number;
    salePrice: number | null;
    svipDiscount: SVIPDiscountRate;
    cpDiscount: CPDiscountRate;
}

export type CouponRecommendation =
    | { status: 'available'; cpDiscount: CPDiscountRate; netPrice: number; profit: number }
    | { status: 'unavailable'; cpDiscount: CPDiscountRate; netPrice: number; shortfall: number; minimumSalePrice: number };

export interface TradingSaleResult {
    netPrice: number;
    effectiveTax: number;
    profit: number;
    roi: number;
    coupon: CouponRecommendation;
}

export type TradingAnalysis =
    | { status: 'invalid'; reason: 'purchase-price' | 'sale-price' | 'range' }
    | { status: 'ready'; minimumSalePrice: number; netAtMinimum: number; sale: TradingSaleResult | null };
