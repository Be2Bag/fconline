"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { BoxType, BoxReward, OpenResult, BoxStats } from "@/types";
import { ALL_BOXES } from "@/data";
import { RARITY_COLORS, RARITY_LABELS } from "@/constants";
import { formatBP, openBox, openMultipleBoxes } from "@/services";

export default function BoxSimulator() {
    // State
    const [selectedBox, setSelectedBox] = useState<BoxType | null>(null); // null = selection phase
    const [isOpening, setIsOpening] = useState(false);
    const [currentResult, setCurrentResult] = useState<OpenResult | null>(null);
    const [recentResults, setRecentResults] = useState<OpenResult[]>([]);
    const [stats, setStats] = useState<BoxStats>({
        totalOpened: 0,
        totalEarned: 0,
        totalFCSpent: 0,
        bestReward: null,
        rarityCount: {
            legendary: 0,
            epic: 0,
            rare: 0,
            uncommon: 0,
            common: 0,
        },
    });
    const [showMultiResults, setShowMultiResults] = useState<OpenResult[]>([]);
    const [customCount, setCustomCount] = useState<string>('');
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // Helper: Format value based on box type
    const formatValue = (value: number): string => {
        if (!selectedBox) return String(value);
        if (selectedBox.valueUnit === 'bp') {
            return formatBP(value) + ' BP';
        }
        return 'x' + value.toLocaleString();
    };

    // เปิดกล่อง 1 ครั้ง
    const handleOpenSingle = useCallback(async () => {
        if (isOpening || !selectedBox) return;

        setIsOpening(true);
        setCurrentResult(null);
        setShowMultiResults([]);

        // Delay for animation
        await new Promise((resolve) => setTimeout(resolve, 800));

        const { reward, actualValue } = openBox(selectedBox);
        const result: OpenResult = {
            id: `${Date.now()}-${Math.random()}`,
            reward,
            actualValue,
            timestamp: Date.now(),
        };

        setCurrentResult(result);
        setRecentResults((prev) => [result, ...prev.slice(0, 9)]);
        setStats((prev) => ({
            totalOpened: prev.totalOpened + 1,
            totalEarned: prev.totalEarned + actualValue,
            totalFCSpent: prev.totalFCSpent + selectedBox.fcCost,
            bestReward: !prev.bestReward || actualValue > prev.bestReward.actualValue ? result : prev.bestReward,
            rarityCount: {
                ...prev.rarityCount,
                [reward.rarity]: prev.rarityCount[reward.rarity] + 1,
            },
        }));

        setTimeout(() => setIsOpening(false), 200);
    }, [isOpening, selectedBox]);

    // เปิดกล่องหลายครั้ง
    const handleOpenMultiple = useCallback(async (count: number) => {
        if (isOpening || !selectedBox) return;

        setIsOpening(true);
        setCurrentResult(null);
        setShowMultiResults([]);

        // Delay for animation
        await new Promise((resolve) => setTimeout(resolve, 600));

        const results = openMultipleBoxes(selectedBox, count);
        const newResults: OpenResult[] = results.map((r, i) => ({
            id: `${Date.now()}-${i}`,
            reward: r.reward,
            actualValue: r.actualValue,
            timestamp: Date.now(),
        }));

        setShowMultiResults(newResults);
        setRecentResults((prev) => [...newResults, ...prev].slice(0, 20));

        // Update stats
        let totalValue = 0;
        const rarityCounts: Record<BoxReward['rarity'], number> = {
            legendary: 0, epic: 0, rare: 0, uncommon: 0, common: 0
        };
        let bestResult: OpenResult | null = null;

        for (const result of newResults) {
            totalValue += result.actualValue;
            rarityCounts[result.reward.rarity]++;
            if (!bestResult || result.actualValue > bestResult.actualValue) {
                bestResult = result;
            }
        }

        setStats((prev) => ({
            totalOpened: prev.totalOpened + count,
            totalEarned: prev.totalEarned + totalValue,
            totalFCSpent: prev.totalFCSpent + (count * selectedBox.fcCost),
            bestReward: !prev.bestReward || (bestResult && bestResult.actualValue > prev.bestReward.actualValue)
                ? bestResult
                : prev.bestReward,
            rarityCount: {
                legendary: prev.rarityCount.legendary + rarityCounts.legendary,
                epic: prev.rarityCount.epic + rarityCounts.epic,
                rare: prev.rarityCount.rare + rarityCounts.rare,
                uncommon: prev.rarityCount.uncommon + rarityCounts.uncommon,
                common: prev.rarityCount.common + rarityCounts.common,
            },
        }));

        setTimeout(() => setIsOpening(false), 200);
    }, [isOpening, selectedBox]);

    // Reset สถิติ
    const handleReset = () => {
        setStats({
            totalOpened: 0,
            totalEarned: 0,
            totalFCSpent: 0,
            bestReward: null,
            rarityCount: { legendary: 0, epic: 0, rare: 0, uncommon: 0, common: 0 },
        });
        setRecentResults([]);
        setCurrentResult(null);
        setShowMultiResults([]);
    };

    // กลับไปเลือกกล่อง
    const handleBackToSelection = () => {
        setSelectedBox(null);
        handleReset();
    };

    // ===== PHASE 1: Box Selection =====
    if (!selectedBox) {
        return (
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="brutal-card p-4 md:p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="sticker-pink sticker text-sm rotate-[-2deg]">🎁 เปิดกล่อง</span>
                        <span className="sticker text-sm rotate-[2deg]">GACHA</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Box Opening Simulator</h2>
                    <p className="text-sm text-black/70">
                        จำลองเปิดกล่องไอเทม FC Online - ลุ้นรางวัลตามอัตราจริง!
                    </p>
                </div>

                {/* Box Selection Grid */}
                <div className="brutal-card p-4 md:p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <span>📦</span> เลือกกล่องที่ต้องการเปิด
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ALL_BOXES.map((box) => (
                            <button
                                key={box.id}
                                onClick={() => {
                                    setSelectedBox(box);
                                    setShowDisclaimer(true);
                                }}
                                className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#1a1a1a]
                                    hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[9px_9px_0px_#1a1a1a]
                                    active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                                    transition-all text-left"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 border-3 border-black overflow-hidden flex-shrink-0">
                                        <Image
                                            src={box.icon}
                                            alt={box.name}
                                            width={96}
                                            height={96}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h4 className="font-bold text-base sm:text-lg">{box.name}</h4>
                                        <p className="text-xs text-black/60">{box.description}</p>
                                    </div>
                                </div>
                                {box.expiresAt && (
                                    <div className="text-xs text-[#FF6B6B] font-bold mb-2">
                                        ⏰ หมดอายุ: {box.expiresAt}
                                    </div>
                                )}
                                <div className="text-sm text-black/70">
                                    🎲 {box.rewards.length} รางวัล
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ===== PHASE 2: Box Opening Simulator =====
    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Card with Back Button */}
            <div className="brutal-card p-4 md:p-6 mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="sticker-pink sticker text-sm rotate-[-2deg]">🎁 เปิดกล่อง</span>
                        <span className="sticker text-sm rotate-[2deg]">GACHA</span>
                    </div>
                    <button
                        onClick={handleBackToSelection}
                        className="px-2 py-1 md:px-4 md:py-2 font-bold uppercase border-3 border-black bg-white
                            shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]
                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs md:text-sm"
                    >
                        ← เปลี่ยน
                    </button>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Box Opening Simulator</h2>
                <p className="text-sm text-black/70">
                    จำลองเปิดกล่องไอเทม FC Online - ลุ้นรางวัลตามอัตราจริง!
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* ===== LEFT PANEL - Box Display ===== */}
                <div className="brutal-card p-4 md:p-6">
                    {/* Box Visual */}
                    <div className="flex justify-center mb-6">
                        <div
                            className={`relative w-36 h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 border-4 border-black shadow-[4px_4px_0px_#1a1a1a] md:shadow-[6px_6px_0px_#1a1a1a]
                flex items-center justify-center cursor-pointer transition-all
                ${isOpening ? 'animate-box-shake' : 'hover:scale-105'}
              `}
                            style={{ backgroundColor: selectedBox.color }}
                            onClick={() => !isOpening && handleOpenSingle()}
                        >
                            {/* Box Icon */}
                            <div className={`transition-transform ${isOpening ? 'animate-box-open' : ''}`}>
                                <Image
                                    src={selectedBox.icon}
                                    alt={selectedBox.name}
                                    width={160}
                                    height={160}
                                    className="object-contain w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40"
                                />
                            </div>

                            {/* Sparkle Effects when opening */}
                            {isOpening && (
                                <>
                                    <div className="absolute top-4 left-4 text-2xl animate-sparkle">✨</div>
                                    <div className="absolute top-4 right-4 text-2xl animate-sparkle-delay">⭐</div>
                                    <div className="absolute bottom-4 left-4 text-2xl animate-sparkle-delay-2">💫</div>
                                    <div className="absolute bottom-4 right-4 text-2xl animate-sparkle">✨</div>
                                </>
                            )}

                            {/* Box Name Badge */}
                            <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-white border-2 md:border-3 border-black px-2 md:px-4 py-1 whitespace-nowrap">
                                <span className="font-bold text-xs md:text-sm">{selectedBox.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Result Display */}
                    {currentResult && !showMultiResults.length && (
                        <div
                            className="p-4 border-4 border-black mb-4 text-center animate-reward-reveal"
                            style={{
                                backgroundColor: RARITY_COLORS[currentResult.reward.rarity].bg,
                                boxShadow: `0 0 30px ${RARITY_COLORS[currentResult.reward.rarity].glow}`,
                            }}
                        >
                            <div
                                className="text-sm font-bold mb-1"
                                style={{ color: RARITY_COLORS[currentResult.reward.rarity].text }}
                            >
                                {RARITY_LABELS[currentResult.reward.rarity]}
                            </div>
                            <div
                                className="text-lg font-bold mb-2"
                                style={{ color: RARITY_COLORS[currentResult.reward.rarity].text }}
                            >
                                {currentResult.reward.name}
                            </div>
                            <div
                                className="text-3xl md:text-4xl font-bold font-mono"
                                style={{ color: RARITY_COLORS[currentResult.reward.rarity].text }}
                            >
                                {formatValue(currentResult.actualValue)}
                            </div>
                        </div>
                    )}

                    {/* Multi Results Display */}
                    {showMultiResults.length > 0 && (
                        <div className="border-4 border-black bg-white p-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                            <div className="text-sm font-bold mb-2 flex items-center gap-2">
                                <span>🎉</span> ได้รับ {showMultiResults.length} รางวัล!
                            </div>
                            <div className="space-y-2">
                                {showMultiResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="flex items-center justify-between p-2 border-2 border-black"
                                        style={{ backgroundColor: RARITY_COLORS[result.reward.rarity].bg + '20' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-black"
                                                style={{ backgroundColor: RARITY_COLORS[result.reward.rarity].bg }}
                                            />
                                            <span className="text-xs font-medium">{result.reward.name}</span>
                                        </div>
                                        <span className="font-bold font-mono text-sm">
                                            {formatValue(result.actualValue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t-2 border-black text-center">
                                <span className="text-sm text-black/60">รวมทั้งหมด:</span>
                                <span className="ml-2 font-bold text-lg">
                                    {formatValue(showMultiResults.reduce((sum, r) => sum + r.actualValue, 0))}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Open Buttons */}
                    <div className="grid grid-cols-3 gap-1 md:gap-2 mb-3 md:mb-4">
                        <button
                            onClick={handleOpenSingle}
                            disabled={isOpening}
                            className={`py-4 font-bold uppercase border-4 border-black transition-all
                ${isOpening
                                    ? 'bg-gray-300 cursor-wait'
                                    : 'bg-[#FF6B6B] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                }`}
                        >
                            {isOpening ? '...' : 'x1'}
                        </button>
                        <button
                            onClick={() => handleOpenMultiple(10)}
                            disabled={isOpening}
                            className={`py-4 font-bold uppercase border-4 border-black transition-all
                ${isOpening
                                    ? 'bg-gray-300 cursor-wait'
                                    : 'bg-[#FFDE00] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                }`}
                        >
                            {isOpening ? '...' : 'x10'}
                        </button>
                        <button
                            onClick={() => handleOpenMultiple(150)}
                            disabled={isOpening}
                            className={`py-4 font-bold uppercase border-4 border-black transition-all
                ${isOpening
                                    ? 'bg-gray-300 cursor-wait'
                                    : 'bg-[#7BF1A8] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                }`}
                        >
                            {isOpening ? '...' : 'x150'}
                        </button>
                    </div>

                    {/* Custom Count Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="number"
                            min="1"
                            max="150"
                            value={customCount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setCustomCount('');
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num) && num >= 1 && num <= 150) {
                                        setCustomCount(String(num));
                                    }
                                }
                            }}
                            placeholder="1-150"
                            disabled={isOpening}
                            className="flex-1 px-4 py-3 border-4 border-black font-bold text-center
                                placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#FF90E8]
                                disabled:bg-gray-200 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={() => {
                                const count = parseInt(customCount);
                                if (count > 0 && count <= 150) {
                                    if (count === 1) {
                                        handleOpenSingle();
                                    } else {
                                        handleOpenMultiple(count);
                                    }
                                }
                            }}
                            disabled={isOpening || !customCount || parseInt(customCount) < 1 || parseInt(customCount) > 150}
                            className={`px-6 py-3 font-bold uppercase border-4 border-black transition-all whitespace-nowrap
                                ${isOpening || !customCount || parseInt(customCount) < 1 || parseInt(customCount) > 150
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-[#FF90E8] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                }`}
                        >
                            {isOpening ? '...' : 'เปิด!'}
                        </button>
                    </div>

                    {/* Stats Panel */}
                    <div className="grid grid-cols-3 gap-1 md:gap-2">
                        <div className="bg-white border-2 md:border-3 border-black p-2 md:p-3 text-center">
                            <div className="text-[10px] md:text-xs text-black/60 mb-1">จำนวน</div>
                            <div className="text-base md:text-xl font-bold">{stats.totalOpened}</div>
                        </div>
                        <div className="bg-[#FF6B6B] border-2 md:border-3 border-black p-2 md:p-3 text-center">
                            <div className="text-[10px] md:text-xs text-white/80 mb-1">FC</div>
                            <div className="text-sm md:text-xl font-bold text-white">{stats.totalFCSpent.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#FFDE00] border-2 md:border-3 border-black p-2 md:p-3 text-center">
                            <div className="text-[10px] md:text-xs text-black/60 mb-1">รวมที่ได้</div>
                            <div className="text-sm md:text-xl font-bold">{formatValue(stats.totalEarned)}</div>
                        </div>
                    </div>

                    {/* Best Reward */}
                    {stats.bestReward && (
                        <div className="mt-2 p-3 border-3 border-black bg-gradient-to-r from-yellow-100 to-yellow-200">
                            <div className="text-xs text-black/60 mb-1">🏆 รางวัลที่ดีที่สุด</div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{stats.bestReward.reward.name}</span>
                                <span className="font-bold font-mono">{formatValue(stats.bestReward.actualValue)}</span>
                            </div>
                        </div>
                    )}

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="w-full mt-4 py-3 font-bold uppercase border-3 border-black bg-white
              shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1a1a1a]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        🔄 เริ่มใหม่
                    </button>
                </div>

                {/* ===== RIGHT PANEL - Info & History ===== */}
                <div className="brutal-card p-4 md:p-6">
                    {/* Box Info */}
                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span>📋</span> รายละเอียดกล่อง
                        </h3>
                        <div className="bg-[#F5F5DC] border-3 border-black p-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-black overflow-hidden flex-shrink-0">
                                    <Image
                                        src={selectedBox.icon}
                                        alt={selectedBox.name}
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="font-bold text-sm sm:text-base">{selectedBox.name}</h4>
                                    <p className="text-xs text-black/60">{selectedBox.description}</p>
                                </div>
                            </div>
                            {selectedBox.expiresAt && (
                                <div className="text-xs text-[#FF6B6B] font-bold">
                                    ⏰ หมดอายุ: {selectedBox.expiresAt}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Drop Rates Table */}
                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span>📊</span> อัตราดรอป
                        </h3>
                        <div className="border-3 border-black overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#FFDE00] border-b-2 border-black">
                                        <th className="px-3 py-2 text-left">รางวัล</th>
                                        <th className="px-3 py-2 text-right">อัตรา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBox.rewards.map((reward, index) => (
                                        <tr
                                            key={reward.id}
                                            className={`border-b border-black last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                        >
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full border border-black flex-shrink-0"
                                                        style={{ backgroundColor: RARITY_COLORS[reward.rarity].bg }}
                                                    />
                                                    <span className="text-xs">{reward.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono font-bold">
                                                {reward.chance}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Rarity Statistics */}
                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span>🎯</span> สถิติ Rarity
                        </h3>
                        <div className="grid grid-cols-5 gap-1">
                            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as const).map((rarity) => (
                                <div
                                    key={rarity}
                                    className="text-center p-2 border-2 border-black"
                                    style={{ backgroundColor: RARITY_COLORS[rarity].bg + '40' }}
                                >
                                    <div className="text-lg font-bold">{stats.rarityCount[rarity]}</div>
                                    <div className="text-[8px] uppercase font-bold truncate">
                                        {rarity.slice(0, 3)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent History */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span>📜</span> ประวัติล่าสุด
                        </h3>
                        <div className="border-3 border-black bg-white max-h-48 overflow-y-auto custom-scrollbar">
                            {recentResults.length === 0 ? (
                                <div className="p-4 text-center text-black/50 text-sm">
                                    ยังไม่มีประวัติการเปิดกล่อง
                                </div>
                            ) : (
                                <div className="divide-y divide-black">
                                    {recentResults.slice(0, 10).map((result) => (
                                        <div
                                            key={result.id}
                                            className="px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: RARITY_COLORS[result.reward.rarity].bg }}
                                                />
                                                <span className="text-xs truncate max-w-[140px]">
                                                    {result.reward.name}
                                                </span>
                                            </div>
                                            <span className="font-mono text-xs font-bold">
                                                {formatValue(result.actualValue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer Popup */}
            {showDisclaimer && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowDisclaimer(false)}
                >
                    <div
                        className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <span className="sticker text-sm rotate-[-2deg]">⚠️ แจ้งเตือน</span>
                        </div>

                        <div className="bg-[#FFDE00] border-3 border-black p-4 mb-4">
                            <p className="text-sm font-bold text-center mb-2">
                                🎮 นี่คือ Simulator เท่านั้น
                            </p>
                            <p className="text-xs text-black/80 text-center">
                                ไม่มีเจตนาชี้แนะให้ซื้อหรือเปิดกล่อง<br />
                                เป็นเพียงเครื่องมือจำลองเพื่อความบันเทิง
                            </p>
                        </div>

                        <div className="text-xs text-black/60 text-center mb-4">
                            💡 อัตราการดรอปอ้างอิงจากข้อมูลในเกมจริง
                        </div>

                        <button
                            onClick={() => setShowDisclaimer(false)}
                            className="w-full py-3 bg-[#7BF1A8] font-bold uppercase
                                border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
                                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
                                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                transition-all"
                        >
                            เข้าใจแล้ว ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
