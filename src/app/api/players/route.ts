import { NextRequest, NextResponse } from 'next/server';
import { Client, Regions } from '@hongbeccodeduocchua/fo4-db';

// สร้าง client สำหรับเชื่อมต่อ fo4-db API (region: Vietnam)
const client = new Client({
    region: Regions.VN,
});

// Cache สำหรับ Season metadata
let seasonCache: Map<string, { id: number; img: string }> | null = null;

/**
 * โหลด Season metadata จาก Nexon
 * ใช้สำหรับแสดง season icon
 */
async function loadSeasonMetadata(): Promise<Map<string, { id: number; img: string }>> {
    if (seasonCache) return seasonCache;

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
            // Legend of Europa - fo4-db ส่ง "EL" แต่ Nexon ใช้ "LE"
            'EL': 'LE',
        };

        for (const [shortCode, fullCode] of Object.entries(manualMappings)) {
            const info = seasonCache.get(fullCode);
            if (info && !seasonCache.has(shortCode)) {
                seasonCache.set(shortCode, info);
            }
        }

        // Direct URL mappings สำหรับ seasons ที่ไม่มีใน Nexon API หรือชื่อไม่ตรง
        // ใช้ Nexon CDN URL โดยตรง
        const directUrlMappings: { [key: string]: { id: number; img: string } } = {
            // ICON The Moment - fo4-db ส่ง "ICONTM"
            'ICONTM': {
                id: 100,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icontm.png'
            },
            // ICON The Moment Bound - fo4-db ส่ง "ICONTMB"
            'ICONTMB': {
                id: 110,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icontm_b.png'
            },
            // ICONS MATCH - fo4-db ส่ง "ICONM"
            'ICONM': {
                id: 111,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/filter/icon_m.png'
            },
            // Premium - อาจมีหลายแบบ ใช้ icon ทั่วไป
            'PRM': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            // FLG - Flair/Flag season
            'FLG': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icon.png'
            },
            // Snake Year Limited
            'SYL': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            // 24 World Legend
            '24WL': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/icon.png'
            },
            // K-League Best - fo4-db ส่ง "25KLB" / "24KLB" / "23KLB" แต่ Nexon ใช้ "25KB" / "24KB" / "23KB"
            '25KLB': {
                id: 853,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/25kb.png'
            },
            '24KLB': {
                id: 830,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/24klb.png'
            },
            '23KLB': {
                id: 805,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/23klb.png'
            },
            // 25 Chinese Super League
            '25CSL': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            // K-League seasons (K + ปี)
            'K19': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            'K20': {
                id: 504,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/20kl.png'
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
            // 19 Autumn
            '19A': {
                id: 0,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/19pla.png'
            },
            // LIVE seasons - ใช้เฉพาะถ้าไม่มี prefix ปี
            'LIVE': {
                id: 300,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/live.png'
            },
            // 23 LIVE
            '23': {
                id: 323,
                img: 'https://ssl.nexon.com/s2/game/fc/online/obt/externalAssets/new/season/23.png'
            },
        };

        // Force set direct mappings (override ค่าจาก Nexon API ที่อาจผิด)
        for (const [code, info] of Object.entries(directUrlMappings)) {
            seasonCache.set(code, info);
        }

        console.log('Loaded season metadata:', seasonCache.size, 'seasons');
        return seasonCache;
    } catch (error) {
        console.error('Failed to load season metadata:', error);
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

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'กรุณาระบุชื่อนักเตะ (อย่างน้อย 2 ตัวอักษร)' },
                { status: 400 }
            );
        }

        // Load season metadata (cached)
        const seasonMetadata = await loadSeasonMetadata();

        // ค้นหานักเตะจาก fo4-db
        const players = await client.player.find({
            name: name.trim(),
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
        console.error('Error searching players:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการค้นหานักเตะ' },
            { status: 500 }
        );
    }
}
