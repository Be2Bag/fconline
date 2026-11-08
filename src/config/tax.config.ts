/**
 * Configuration สำหรับระบบคำนวณภาษีตลาดนักเตะ
 * แก้ไขค่าที่นี่เพื่อปรับพฤติกรรมของ Tax Calculator
 */

import type { CPDiscountRate, SVIPDiscountRate } from '@/types/tax';

export const TAX_CONFIG = {
    // ===== Tax Rate Settings =====
    /** อัตราภาษีตลาดคงที่ (40%) */
    MARKET_TAX_RATE: 0.4,

    // ===== Number Formatting =====
    /** ตัวหารสำหรับแปลงข้อมูลที่บันทึกเป็น BP เดิมให้เป็น BP ใหม่ */
    LEGACY_BP_DIVISOR: 1_000_000,
    /** จำนวนทศนิยมสูงสุดสำหรับแสดงผล BP */
    MAX_DECIMAL_PLACES: 3,

    // ===== Discount Options =====
    /** ตัวเลือก CP discount */
    CP_DISCOUNT_OPTIONS: [
        { value: 0 as CPDiscountRate, label: 'ไม่ใช้' },
        { value: 0.10 as CPDiscountRate, label: 'CP 10%' },
        { value: 0.20 as CPDiscountRate, label: 'CP 20%' },
        { value: 0.25 as CPDiscountRate, label: 'CP 25%' },
        { value: 0.30 as CPDiscountRate, label: 'CP 30%' },
        { value: 0.35 as CPDiscountRate, label: 'CP 35%' },
        { value: 0.40 as CPDiscountRate, label: 'CP 40%' },
        { value: 0.45 as CPDiscountRate, label: 'CP 45%' },
        { value: 0.50 as CPDiscountRate, label: 'CP 50%' },
        { value: 0.55 as CPDiscountRate, label: 'CP 55%' },
        { value: 0.60 as CPDiscountRate, label: 'CP 60%' },
    ],

    /** ตัวเลือก SVIP discount */
    SVIP_DISCOUNT_OPTIONS: [
        { value: 0 as SVIPDiscountRate, label: 'ไม่ใช้' },
        { value: 0.10 as SVIPDiscountRate, label: 'SVIP 10%' },
        { value: 0.20 as SVIPDiscountRate, label: 'SVIP 20%' },
    ],

    // ===== Default Values =====
    /** ค่า default สำหรับ player item ใหม่ */
    DEFAULT_PLAYER: {
        name: '',
        price: 0,
        cpDiscount: 0 as CPDiscountRate,
    },

    /** ค่า default สำหรับ global settings */
    DEFAULT_GLOBAL_SETTINGS: {
        svipDiscount: 0 as SVIPDiscountRate,
    },
} as const;

/** Type สำหรับ config (readonly) */
export type TaxConfigType = typeof TAX_CONFIG;
