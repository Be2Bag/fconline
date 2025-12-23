/**
 * Tax Calculator Types
 * สำหรับคำนวณภาษีตลาดนักเตะ FC Online
 */

/** ส่วนลด CP ที่เลือกได้ */
export type CPDiscountRate = 0 | 0.10 | 0.20 | 0.25 | 0.30 | 0.35 | 0.40;

/** ส่วนลด SVIP ที่เลือกได้ */
export type SVIPDiscountRate = 0 | 0.10 | 0.20;

/** ข้อมูลนักเตะแต่ละรายการ */
export interface TaxPlayerItem {
    /** ID สำหรับ React key */
    id: string;
    /** ชื่อนักเตะ (optional - ถ้าไม่กรอกจะแสดง Player 1, 2, ...) */
    name: string;
    /** ราคาขาย */
    price: number;
    /** อัตราส่วนลด CP ที่เลือก */
    cpDiscount: CPDiscountRate;
}

/** การตั้งค่าส่วนลดทั่วไป (ใช้กับทุกรายการ) */
export interface TaxGlobalSettings {
    /** อัตราส่วนลด SVIP (0, 10%, 20%) */
    svipDiscount: SVIPDiscountRate;
    /** เปิดใช้ส่วนลด PC (10%) */
    pcEnabled: boolean;
}

/** ผลการคำนวณภาษีต่อรายการ */
export interface TaxCalculationResult {
    /** ราคาขาย */
    price: number;
    /** ภาษีตลาด 40% (ก่อนหักส่วนลด) */
    grossTax: number;
    /** ส่วนลดรวมทั้งหมด (SVIP + PC + CP) */
    totalDiscountRate: number;
    /** จำนวนเงินที่ได้คืนจากส่วนลด */
    discountAmount: number;
    /** เงินที่ได้รับสุทธิ */
    netPrice: number;
    /** รายละเอียดส่วนลดแต่ละประเภท */
    discountBreakdown: {
        svip: number;
        pc: number;
        cp: number;
    };
}

/** ผลรวมทั้งหมด */
export interface TaxTotalSummary {
    /** ราคารวมทั้งหมด */
    totalPrice: number;
    /** ภาษีรวมทั้งหมด (ก่อนหักส่วนลด) */
    totalGrossTax: number;
    /** เงินที่ได้คืนจากส่วนลดทั้งหมด */
    totalDiscountAmount: number;
    /** เงินที่ได้รับสุทธิรวม */
    totalNetPrice: number;
    /** จำนวนรายการ */
    itemCount: number;
    /** รายละเอียดส่วนลดรวมแต่ละประเภท */
    discountBreakdown: {
        svip: number;
        pc: number;
        cp: number;
    };
}
