import type { Metadata } from "next";

export const SITE_URL = "https://fconline.vercel.app";
export type ToolName = "ovr" | "tax" | "trading";

interface ToolPage {
    path: string;
    label: string;
    heading: string;
    title: string;
    description: string;
}

export const TOOLS: Record<ToolName, ToolPage> = {
    ovr: {
        path: "/ovr",
        label: "🧮 คำนวณ OVR",
        heading: "OVR Calculator",
        title: "คำนวณ OVR นักเตะ | FC Online",
        description: "คำนวณ OVR นักเตะ FC Online ตามตำแหน่งที่ยืนจริง พร้อมแนะนำการอัปสกิล +2 ให้ OVR สูงสุด",
    },
    tax: {
        path: "/tax",
        label: "💰 ภาษีตลาด",
        heading: "Tax Calculator",
        title: "คำนวณภาษีตลาดนักเตะ | FC Online",
        description: "คำนวณภาษีตลาดนักเตะ FC Online 40% พร้อมส่วนลด SVIP และคูปอง รองรับราคา M/B และสรุปเงินที่ได้รับสุทธิ",
    },
    trading: {
        path: "/trading",
        label: "📈 เก็งกำไรนักเตะ",
        heading: "Trading Calculator",
        title: "คำนวณกำไรและราคาขายที่ไม่ขาดทุน | FC Online",
        description: "คำนวณราคาขายที่ไม่ขาดทุนและกำไรนักเตะ FC Online หลังหักภาษี พร้อม SVIP คูปอง และสรุปหลายรายการ",
    },
};

export function getToolMetadata(tool: ToolName): Metadata {
    const page = TOOLS[tool];
    const url = SITE_URL + page.path;
    return {
        title: page.title,
        description: page.description,
        alternates: { canonical: url },
        openGraph: {
            title: page.title,
            description: page.description,
            url,
            type: "website",
            locale: "th_TH",
            siteName: "FC Online Tools",
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FC Online Tools" }],
        },
        twitter: {
            card: "summary_large_image",
            title: page.title,
            description: page.description,
            images: ["/og-image.png"],
        },
    };
}
