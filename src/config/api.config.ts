/**
 * Configuration สำหรับ API calls
 * แก้ไขค่าที่นี่เพื่อปรับ endpoints และ settings
 */

export const API_CONFIG = {
    // ===== External APIs =====
    /** FIFAAddict CDN สำหรับรูปนักเตะ */
    FIFAADDICT_CDN: 'https://s1.fifaaddict.com/fo4/players',
    /** FIFAAddict API สำหรับข้อมูลนักเตะ */
    FIFAADDICT_API: 'https://fifaaddict.com/api2',
    /** Nexon CDN สำหรับรูปนักเตะ */
    NEXON_CDN: 'https://fco.dn.nexoncdn.co.kr/live/externalAssets/common',
    /** Nexon API สำหรับ meta data */
    NEXON_API: 'https://open.api.nexon.com/static/fconline/meta',

    // ===== Internal API Endpoints =====
    INTERNAL: {
        /** ค้นหานักเตะ */
        PLAYERS: '/api/players',
        /** ดึงรูปนักเตะ */
        PLAYER_IMAGE: '/api/player-image',
        /** ดึง OVR นักเตะ */
        PLAYER_OVR: '/api/player-ovr',
    },

    // ===== Cache Settings =====
    /** Cache duration สำหรับ season metadata (ms) */
    SEASON_CACHE_TTL: 86400000, // 24 hours
    /** Cache duration สำหรับ player images (seconds) */
    PLAYER_IMAGE_CACHE: 86400, // 24 hours

    // ===== Request Settings =====
    /** Timeout สำหรับ API calls (ms) */
    REQUEST_TIMEOUT: 10000,
    /** User-Agent สำหรับ external requests */
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',

    // ===== Validation =====
    /** ความยาวชื่อนักเตะขั้นต่ำ */
    MIN_PLAYER_NAME_LENGTH: 2,
    /** ความยาวชื่อนักเตะสูงสุด */
    MAX_PLAYER_NAME_LENGTH: 50,
    /** จำนวนผลลัพธ์สูงสุดต่อการค้นหา */
    MAX_SEARCH_RESULTS: 20,
} as const;

/** Type สำหรับ config (readonly) */
export type ApiConfigType = typeof API_CONFIG;
