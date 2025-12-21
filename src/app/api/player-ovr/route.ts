import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy สำหรับดึง OVR ของนักเตะจาก FIFAAddict
 * 
 * GET /api/player-ovr?spid=nwlyvvqm
 * 
 * Returns: { ovr: number, positions: { pos: string, ovr: number }[] }
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const spid = searchParams.get('spid');

        if (!spid) {
            return NextResponse.json(
                { error: 'กรุณาระบุ spid' },
                { status: 400 }
            );
        }

        // FIFAAddict API ต้องการ prefix "pid" ก่อน hash ID
        const pid = spid.startsWith('pid') ? spid : `pid${spid}`;

        const apiUrl = `https://fifaaddict.com/api2?fo4pid=${pid}&locale=th`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://fifaaddict.com/',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'ไม่พบข้อมูลนักเตะ' },
                { status: 404 }
            );
        }

        const data = await response.json();

        // ดึง OVR จาก db object
        // pos1val, pos2val, pos3val คือ OVR สำหรับแต่ละตำแหน่ง
        if (!data.db) {
            return NextResponse.json(
                { error: 'ไม่พบข้อมูล OVR' },
                { status: 404 }
            );
        }

        const db = data.db;

        // ดึง base OVR (ใช้ตำแหน่งหลัก = pos1val)
        // ค่านี้คือ OVR ที่ +0 (ยังไม่ได้ตีบวก)
        const baseOvr = db.pos1val || 0;

        // สร้าง array ของตำแหน่งและ OVR
        const positions: { pos: string; ovr: number }[] = [];

        if (db.pos1 && db.pos1val) {
            positions.push({ pos: db.pos1, ovr: db.pos1val });
        }
        if (db.pos2 && db.pos2val) {
            positions.push({ pos: db.pos2, ovr: db.pos2val });
        }
        if (db.pos3 && db.pos3val) {
            positions.push({ pos: db.pos3, ovr: db.pos3val });
        }

        return NextResponse.json({
            ovr: baseOvr,
            positions,
            name: db.name || null,
            season: db.seasonLink || null,
        }, {
            headers: {
                'Cache-Control': 'public, max-age=86400', // Cache 24 ชั่วโมง
            },
        });
    } catch (error) {
        // Log error อย่างปลอดภัย ไม่เปิดเผยข้อมูล sensitive
        console.error('Error fetching player OVR:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล OVR' },
            { status: 500 }
        );
    }
}
