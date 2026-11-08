import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import Script from "next/script";
import { SITE_URL } from "@/config/site.config";
import "./globals.css";
// TEMPORARILY DISABLED - Upstash Redis limit exceeded (500k/month)
// import ActiveUsersSticker from "@/components/ActiveUsersSticker";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FC Online Tools | OVR ภาษีตลาด และเก็งกำไรนักเตะ",
  description: "เครื่องมือ FC Online สำหรับคำนวณ OVR ภาษีตลาด และกำไรจากการซื้อขายนักเตะ",
  keywords: ["FC Online", "OVR Calculator", "คำนวณ OVR", "ภาษีตลาด", "เก็งกำไรนักเตะ", "SVIP", "คูปองภาษี", "ราคาขายที่ไม่ขาดทุน"],
  authors: [{ name: "FC Online Tools" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-sans antialiased football-bg`}>
        {/* Native page navigation is measured once by the Google tag on page load. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QMXK0T0SKG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QMXK0T0SKG', {
              page_title: document.title,
              page_location: window.location.origin + window.location.pathname + window.location.search,
              page_path: window.location.pathname
            });
          `}
        </Script>
        {children}
        {/* TEMPORARILY DISABLED - Upstash Redis limit exceeded
        <ActiveUsersSticker />
        */}
      </body>
    </html>
  );
}
