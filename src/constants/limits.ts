/**
 * Numeric limits และ constraints
 * แก้ไขที่นี่เพื่อปรับข้อจำกัดต่างๆ ในแอพ
 */

/**
 * Limits สำหรับค่า Stats
 */
export const STAT_LIMITS = {
    /** ค่า stat ต่ำสุด */
    MIN: 1,
    /** ค่า stat สูงสุด */
    MAX: 999,
    /** ค่าเริ่มต้น */
    DEFAULT: 0,
} as const;

/**
 * Limits สำหรับ OVR
 */
export const OVR_LIMITS = {
    /** OVR ต่ำสุด */
    MIN: 0,
    /** OVR สูงสุด (ทฤษฎี) */
    MAX: 200,
    /** ทศนิยม */
    DECIMALS: 2,
} as const;

/**
 * Limits สำหรับการค้นหา
 */
export const SEARCH_LIMITS = {
    /** ความยาวชื่อขั้นต่ำ */
    MIN_NAME_LENGTH: 2,
    /** ความยาวชื่อสูงสุด */
    MAX_NAME_LENGTH: 50,
    /** จำนวนผลลัพธ์สูงสุด */
    MAX_RESULTS: 20,
    /** Debounce delay (ms) */
    DEBOUNCE_DELAY: 300,
} as const;

/**
 * Limits สำหรับ BP formatting
 */
export const BP_LIMITS = {
    TRILLION: 1_000_000_000_000,    // T
    BILLION: 1_000_000_000,          // B
    MILLION: 1_000_000,              // M
    THOUSAND: 1_000,                 // K
} as const;

/**
 * Suffixes สำหรับ BP formatting
 */
export const BP_SUFFIXES = {
    TRILLION: 'T',
    BILLION: 'B',
    MILLION: 'M',
    THOUSAND: 'K',
} as const;

/**
 * Limits สำหรับ animation
 */
export const ANIMATION_LIMITS = {
    /** ระยะเวลาสั้นสุด */
    MIN_DURATION: 100,
    /** ระยะเวลายาวสุด */
    MAX_DURATION: 3000,
} as const;
