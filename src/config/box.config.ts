/**
 * Configuration สำหรับระบบเปิดกล่อง
 * แก้ไขค่าที่นี่เพื่อปรับพฤติกรรมของ Box Simulator
 */

export const BOX_CONFIG = {
    // ===== Animation Durations (ms) =====
    /** ระยะเวลา shake ก่อนเปิด */
    SHAKE_DURATION: 800,
    /** ระยะเวลา animation เปิดกล่อง */
    OPEN_ANIMATION_DURATION: 600,
    /** ระยะเวลา reveal รางวัล */
    REVEAL_DURATION: 500,
    /** ระยะเวลา glow effect */
    GLOW_DURATION: 1500,

    // ===== Open Count Limits =====
    /** จำนวนเปิดขั้นต่ำ */
    MIN_OPEN_COUNT: 1,
    /** จำนวนเปิดสูงสุด */
    MAX_OPEN_COUNT: 100,
    /** จำนวนเปิดเริ่มต้น */
    DEFAULT_OPEN_COUNT: 1,

    // ===== Quick Open Options =====
    /** ตัวเลือกเปิดเร็ว */
    QUICK_OPEN_OPTIONS: [1, 10, 50, 100],

    // ===== Display Settings =====
    /** จำนวน history items ที่แสดง */
    MAX_HISTORY_DISPLAY: 50,

    // ===== Cache Settings =====
    /** เวลา cache รูปกล่อง (ms) */
    BOX_IMAGE_CACHE_DURATION: 86400000, // 24 hours
} as const;

/** Type สำหรับ config (readonly) */
export type BoxConfigType = typeof BOX_CONFIG;
