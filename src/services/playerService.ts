/**
 * Service สำหรับ Player API calls
 * ใช้สำหรับค้นหาและดึงข้อมูลนักเตะ
 */

import type { Player, PlayerOvrResult } from '@/types';
import { API_CONFIG } from '@/config';

/**
 * ค้นหานักเตะจากชื่อ
 * 
 * @param name - ชื่อนักเตะที่ต้องการค้นหา
 * @returns Promise<Player[]>
 */
export async function searchPlayers(name: string): Promise<Player[]> {
    // Validate input
    if (!name || name.length < API_CONFIG.MIN_PLAYER_NAME_LENGTH) {
        return [];
    }

    try {
        const params = new URLSearchParams({ name });
        const response = await fetch(
            `${API_CONFIG.INTERNAL.PLAYERS}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        return data.players || [];
    } catch (error) {
        console.error('Error searching players:', error);
        return [];
    }
}

/**
 * ดึงรูปนักเตะ
 * 
 * @param spid - SPID หรือ hash ID ของนักเตะ
 * @param type - 'action' หรือ 'normal'
 * @returns URL ของรูป
 */
export function getPlayerImageUrl(spid: string, type: 'action' | 'normal' = 'action'): string {
    const params = new URLSearchParams({ spid, type });
    return `${API_CONFIG.INTERNAL.PLAYER_IMAGE}?${params.toString()}`;
}

/**
 * ดึง OVR ของนักเตะ
 * 
 * @param spid - SPID หรือ hash ID ของนักเตะ
 * @returns Promise<PlayerOvrResult | null>
 */
export async function getPlayerOvr(spid: string): Promise<PlayerOvrResult | null> {
    try {
        const params = new URLSearchParams({ spid });
        const response = await fetch(
            `${API_CONFIG.INTERNAL.PLAYER_OVR}?${params.toString()}`
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching player OVR:', error);
        return null;
    }
}

/**
 * ตรวจสอบว่าเป็น hash ID หรือ numeric SPID
 * 
 * @param id - ID ที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น hash ID
 */
export function isHashId(id: string): boolean {
    return /^[a-zA-Z]+$/.test(id);
}

/**
 * สร้าง URL สำหรับรูปนักเตะจาก CDN โดยตรง
 * ใช้กรณีต้องการ bypass API proxy
 * 
 * @param spid - SPID ของนักเตะ
 * @param source - 'fifaaddict' หรือ 'nexon'
 * @returns URL ของรูป
 */
export function getDirectImageUrl(
    spid: string,
    source: 'fifaaddict' | 'nexon' = 'fifaaddict'
): string {
    if (source === 'fifaaddict') {
        return `${API_CONFIG.FIFAADDICT_CDN}/${spid}.png`;
    }
    return `${API_CONFIG.NEXON_CDN}/playersAction/p${spid}.png`;
}
