import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "OVR Calculator, ตีบวก & เปิดกล่อง Simulator | FC Online",
  description:
    "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบแนะนำการอัพเกรดสเตตัส +2 ให้ OVR สูงสุด จำลองการตีบวกนักเตะพร้อมอัตราสำเร็จ และจำลองเปิดกล่อง BP / กุญแจ Champions Chest ตามอัตราดรอปจริง",
  keywords: [
    "FC Online",
    "OVR Calculator",
    "ค่า OVR",
    "คำนวณ OVR",
    "FIFA Online",
    "ตีบวก",
    "ตีบวก FC Online",
    "Upgrade Simulator",
    "จำลองตีบวก",
    "อัตราตีบวก",
    "เกรดนักเตะ",
    "ตีบวกนักเตะ",
    "FC Online ตีบวก",
    "หาตำแหน่งนักเตะ",
    "Best Position",
    "เปิดกล่อง",
    "Box Simulator",
    "กล่อง BP",
    "กล่องกุญแจ",
    "Champions Chest",
    "อัตราดรอป",
    "Gacha Simulator",
    "จำลองเปิดกล่อง",
    "FC Online Box"
  ],
  authors: [{ name: "FC Online Tools" }],
  openGraph: {
    title: "OVR Calculator, ตีบวก & เปิดกล่อง Simulator | FC Online",
    description: "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบตีบวกจำลอง แนะนำการอัพเกรด +2 และจำลองเปิดกล่อง BP / กุญแจ",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FC Online OVR Calculator & Box Simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OVR Calculator, ตีบวก & เปิดกล่อง Simulator | FC Online",
    description: "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบตีบวกจำลอง แนะนำการอัพเกรด +2 และจำลองเปิดกล่อง BP / กุญแจ",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-sans antialiased football-bg`}>
        {children}
      </body>
    </html>
  );
}
