/**
 * Custom Hook สำหรับ Box Simulator
 * จัดการ state และ logic ทั้งหมดของการเปิดกล่อง
 */

import { useState, useCallback } from 'react';
import type { BoxType, OpenResult, BoxStats, BoxAnimationState, Rarity } from '@/types';
import {
    openBox,
    openMultipleBoxes,
    calculateTotalValue,
    findBestReward,
    countByRarity,
} from '@/services';
import { BOX_CONFIG } from '@/config';

/**
 * Initial stats
 */
const initialStats: BoxStats = {
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
};

/**
 * State ของ hook
 */
interface UseBoxSimulatorState {
    // Box selection
    selectedBox: BoxType | null;

    // Open state
    openCount: number;

    // Results
    history: OpenResult[];
    latestResult: OpenResult | null;

    // Stats
    stats: BoxStats;

    // Animation
    animationState: BoxAnimationState;
}

/**
 * Return type ของ hook
 */
interface UseBoxSimulatorReturn extends UseBoxSimulatorState {
    // Computed
    profit: number;

    // Actions
    selectBox: (box: BoxType) => void;
    setOpenCount: (count: number) => void;
    handleOpen: () => void;
    handleOpenMultiple: (count?: number) => void;
    resetStats: () => void;
    clearBox: () => void;
}

/**
 * Hook สำหรับ Box Simulator
 */
export function useBoxSimulator(): UseBoxSimulatorReturn {
    // Box state
    const [selectedBox, setSelectedBox] = useState<BoxType | null>(null);
    const [openCount, setOpenCountState] = useState<number>(BOX_CONFIG.DEFAULT_OPEN_COUNT);

    // Results
    const [history, setHistory] = useState<OpenResult[]>([]);
    const [latestResult, setLatestResult] = useState<OpenResult | null>(null);

    // Stats
    const [stats, setStats] = useState<BoxStats>(initialStats);

    // Animation
    const [animationState, setAnimationState] = useState<BoxAnimationState>('idle');

    // Computed
    const profit = stats.totalEarned - stats.totalFCSpent;

    /**
     * เลือกกล่อง
     */
    const selectBox = useCallback((box: BoxType) => {
        setSelectedBox(box);
        // Don't reset stats when switching boxes
    }, []);

    /**
     * ตั้งค่าจำนวนที่จะเปิด
     */
    const setOpenCount = useCallback((count: number) => {
        const validCount = Math.max(
            BOX_CONFIG.MIN_OPEN_COUNT,
            Math.min(BOX_CONFIG.MAX_OPEN_COUNT, count)
        );
        setOpenCountState(validCount);
    }, []);

    /**
     * เปิดกล่อง 1 ใบ
     */
    const handleOpen = useCallback(() => {
        if (!selectedBox || animationState !== 'idle') return;

        // Start shake animation
        setAnimationState('shaking');

        setTimeout(() => {
            setAnimationState('opening');

            setTimeout(() => {
                // Open box
                const result = openBox(selectedBox);

                // Update history (limit to max display)
                setHistory(prev => {
                    const newHistory = [result, ...prev];
                    return newHistory.slice(0, BOX_CONFIG.MAX_HISTORY_DISPLAY);
                });

                setLatestResult(result);

                // Update stats
                setStats(prev => {
                    const newRarityCount = { ...prev.rarityCount };
                    newRarityCount[result.reward.rarity]++;

                    const newBestReward = !prev.bestReward ||
                        result.actualValue > prev.bestReward.actualValue
                        ? result
                        : prev.bestReward;

                    return {
                        totalOpened: prev.totalOpened + 1,
                        totalEarned: prev.totalEarned + result.actualValue,
                        totalFCSpent: prev.totalFCSpent + selectedBox.fcCost,
                        bestReward: newBestReward,
                        rarityCount: newRarityCount,
                    };
                });

                setAnimationState('revealed');

                // Reset after reveal
                setTimeout(() => {
                    setAnimationState('idle');
                }, BOX_CONFIG.REVEAL_DURATION);
            }, BOX_CONFIG.OPEN_ANIMATION_DURATION);
        }, BOX_CONFIG.SHAKE_DURATION);
    }, [selectedBox, animationState]);

    /**
     * เปิดกล่องหลายใบ
     */
    const handleOpenMultiple = useCallback((count?: number) => {
        if (!selectedBox || animationState !== 'idle') return;

        const actualCount = count ?? openCount;

        // Fast open - no individual animations
        setAnimationState('opening');

        setTimeout(() => {
            const results = openMultipleBoxes(selectedBox, actualCount);

            // Update history
            setHistory(prev => {
                const newHistory = [...results.reverse(), ...prev];
                return newHistory.slice(0, BOX_CONFIG.MAX_HISTORY_DISPLAY);
            });

            // Latest is the last one opened
            setLatestResult(results[results.length - 1]);

            // Update stats
            const totalValue = calculateTotalValue(results);
            const bestFromBatch = findBestReward(results);
            const rarityCounts = countByRarity(results);

            setStats(prev => {
                const newRarityCount: Record<Rarity, number> = {
                    legendary: prev.rarityCount.legendary + rarityCounts.legendary,
                    epic: prev.rarityCount.epic + rarityCounts.epic,
                    rare: prev.rarityCount.rare + rarityCounts.rare,
                    uncommon: prev.rarityCount.uncommon + rarityCounts.uncommon,
                    common: prev.rarityCount.common + rarityCounts.common,
                };

                // Compare best rewards
                let newBestReward = prev.bestReward;
                if (bestFromBatch) {
                    if (!newBestReward || bestFromBatch.actualValue > newBestReward.actualValue) {
                        newBestReward = bestFromBatch;
                    }
                }

                return {
                    totalOpened: prev.totalOpened + actualCount,
                    totalEarned: prev.totalEarned + totalValue,
                    totalFCSpent: prev.totalFCSpent + (selectedBox.fcCost * actualCount),
                    bestReward: newBestReward,
                    rarityCount: newRarityCount,
                };
            });

            setAnimationState('revealed');

            setTimeout(() => {
                setAnimationState('idle');
            }, BOX_CONFIG.REVEAL_DURATION);
        }, 500); // Short delay for batch open
    }, [selectedBox, openCount, animationState]);

    /**
     * Reset สถิติ
     */
    const resetStats = useCallback(() => {
        setHistory([]);
        setLatestResult(null);
        setStats(initialStats);
        setAnimationState('idle');
    }, []);

    /**
     * Clear box selection
     */
    const clearBox = useCallback(() => {
        setSelectedBox(null);
        setLatestResult(null);
        setAnimationState('idle');
    }, []);

    return {
        // State
        selectedBox,
        openCount,
        history,
        latestResult,
        stats,
        animationState,

        // Computed
        profit,

        // Actions
        selectBox,
        setOpenCount,
        handleOpen,
        handleOpenMultiple,
        resetStats,
        clearBox,
    };
}
