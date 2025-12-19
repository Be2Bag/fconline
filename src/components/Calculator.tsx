"use client";

import { useState, useEffect, useCallback } from "react";
import { ovrWeights } from "@/data/ovrWeights";
import {
    StatValues,
    calculateOVR,
    calculateUpgradedOVR,
    getEfficientUpgrades,
    EfficientUpgradeResult,
} from "@/utils/calculation";
import PositionSelect from "./PositionSelect";
import StatInput from "./StatInput";
import Recommendation from "./Recommendation";

const MAX_UPGRADES = 5;

export default function Calculator() {
    const [position, setPosition] = useState<string>("ST");
    const [stats, setStats] = useState<StatValues>({});
    const [upgradedStats, setUpgradedStats] = useState<Set<string>>(new Set());
    const [baseOVR, setBaseOVR] = useState<number>(0);
    const [upgradedOVR, setUpgradedOVR] = useState<number>(0);
    const [efficientResult, setEfficientResult] =
        useState<EfficientUpgradeResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasCalculated, setHasCalculated] = useState(false);

    useEffect(() => {
        const positionData = ovrWeights[position];
        if (positionData) {
            const initialStats: StatValues = {};
            positionData.stats.forEach((s) => {
                initialStats[s.stat] = 0;
            });
            setStats(initialStats);
            setUpgradedStats(new Set());
        }
    }, [position]);

    useEffect(() => {
        const positionData = ovrWeights[position];
        if (positionData) {
            const base = calculateOVR(stats, positionData.stats);
            const upgraded = calculateUpgradedOVR(
                stats,
                positionData.stats,
                Array.from(upgradedStats)
            );
            setBaseOVR(base);
            setUpgradedOVR(upgraded);

            const hasStats = Object.values(stats).some((v) => v > 0);
            if (hasStats) {
                const efficient = getEfficientUpgrades(stats, position);
                setEfficientResult(efficient);
            } else {
                setEfficientResult(null);
            }
        }
    }, [stats, upgradedStats, position]);

    const handleStatChange = useCallback((stat: string, value: number) => {
        setStats((prev) => ({ ...prev, [stat]: value }));
    }, []);

    const handleToggleUpgrade = useCallback((stat: string) => {
        setUpgradedStats((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(stat)) {
                newSet.delete(stat);
            } else if (newSet.size < MAX_UPGRADES) {
                newSet.add(stat);
            }
            return newSet;
        });
    }, []);

    const handleApplyRecommendation = useCallback((recommendedStats: string[]) => {
        setUpgradedStats(new Set(recommendedStats));
    }, []);

    const handlePositionChange = useCallback((newPosition: string) => {
        setPosition(newPosition);
    }, []);

    const handleReset = useCallback(() => {
        const positionData = ovrWeights[position];
        if (positionData) {
            const resetStats: StatValues = {};
            positionData.stats.forEach((s) => {
                resetStats[s.stat] = 0;
            });
            setStats(resetStats);
            setUpgradedStats(new Set());
        }
    }, [position]);

    const positionData = ovrWeights[position];

    // Check if all stats are filled
    const allStatsFilled = positionData
        ? positionData.stats.every((s) => stats[s.stat] && stats[s.stat] > 0)
        : false;

    // Count filled stats for progress indicator
    const filledCount = positionData
        ? positionData.stats.filter((s) => stats[s.stat] && stats[s.stat] > 0).length
        : 0;
    const totalCount = positionData?.stats.length || 0;

    // Trigger loading when all stats are filled for the first time
    useEffect(() => {
        if (allStatsFilled && !hasCalculated && !isLoading) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                setHasCalculated(true);
            }, 1000);
        } else if (!allStatsFilled && hasCalculated) {
            setHasCalculated(false);
        }
    }, [allStatsFilled, hasCalculated, isLoading]);

    return (
        <div className="calculator max-w-6xl mx-auto">
            {/* Position Selector */}
            <div className="glass-card p-4 md:p-6 mb-4 md:mb-6">
                <PositionSelect
                    selectedPosition={position}
                    onPositionChange={handlePositionChange}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Stats Input Section */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="sticker text-xs md:text-sm rotate-[-2deg]">
                                    {positionData?.thaiName}
                                </span>
                                {/* Progress indicator */}
                                <span className={`text-xs font-bold px-2 py-0.5 border-2 border-black ${allStatsFilled ? 'bg-[#7BF1A8]' : 'bg-white'}`}>
                                    {filledCount}/{totalCount}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-xs md:text-sm font-bold text-black">
                                    +2: <span className="bg-[#FFDE00] px-1 border-2 border-black">{upgradedStats.size}/{MAX_UPGRADES}</span>
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
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                            {positionData?.stats.map((statWeight) => (
                                <StatInput
                                    key={statWeight.stat}
                                    stat={statWeight.stat}
                                    weight={statWeight.weight}
                                    value={stats[statWeight.stat] || 0}
                                    isUpgraded={upgradedStats.has(statWeight.stat)}
                                    canUpgrade={upgradedStats.size < MAX_UPGRADES}
                                    onValueChange={(value) =>
                                        handleStatChange(statWeight.stat, value)
                                    }
                                    onToggleUpgrade={() => handleToggleUpgrade(statWeight.stat)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* OVR Display & Recommendations */}
                <div className="space-y-4 md:space-y-6">
                    {/* OVR Display */}
                    <div className="glass-card p-4 md:p-6">
                        <h2 className="text-sm md:text-base font-bold uppercase tracking-wide text-black mb-3 md:mb-4 text-center">
                            ค่า OVR
                        </h2>

                        {/* Show message if not all stats are filled */}
                        {!allStatsFilled ? (
                            <div className="text-center p-4 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                <div className="text-2xl mb-2">📝</div>
                                <div className="text-sm font-bold text-black/70">
                                    กรุณากรอกสถิติให้ครบทุกช่อง
                                </div>
                                <div className="text-xs text-black/50 mt-1">
                                    เหลืออีก {totalCount - filledCount} ช่อง
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="text-center p-4 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                <div className="inline-block w-10 h-10 border-4 border-black/20 border-t-[#FFDE00] rounded-full animate-spin mb-3"></div>
                                <div className="text-sm font-bold text-black/70">
                                    กำลังคำนวณ...
                                </div>
                            </div>
                        ) : hasCalculated ? (
                            <>
                                {/* Base OVR */}
                                <div className="text-center mb-3 md:mb-4 p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                    <div className="text-[10px] md:text-xs text-black/60 uppercase mb-1">พื้นฐาน</div>
                                    <div className="text-3xl md:text-4xl font-bold text-black font-mono">
                                        {baseOVR.toFixed(2)}
                                    </div>
                                    <div className="text-sm md:text-base font-mono text-black/60">
                                        ({Math.floor(baseOVR)})
                                    </div>
                                </div>

                                {/* Upgraded OVR */}
                                {upgradedStats.size > 0 && (
                                    <div className="text-center p-3 bg-[#7BF1A8] border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                        <div className="text-[10px] md:text-xs text-black/60 uppercase mb-1">
                                            หลังอัพ +2
                                        </div>
                                        <div className="text-4xl md:text-5xl font-bold text-black font-mono">
                                            {upgradedOVR.toFixed(2)}
                                        </div>
                                        <div className="text-lg md:text-xl font-mono font-bold text-black">
                                            ({Math.floor(upgradedOVR)})
                                        </div>
                                        <div className="mt-2 text-xs md:text-sm font-mono font-bold">
                                            <span className="bg-[#FFDE00] px-2 py-0.5 border-2 border-black">
                                                +{(upgradedOVR - baseOVR).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Recommendations */}
                    <div className="glass-card p-4 md:p-6">
                        <h2 className="text-sm md:text-base font-bold uppercase tracking-wide text-black mb-3 md:mb-4 text-center">
                            คำแนะนำ
                        </h2>
                        {!allStatsFilled ? (
                            <div className="text-center p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                <div className="text-xs text-black/60">
                                    กรอกสถิติครบแล้วจะแสดงคำแนะนำ
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="text-center p-3 bg-white border-3 border-black shadow-[3px_3px_0px_#1a1a1a]">
                                <div className="inline-block w-6 h-6 border-2 border-black/20 border-t-[#FFDE00] rounded-full animate-spin"></div>
                            </div>
                        ) : hasCalculated ? (
                            <Recommendation
                                position={position}
                                efficientResult={efficientResult}
                                onApplyRecommendation={handleApplyRecommendation}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
