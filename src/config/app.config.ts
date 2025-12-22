/**
 * Configuration หลักของแอพ
 * Settings ทั่วไปที่ใช้ทั้งแอพ
 */

export const APP_CONFIG = {
    // ===== App Info =====
    /** ชื่อแอพ */
    APP_NAME: 'FC Online Tools',
    /** Version */
    VERSION: '1.0.0',

    // ===== UI Settings =====
    /** ภาษาเริ่มต้น */
    DEFAULT_LOCALE: 'th',
    /** จำนวนทศนิยม OVR */
    OVR_DECIMAL_PLACES: 2,

    // ===== OVR Calculator Settings =====
    /** จำนวน upgrades สูงสุด (+2) */
    MAX_STAT_UPGRADES: 5,
    /** ค่า upgrade ต่อ stat */
    UPGRADE_VALUE: 2,

    // ===== Loading States =====
    /** ระยะเวลา loading delay (ms) - สำหรับ UX */
    CALCULATION_DELAY: 1000,

    // ===== Tab Settings =====
    /** Tab เริ่มต้น */
    DEFAULT_TAB: 'calculator' as const,
    /** รายการ tabs ทั้งหมด */
    TABS: ['calculator', 'position', 'upgrade', 'box'] as const,
} as const;

/** Type สำหรับ tab */
export type TabType = typeof APP_CONFIG.TABS[number];

/** Type สำหรับ config (readonly) */
export type AppConfigType = typeof APP_CONFIG;
