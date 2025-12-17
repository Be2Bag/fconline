"use client";

import { EfficientUpgradeResult } from "@/utils/calculation";
import { ovrWeights } from "@/data/ovrWeights";

interface RecommendationProps {
    position: string;
    efficientResult: EfficientUpgradeResult | null;
    onApplyRecommendation: (stats: string[]) => void;
}

export default function Recommendation({
    position,
    efficientResult,
    onApplyRecommendation,
}: RecommendationProps) {
    if (!efficientResult || !position) {
        return (
            <div className="p-4 md:p-6 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a] text-center">
                <span className="text-sm text-black/50">กรอกค่าสเตตัสเพื่อดูคำแนะนำ</span>
            </div>
        );
    }

    const positionData = ovrWeights[position];
    if (!positionData) return null;

    const top5Stats = [...positionData.stats]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);

    const { savedUpgrades, minUpgradesNeeded, floorFullUpgrade, minUpgradeOVR } =
        efficientResult;

    return (
        <div className="recommendation space-y-3 md:space-y-4">
            {/* Optimal Upgrade Recommendation */}
            <div className="p-3 md:p-4 bg-[#6EB5FF] border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <span className="text-base md:text-lg">💡</span>
                    <h3 className="text-xs md:text-sm font-bold uppercase tracking-wide text-black">
                        แนะนำอัพ OVR สูงสุด
                    </h3>
                </div>

                <div className="grid gap-1 md:gap-1.5 mb-3 md:mb-4">
                    {top5Stats.map((stat, index) => (
                        <div
                            key={stat.stat}
                            className="flex items-center gap-2 p-1.5 md:p-2 bg-white border-2 border-black"
                        >
                            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#FFDE00] border-2 border-black flex items-center justify-center text-[10px] md:text-xs font-bold">
                                {index + 1}
                            </span>
                            <span className="flex-1 text-black text-xs md:text-sm font-bold truncate">{stat.stat}</span>
                            <span className="text-black/60 text-[10px] md:text-xs font-mono">{stat.weight}%</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onApplyRecommendation(top5Stats.map((s) => s.stat))}
                    className="w-full py-2.5 md:py-3 bg-[#FFDE00] text-black font-bold text-sm md:text-base uppercase
            border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
            hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
            transition-all"
                >
                    ใช้คำแนะนำนี้
                </button>
            </div>

            {/* Efficient Upgrade Suggestion */}
            {savedUpgrades > 0 && (
                <div className="p-3 md:p-4 bg-[#FF9F1C] border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <span className="text-base md:text-lg">⚡</span>
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wide text-black">
                            ประหยัดการอัพ!
                        </h3>
                    </div>

                    <p className="text-black text-xs md:text-sm mb-2 md:mb-3">
                        อัพแค่{" "}
                        <span className="bg-white px-1 border-2 border-black font-bold">
                            {minUpgradesNeeded} ค่า
                        </span>{" "}
                        ก็ได้ OVR{" "}
                        <span className="bg-white px-1 border-2 border-black font-bold">{floorFullUpgrade}</span>
                    </p>

                    <div className="bg-white p-2 md:p-3 border-2 border-black space-y-1 text-[10px] md:text-xs font-mono">
                        <div className="flex justify-between">
                            <span className="text-black/60">อัพ 5 ค่า:</span>
                            <span className="text-black font-bold">
                                {efficientResult.fullUpgradeOVR.toFixed(2)} → {floorFullUpgrade}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-black/60">
                                อัพ {minUpgradesNeeded} ค่า:
                            </span>
                            <span className="text-black font-bold">
                                {minUpgradeOVR.toFixed(2)} → {Math.floor(minUpgradeOVR)}
                            </span>
                        </div>
                        <div className="flex justify-between text-black pt-1 border-t border-black">
                            <span>ประหยัด:</span>
                            <span className="font-bold bg-[#7BF1A8] px-1">{savedUpgrades} สเตตัส</span>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            onApplyRecommendation(efficientResult.recommendedStats)
                        }
                        className="w-full mt-2 md:mt-3 py-2.5 md:py-3 bg-[#7BF1A8] text-black font-bold text-sm md:text-base uppercase
              border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
              hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              transition-all"
                    >
                        ใช้แบบประหยัด ({minUpgradesNeeded} ค่า)
                    </button>
                </div>
            )}
        </div>
    );
}
