/**
 * Tax Calculator Service
 * Business logic สำหรับคำนวณภาษีตลาดนักเตะ FC Online
 * 
 * สูตร: Net = [Price × (1 - Tax)] + [(Price × Tax) × Disc_total]
 * - Tax = 40% (0.4)
 * - Disc_total = SVIP + CP
 */

import type {
    TaxPlayerItem,
    TaxGlobalSettings,
    TaxCalculationResult,
    TaxTotalSummary,
    TaxPriceUnit,
} from '@/types/tax';
import { TAX_CONFIG } from '@/config';

// Re-export config values for backwards compatibility
export const MARKET_TAX_RATE = TAX_CONFIG.MARKET_TAX_RATE;
export const CP_DISCOUNT_OPTIONS = TAX_CONFIG.CP_DISCOUNT_OPTIONS;
export const SVIP_DISCOUNT_OPTIONS = TAX_CONFIG.SVIP_DISCOUNT_OPTIONS;

const compactBPFormatter = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumFractionDigits: TAX_CONFIG.MAX_DECIMAL_PLACES,
    roundingMode: 'trunc',
});
const smallBPFormatter = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumSignificantDigits: 15,
    roundingMode: 'trunc',
});

const MILLION_BP = 1_000_000;
const BILLION_BP = 1_000_000_000;
const priceUnitMultipliers: Record<TaxPriceUnit, number> = { M: MILLION_BP, B: BILLION_BP };
const priceInputFormatter = new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumFractionDigits: 20,
});

/**
 * คำนวณราคาสุทธิสำหรับรายการเดียว
 * 
 * @param item - ข้อมูลนักเตะ
 * @param globalSettings - การตั้งค่าส่วนลดทั่วไป
 * @returns ผลการคำนวณพร้อมรายละเอียด
 */
export function calculateNetPrice(
    item: TaxPlayerItem,
    globalSettings: TaxGlobalSettings
): TaxCalculationResult {
    const { price, cpDiscount } = item;
    const { svipDiscount } = globalSettings;

    // คำนวณส่วนลดรวม
    const totalDiscountRate = svipDiscount + cpDiscount;

    // คำนวณภาษีและส่วนลด
    const grossTax = price * MARKET_TAX_RATE;
    const discountAmount = grossTax * totalDiscountRate;

    // Net = [Price × (1 - Tax)] + [(Price × Tax) × Disc_total]
    // หรือ Net = (Price - grossTax) + discountAmount
    const netPrice = (price - grossTax) + discountAmount;

    return {
        price,
        grossTax,
        totalDiscountRate,
        discountAmount,
        netPrice,
        discountBreakdown: {
            svip: grossTax * svipDiscount,
            cp: grossTax * cpDiscount,
        },
    };
}

/**
 * คำนวณผลรวมทั้งหมดจากหลายรายการ
 * 
 * @param items - รายการนักเตะทั้งหมด
 * @param globalSettings - การตั้งค่าส่วนลดทั่วไป
 * @returns ผลรวมทั้งหมด
 */
export function calculateTotalSummary(
    items: TaxPlayerItem[],
    globalSettings: TaxGlobalSettings
): TaxTotalSummary {
    const results = items.map(item => calculateNetPrice(item, globalSettings));

    return {
        totalPrice: results.reduce((sum, r) => sum + r.price, 0),
        totalGrossTax: results.reduce((sum, r) => sum + r.grossTax, 0),
        totalDiscountAmount: results.reduce((sum, r) => sum + r.discountAmount, 0),
        totalNetPrice: results.reduce((sum, r) => sum + r.netPrice, 0),
        itemCount: items.length,
        discountBreakdown: {
            svip: results.reduce((sum, r) => sum + r.discountBreakdown.svip, 0),
            cp: results.reduce((sum, r) => sum + r.discountBreakdown.cp, 0),
        },
    };
}

/**
 * สร้าง ID สำหรับรายการใหม่
 */
export function generateItemId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * สร้างรายการนักเตะใหม่
 */
export function createNewPlayerItem(): TaxPlayerItem {
    return {
        id: generateItemId(),
        ...TAX_CONFIG.DEFAULT_PLAYER,
    };
}

/**
 * ย่อจำนวน BP ใหม่เป็น B/M โดยไม่ปัดยอดขึ้น
 */
export function formatBPAmount(num: number): string {
    if (num >= BILLION_BP) return `${compactBPFormatter.format(num / BILLION_BP)}B`;
    if (num >= MILLION_BP) return `${compactBPFormatter.format(num / MILLION_BP)}M`;
    return `${smallBPFormatter.format(num / MILLION_BP)}M`;
}


/**
 * แสดงราคาในหน่วย M/B โดยรักษาทศนิยมของยอดเดิม
 */
export function formatBPInput(num: number, unit: TaxPriceUnit): string {
    if (num === 0) return '';
    return priceInputFormatter.format(num / priceUnitMultipliers[unit]);
}

/**
 * อ่านราคา M/B เป็น BP เต็ม รองรับ comma และทศนิยม ไม่รับค่าติดลบ
 */
export function parseBPInput(value: string, unit: TaxPriceUnit): number | null {
    const normalized = value.replaceAll(',', '').trim();
    if (!/^\d*\.?\d*$/.test(normalized)) return null;
    const parsed = normalized === '.' ? 0 : Number(normalized) * priceUnitMultipliers[unit];
    return Number.isFinite(parsed) ? parsed : null;
}
