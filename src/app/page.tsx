"use client";

import { useState } from "react";
import Calculator from "@/components/Calculator";
import BestPositionFinder from "@/components/BestPositionFinder";
import Image from "next/image";

type TabType = "calculator" | "position-finder";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("calculator");
  const [showCoffee, setShowCoffee] = useState(false);

  return (
    <div className="min-h-screen noise-bg relative overflow-hidden">
      {/* Decorative Stickers - Floating */}
      <div className="absolute top-20 left-4 md:left-10 hidden md:block">
        <span className="sticker-green sticker text-xl rotate-[-8deg]">🔥</span>
      </div>
      <div className="absolute top-40 right-4 md:right-12 hidden md:block">
        <span className="sticker-pink sticker text-lg rotate-[5deg]">✨</span>
      </div>
      <div className="absolute top-60 left-8 hidden lg:block">
        <span className="sticker-blue sticker text-sm rotate-[-3deg]">PRO</span>
      </div>
      <div className="absolute bottom-40 right-8 hidden lg:block">
        <span className="sticker sticker text-lg rotate-[8deg]">💪</span>
      </div>

      {/* Header */}
      <header className="py-6 md:py-8 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          {/* Sticker Badges */}
          <div className="mb-4 flex justify-center gap-2 flex-wrap">
            <span className="sticker text-xs md:text-sm rotate-[-3deg]">⚽ FC ONLINE</span>
            <span className="sticker-pink sticker text-xs md:text-sm rotate-[2deg]">NEW</span>
            <span className="sticker-green sticker text-xs md:text-sm rotate-[-1deg]">FREE</span>
          </div>

          {/* Title */}
          <h1 className="hero-title text-3xl md:text-5xl lg:text-6xl font-bold mb-2">
            OVR CALCULATOR
          </h1>
          <p className="text-sm md:text-base text-black/70 max-w-md mx-auto px-4">
            คำนวณค่า OVR + ระบบแนะนำอัพเกรด
          </p>

          {/* Extra decorative stickers */}
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-2xl">🏆</span>
            <span className="text-2xl">🎮</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 mb-4 md:mb-6 relative">
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex-1 py-3 md:py-4 px-3 md:px-4 font-bold text-sm md:text-base uppercase tracking-wide
              border-4 border-black transition-all relative
              ${activeTab === "calculator"
                ? "bg-[#FFDE00] shadow-[4px_4px_0px_#1a1a1a] translate-x-0 translate-y-0"
                : "bg-white shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a]"
              }`}
          >
            🧮 คำนวณ OVR
            {activeTab === "calculator" && (
              <span className="absolute -top-2 -right-2 text-xs bg-[#FF6B6B] text-black px-1.5 py-0.5 border-2 border-black rotate-[12deg]">
                HOT
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("position-finder")}
            className={`flex-1 py-3 md:py-4 px-3 md:px-4 font-bold text-sm md:text-base uppercase tracking-wide
              border-4 border-black transition-all relative
              ${activeTab === "position-finder"
                ? "bg-[#FF90E8] shadow-[4px_4px_0px_#1a1a1a] translate-x-0 translate-y-0"
                : "bg-white shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a]"
              }`}
          >
            🎯 หาตำแหน่ง
            {activeTab === "position-finder" && (
              <span className="absolute -top-2 -right-2 text-xs bg-[#7BF1A8] text-black px-1.5 py-0.5 border-2 border-black rotate-[-8deg]">
                NEW
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-3 md:px-4 pb-8 md:pb-12 relative z-10">
        {activeTab === "calculator" ? <Calculator /> : <BestPositionFinder />}
      </main>

      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 border-t-4 border-black bg-white relative">
        <div className="max-w-6xl mx-auto text-center">
          {/* Coffee Support Button */}
          <button
            onClick={() => setShowCoffee(true)}
            className="mb-4 px-4 py-2 bg-[#FFDE00] font-bold text-sm uppercase
              border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
              hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              transition-all inline-flex items-center gap-2"
          >
            ☕ สนับสนุนค่ากาแฟ
          </button>

          {/* Footer Stickers */}
          <div className="flex justify-center gap-2 mb-3 flex-wrap">
            <span className="sticker-pink sticker text-xs rotate-[-2deg]">⚽ FC</span>
            <span className="sticker-blue sticker text-xs rotate-[3deg]">📊 OVR</span>
            <span className="sticker-green sticker text-xs rotate-[-1deg]">⬆️ +2</span>
            <span className="sticker text-xs rotate-[2deg]">🏅 TOP</span>
          </div>
          <p className="text-xs text-black/50 mb-2">
            Made with 💛 | ไม่มีส่วนเกี่ยวข้องกับ EA Sports
          </p>
          <p className="text-xs text-black/40">
            Dev by <span className="font-bold">Be2Bag</span> |
            <a href="mailto:dev.be2bag@gmail.com" className="underline hover:text-black/60 ml-1">
              dev.be2bag@gmail.com
            </a>
          </p>
        </div>

        {/* Corner Stickers */}
        <div className="absolute bottom-4 left-4 hidden md:block">
          <span className="text-2xl">👾</span>
        </div>
        <div className="absolute bottom-4 right-4 hidden md:block">
          <span className="text-2xl">🎲</span>
        </div>
      </footer>

      {/* Coffee Modal */}
      {showCoffee && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCoffee(false)}
        >
          <div
            className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="sticker text-sm rotate-[-2deg]">☕ สนับสนุนค่ากาแฟ</span>
            </div>

            <div className="border-4 border-black p-2 mb-4">
              <Image
                src="/promptpay-qr.jpg"
                alt="QR Code สำหรับสนับสนุน"
                width={300}
                height={400}
                className="w-full h-auto"
              />
            </div>

            <p className="text-center text-sm text-black/70 mb-4">
              ขอบคุณที่สนับสนุนครับ 🙏
            </p>

            <button
              onClick={() => setShowCoffee(false)}
              className="w-full py-3 bg-[#FFDE00] font-bold uppercase
                border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

