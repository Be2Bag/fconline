import { NextRequest, NextResponse } from 'next/server';
import { Client, Regions } from '@hongbeccodeduocchua/fo4-db';

// ===== Constants สำหรับ validation และ cache =====
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 50;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

// สร้าง client สำหรับเชื่อมต่อ fo4-db API (region: Vietnam)
const client = new Client({
    region: Regions.VN,
});

// Cache สำหรับ Season metadata พร้อม TTL
let seasonCache: Map<string, { id: number; img: string }> | null = null;
let seasonCacheTimestamp: number = 0;

/**
 * โหลด Season metadata จาก Nexon
 * ใช้สำหรับแสดง season icon
 * Cache จะ expire หลังจาก 24 ชั่วโมง
 */
async function loadSeasonMetadata(): Promise<Map<string, { id: number; img: string }>> {
    const now = Date.now();

    // ตรวจสอบว่า cache ยังใช้ได้อยู่หรือไม่
    if (seasonCache && (now - seasonCacheTimestamp) < CACHE_TTL_MS) {
        return seasonCache;
    }

    try {
        const response = await fetch('https://open.api.nexon.com/static/fconline/meta/seasonid.json');
        const data = await response.json() as Array<{ seasonId: number; className: string; seasonImg: string }>;

        seasonCache = new Map();
        for (const season of data) {
            // Extract season code from className, e.g. "23 TOTY (23 Team Of The Year)" -> "23TOTY"
            // Or "FAC (Football Association Champions)" -> "FAC"
            const classMatch = season.className.match(/^([A-Z0-9]+\s?[A-Z\-]*)/);
            if (classMatch) {
                const code = classMatch[1].replace(/\s+/g, '').toUpperCase();
                seasonCache.set(code, { id: season.seasonId, img: season.seasonImg });
            }

            // Also try to extract short codes like "23TY", "24TY", etc.
            const shortMatch = season.className.match(/(\d+)\s*([A-Z]+)/);
            if (shortMatch) {
                const shortCode = shortMatch[1] + shortMatch[2];
                if (!seasonCache.has(shortCode)) {
                    seasonCache.set(shortCode, { id: season.seasonId, img: season.seasonImg });
                }
            }
        }

        // เพิ่ม Abbreviation mappings สำหรับชื่อย่อที่ fo4-db ใช้
        // fo4-db ส่งชื่อย่อ เช่น "25TY" แต่ Nexon ใช้ "25TOTY"
        const abbreviationMappings: { [key: string]: string[] } = {
            // TOTY (Team Of The Year) -> TY
            'TOTY': ['TY'],
            'TOTS': ['TS'],
            'TOTY-N': ['TYN', 'TOTN'],
            'UCL': ['UCL'],
            'LIVE': ['LIVE'],
        };

        // สร้าง reverse mapping: หาจาก seasonCache ที่มี TOTY/TOTS แล้วเพิ่ม key ย่อ
        const entriesToAdd: [string, { id: number; img: string }][] = [];

        for (const [fullCode, seasonInfo] of seasonCache.entries()) {
            for (const [fullSuffix, abbreviations] of Object.entries(abbreviationMappings)) {
                if (fullCode.includes(fullSuffix)) {
                    // เช่น "25TOTY" -> extract "25" และแทน "TOTY" ด้วย "TY"
                    for (const abbr of abbreviations) {
                        const shortCode = fullCode.replace(fullSuffix, abbr);
                        if (!seasonCache.has(shortCode) && shortCode !== fullCode) {
                            entriesToAdd.push([shortCode, seasonInfo]);
                        }
                    }
                }
            }
        }

        // เพิ่ม entries ที่สร้างใหม่
        for (const [key, value] of entriesToAdd) {
            seasonCache.set(key, value);
        }

        // เพิ่ม manual mappings สำหรับ seasons พิเศษที่อาจไม่ match
        // fo4-db ส่งชื่อที่แตกต่างจาก Nexon API
        const manualMappings: { [key: string]: string } = {
            // FC Ambassador
            'FC': 'FCA',
            'JA': 'JVA',
        };

        for (const [shortCode, fullCode] of Object.entries(manualMappings)) {
            const info = seasonCache.get(fullCode);
            if (info && !seasonCache.has(shortCode)) {
                seasonCache.set(shortCode, info);
            }
        }

        // Direct URL mappings สำหรับ seasons ที่ไม่มีใน Nexon API หรือชื่อไม่ตรง
        // ใช้ Nexon CDN URL โดยตรง
        // Direct URL mappings เรียงตาม id จากน้อยไปมาก
        const directUrlMappings: { [key: string]: { id: number; img: string } } = {
            // === ID 100-114: ICON Series ===
            'ICONTM': {
                id: 100,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icontm.png'
            },
            'ICONTMB': {
                id: 110,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icontm_b.png'
            },
            'ICONM': {
                id: 111,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/filter/icon_m.png'
            },
            '25IMF': {
                id: 114,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/25im_fb.png'
            },
            // === ID 300-324: LIVE Series ===
            'LIVE': {
                id: 300,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            '17': {
                id: 317,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/17.png'
            },
            '18': {
                id: 318,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/18.png'
            },
            '19': {
                id: 319,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/19.png'
            },
            '20': {
                id: 320,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/20.png'
            },
            '21': {
                id: 321,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/21.png'
            },
            '22': {
                id: 322,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/22.png'
            },
            '23': {
                id: 323,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/23.png'
            },
            '24': {
                id: 324,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/24.png'
            },
            // === ID 502-517: Premium Live & K-League ===
            '19A': {
                id: 502,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/19pla.png'
            },
            'K20': {
                id: 504,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/20kl.png'
            },
            '20A': {
                id: 506,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/20pla.png'
            },
            'K21': {
                id: 507,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/21kl.png'
            },
            'K22': {
                id: 510,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/22kl.png'
            },
            'K23': {
                id: 512,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/23kl.png'
            },
            'K24': {
                id: 514,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/24kl.png'
            },
            'K25': {
                id: 516,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/25kl.png'
            },
            // === ID 805-853: K-League Best & Special ===
            '23KLB': {
                id: 805,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/23klb.png'
            },
            '24KLB': {
                id: 830,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/24klb.png'
            },
            'FSL': {
                id: 850,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/25fsl.png'
            },
            '25KLB': {
                id: 853,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/25kb.png'
            },
        };

        // Force set direct mappings (override ค่าจาก Nexon API ที่อาจผิด)
        for (const [code, info] of Object.entries(directUrlMappings)) {
            seasonCache.set(code, info);
        }

        // อัพเดท cache timestamp
        seasonCacheTimestamp = Date.now();
        console.log('Loaded season metadata:', seasonCache.size, 'seasons');
        return seasonCache;
    } catch (error) {
        // Log error อย่างปลอดภัย ไม่เปิดเผยข้อมูล sensitive
        console.error('Failed to load season metadata:', error instanceof Error ? error.message : 'Unknown error');
        return new Map();
    }
}

/**
 * API สำหรับค้นหานักเตะ
 * ใช้ fo4-db library ซึ่งใช้ FIFAAddict hash ID
 * รูปนักเตะจะดึงจาก FIFAAddict CDN ผ่าน /api/player-image
 * 
 * GET /api/players?name=messi
 * 
 * Response:
 * {
 *   players: [{
 *     name: "L. Messi",
 *     id: "nwlyvvqm",  // FIFAAddict hash ID - ใช้สำหรับดึงรูป
 *     position: "RW",
 *     team: "Inter Miami",
 *     season: "EL",
 *     seasonId: 848,     // Nexon season ID
 *     seasonImg: "url"   // Season icon URL
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const name = searchParams.get('name');

        // === Input Validation ===
        const sanitizedName = name?.trim() || '';

        // ตรวจสอบ length
        if (sanitizedName.length < MIN_NAME_LENGTH) {
            return NextResponse.json(
                { error: 'กรุณาระบุชื่อนักเตะ (อย่างน้อย 2 ตัวอักษร)' },
                { status: 400 }
            );
        }

        if (sanitizedName.length > MAX_NAME_LENGTH) {
            return NextResponse.json(
                { error: 'ชื่อนักเตะยาวเกินไป (สูงสุด 50 ตัวอักษร)' },
                { status: 400 }
            );
        }

        // Load season metadata (cached)
        const seasonMetadata = await loadSeasonMetadata();

        // ค้นหานักเตะจาก fo4-db
        const players = await client.player.find({
            name: sanitizedName,
        });

        // Map players โดยเพิ่ม season info
        const mappedPlayers = players.slice(0, 20).map(player => {
            // Get season info
            const seasonCode = player.season?.toUpperCase() || '';
            const seasonInfo = seasonMetadata.get(seasonCode);
            const seasonId = seasonInfo?.id || null;
            const seasonImg = seasonInfo?.img || null;

            return {
                ...player,
                // FIFAAddict hash ID (player.id) is used directly for images
                // via /api/player-image?spid={hash}
                seasonId: seasonId,
                seasonImg: seasonImg,
                // OVR ของนักเตะ (ถ้า fo4-db มีให้)
                ovr: (player as unknown as { ovr?: number }).ovr || null,
            };
        });

        return NextResponse.json({ players: mappedPlayers });
    } catch (error) {
        // Log error อย่างปลอดภัย
        console.error('Error searching players:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการค้นหานักเตะ' },
            { status: 500 }
        );
    }
}
