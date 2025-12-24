"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import type { Player, UpgradeStats } from "@/types";
import { UPGRADE_DATA, LEVEL_COLORS, BASE_CHANCE_MAP } from "@/data";
import {
    getUpgradeInfo,
    getTotalOvrBonus,
    getLevelAfterFailure,
    calculateSuccessRate,
    simulateUpgrade,
} from "@/services";

export default function UpgradeSimulator() {
    // State สำหรับค้นหานักเตะ
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Player[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // State สำหรับการตีบวก
    const [baseOvr, setBaseOvr] = useState<number>(100);
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [stats, setStats] = useState<UpgradeStats>({
        attempts: 0,
        successes: 0,
        failures: 0,
        highestLevel: 0,
    });

    // State สำหรับ animation
    const [upgradeResult, setUpgradeResult] = useState<"success" | "fail" | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);

    // State สำหรับ Image error
    const [imageError, setImageError] = useState(false);

    // State สำหรับ Boost Gauge (วัตถุดิบ)
    const [boostGauge, setBoostGauge] = useState<number>(5.0);

    // State สำหรับ OVR loading
    const [isLoadingOvr, setIsLoadingOvr] = useState(false);

    // State สำหรับระบบป้องกัน (Protection) - ไม่ลดระดับเมื่อล้มเหลว
    const [protectionEnabled, setProtectionEnabled] = useState(false);

    // State สำหรับ Popup แจ้งเตือน
    const [showWarningPopup, setShowWarningPopup] = useState(false);

    // State สำหรับ Popup ข้อจำกัดความรับผิดชอบ (Disclaimer) - ไม่แสดงอัตโนมัติ
    const [showDisclaimerPopup, setShowDisclaimerPopup] = useState(false);

    // State สำหรับ Keyboard navigation ในผลการค้นหา
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const highlightedItemRef = useRef<HTMLButtonElement>(null);

    // Auto-scroll เมื่อเลื่อน highlight ด้วย keyboard
    useEffect(() => {
        if (highlightedItemRef.current && resultsContainerRef.current) {
            highlightedItemRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [highlightedIndex]);

    // ค้นหานักเตะ
    const searchPlayers = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/players?name=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data.players) {
                setSearchResults(data.players);
            }
        } catch (error) {
            console.error("Error searching players:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // เลือกนักเตะ
    const selectPlayer = async (player: Player) => {
        setSelectedPlayer(player);
        setSearchQuery("");
        setSearchResults([]);
        setImageError(false);
        resetSimulation();

        // ดึง OVR จาก FIFAAddict API โดยใช้ player.id (FIFAAddict hash ID)
        const playerId = player.spid || player.id;
        if (playerId) {
            setIsLoadingOvr(true);
            try {
                const response = await fetch(`/api/player-ovr?spid=${playerId}`);
                const data = await response.json();
                if (data.ovr) {
                    setBaseOvr(data.ovr);
                }
            } catch (error) {
                console.error("Error fetching player OVR:", error);
                // ถ้าดึง OVR ไม่ได้ ใช้ค่า default 100
                setBaseOvr(100);
            } finally {
                setIsLoadingOvr(false);
            }
        }
    };

    // Reset การจำลอง
    const resetSimulation = () => {
        setCurrentLevel(1);
        setBoostGauge(5.0);
        setProtectionEnabled(false);
        setStats({
            attempts: 0,
            successes: 0,
            failures: 0,
            highestLevel: 0,
        });
        setUpgradeResult(null);
    };

    // ตีบวก!
    const handleUpgrade = async () => {
        // ตรวจสอบว่าเลือกนักเตะแล้วหรือยัง
        if (!selectedPlayer) {
            setShowWarningPopup(true);
            return;
        }

        if (currentLevel >= 13 || isUpgrading) return;

        setIsUpgrading(true);
        setUpgradeResult(null);

        // Delay เล็กน้อยเพื่อ animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        const result = simulateUpgrade(currentLevel, boostGauge);

        if (result.success) {
            // สำเร็จ - เพิ่มระดับ
            setCurrentLevel(result.newLevel);
            setUpgradeResult("success");
            setStats((prev) => ({
                ...prev,
                attempts: prev.attempts + 1,
                successes: prev.successes + 1,
                highestLevel: Math.max(prev.highestLevel, result.newLevel),
            }));
        } else {
            // ล้มเหลว
            if (protectionEnabled) {
                // เปิดระบบป้องกัน - ไม่ลดระดับ
                setUpgradeResult("fail");
                setStats((prev) => ({
                    ...prev,
                    attempts: prev.attempts + 1,
                    failures: prev.failures + 1,
                }));
            } else {
                // ไม่มีการป้องกัน - ลดระดับตามกฎ
                const failResult = getLevelAfterFailure(currentLevel);
                setCurrentLevel(failResult.newLevel);
                setUpgradeResult("fail");
                setStats((prev) => ({
                    ...prev,
                    attempts: prev.attempts + 1,
                    failures: prev.failures + 1,
                }));
            }
        }

        // Clear animation state หลังจาก animation จบ
        setTimeout(() => {
            setUpgradeResult(null);
            setIsUpgrading(false);
        }, 800);
    };


    // คำนวณ OVR ปัจจุบัน
    const currentOvr = baseOvr + getTotalOvrBonus(currentLevel);
    const upgradeInfo = getUpgradeInfo(currentLevel);
    const levelColor = LEVEL_COLORS[currentLevel] || "#808080";

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Card */}
            <div className="brutal-card p-4 md:p-6 mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="sticker-green sticker text-sm rotate-[-2deg]">⚡ ตีบวก</span>
                        <span className="sticker-pink sticker text-sm rotate-[2deg]">+13 MAX</span>
                    </div>
                    <button
                        onClick={() => setShowDisclaimerPopup(true)}
                        className="px-3 py-2 bg-[#FF6B6B] text-white font-bold text-xs uppercase border-3 border-black
                            shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1a1a1a]
                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all
                            flex items-center gap-1 cursor-pointer animate-pulse hover:animate-none"
                    >
                        ⚠️ ข้อจำกัด
                    </button>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Upgrade Simulator</h2>
                <p className="text-sm text-black/70">
                    จำลองการตีบวกนักเตะ FC Online - <span className="text-[#FF6B6B] font-bold">อัตราความสำเร็จเหมือนเกมจริง!</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* ===== LEFT PANEL - Main Display ===== */}
                <div className="brutal-card p-4 md:p-6">
                    {/* Player Card Display */}
                    <div className="mb-6">
                        {selectedPlayer ? (
                            <div className="flex justify-center">
                                <div
                                    className={`fc-card ${currentLevel >= 10 ? 'fc-card-glow-gold' : currentLevel >= 5 ? 'fc-card-glow-blue' : ''} ${upgradeResult === 'success' ? 'animate-card-success' : upgradeResult === 'fail' ? 'animate-card-fail' : ''}`}
                                >
                                    {/* Card Frame based on level */}
                                    <div className={`fc-card-frame ${currentLevel >= 10 ? 'fc-card-frame-gold' :
                                        currentLevel >= 5 ? 'fc-card-frame-blue' :
                                            currentLevel >= 3 ? 'fc-card-frame-purple' :
                                                'fc-card-frame-standard'
                                        }`}></div>

                                    {/* Shimmer Effect */}
                                    <div className="fc-card-shimmer"></div>

                                    {/* Holographic Effect */}
                                    <div className="fc-card-holo"></div>

                                    {/* Particles for high level */}
                                    {currentLevel >= 8 && (
                                        <div className="fc-card-particles">
                                            <div className="fc-card-particle"></div>
                                            <div className="fc-card-particle"></div>
                                            <div className="fc-card-particle"></div>
                                            <div className="fc-card-particle"></div>
                                        </div>
                                    )}

                                    {/* OVR Section */}
                                    <div className="fc-card-ovr">
                                        <div className="fc-card-ovr-number" style={{
                                            color: currentLevel >= 10 ? '#ffd700' : currentLevel >= 5 ? '#00bfff' : '#fff'
                                        }}>
                                            {currentOvr}
                                        </div>
                                        <div className="fc-card-position">{selectedPlayer.position}</div>
                                    </div>

                                    {/* Season Badge */}
                                    <div className="fc-card-season">
                                        <div className="fc-card-season-badge">
                                            {selectedPlayer.seasonImg ? (
                                                <Image
                                                    src={selectedPlayer.seasonImg}
                                                    alt={selectedPlayer.season}
                                                    width={40}
                                                    height={40}
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-white">{selectedPlayer.season}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Level Badge */}
                                    <div className="fc-card-level" style={{ backgroundColor: 'transparent', width: '42px', height: '18px', padding: 0 }}>
                                        <Image
                                            src={`/grade/${currentLevel}.png`}
                                            alt={`+${currentLevel}`}
                                            width={42}
                                            height={18}
                                            className="object-contain"
                                        />
                                    </div>

                                    {/* Player Image */}
                                    <div className="fc-card-image">
                                        {imageError ? (
                                            <div className="w-full h-full flex items-center justify-center text-6xl text-white/40">
                                                👤
                                            </div>
                                        ) : (
                                            <Image
                                                src={`/api/player-image?spid=${selectedPlayer.spid || selectedPlayer.id}&type=action`}
                                                alt={selectedPlayer.name}
                                                fill
                                                className="object-cover object-top"
                                                unoptimized
                                                onError={() => setImageError(true)}
                                            />
                                        )}
                                    </div>

                                    {/* Player Info Section */}
                                    <div className="fc-card-info">
                                        <div className="fc-card-name">{selectedPlayer.name}</div>
                                        <div className="fc-card-icons">
                                            {/* Team/Club icon placeholder */}
                                            <div className="fc-card-icon">
                                                <span className="text-xs">⚽</span>
                                            </div>
                                            {/* Position badge */}
                                            <div
                                                className="px-2 py-0.5 text-xs font-bold rounded"
                                                style={{ backgroundColor: levelColor, color: '#fff' }}
                                            >
                                                {selectedPlayer.position}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="fc-card fc-card-frame-standard flex items-center justify-center">
                                    <div className="text-center text-white/50">
                                        <div className="text-5xl mb-3">👤</div>
                                        <p className="text-sm">ค้นหาและเลือกนักเตะ</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Material Cards - แสดงการ์ดอะไหล่ตาม Boost Gauge */}
                        {selectedPlayer && boostGauge > 0 && (
                            <div className="mt-4">
                                <div className="text-center text-sm font-bold mb-2 text-black/60">
                                    🧪 วัตถุดิบ ({Math.ceil(boostGauge)} การ์ด)
                                </div>
                                <div className="flex justify-center gap-1 flex-wrap">
                                    {Array.from({ length: Math.ceil(boostGauge) }, (_, i) => {
                                        // คำนวณ animation delay เพื่อให้การ์ดทุกใบ sync กัน
                                        // ใช้ CSS ที่ sync กับเวลา global (ทุกการ์ดจะอยู่ phase เดียวกัน)
                                        const animationDuration = 4000; // 4s in ms
                                        const currentPhase = Date.now() % animationDuration;
                                        const syncDelay = -currentPhase; // Negative delay to sync all cards

                                        return (
                                            <div
                                                key={`material-${boostGauge}-${i}`}
                                                className="relative w-12 h-16 rounded border-2 border-black bg-gradient-to-b from-gray-600 to-gray-800 shadow-[2px_2px_0px_#1a1a1a] overflow-hidden animate-bounce-lr"
                                                style={{ animationDelay: `${syncDelay}ms` }}
                                            >
                                                {/* Mini card design */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-white/60 text-lg">⚽</span>
                                                </div>
                                                {/* Shimmer effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Level Display */}
                    <div
                        className="relative p-6 border-4 border-black mb-4 text-center transition-all duration-300"
                        style={{ backgroundColor: levelColor }}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border-3 border-black px-4 py-1">
                            <span className="font-bold text-sm">Grade</span>
                        </div>
                        <div className="text-white">
                            <div className="text-5xl md:text-6xl font-bold font-mono flex items-center justify-center gap-2">
                                +{currentLevel}
                                {currentLevel === 13 && <span className="text-3xl">⭐</span>}
                            </div>
                            <div className="text-lg mt-1 font-bold">
                                OVR: {currentOvr}
                                <span className="text-sm opacity-80 ml-2">({baseOvr} + {getTotalOvrBonus(currentLevel)})</span>
                            </div>
                        </div>
                        {currentLevel === 13 && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#FFDE00] border-3 border-black px-4 py-1">
                                <span className="font-bold text-sm">🏆 MAX!</span>
                            </div>
                        )}
                    </div>

                    {/* Upgrade Button - BIG */}
                    <button
                        onClick={handleUpgrade}
                        disabled={currentLevel >= 13 || isUpgrading}
                        className={`w-full py-5 text-2xl font-bold uppercase border-4 border-black transition-all mb-4 cursor-hide-on-hover
              ${currentLevel >= 13
                                ? "bg-gray-300 cursor-not-allowed"
                                : isUpgrading
                                    ? "bg-[#FFDE00] cursor-wait"
                                    : "bg-[#FF6B6B] shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#1a1a1a] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                            }`}
                    >
                        {currentLevel >= 13 ? (
                            "🏆 ระดับสูงสุดแล้ว!"
                        ) : isUpgrading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                                กำลังตีบวก...
                            </span>
                        ) : (
                            `⚡ ตีบวก +${currentLevel} → +${currentLevel + 1}`
                        )}
                    </button>

                    {/* Stats Panel */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white border-3 border-black p-3 text-center">
                            <div className="text-xs text-black/60 mb-1">ครั้งที่ตี</div>
                            <div className="text-xl font-bold">{stats.attempts}</div>
                        </div>
                        <div className="bg-[#7BF1A8] border-3 border-black p-3 text-center">
                            <div className="text-xs text-black/60 mb-1">สำเร็จ</div>
                            <div className="text-xl font-bold">{stats.successes}</div>
                        </div>
                        <div className="bg-[#FF6B6B] border-3 border-black p-3 text-center">
                            <div className="text-xs text-black/60 mb-1">ล้มเหลว</div>
                            <div className="text-xl font-bold text-white">{stats.failures}</div>
                        </div>
                        <div className="bg-[#FFDE00] border-3 border-black p-3 text-center">
                            <div className="text-xs text-black/60 mb-1">สูงสุด</div>
                            <div className="text-xl font-bold">+{stats.highestLevel}</div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={resetSimulation}
                        className="w-full mt-4 py-3 font-bold uppercase border-3 border-black bg-white
              shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1a1a1a]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        🔄 เริ่มใหม่
                    </button>
                </div>

                {/* ===== RIGHT PANEL - Settings ===== */}
                <div className="brutal-card p-4 md:p-6">
                    {/* Search Input */}
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <span>🔍</span> ค้นหานักเตะ
                    </h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchPlayers(e.target.value);
                                setHighlightedIndex(-1);
                            }}
                            onKeyDown={(e) => {
                                if (searchResults.length === 0) return;

                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setHighlightedIndex((prev) =>
                                        prev < searchResults.length - 1 ? prev + 1 : 0
                                    );
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setHighlightedIndex((prev) =>
                                        prev > 0 ? prev - 1 : searchResults.length - 1
                                    );
                                } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                    e.preventDefault();
                                    selectPlayer(searchResults[highlightedIndex]);
                                } else if (e.key === 'Escape') {
                                    setSearchResults([]);
                                    setHighlightedIndex(-1);
                                }
                            }}
                            placeholder="พิมพ์ชื่อนักเตะ..."
                            className="brutal-input w-full px-4 py-3 text-base"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {searchResults.length > 0 && (
                            <div
                                ref={resultsContainerRef}
                                className="absolute z-20 w-full mt-2 bg-white border-4 border-black shadow-[4px_4px_0px_#1a1a1a] max-h-60 overflow-y-auto"
                            >
                                {searchResults.map((player, index) => (
                                    <button
                                        key={player.id}
                                        ref={highlightedIndex === index ? highlightedItemRef : null}
                                        onClick={() => selectPlayer(player)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`w-full px-4 py-3 text-left border-b-2 border-black last:border-b-0 transition-colors flex items-center gap-3
                                            ${highlightedIndex === index ? 'bg-[#FFDE00]' : 'hover:bg-[#FFDE00]'}`}
                                    >
                                        <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center text-xs font-bold overflow-hidden">
                                            {player.seasonImg ? (
                                                <Image src={player.seasonImg} alt={player.season || 'Season'} width={40} height={40} className="object-contain" />
                                            ) : (
                                                <span>{player.season}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">{player.name}</div>
                                            <div className="text-sm text-black/60">{player.position} • {player.team}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Base OVR Display */}
                    {selectedPlayer && (
                        <div className="p-3 bg-[#F5F5DC] border-3 border-black flex items-center justify-between mb-4">
                            <span className="font-bold text-sm">🎯 Base OVR:</span>
                            {isLoadingOvr ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-black/60">กำลังโหลด...</span>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-[#3B82F6]">{baseOvr}</span>
                            )}
                        </div>
                    )}

                    {/* Level Selector - 6x2 Grid */}
                    <div className="mb-4">
                        <label className="block font-bold text-sm mb-2">📊 ระดับเริ่มต้น</label>
                        <div className="grid grid-cols-6 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        setCurrentLevel(level);
                                        setStats((prev) => ({ ...prev, highestLevel: Math.max(prev.highestLevel, level) }));
                                    }}
                                    className={`aspect-square border-3 border-black font-bold text-sm transition-all
                      ${currentLevel === level
                                            ? "shadow-none translate-x-[2px] translate-y-[2px]"
                                            : "shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_#1a1a1a]"
                                        }`}
                                    style={{
                                        backgroundColor: currentLevel === level ? LEVEL_COLORS[level] : "#fff",
                                        color: currentLevel === level ? "#fff" : "#000",
                                    }}
                                >
                                    +{level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Protection Toggle */}
                    {currentLevel < 13 && (
                        <div className="bg-[#E8F5E9] border-3 border-black p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🛡️</span>
                                    <div>
                                        <h4 className="font-bold text-sm">ระบบป้องกัน</h4>
                                        <p className="text-xs text-black/60">ไม่ลดระดับเมื่อตีบวกล้มเหลว</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setProtectionEnabled(!protectionEnabled)}
                                    className={`relative w-14 h-8 rounded-full border-3 border-black transition-all duration-300 ${protectionEnabled ? 'bg-[#22C55E]' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full border-2 border-black bg-white transition-all duration-300 ${protectionEnabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Boost Gauge Section - Card-based Material Selection */}
                    {
                        currentLevel < 13 && (
                            <div className="bg-[#F5F5DC] border-3 border-black p-4 mb-4">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <span>🃏</span> วัตถุดิบ (การ์ดนักเตะ)
                                </h4>

                                {/* Card Slots - Click to cycle: empty → full → half → empty */}
                                <div className="flex justify-center gap-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((cardNum) => {
                                        // Calculate the card's state (0, 0.5, or 1)
                                        const prevCards = cardNum - 1;
                                        const cardValue = Math.max(0, Math.min(1, boostGauge - prevCards));
                                        const isFull = cardValue >= 1;
                                        const isHalf = cardValue >= 0.5 && cardValue < 1;
                                        const isEmpty = cardValue < 0.5;

                                        const handleCardClick = () => {
                                            if (isEmpty) {
                                                setBoostGauge(cardNum);
                                            } else if (isFull) {
                                                setBoostGauge(cardNum - 0.5);
                                            } else {
                                                setBoostGauge(cardNum - 1);
                                            }
                                        };

                                        return (
                                            <button
                                                key={cardNum}
                                                onClick={handleCardClick}
                                                className={`relative w-14 h-20 rounded border-3 transition-all cursor-pointer
                                                    ${isFull
                                                        ? 'border-black bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] shadow-[3px_3px_0px_#1a1a1a] scale-105'
                                                        : isHalf
                                                            ? 'border-black bg-gradient-to-b from-gray-300 to-gray-400 shadow-[2px_2px_0px_#1a1a1a]'
                                                            : 'border-gray-400 bg-gradient-to-b from-gray-300 to-gray-400 shadow-[2px_2px_0px_#999] opacity-50 hover:opacity-75'
                                                    }`}
                                            >
                                                {/* Card content wrapper with overflow hidden */}
                                                <div className="absolute inset-0 overflow-hidden rounded">
                                                    {/* Half fill effect */}
                                                    {isHalf && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#3B82F6] to-[#60A5FA]"></div>
                                                    )}
                                                    {/* Shimmer effect for full cards */}
                                                    {isFull && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                                    )}
                                                </div>
                                                {/* Card Design */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    {isFull ? (
                                                        <>
                                                            <span className="text-2xl">⚽</span>
                                                            <span className="text-[10px] font-bold text-white mt-1">เต็ม</span>
                                                        </>
                                                    ) : isHalf ? (
                                                        <>
                                                            <span className="text-2xl">⚽</span>
                                                            <span className="text-[10px] font-bold text-black mt-1">ครึ่ง</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xl text-gray-500">?</span>
                                                            <span className="text-[10px] font-bold text-gray-500 mt-1">ว่าง</span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Card number badge - OUTSIDE overflow container */}
                                                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${isFull ? 'bg-[#22C55E] border-black text-white' : isHalf ? 'bg-[#F59E0B] border-black text-white' : 'bg-gray-200 border-gray-400 text-gray-500'}`}>
                                                    {cardNum}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Hint text */}
                                <p className="text-center text-xs text-black/50 mb-3">
                                    💡 คลิกซ้ำเพื่อเปลี่ยน: เต็ม → ครึ่ง → ว่าง
                                </p>

                                {/* Card Count Display */}
                                <div className="text-center mb-3">
                                    <span className="text-sm font-bold">
                                        ใส่การ์ด: <span className={`text-lg ${boostGauge >= 5 ? 'text-[#22C55E]' : boostGauge >= 3 ? 'text-[#F59E0B]' : 'text-[#FF6B6B]'}`}>
                                            {boostGauge % 1 === 0 ? boostGauge : boostGauge.toFixed(1)}
                                        </span> / 5 ใบ
                                    </span>
                                </div>

                                {/* Boost Gauge Visual Bar */}
                                <div className="relative h-8 bg-gray-200 border-3 border-black mb-3 overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300"
                                        style={{
                                            width: `${(boostGauge / 5.0) * 100}%`,
                                            backgroundColor: boostGauge >= 5 ? '#22C55E' : boostGauge >= 3 ? '#FFDE00' : '#FF6B6B'
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-black">
                                        {boostGauge % 1 === 0 ? boostGauge : boostGauge.toFixed(1)} / 5
                                    </div>
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex-1 border-r-2 border-black/30" />
                                        ))}
                                    </div>
                                </div>

                                {/* Success Rate Display */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white border-2 border-black">
                                        <div className="text-xs text-black/60">เต็ม 5 ใบ</div>
                                        <div className="text-xl font-bold text-[#808080]">
                                            {BASE_CHANCE_MAP[currentLevel] || 0}%
                                        </div>
                                    </div>
                                    <div className="text-center p-3 bg-[#22C55E] border-2 border-black">
                                        <div className="text-xs text-white/80">อัตราสำเร็จจริง</div>
                                        <div className="text-2xl font-bold text-white">
                                            {calculateSuccessRate(currentLevel, boostGauge)}%
                                        </div>
                                    </div>
                                </div>

                                {/* OVR Gain Info */}
                                {upgradeInfo && (
                                    <div className="mt-3 text-center text-sm text-black/60">
                                        +{currentLevel} → +{currentLevel + 1} จะได้ OVR เพิ่ม <span className="font-bold text-[#3B82F6]">+{upgradeInfo.ovrGain}</span>
                                    </div>
                                )}
                            </div>
                        )
                    }


                </div>
            </div>

            {/* Upgrade Rates Table */}
            <div className="brutal-card p-4 md:p-6 mt-4 md:mt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span>📊</span> ตารางอัตราความสำเร็จ
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#FFDE00] border-3 border-black">
                                <th className="px-3 py-2 text-left border-r-2 border-black">ระดับ</th>
                                <th className="px-3 py-2 text-center border-r-2 border-black">OVR+</th>
                                <th className="px-3 py-2 text-center border-r-2 border-black">รวม OVR</th>
                                <th className="px-3 py-2 text-center">อัตราสำเร็จ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {UPGRADE_DATA.map((data, index) => (
                                <tr
                                    key={data.from}
                                    className={`border-2 border-black ${index % 2 === 0 ? "bg-white" : "bg-[#F5F5DC]"}
                    ${currentLevel === data.from ? "ring-4 ring-[#FF6B6B] ring-inset" : ""}`}
                                >
                                    <td className="px-3 py-2 border-r-2 border-black font-bold">
                                        <span
                                            className="inline-block px-2 py-1 text-white text-sm"
                                            style={{ backgroundColor: LEVEL_COLORS[data.to] }}
                                        >
                                            +{data.from} → +{data.to}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-center border-r-2 border-black font-mono">
                                        +{data.ovrGain}
                                    </td>
                                    <td className="px-3 py-2 text-center border-r-2 border-black font-mono">
                                        +{data.totalOvr}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span
                                            className={`font-bold ${data.chance >= 50
                                                ? "text-[#22C55E]"
                                                : data.chance >= 10
                                                    ? "text-[#F59E0B]"
                                                    : "text-[#EF4444]"
                                                }`}
                                        >
                                            {data.chance}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* Warning Popup Modal */}
            {showWarningPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowWarningPopup(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-6 max-w-sm mx-4 animate-bounce-in">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold mb-2">กรุณาเลือกนักเตะ!</h3>
                            <p className="text-black/70 mb-6">
                                คุณต้องค้นหาและเลือกนักเตะก่อน<br />ถึงจะสามารถตีบวกได้
                            </p>
                            <button
                                onClick={() => setShowWarningPopup(false)}
                                className="w-full py-3 font-bold uppercase border-3 border-black bg-[#FFDE00]
                                    shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a]
                                    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                เข้าใจแล้ว! 👍
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disclaimer Popup Modal */}
            {showDisclaimerPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowDisclaimerPopup(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-6 max-w-lg mx-4 animate-bounce-in max-h-[85vh] overflow-y-auto">
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-3">⚠️</div>
                            <h3 className="text-xl font-bold">ข้อจำกัดของ Simulator นี้</h3>
                        </div>

                        {/* Warning Badge */}
                        <div className="bg-[#FF6B6B] text-white border-3 border-black p-3 mb-4">
                            <p className="text-sm font-bold text-center">
                                🚨 นี่คือ &quot;การจำลองโดยประมาณ&quot; ไม่ใช่ค่าจากเกมจริง 100%
                            </p>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 text-left">
                            {/* Point 1 */}
                            <div className="bg-[#F5F5DC] border-2 border-black p-3">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <span>❌</span> ไม่มีสูตรที่เปิดเผยอย่างเป็นทางการ
                                </h4>
                                <p className="text-xs text-black/70">
                                    Garena และ EA ไม่เคยเปิดเผยสูตรการคำนวณที่แท้จริงของระบบตีบวก ข้อมูลทั้งหมดมาจากการประมาณการของชุมชน
                                </p>
                            </div>

                            {/* Point 2 */}
                            <div className="bg-[#E8F5E9] border-2 border-black p-3">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <span>📊</span> อัตราสำเร็จเป็นค่าประมาณ
                                </h4>
                                <p className="text-xs text-black/70">
                                    ตัวเลขอัตราสำเร็จที่แสดงเป็นข้อมูลที่รวบรวมจากชุมชนผู้เล่น ไม่ใช่ค่าจริงจากเกม
                                </p>
                            </div>

                            {/* Point 3 */}
                            <div className="bg-[#E3F2FD] border-2 border-black p-3">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <span>🧪</span> Boost Gauge เป็นการ Simplify
                                </h4>
                                <p className="text-xs text-black/70">
                                    ในเกมจริงใช้ &quot;การ์ดนักเตะ&quot; เป็นวัตถุดิบ ซึ่งคุณภาพของการ์ดมีผลต่อโอกาสสำเร็จ ไม่ใช่ตัวเลข 0-5 แบบที่แสดงในนี้
                                </p>
                            </div>

                            {/* Point 4 */}
                            <div className="bg-[#FFF3E0] border-2 border-black p-3">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                    <span>🎲</span> ระบบลดระดับอาจต่างจากเกมจริง
                                </h4>
                                <p className="text-xs text-black/70">
                                    กฎการลดระดับเมื่อตีบวกล้มเหลวในเกมจริงอาจซับซ้อนกว่าที่จำลองในนี้
                                </p>
                            </div>
                        </div>

                        {/* Quote */}
                        <div className="mt-4 p-3 bg-gray-100 border-l-4 border-black">
                            <p className="text-xs italic text-black/60">
                                &quot;เปอร์เซ็นต์อย่างเป็นทางการนั้นถูกต้อง... แต่สุดท้ายแล้ว ดวง เป็นปัจจัยสำคัญ&quot;
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowDisclaimerPopup(false)}
                            className="w-full mt-4 py-3 font-bold uppercase border-3 border-black bg-[#FFDE00]
                                shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a]
                                active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            เข้าใจแล้ว! 👍
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
