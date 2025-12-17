// OVR Weight data for FC Online
// Each position has different stat weights that determine the OVR calculation

export interface StatWeight {
    stat: string;
    weight: number;
}

export interface PositionWeights {
    position: string;
    thaiName: string;
    stats: StatWeight[];
}

// Position weights data - weights should sum to 100 for each position
// Stats are ordered exactly as specified
export const ovrWeights: Record<string, PositionWeights> = {
    ST: {
        position: "ST",
        thaiName: "กองหน้าตัวกลาง",
        stats: [
            { stat: "แข็งแกร่ง", weight: 5 },
            { stat: "สปีดต้น", weight: 4 },
            { stat: "ความเร็ว", weight: 5 },
            { stat: "เลี้ยงบอล", weight: 7 },
            { stat: "ควบคุมบอล", weight: 10 },
            { stat: "ส่งสั้น", weight: 5 },
            { stat: "จบสกอร์", weight: 18 },
            { stat: "พลังการยิง", weight: 10 },
            { stat: "โหม่งบอล", weight: 10 },
            { stat: "ยิงไกล", weight: 3 },
            { stat: "วอลเลย์", weight: 2 },
            { stat: "ยืนตำแหน่ง", weight: 13 },
            { stat: "ปฏิกิริยา", weight: 8 },
        ],
    },
    CF: {
        position: "CF",
        thaiName: "กองหน้าตัวเชื่อม",
        stats: [
            { stat: "สปีดต้น", weight: 5 },
            { stat: "ความเร็ว", weight: 5 },
            { stat: "เลี้ยงบอล", weight: 14 },
            { stat: "ควบคุมบอล", weight: 15 },
            { stat: "ส่งสั้น", weight: 9 },
            { stat: "จบสกอร์", weight: 11 },
            { stat: "พลังการยิง", weight: 5 },
            { stat: "โหม่งบอล", weight: 2 },
            { stat: "ยิงไกล", weight: 4 },
            { stat: "ยืนตำแหน่ง", weight: 13 },
            { stat: "อ่านเกม", weight: 8 },
            { stat: "ปฏิกิริยา", weight: 9 },
        ],
    },
    "LW/RW": {
        position: "LW/RW",
        thaiName: "ปีกซ้าย/ขวา",
        stats: [
            { stat: "สปีดต้น", weight: 7 },
            { stat: "ความเร็ว", weight: 6 },
            { stat: "คล่องตัว", weight: 3 },
            { stat: "เลี้ยงบอล", weight: 16 },
            { stat: "ควบคุมบอล", weight: 14 },
            { stat: "เปิดบอล", weight: 9 },
            { stat: "ส่งสั้น", weight: 9 },
            { stat: "จบสกอร์", weight: 10 },
            { stat: "ยิงไกล", weight: 4 },
            { stat: "ยืนตำแหน่ง", weight: 9 },
            { stat: "อ่านเกม", weight: 6 },
            { stat: "ปฏิกิริยา", weight: 7 },
        ],
    },
    "LM/RM": {
        position: "LM/RM",
        thaiName: "กองกลางซ้าย/ขวา",
        stats: [
            { stat: "ความอึด", weight: 5 },
            { stat: "สปีดต้น", weight: 7 },
            { stat: "ความเร็ว", weight: 6 },
            { stat: "เลี้ยงบอล", weight: 15 },
            { stat: "ควบคุมบอล", weight: 13 },
            { stat: "เปิดบอล", weight: 10 },
            { stat: "ส่งสั้น", weight: 11 },
            { stat: "จบสกอร์", weight: 6 },
            { stat: "ส่งไกล", weight: 5 },
            { stat: "ยืนตำแหน่ง", weight: 8 },
            { stat: "อ่านเกม", weight: 7 },
            { stat: "ปฏิกิริยา", weight: 7 },
        ],
    },
    CAM: {
        position: "CAM",
        thaiName: "กองกลางตัวรุก",
        stats: [
            { stat: "สปีดต้น", weight: 4 },
            { stat: "ความเร็ว", weight: 3 },
            { stat: "คล่องตัว", weight: 3 },
            { stat: "เลี้ยงบอล", weight: 13 },
            { stat: "ควบคุมบอล", weight: 15 },
            { stat: "ส่งสั้น", weight: 16 },
            { stat: "จบสกอร์", weight: 7 },
            { stat: "ส่งไกล", weight: 4 },
            { stat: "ยิงไกล", weight: 5 },
            { stat: "ยืนตำแหน่ง", weight: 9 },
            { stat: "อ่านเกม", weight: 14 },
            { stat: "ปฏิกิริยา", weight: 7 },
        ],
    },
    CM: {
        position: "CM",
        thaiName: "กองกลางตัวกลาง",
        stats: [
            { stat: "ความอึด", weight: 6 },
            { stat: "เลี้ยงบอล", weight: 7 },
            { stat: "ควบคุมบอล", weight: 14 },
            { stat: "เข้าปะทะ", weight: 5 },
            { stat: "ส่งสั้น", weight: 17 },
            { stat: "จบสกอร์", weight: 2 },
            { stat: "ส่งไกล", weight: 13 },
            { stat: "ยิงไกล", weight: 4 },
            { stat: "เข้าสกัด", weight: 5 },
            { stat: "ยืนตำแหน่ง", weight: 6 },
            { stat: "อ่านเกม", weight: 13 },
            { stat: "ปฏิกิริยา", weight: 8 },
        ],
    },
    CDM: {
        position: "CDM",
        thaiName: "กองกลางตัวรับ",
        stats: [
            { stat: "แข็งแกร่ง", weight: 4 },
            { stat: "ความอึด", weight: 6 },
            { stat: "สไลด์", weight: 5 },
            { stat: "ควบคุมบอล", weight: 10 },
            { stat: "ประกบตัว", weight: 9 },
            { stat: "เข้าปะทะ", weight: 12 },
            { stat: "ส่งสั้น", weight: 14 },
            { stat: "ส่งไกล", weight: 10 },
            { stat: "เข้าสกัด", weight: 14 },
            { stat: "อ่านเกม", weight: 4 },
            { stat: "ปฏิกิริยา", weight: 7 },
            { stat: "ดุดัน", weight: 5 },
        ],
    },
    CB: {
        position: "CB",
        thaiName: "กองหลังตัวกลาง",
        stats: [
            { stat: "แข็งแกร่ง", weight: 10 },
            { stat: "ความเร็ว", weight: 2 },
            { stat: "กระโดด", weight: 3 },
            { stat: "สไลด์", weight: 10 },
            { stat: "ควบคุมบอล", weight: 4 },
            { stat: "ประกบตัว", weight: 17 },
            { stat: "เข้าปะทะ", weight: 13 },
            { stat: "ส่งสั้น", weight: 5 },
            { stat: "โหม่งบอล", weight: 10 },
            { stat: "เข้าสกัด", weight: 14 },
            { stat: "ปฏิกิริยา", weight: 5 },
            { stat: "ดุดัน", weight: 7 },
        ],
    },
    "LB/RB": {
        position: "LB/RB",
        thaiName: "แบ็คซ้าย/ขวา",
        stats: [
            { stat: "ความอึด", weight: 8 },
            { stat: "สปีดต้น", weight: 5 },
            { stat: "ความเร็ว", weight: 7 },
            { stat: "สไลด์", weight: 14 },
            { stat: "ควบคุมบอล", weight: 7 },
            { stat: "ประกบตัว", weight: 8 },
            { stat: "เข้าปะทะ", weight: 11 },
            { stat: "เปิดบอล", weight: 9 },
            { stat: "ส่งสั้น", weight: 7 },
            { stat: "โหม่งบอล", weight: 4 },
            { stat: "เข้าสกัด", weight: 12 },
            { stat: "ปฏิกิริยา", weight: 8 },
        ],
    },
    "LWB/RWB": {
        position: "LWB/RWB",
        thaiName: "วิงแบ็คซ้าย/ขวา",
        stats: [
            { stat: "ความอึด", weight: 10 },
            { stat: "สปีดต้น", weight: 4 },
            { stat: "ความเร็ว", weight: 6 },
            { stat: "สไลด์", weight: 11 },
            { stat: "เลี้ยงบอล", weight: 4 },
            { stat: "ควบคุมบอล", weight: 8 },
            { stat: "ประกบตัว", weight: 7 },
            { stat: "เข้าปะทะ", weight: 8 },
            { stat: "เปิดบอล", weight: 12 },
            { stat: "ส่งสั้น", weight: 10 },
            { stat: "เข้าสกัด", weight: 12 },
            { stat: "ปฏิกิริยา", weight: 8 },
        ],
    },
    GK: {
        position: "GK",
        thaiName: "ผู้รักษาประตู",
        stats: [
            { stat: "พุ่งรับ", weight: 21 },
            { stat: "รับบอล", weight: 21 },
            { stat: "ส่งบอล", weight: 5 },
            { stat: "ยืนตำแหน่ง", weight: 21 },
            { stat: "GK ปฏิกิริยา", weight: 21 },
            { stat: "ปฏิกิริยา", weight: 11 },
        ],
    },
};

// Get list of all positions
export const positionList = Object.keys(ovrWeights);

// Get all unique stat names across all positions
export const getAllStats = (): string[] => {
    const stats = new Set<string>();
    Object.values(ovrWeights).forEach((position) => {
        position.stats.forEach((s) => stats.add(s.stat));
    });
    return Array.from(stats);
};
