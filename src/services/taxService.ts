/**
 * Tax Calculator Service
 * Business logic สำหรับคำนวณภาษีตลาดนักเตะ FC Online
 * 
 * สูตร: Net = [Price × (1 - Tax)] + [(Price × Tax) × Disc_total]
 * - Tax = 40% (0.4)
 * - Disc_total = SVIP + PC + CP
 */

import type {
    TaxPlayerItem,
    TaxGlobalSettings,
    TaxCalculationResult,
    TaxTotalSummary,
} from '@/types/tax';
import { TAX_CONFIG } from '@/config';

// Re-export config values for backwards compatibility
export const MARKET_TAX_RATE = TAX_CONFIG.MARKET_TAX_RATE;
export const PC_DISCOUNT_RATE = TAX_CONFIG.PC_DISCOUNT_RATE;
export const CP_DISCOUNT_OPTIONS = TAX_CONFIG.CP_DISCOUNT_OPTIONS;
export const SVIP_DISCOUNT_OPTIONS = TAX_CONFIG.SVIP_DISCOUNT_OPTIONS;

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
    const { svipDiscount, pcEnabled } = globalSettings;

    // คำนวณส่วนลดรวม
    const pcDiscount = pcEnabled ? PC_DISCOUNT_RATE : 0;
    const totalDiscountRate = svipDiscount + pcDiscount + cpDiscount;

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
            pc: grossTax * pcDiscount,
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
            pc: results.reduce((sum, r) => sum + r.discountBreakdown.pc, 0),
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
 * Format ตัวเลขเป็นรูปแบบ locale (มี comma)
 * แสดงทศนิยมไม่เกิน 3 ตำแหน่ง
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('en-US', {
        maximumFractionDigits: TAX_CONFIG.MAX_DECIMAL_PLACES,
    });
}

/**
 * แสดงจำนวน BP ใหม่โดยตรง พร้อม comma และหน่วย BP
 */
export function formatBPAmount(num: number): string {
    return `${formatNumber(num)} BP`;
}


/**
 * แสดงจำนวน BP ใหม่ในช่องราคา โดยไม่แปลงหน่วย
 */
export function formatBPInput(num: number): string {
    if (num === 0) return '';
    return num.toString();
}

/**
 * อ่านราคา BP ใหม่ รองรับ comma และทศนิยม ไม่รับค่าติดลบ
 */
export function parseBPInput(value: string): number {
    const normalized = value.replaceAll(',', '').trim();
    if (!/^\d*\.?\d*$/.test(normalized)) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
