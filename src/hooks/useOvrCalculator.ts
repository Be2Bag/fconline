/**
 * Custom Hook สำหรับ OVR Calculator
 * จัดการ state และ logic ทั้งหมดของการคำนวณ OVR
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { StatValues, EfficientUpgradeResult } from '@/types';
import {
    calculateOVR,
    calculateUpgradedOVR,
    getEfficientUpgrades,
    getOptimalUpgrades,
} from '@/services';
import { ovrWeights } from '@/data/ovrWeights';
import { APP_CONFIG } from '@/config';

/**
 * State ของ hook
 */
interface UseOvrCalculatorState {
    // Position
    selectedPosition: string;

    // Stats
    stats: StatValues;
    upgradedStats: string[];

    // UI state
    isCalculating: boolean;
    showResults: boolean;
}

/**
 * Return type ของ hook
 */
interface UseOvrCalculatorReturn extends UseOvrCalculatorState {
    // Computed values
    baseOvr: number;
    upgradedOvr: number;

    // Available data
    positionStats: { stat: string; weight: number }[];
    allStatsFilled: boolean;
    filledStatsCount: number;
    totalStatsCount: number;

    // Recommendations
    recommendations: EfficientUpgradeResult | null;
    optimalStats: string[];

    // Actions
    setPosition: (position: string) => void;
    setStat: (stat: string, value: number) => void;
    toggleUpgrade: (stat: string) => void;
    reset: () => void;
}

/**
 * Hook สำหรับ OVR Calculator
 */
export function useOvrCalculator(): UseOvrCalculatorReturn {
    // Position
    const [selectedPosition, setSelectedPosition] = useState('ST');

    // Stats
    const [stats, setStats] = useState<StatValues>({});
    const [upgradedStats, setUpgradedStats] = useState<string[]>([]);

    // UI state
    const [isCalculating, setIsCalculating] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Get position data
    const positionData = useMemo(() => {
        return ovrWeights[selectedPosition];
    }, [selectedPosition]);

    const positionStats = useMemo(() => {
        return positionData?.stats || [];
    }, [positionData]);

    // Calculate filled stats
    const { filledStatsCount, totalStatsCount, allStatsFilled } = useMemo(() => {
        const total = positionStats.length;
        const filled = positionStats.filter(
            (s) => stats[s.stat] !== undefined && stats[s.stat] > 0
        ).length;
        return {
            filledStatsCount: filled,
            totalStatsCount: total,
            allStatsFilled: filled === total && total > 0,
        };
    }, [positionStats, stats]);

    // Calculate OVR values
    const baseOvr = useMemo(() => {
        if (!allStatsFilled) return 0;
        return calculateOVR(stats, positionStats);
    }, [stats, positionStats, allStatsFilled]);

    const upgradedOvr = useMemo(() => {
        if (!allStatsFilled) return 0;
        return calculateUpgradedOVR(stats, positionStats, upgradedStats);
    }, [stats, positionStats, upgradedStats, allStatsFilled]);

    // Get recommendations
    const recommendations = useMemo(() => {
        if (!allStatsFilled) return null;
        return getEfficientUpgrades(stats, selectedPosition);
    }, [stats, selectedPosition, allStatsFilled]);

    // Get optimal stats to upgrade
    const optimalStats = useMemo(() => {
        const optimal = getOptimalUpgrades(selectedPosition, APP_CONFIG.MAX_STAT_UPGRADES);
        return optimal.map((o) => o.stat);
    }, [selectedPosition]);

    // Auto-calculate when all stats are filled
    useEffect(() => {
        if (allStatsFilled) {
            setIsCalculating(true);
            // Simulate calculation delay for UX
            const timer = setTimeout(() => {
                setIsCalculating(false);
                setShowResults(true);
            }, APP_CONFIG.CALCULATION_DELAY);
            return () => clearTimeout(timer);
        } else {
            setShowResults(false);
        }
    }, [allStatsFilled]);

    /**
     * เปลี่ยนตำแหน่ง
     */
    const setPosition = useCallback((position: string) => {
        setSelectedPosition(position);
        setStats({});
        setUpgradedStats([]);
        setShowResults(false);
    }, []);

    /**
     * ตั้งค่า stat
     */
    const setStat = useCallback((stat: string, value: number) => {
        setStats((prev) => ({
            ...prev,
            [stat]: value,
        }));
    }, []);

    /**
     * Toggle การ upgrade stat
     */
    const toggleUpgrade = useCallback((stat: string) => {
        setUpgradedStats((prev) => {
            if (prev.includes(stat)) {
                return prev.filter((s) => s !== stat);
            }
            if (prev.length >= APP_CONFIG.MAX_STAT_UPGRADES) {
                return prev;
            }
            return [...prev, stat];
        });
    }, []);

    /**
     * Reset ทั้งหมด
     */
    const reset = useCallback(() => {
        setStats({});
        setUpgradedStats([]);
        setShowResults(false);
        setIsCalculating(false);
    }, []);

    return {
        // State
        selectedPosition,
        stats,
        upgradedStats,
        isCalculating,
        showResults,

        // Computed
        baseOvr,
        upgradedOvr,
        positionStats,
        allStatsFilled,
        filledStatsCount,
        totalStatsCount,
        recommendations,
        optimalStats,

        // Actions
        setPosition,
        setStat,
        toggleUpgrade,
        reset,
    };
}
