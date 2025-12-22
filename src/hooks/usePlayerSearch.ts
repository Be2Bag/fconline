/**
 * Custom Hook สำหรับ Player Search
 * จัดการ state และ logic ของการค้นหานักเตะ
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Player } from '@/types';
import { searchPlayers } from '@/services';
import { SEARCH_LIMITS } from '@/constants';

/**
 * State ของ hook
 */
interface UsePlayerSearchState {
    // Search
    searchQuery: string;
    searchResults: Player[];

    // UI state
    isSearching: boolean;
    showResults: boolean;
    error: string | null;
}

/**
 * Return type ของ hook
 */
interface UsePlayerSearchReturn extends UsePlayerSearchState {
    // Actions
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;
    selectPlayer: (player: Player, onSelect?: (player: Player) => void) => void;
}

/**
 * Hook สำหรับ Player Search พร้อม debounce
 */
export function usePlayerSearch(): UsePlayerSearchReturn {
    // Search state
    const [searchQuery, setSearchQueryState] = useState('');
    const [searchResults, setSearchResults] = useState<Player[]>([]);

    // UI state
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ref สำหรับ debounce
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * ค้นหานักเตะ (ถูกเรียกหลัง debounce)
     */
    const doSearch = useCallback(async (query: string) => {
        if (query.length < SEARCH_LIMITS.MIN_NAME_LENGTH) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const results = await searchPlayers(query);
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch (err) {
            console.error('Search error:', err);
            setError('เกิดข้อผิดพลาดในการค้นหา');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    /**
     * ตั้งค่า search query พร้อม debounce
     */
    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Clear results if query is too short
        if (query.length < SEARCH_LIMITS.MIN_NAME_LENGTH) {
            setSearchResults([]);
            setShowResults(false);
            setIsSearching(false);
            return;
        }

        // Show loading immediately
        setIsSearching(true);

        // Debounce the actual search
        debounceRef.current = setTimeout(() => {
            doSearch(query);
        }, SEARCH_LIMITS.DEBOUNCE_DELAY);
    }, [doSearch]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        setSearchQueryState('');
        setSearchResults([]);
        setShowResults(false);
        setIsSearching(false);
        setError(null);
    }, []);

    /**
     * เลือกนักเตะ
     */
    const selectPlayer = useCallback((
        player: Player,
        onSelect?: (player: Player) => void
    ) => {
        setShowResults(false);
        if (onSelect) {
            onSelect(player);
        }
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        // State
        searchQuery,
        searchResults,
        isSearching,
        showResults,
        error,

        // Actions
        setSearchQuery,
        clearSearch,
        selectPlayer,
    };
}
