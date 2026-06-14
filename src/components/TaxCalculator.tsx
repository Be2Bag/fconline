"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
    TaxPlayerItem,
    TaxGlobalSettings,
    SVIPDiscountRate,
    CPDiscountRate,
} from "@/types/tax";
import {
    CP_DISCOUNT_OPTIONS,
    SVIP_DISCOUNT_OPTIONS,
    calculateNetPrice,
    calculateTotalSummary,
    createNewPlayerItem,
    formatNumber,
    formatShortNumber,
    parseBInput,
    formatBInput,
} from "@/services/taxService";

export const TAX_CALCULATOR_STORAGE_KEY = "fc_online_tax_calculator_state";

const TAX_CALCULATOR_STORAGE_VERSION = 1;

interface TaxCalculatorState {
    globalSettings: TaxGlobalSettings;
    players: TaxPlayerItem[];
}

interface CachedTaxCalculatorState extends TaxCalculatorState {
    version: typeof TAX_CALCULATOR_STORAGE_VERSION;
}

const cpDiscountValues = new Set<number>(
    CP_DISCOUNT_OPTIONS.map((option) => option.value)
);
const svipDiscountValues = new Set<number>(
    SVIP_DISCOUNT_OPTIONS.map((option) => option.value)
);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isValidGlobalSettings(value: unknown): value is TaxGlobalSettings {
    if (!isRecord(value)) return false;

    return (
        svipDiscountValues.has(value.svipDiscount as number) &&
        typeof value.pcEnabled === "boolean"
    );
}

function isValidPlayerItem(value: unknown): value is TaxPlayerItem {
    if (!isRecord(value)) return false;

    return (
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        typeof value.price === "number" &&
        Number.isFinite(value.price) &&
        value.price >= 0 &&
        cpDiscountValues.has(value.cpDiscount as number)
    );
}

function createDefaultTaxCalculatorState(): TaxCalculatorState {
    return {
        globalSettings: {
            svipDiscount: 0,
            pcEnabled: false,
        },
        players: [createNewPlayerItem()],
    };
}

function readCachedTaxCalculatorState(): TaxCalculatorState | null {
    if (typeof window === "undefined") return null;

    const cachedValue = window.localStorage.getItem(TAX_CALCULATOR_STORAGE_KEY);
    if (!cachedValue) return null;

    try {
        const parsed: unknown = JSON.parse(cachedValue);
        if (!isRecord(parsed)) return null;
        if (parsed.version !== TAX_CALCULATOR_STORAGE_VERSION) return null;

        const { globalSettings, players } = parsed;
        if (!isValidGlobalSettings(globalSettings)) return null;
        if (
            !Array.isArray(players) ||
            players.length === 0 ||
            !players.every(isValidPlayerItem)
        ) {
            return null;
        }

        return { globalSettings, players };
    } catch {
        return null;
    }
}

function getInitialTaxCalculatorState(): TaxCalculatorState {
    return readCachedTaxCalculatorState() ?? createDefaultTaxCalculatorState();
}

function writeCachedTaxCalculatorState(state: TaxCalculatorState): void {
    if (typeof window === "undefined") return;

    const cachedState: CachedTaxCalculatorState = {
        version: TAX_CALCULATOR_STORAGE_VERSION,
        ...state,
    };

    try {
        window.localStorage.setItem(
            TAX_CALCULATOR_STORAGE_KEY,
            JSON.stringify(cachedState)
        );
    } catch {
        // Ignore storage failures so calculation remains usable.
    }
}

