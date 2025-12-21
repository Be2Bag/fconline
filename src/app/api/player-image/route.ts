import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy สำหรับดึงรูปนักเตะ
 * รองรับทั้ง:
 * 1. FIFAAddict hash ID (เช่น "nwlyvvqm") - ใช้ FIFAAddict CDN
 * 2. Nexon SPID (ตัวเลข) - ใช้ Nexon CDN
 * 
 * GET /api/player-image?spid=nwlyvvqm&type=action
 * GET /api/player-image?spid=250200104&type=action
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const spid = searchParams.get('spid');
        const type = searchParams.get('type') || 'action'; // 'action' หรือ 'normal'

        if (!spid) {
            return NextResponse.json(
                { error: 'กรุณาระบุ spid' },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าเป็น hash ID (ตัวอักษร) หรือ numeric SPID (ตัวเลข)
        const isHashId = /^[a-zA-Z]+$/.test(spid);

        let imageUrl: string;
        let fallbackUrl: string | null = null;

        if (isHashId) {
            // ใช้ FIFAAddict CDN สำหรับ hash ID
            imageUrl = `https://s1.fifaaddict.com/fo4/players/${spid}.png`;
            // ไม่มี fallback สำหรับ FIFAAddict
        } else {
            // ใช้ Nexon CDN สำหรับ numeric SPID
            imageUrl = type === 'action'
                ? `https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/playersAction/p${spid}.png`
                : `https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/players/p${spid}.png`;

            fallbackUrl = `https://fco.dn.nexoncdn.co.kr/live/externalAssets/common/players/p${spid}.png`;
        }

        // ดึงรูป
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': isHashId ? 'https://fifaaddict.com/' : 'https://fconline.nexon.com/',
            },
        });

        if (!response.ok) {
            // ลอง fallback URL (สำหรับ Nexon CDN เท่านั้น)
            if (fallbackUrl && type === 'action') {
                const fallbackResponse = await fetch(fallbackUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://fconline.nexon.com/',
                    },
                });

                if (fallbackResponse.ok) {
                    const imageBuffer = await fallbackResponse.arrayBuffer();
                    return new NextResponse(imageBuffer, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Cache-Control': 'public, max-age=86400',
                        },
                    });
                }
            }

            return NextResponse.json(
                { error: 'ไม่พบรูปนักเตะ' },
                { status: 404 }
            );
        }

        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400', // Cache 24 ชั่วโมง
            },
        });
    } catch (error) {
        console.error('Error fetching player image:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการดึงรูปนักเตะ' },
            { status: 500 }
        );
    }
}
