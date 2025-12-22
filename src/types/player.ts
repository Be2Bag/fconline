/**
 * Types สำหรับข้อมูลนักเตะ FC Online
 * ใช้ทั่วทั้งแอพสำหรับการแสดงผลและค้นหานักเตะ
 */

/**
 * ข้อมูลนักเตะที่ได้จากการค้นหา
 */
export interface Player {
    /** ชื่อนักเตะ */
    name: string;
    /** ID ของนักเตะ (hash ID จาก FIFAAddict) */
    id: string;
    /** SPID ของนักเตะ (อาจเป็น hash หรือ numeric) */
    spid?: string;
    /** ตำแหน่งหลักของนักเตะ */
    position: string;
    /** ชื่อทีม */
    team: string;
    /** รหัส season (เช่น "EL", "TOTY") */
    season: string;
    /** URL รูป season icon */
    seasonImg?: string;
    /** ค่า OVR พื้นฐาน (ที่ +0) */
    ovr?: number;
}

/**
 * ข้อมูลตำแหน่งและ OVR ของนักเตะ
 */
export interface PlayerPosition {
    /** รหัสตำแหน่ง (เช่น "ST", "CAM") */
    pos: string;
    /** ค่า OVR ที่ตำแหน่งนี้ */
    ovr: number;
}

/**
 * ผลลัพธ์จาก API player search
 */
export interface PlayerSearchResult {
    /** รายการนักเตะที่พบ */
    players: Player[];
    /** จำนวนผลลัพธ์ทั้งหมด */
    total: number;
}

/**
 * ผลลัพธ์จาก API player OVR
 */
export interface PlayerOvrResult {
    /** OVR หลัก (ตำแหน่งแรก) */
    ovr: number;
    /** OVR แยกตามตำแหน่ง */
    positions: PlayerPosition[];
    /** ชื่อนักเตะ */
    name?: string;
    /** Season link */
    season?: string;
}