export default function TaxCalculator() {
    const [initialTaxState] = useState<TaxCalculatorState>(
        getInitialTaxCalculatorState
    );

    // Global settings
    const [globalSettings, setGlobalSettings] = useState<TaxGlobalSettings>(
        initialTaxState.globalSettings
    );

    // Player items list
    const [players, setPlayers] = useState<TaxPlayerItem[]>(
        initialTaxState.players
    );

    useEffect(() => {
        writeCachedTaxCalculatorState({ globalSettings, players });
    }, [globalSettings, players]);

    // Add new player
    const addPlayer = useCallback(() => {
        setPlayers((prev) => [...prev, createNewPlayerItem()]);
    }, []);

    // Remove player
    const removePlayer = useCallback((id: string) => {
        setPlayers((prev) => {
            if (prev.length <= 1) return prev;
            return prev.filter((p) => p.id !== id);
        });
    }, []);

    // Update player field
    const updatePlayer = useCallback(
        (id: string, field: keyof TaxPlayerItem, value: string | number) => {
            setPlayers((prev) =>
                prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
            );
        },
        []
    );

    // Calculate results for each player
    const playerResults = useMemo(() => {
        return players.map((player) => ({
            player,
            result: calculateNetPrice(player, globalSettings),
        }));
    }, [players, globalSettings]);

    // Calculate total summary
    const totalSummary = useMemo(() => {
        return calculateTotalSummary(players, globalSettings);
    }, [players, globalSettings]);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Card */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">💰</span>
                    <h2 className="text-xl md:text-2xl font-bold uppercase">
                        Tax Calculator
                    </h2>
                    <span className="sticker-green sticker text-xs rotate-[3deg]">
                        ภาษี 40%
                    </span>
                </div>


                {/* Global Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* SVIP Discount */}
                    <div className="flex items-center gap-3">
                        <label className="font-bold text-sm uppercase min-w-[80px]">
                            SVIP:
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {SVIP_DISCOUNT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() =>
                                        setGlobalSettings((prev) => ({
                                            ...prev,
                                            svipDiscount: option.value as SVIPDiscountRate,
                                        }))
                                    }
                                    className={`px-3 py-2 font-bold text-xs uppercase border-3 border-black transition-all
                                        ${globalSettings.svipDiscount === option.value
                                            ? "bg-[#FFD700] shadow-[2px_2px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                                            : "bg-white shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PC Discount */}
                    <div className="flex items-center gap-3">
                        <label className="font-bold text-sm uppercase min-w-[80px]">
                            PC 10%:
                        </label>
                        <button
                            onClick={() =>
                                setGlobalSettings((prev) => ({
                                    ...prev,
                                    pcEnabled: !prev.pcEnabled,
                                }))
                            }
                            className={`px-4 py-2 font-bold text-sm uppercase border-3 border-black transition-all
                                ${globalSettings.pcEnabled
                                    ? "bg-[#7BF1A8] shadow-[2px_2px_0px_#1a1a1a] translate-x-[-1px] translate-y-[-1px]"
                                    : "bg-white shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
                                }`}
                        >
                            {globalSettings.pcEnabled ? "✓ เปิดใช้" : "ปิด"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Player List */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold uppercase flex items-center gap-2">
                        <span>📋</span> รายการนักเตะ
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPlayers([createNewPlayerItem()])}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 font-bold text-xs sm:text-sm uppercase
                                border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
                                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
                                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                transition-all"
                        >
                            🗑️ เคลียร์
                        </button>
                        <button
                            onClick={addPlayer}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-[#7BF1A8] font-bold text-xs sm:text-sm uppercase
                                border-3 border-black shadow-[3px_3px_0px_#1a1a1a]
                                hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]
                                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                                transition-all"
                        >
                            + เพิ่มนักเตะ
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-[36px_minmax(60px,1fr)_minmax(80px,1.2fr)_minmax(70px,1fr)_minmax(80px,1.1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(80px,1fr)_minmax(80px,1.2fr)_36px] gap-2 bg-black text-white p-3 font-bold text-[11px] uppercase mb-2 items-center">
                    <div className="text-center">#</div>
                    <div className="text-center">ชื่อ</div>
                    <div className="text-center">ราคาขาย</div>
                    <div className="text-center">คูปอง</div>
                    <div className="text-center text-red-400">ภาษีตลาด</div>
                    <div className="text-center text-cyan-400">PC</div>
                    <div className="text-center text-purple-400">VIP</div>
                    <div className="text-center text-green-400">คูปอง</div>
                    <div className="text-center text-yellow-400">ราคาสุทธิ</div>
                    <div className="text-center">ลบ</div>
                </div>

                {/* Player Rows */}
                <div className="space-y-3">
                    {playerResults.map(({ player, result }, index) => (
                        <div
                            key={player.id}
                            className="border-3 border-black bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                        >
                            {/* Mobile Layout */}
                            <div className="md:hidden">
                                {/* Header Row: Index + Name + Delete */}
                                <div className="flex items-center gap-2 p-3 bg-gray-100 border-b-2 border-black">
                                    <span className="font-black text-base bg-[#FFDE00] border-2 border-black w-7 h-7 flex items-center justify-center shrink-0">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={player.name}
                                        onChange={(e) =>
                                            updatePlayer(player.id, "name", e.target.value)
                                        }
                                        placeholder={`Player${index + 1}`}
                                        className="flex-1 min-w-0 px-2 py-1.5 border-2 border-black font-bold text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#FFDE00]"
                                    />
                                    <button
                                        onClick={() => removePlayer(player.id)}
                                        disabled={players.length <= 1}
                                        className={`px-2 py-1.5 font-bold text-xs border-2 border-black transition-all shrink-0
                                            ${players.length <= 1
                                                ? "bg-gray-300 cursor-not-allowed opacity-50"
                                                : "bg-[#FF6B6B] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                            }`}
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Input Row: Price + Coupon */}
                                <div className="grid grid-cols-2 gap-3 p-3 border-b-2 border-black">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-600 mb-1 block">
                                            💵 ราคาขาย
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formatBInput(player.price)}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                                    updatePlayer(
                                                        player.id,
                                                        "price",
                                                        parseBInput(value)
                                                    );
                                                }}
                                                placeholder="0"
                                                className="w-full px-3 py-2.5 pr-6 border-2 border-black font-bold text-center text-base
                                                    focus:outline-none focus:ring-2 focus:ring-[#FFDE00]
                                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">B</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-600 mb-1 block">
                                            🎟️ คูปอง
                                        </label>
                                        <select
                                            value={player.cpDiscount}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "cpDiscount",
                                                    parseFloat(e.target.value) as CPDiscountRate
                                                )
                                            }
                                            className="w-full px-2 py-2.5 border-2 border-black font-bold bg-white text-base text-center
                                                focus:outline-none focus:ring-2 focus:ring-[#FFDE00] cursor-pointer"
                                        >
                                            {CP_DISCOUNT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Breakdown Grid: 2x2 */}
                                <div className="grid grid-cols-4 gap-1 p-2 bg-gray-200 border-b-2 border-black">
                                    <div className="bg-red-100 p-2 text-center border border-red-300">
                                        <div className="text-[10px] font-bold text-red-700 uppercase">ภาษี</div>
                                        <div className="font-bold text-red-600 text-sm">-{formatShortNumber(result.grossTax)}</div>
                                    </div>
                                    <div className="bg-cyan-100 p-2 text-center border border-cyan-300">
                                        <div className="text-[10px] font-bold text-cyan-700 uppercase">PC</div>
                                        <div className="font-bold text-cyan-600 text-sm">+{formatShortNumber(result.discountBreakdown.pc)}</div>
                                    </div>
                                    <div className="bg-purple-100 p-2 text-center border border-purple-300">
                                        <div className="text-[10px] font-bold text-purple-700 uppercase">SVIP</div>
                                        <div className="font-bold text-purple-600 text-sm">+{formatShortNumber(result.discountBreakdown.svip)}</div>
                                    </div>
                                    <div className="bg-green-100 p-2 text-center border border-green-300">
                                        <div className="text-[10px] font-bold text-green-700 uppercase">คูปอง</div>
                                        <div className="font-bold text-green-600 text-sm">+{formatShortNumber(result.discountBreakdown.cp)}</div>
                                    </div>
                                </div>

                                {/* Net Price - Prominent */}
                                <div className="bg-[#FFDE00] p-3 flex items-center justify-between">
                                    <span className="font-bold text-sm uppercase">💰 ราคาสุทธิ</span>
                                    <span className="font-black text-xl text-[#1a1a1a]">
                                        {formatShortNumber(result.netPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Layout (unchanged) */}
                            <div className="hidden md:grid md:grid-cols-[36px_minmax(60px,1fr)_minmax(80px,1.2fr)_minmax(70px,1fr)_minmax(80px,1.1fr)_minmax(75px,1fr)_minmax(75px,1fr)_minmax(80px,1fr)_minmax(80px,1.2fr)_36px] gap-2 items-center p-3">
                                {/* Index */}
                                <div className="text-center font-bold text-sm">
                                    {index + 1}
                                </div>

                                {/* Name Input */}
                                <div>
                                    <input
                                        type="text"
                                        value={player.name}
                                        onChange={(e) =>
                                            updatePlayer(player.id, "name", e.target.value)
                                        }
                                        placeholder={`Player${index + 1}`}
                                        className="w-full px-2 py-1.5 border-2 border-black font-bold text-xs text-center
                                            focus:outline-none focus:ring-2 focus:ring-[#FFDE00]"
                                    />
                                </div>

                                {/* Price Input with B suffix */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formatBInput(player.price)}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.]/g, '');
                                            updatePlayer(
                                                player.id,
                                                "price",
                                                parseBInput(value)
                                            );
                                        }}
                                        placeholder="0"
                                        className="w-full px-2 py-1.5 pr-5 border-2 border-black font-bold text-center text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#FFDE00]
                                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">B</span>
                                </div>

                                {/* CP Discount Dropdown */}
                                <select
                                    value={player.cpDiscount}
                                    onChange={(e) =>
                                        updatePlayer(
                                            player.id,
                                            "cpDiscount",
                                            parseFloat(e.target.value) as CPDiscountRate
                                        )
                                    }
                                    className="w-full px-1 py-1.5 border-2 border-black font-bold bg-white text-xs text-center
                                        focus:outline-none focus:ring-2 focus:ring-[#FFDE00] cursor-pointer"
                                >
                                    {CP_DISCOUNT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Tax */}
                                <span className="font-bold text-red-600 text-xs truncate block text-center" title={`-${formatShortNumber(result.grossTax)}`}>
                                    -{formatShortNumber(result.grossTax)}
                                </span>

                                {/* PC */}
                                <span className="font-bold text-cyan-600 text-xs truncate block text-center" title={`+${formatShortNumber(result.discountBreakdown.pc)}`}>
                                    +{formatShortNumber(result.discountBreakdown.pc)}
                                </span>

                                {/* VIP */}
                                <span className="font-bold text-purple-600 text-xs truncate block text-center" title={`+${formatShortNumber(result.discountBreakdown.svip)}`}>
                                    +{formatShortNumber(result.discountBreakdown.svip)}
                                </span>

                                {/* Coupon */}
                                <span className="font-bold text-green-600 text-xs truncate block text-center" title={`+${formatShortNumber(result.discountBreakdown.cp)}`}>
                                    +{formatShortNumber(result.discountBreakdown.cp)}
                                </span>

                                {/* Net Price */}
                                <span className="font-bold text-base text-[#D4A017] truncate block text-center" title={formatShortNumber(result.netPrice)}>
                                    {formatShortNumber(result.netPrice)}
                                </span>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removePlayer(player.id)}
                                    disabled={players.length <= 1}
                                    className={`px-2 py-1 font-bold text-xs uppercase border-2 border-black transition-all
                                        ${players.length <= 1
                                            ? "bg-gray-300 cursor-not-allowed opacity-50"
                                            : "bg-[#FF6B6B] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#1a1a1a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                        }`}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Card - Neo-Brutalism Style */}
            <div className="relative">
                {/* Main Container */}
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#FFD700] border-4 border-black shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center text-2xl rotate-[-3deg]">
                                📊
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">สรุปยอดรวม</h3>
                                <div className="text-xs font-bold text-gray-500">{totalSummary.itemCount} รายการ</div>
                            </div>
                        </div>
                        <div className="sticker sticker-blue text-xs rotate-[5deg]">
                            SUMMARY
                        </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {/* ราคาขายรวม */}
                        <div className="bg-gray-100 border-3 border-black p-4 shadow-[4px_4px_0px_#1a1a1a]">
                            <div className="text-xs font-bold uppercase text-gray-500 mb-1">💵 ราคาขายรวม</div>
                            <div className="text-2xl font-black">{formatShortNumber(totalSummary.totalPrice)}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{formatNumber(totalSummary.totalPrice)}</div>
                        </div>

                        {/* ภาษีตลาด */}
                        <div className="bg-[#FF6B6B] border-3 border-black p-4 shadow-[4px_4px_0px_#1a1a1a]">
                            <div className="text-xs font-bold uppercase text-red-900 mb-1">📉 หักภาษีตลาด 40%</div>
                            <div className="text-2xl font-black text-red-900">-{formatShortNumber(totalSummary.totalGrossTax)}</div>
                            <div className="text-[10px] text-red-800 font-mono">-{formatNumber(totalSummary.totalGrossTax)}</div>
                        </div>
                    </div>

                    {/* Discounts Section */}
                    {(totalSummary.discountBreakdown.pc > 0 || totalSummary.discountBreakdown.svip > 0 || totalSummary.discountBreakdown.cp > 0) && (
                        <div className="bg-[#E8F5E9] border-3 border-black p-4 mb-4 shadow-[4px_4px_0px_#1a1a1a]">
                            <div className="text-xs font-bold uppercase text-green-800 mb-3 flex items-center gap-2">
                                🎁 ส่วนลดที่ได้รับคืน
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {/* PC Discount */}
                                <div className={`text-center p-2 border-2 border-black ${totalSummary.discountBreakdown.pc > 0 ? 'bg-cyan-300' : 'bg-gray-200 opacity-50'}`}>
                                    <div className="text-[10px] font-bold uppercase">PC</div>
                                    <div className="text-sm font-black text-cyan-800">
                                        +{formatShortNumber(totalSummary.discountBreakdown.pc)}
                                    </div>
                                </div>

                                {/* SVIP Discount */}
                                <div className={`text-center p-2 border-2 border-black ${totalSummary.discountBreakdown.svip > 0 ? 'bg-purple-300' : 'bg-gray-200 opacity-50'}`}>
                                    <div className="text-[10px] font-bold uppercase">VIP</div>
                                    <div className="text-sm font-black text-purple-800">
                                        +{formatShortNumber(totalSummary.discountBreakdown.svip)}
                                    </div>
                                </div>

                                {/* CP Discount */}
                                <div className={`text-center p-2 border-2 border-black ${totalSummary.discountBreakdown.cp > 0 ? 'bg-green-300' : 'bg-gray-200 opacity-50'}`}>
                                    <div className="text-[10px] font-bold uppercase">คูปอง</div>
                                    <div className="text-sm font-black text-green-800">
                                        +{formatShortNumber(totalSummary.discountBreakdown.cp)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Net Price - Hero Section */}
                    <div className="relative">
                        <div className="bg-[#FFD700] border-4 border-black p-5 shadow-[6px_6px_0px_#1a1a1a] transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#1a1a1a] transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-black uppercase text-yellow-900 flex items-center gap-2">
                                        💰 เงินที่ได้รับสุทธิ
                                    </div>
                                    <div className="text-[10px] text-yellow-800 mt-1">
                                        SVIP: {globalSettings.svipDiscount * 100}% | PC: {globalSettings.pcEnabled ? "✓ 10%" : "✗"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl md:text-4xl font-black text-black tracking-tight">
                                        {formatShortNumber(totalSummary.totalNetPrice)}
                                    </div>
                                    <div className="text-xs text-yellow-800 font-mono">
                                        {formatNumber(totalSummary.totalNetPrice)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative corner */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rotate-12"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
