/**
 * Configuration สำหรับระบบตีบวกนักเตะ
 * แก้ไขค่าที่นี่เพื่อปรับพฤติกรรมของ Upgrade Simulator
 */

export const UPGRADE_CONFIG = {
    // ===== Level Settings =====
    /** ระดับต่ำสุด (+1) */
    MIN_LEVEL: 1,
    /** ระดับสูงสุด (+13) */
    MAX_LEVEL: 13,

    // ===== Catastrophic Drop Settings =====
    /** โอกาสเกิด Catastrophic Drop (%) */
    CATASTROPHIC_DROP_CHANCE: 10,

    // ===== Boost Gauge Settings =====
    /** ค่า Boost สูงสุด (5 = 5 การ์ด) */
    MAX_BOOST: 5.0,
    /** Boost ต่อการ์ด 1 ใบ */
    BOOST_PER_CARD: 1.0,
    /** จำนวนการ์ดสูงสุด */
    MAX_CARDS: 5,

    // ===== Animation Durations (ms) =====
    /** ระยะเวลา animation ตีบวก */
    UPGRADE_ANIMATION_DURATION: 600,
    /** ระยะเวลา animation สำเร็จ */
    SUCCESS_ANIMATION_DURATION: 600,
    /** ระยะเวลา animation ล้มเหลว */
    FAIL_ANIMATION_DURATION: 500,

    // ===== UI Settings =====
    /** จำนวน dividers บน Boost Gauge */
    BOOST_GAUGE_DIVIDERS: 5,

    // ===== Level Drop Rules =====
    /**
     * กฎการลดระดับเมื่อตีบวกล้มเหลว
     * dropMin/dropMax = ระดับที่ลดปกติ
     * catastrophicMin/catastrophicMax = ระดับที่ลดเมื่อเกิด catastrophic
     */
    LEVEL_DROP_RULES: {
        // +2 ถึง +4
        LOW: {
            minLevel: 2,
            maxLevel: 4,
            dropMin: 1,
            dropMax: 1,
            catastrophicMin: 2,
            catastrophicMax: 3,
        },
        // +5 ถึง +7
        MID: {
            minLevel: 5,
            maxLevel: 7,
            dropMin: 2,
            dropMax: 3,
            catastrophicMin: 4,
            catastrophicMax: 5,
        },
        // +8 ถึง +9
        HIGH: {
            minLevel: 8,
            maxLevel: 9,
            dropMin: 3,
            dropMax: 4,
            catastrophicMin: 5,
            catastrophicMax: 6,
        },
        // +10+
        EXTREME: {
            minLevel: 10,
            maxLevel: 13,
            dropMin: 4,
            dropMax: 6,
            catastrophicMin: 6,
            catastrophicMax: 8,
        },
    },
} as const;

/** Type สำหรับ config (readonly) */
export type UpgradeConfigType = typeof UPGRADE_CONFIG;
