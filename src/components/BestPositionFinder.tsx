"use client";

import { useState, useMemo } from "react";
import { ovrWeights, positionList } from "@/data/ovrWeights";
import { allPlayerStats, statNameMapping } from "@/data/allStats";
import { StatValues, calculateOVR, calculateUpgradedOVR } from "@/utils/calculation";

interface PositionResult {
    position: string;
    thaiName: string;
    baseOVR: number;
    upgradedOVR: number;
    top5Stats: { stat: string; weight: number }[];
}

export default function BestPositionFinder() {
    const [playerStats, setPlayerStats] = useState<StatValues>({});
    const [showResults, setShowResults] = useState(false);

    const handleStatChange = (stat: string, value: number) => {
        setPlayerStats((prev) => ({ ...prev, [stat]: value }));
    };

    const mapStatName = (inputStat: string): string => {
        return statNameMapping[inputStat] || inputStat;
    };

    const positionResults = useMemo((): PositionResult[] => {
        if (Object.keys(playerStats).length === 0) return [];

        const mappedStats: StatValues = {};
        Object.entries(playerStats).forEach(([stat, value]) => {
            const mappedName = mapStatName(stat);
            mappedStats[mappedName] = value;
        });

        const results: PositionResult[] = [];

        positionList.forEach((posKey) => {
            const posData = ovrWeights[posKey];
            if (!posData) return;

            const baseOVR = calculateOVR(mappedStats, posData.stats);
            const sortedStats = [...posData.stats].sort((a, b) => b.weight - a.weight);
            const top5Stats = sortedStats.slice(0, 5);
            const top5StatNames = top5Stats.map((s) => s.stat);
            const upgradedOVR = calculateUpgradedOVR(mappedStats, posData.stats, top5StatNames);

            results.push({
                position: posKey,
                thaiName: posData.thaiName,
                baseOVR,
                upgradedOVR,
                top5Stats: top5Stats.map((s) => ({ stat: s.stat, weight: s.weight })),
            });
        });

        return results.sort((a, b) => b.upgradedOVR - a.upgradedOVR);
    }, [playerStats]);

    const handleReset = () => {
        setPlayerStats({});
        setShowResults(false);
        setIsLoading(false);
    };

    const handleCalculate = () => {
        setIsLoading(true);
        setShowResults(false);
        // Delay to simulate processing
        setTimeout(() => {
            setIsLoading(false);
            setShowResults(true);
        }, 1500);
    };

    const [isLoading, setIsLoading] = useState(false);

    // Check if all stats are filled
    const filledCount = allPlayerStats.filter((stat) => playerStats[stat] && playerStats[stat] > 0).length;
    const totalCount = allPlayerStats.length;
    const allStatsFilled = filledCount === totalCount;

    const medalColors = ["#FFDE00", "#C0C0C0", "#CD7F32"];

    return (
        <div className="best-position-finder max-w-6xl mx-auto">
            <div className="glass-card p-4 md:p-6 mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-2">
                        <span className="sticker-pink sticker text-xs md:text-sm rotate-[-2deg]">
                            🎯 หาตำแหน่ง
                        </span>
                        {/* Progress indicator */}
                        <span className={`text-xs font-bold px-2 py-0.5 border-2 border-black ${allStatsFilled ? 'bg-[#7BF1A8]' : 'bg-white'}`}>
                            {filledCount}/{totalCount}
                        </span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-white font-bold text-xs md:text-sm uppercase
              border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
              hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              transition-all"
                    >
                        🔄 รีเซ็ต
                    </button>
                </div>

                <p className="text-black/60 text-xs md:text-sm mb-3 md:mb-4">
                    กรอกค่าสเตตัสทั้งหมดของนักเตะ {!allStatsFilled && <span className="text-black/40">(เหลืออีก {totalCount - filledCount} ช่อง)</span>}
                </p>

                {/* Stats Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 max-h-[350px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                    {allPlayerStats.map((stat) => (
                        <div key={stat} className="bg-white p-2 md:p-3 border-3 border-black shadow-[2px_2px_0px_#1a1a1a]">
                            <label className="text-[9px] md:text-[10px] text-black/60 font-bold block mb-1 truncate uppercase">
                                {stat}
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={playerStats[stat] || ""}
                                placeholder="0"
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                    handleStatChange(stat, Math.min(200, val));
                                }}
                                className="w-full px-2 py-2 text-center font-mono font-bold text-sm md:text-base
                  bg-[#FFFFF0] border-2 border-black outline-none
                  focus:bg-[#FFDE00] focus:shadow-[2px_2px_0px_#1a1a1a]
                  transition-all"
                            />
                        </div>
                    ))}
                </div>

                {/* Calculate Button */}
                <button
                    onClick={handleCalculate}
                    disabled={!allStatsFilled || isLoading}
                    className={`w-full mt-3 md:mt-4 py-3 md:py-4 font-bold text-sm md:text-base uppercase tracking-wide
            border-4 border-black transition-all
            ${allStatsFilled && !isLoading
                            ? 'bg-[#FFDE00] text-black shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                            : 'bg-gray-300 text-gray-500 shadow-[2px_2px_0px_#666] cursor-not-allowed'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                            กำลังวิเคราะห์...
                        </span>
                    ) : allStatsFilled ? '🔍 วิเคราะห์ตำแหน่งที่ดีที่สุด' : `📝 กรอกให้ครบก่อน (${filledCount}/${totalCount})`}
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="glass-card p-6 md:p-8 mb-4 md:mb-6 text-center">
                    <div className="inline-block w-12 h-12 border-4 border-black/20 border-t-[#FFDE00] rounded-full animate-spin mb-4"></div>
                    <div className="text-lg font-bold text-black">กำลังวิเคราะห์ตำแหน่ง...</div>
                    <div className="text-sm text-black/60 mt-1">กรุณารอสักครู่</div>
                </div>
            )}

            {/* Results */}
            {showResults && allStatsFilled && positionResults.length > 0 && (
                <div className="glass-card p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <span className="sticker-blue sticker text-xs md:text-sm">📊 ผลการวิเคราะห์</span>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                        {positionResults.map((result, index) => (
                            <div
                                key={result.position}
                                style={{
                                    backgroundColor: index < 3 ? medalColors[index] : '#FFFFF0',
                                }}
                                className="p-3 md:p-4 border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
                  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
                  transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span
                                            className="w-7 h-7 md:w-8 md:h-8 bg-black text-white flex items-center justify-center font-bold text-xs md:text-sm font-mono"
                                        >
                                            {index + 1}
                                        </span>
                                        <div>
                                            <span className="text-black font-bold text-sm md:text-base">{result.position}</span>
                                            <span className="text-black/60 text-xs md:text-sm ml-1 md:ml-2">
                                                {result.thaiName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] md:text-[10px] text-black/60 uppercase">หลังฝึกพิเศษ</div>
                                        <div className="text-xl md:text-2xl font-bold text-black font-mono">
                                            {result.upgradedOVR.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Top 5 stats */}
                                <div className="pt-2 border-t-2 border-black">
                                    <div className="text-[9px] md:text-[10px] text-black/60 uppercase mb-1">แนะนำอัพ:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {result.top5Stats.map((s) => (
                                            <span
                                                key={s.stat}
                                                className="px-1.5 md:px-2 py-0.5 bg-white border-2 border-black text-[9px] md:text-[10px] font-bold"
                                            >
                                                {s.stat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
