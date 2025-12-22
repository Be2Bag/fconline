/**
 * Custom Hook สำหรับ Upgrade Simulator
 * จัดการ state และ logic ทั้งหมดของการตีบวก
 */

import { useState, useCallback } from 'react';
import type { UpgradeStats, Player, UpgradeAnimationState } from '@/types';
import {
    simulateUpgrade,
    getTotalOvrBonus,
    calculateSuccessRate,
    isMaxLevel,
} from '@/services';
import { UPGRADE_CONFIG } from '@/config';

/**
 * Initial stats
 */
const initialStats: UpgradeStats = {
    attempts: 0,
    successes: 0,
    failures: 0,
    highestLevel: 1,
};

/**
 * State ของ hook
 */
interface UseUpgradeSimulatorState {
    // Player state
    selectedPlayer: Player | null;

    // Level state
    currentLevel: number;
    startLevel: number;

    // Boost state
    boostGauge: number;
    cardStates: (0 | 0.5 | 1)[];

    // Stats
    stats: UpgradeStats;

    // Animation
    animationState: UpgradeAnimationState;
    lastResult: 'success' | 'fail' | 'catastrophic' | null;
}

/**
 * Return type ของ hook
 */
interface UseUpgradeSimulatorReturn extends UseUpgradeSimulatorState {
    // Computed values
    ovrBonus: number;
    successRate: number;
    isAtMaxLevel: boolean;

    // Actions
    selectPlayer: (player: Player) => void;
    setStartLevel: (level: number) => void;
    handleUpgrade: () => void;
    handleCardClick: (index: number) => void;
    resetSimulation: () => void;
    clearPlayer: () => void;
}

/**
 * Hook สำหรับ Upgrade Simulator
 */
export function useUpgradeSimulator(): UseUpgradeSimulatorReturn {
    // Player state
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // Level state
    const [currentLevel, setCurrentLevel] = useState(1);
    const [startLevel, setStartLevelState] = useState(1);

    // Boost state - 5 cards
    const [cardStates, setCardStates] = useState<(0 | 0.5 | 1)[]>([1, 1, 1, 1, 1]);

    // Stats
    const [stats, setStats] = useState<UpgradeStats>(initialStats);

    // Animation
    const [animationState, setAnimationState] = useState<UpgradeAnimationState>('idle');
    const [lastResult, setLastResult] = useState<'success' | 'fail' | 'catastrophic' | null>(null);

    // Computed values
    const boostGauge = cardStates.reduce<number>((sum, state) => sum + state, 0);
    const ovrBonus = getTotalOvrBonus(currentLevel);
    const successRate = calculateSuccessRate(currentLevel, boostGauge);
    const isAtMaxLevel = isMaxLevel(currentLevel);

    /**
     * เลือกนักเตะ
     */
    const selectPlayer = useCallback((player: Player) => {
        setSelectedPlayer(player);
        setCurrentLevel(startLevel);
        setStats(initialStats);
        setLastResult(null);
    }, [startLevel]);

    /**
     * ตั้งค่า start level
     */
    const setStartLevel = useCallback((level: number) => {
        const validLevel = Math.max(
            UPGRADE_CONFIG.MIN_LEVEL,
            Math.min(UPGRADE_CONFIG.MAX_LEVEL, level)
        );
        setStartLevelState(validLevel);
        setCurrentLevel(validLevel);
        setStats(initialStats);
        setLastResult(null);
    }, []);

    /**
     * คลิกการ์ดเพื่อเปลี่ยนสถานะ (0 -> 0.5 -> 1 -> 0)
     */
    const handleCardClick = useCallback((index: number) => {
        setCardStates(prev => {
            const newStates = [...prev];
            const currentState = newStates[index];

            // Cycle: 0 -> 0.5 -> 1 -> 0
            if (currentState === 0) {
                newStates[index] = 0.5;
            } else if (currentState === 0.5) {
                newStates[index] = 1;
            } else {
                newStates[index] = 0;
            }

            return newStates;
        });
    }, []);

    /**
     * ตีบวก!
     */
    const handleUpgrade = useCallback(() => {
        if (isAtMaxLevel || animationState !== 'idle') return;

        // Start animation
        setAnimationState('upgrading');

        // Simulate after animation delay
        setTimeout(() => {
            const result = simulateUpgrade(currentLevel, boostGauge);

            // Update level
            setCurrentLevel(result.newLevel);

            // Update stats
            setStats(prev => ({
                attempts: prev.attempts + 1,
                successes: result.success ? prev.successes + 1 : prev.successes,
                failures: result.success ? prev.failures : prev.failures + 1,
                highestLevel: Math.max(prev.highestLevel, result.newLevel),
            }));

            // Set result and animation
            if (result.success) {
                setLastResult('success');
                setAnimationState('success');
            } else if (result.isCatastrophic) {
                setLastResult('catastrophic');
                setAnimationState('fail');
            } else {
                setLastResult('fail');
                setAnimationState('fail');
            }

            // Reset animation after duration
            setTimeout(() => {
                setAnimationState('idle');
            }, UPGRADE_CONFIG.SUCCESS_ANIMATION_DURATION);
        }, 300); // Short delay before result
    }, [currentLevel, boostGauge, isAtMaxLevel, animationState]);

    /**
     * Reset การจำลอง
     */
    const resetSimulation = useCallback(() => {
        setCurrentLevel(startLevel);
        setStats(initialStats);
        setCardStates([1, 1, 1, 1, 1]);
        setLastResult(null);
        setAnimationState('idle');
    }, [startLevel]);

    /**
     * Clear player
     */
    const clearPlayer = useCallback(() => {
        setSelectedPlayer(null);
        resetSimulation();
    }, [resetSimulation]);

    return {
        // State
        selectedPlayer,
        currentLevel,
        startLevel,
        boostGauge,
        cardStates,
        stats,
        animationState,
        lastResult,

        // Computed
        ovrBonus,
        successRate,
        isAtMaxLevel,

        // Actions
        selectPlayer,
        setStartLevel,
        handleUpgrade,
        handleCardClick,
        resetSimulation,
        clearPlayer,
    };
}
