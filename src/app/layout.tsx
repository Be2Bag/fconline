import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "OVR Calculator | FC Online",
  description:
    "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบแนะนำการอัพเกรดสเตตัส +2 ให้ OVR สูงสุด",
  keywords: ["FC Online", "OVR Calculator", "ค่า OVR", "คำนวณ OVR", "FIFA Online"],
  authors: [{ name: "FC Online Tools" }],
  openGraph: {
    title: "OVR Calculator | FC Online",
    description: "คำนวณค่า OVR นักเตะ FC Online พร้อมระบบแนะนำการอัพเกรด +2",
    type: "website",
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
        <Analytics />
      </body>
    </html>
  );
}
