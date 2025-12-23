import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ActiveUsersSticker from "@/components/ActiveUsersSticker";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "OVR Calculator, ตีบวก, ภาษีตลาด & เปิดกล่อง Simulator | FC Online",
  description:
    "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบแนะนำการอัพเกรดสเตตัส +2 ให้ OVR สูงสุด จำลองการตีบวกนักเตะพร้อมอัตราสำเร็จ คำนวณภาษีตลาด 40% พร้อมส่วนลด SVIP/PC/คูปอง และจำลองเปิดกล่อง BP / กุญแจ Champions Chest ตามอัตราดรอปจริง",
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
    "FC Online Box",
    "ภาษีตลาด",
    "Tax Calculator",
    "คำนวณภาษี",
    "ภาษี 40%",
    "ส่วนลด SVIP",
    "ส่วนลด PC",
    "คูปองภาษี",
    "ราคาสุทธิ",
    "FC Online Tax",
    "ขายนักเตะ"
  ],
  authors: [{ name: "FC Online Tools" }],
  openGraph: {
    title: "OVR Calculator, ตีบวก, ภาษีตลาด & เปิดกล่อง Simulator | FC Online",
    description: "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบตีบวกจำลอง แนะนำการอัพเกรด +2 จำลองเปิดกล่อง BP / กุญแจ และคำนวณภาษีตลาด 40%",
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
    title: "OVR Calculator, ตีบวก, ภาษีตลาด & เปิดกล่อง Simulator | FC Online",
    description: "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบตีบวกจำลอง แนะนำการอัพเกรด +2 จำลองเปิดกล่อง BP / กุญแจ และคำนวณภาษีตลาด 40%",
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
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-QMXK0T0SKG"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QMXK0T0SKG');
        `}
      </Script>
      <body className={`${prompt.variable} font-sans antialiased football-bg`}>
        {children}
        <ActiveUsersSticker />
      </body>
    </html>
  );
}
