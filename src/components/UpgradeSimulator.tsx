"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
    UPGRADE_DATA,
    LEVEL_COLORS,
    getUpgradeInfo,
    getTotalOvrBonus,
    getLevelAfterFailure,
    calculateSuccessRate,
    simulateUpgradeWithBoost,
    BASE_CHANCE_MAP,
} from "@/data/upgradeChances";

// ข้อมูลนักเตะที่ค้นหาได้
interface Player {
    name: string;
    id: string;
    spid?: string; // Player unique ID สำหรับดึงรูป
    position: string;
    team: string;
    season: string;
    seasonImg?: string;
    ovr?: number; // OVR เริ่มต้นของนักเตะ
}

// สถิติการตีบวก
interface UpgradeStats {
    attempts: number;
    successes: number;
    failures: number;
    highestLevel: number;
}

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

        const success = simulateUpgradeWithBoost(currentLevel, boostGauge);

        if (success) {
            // สำเร็จ - เพิ่มระดับ
            const newLevel = currentLevel + 1;
            setCurrentLevel(newLevel);
            setUpgradeResult("success");
            setStats((prev) => ({
                ...prev,
                attempts: prev.attempts + 1,
                successes: prev.successes + 1,
                highestLevel: Math.max(prev.highestLevel, newLevel),
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
                const newLevel = getLevelAfterFailure(currentLevel);
                setCurrentLevel(newLevel);
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
                <div className="flex items-center gap-3 mb-4">
                    <span className="sticker-green sticker text-sm rotate-[-2deg]">⚡ ตีบวก</span>
                    <span className="sticker-pink sticker text-sm rotate-[2deg]">+13 MAX</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Upgrade Simulator</h2>
                <p className="text-sm text-black/70">
                    จำลองการตีบวกนักเตะ FC Online - อัตราความสำเร็จเหมือนเกมจริง!
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
                                    🧪 วัตถุดิบ ({Math.floor(boostGauge)} การ์ด)
                                </div>
                                <div className="flex justify-center gap-1 flex-wrap">
                                    {Array.from({ length: Math.floor(boostGauge) }, (_, i) => {
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
                            <div className="absolute z-20 w-full mt-2 bg-white border-4 border-black shadow-[4px_4px_0px_#1a1a1a] max-h-60 overflow-y-auto">
                                {searchResults.map((player) => (
                                    <button
                                        key={player.id}
                                        onClick={() => selectPlayer(player)}
                                        className="w-full px-4 py-3 text-left hover:bg-[#FFDE00] border-b-2 border-black last:border-b-0 transition-colors flex items-center gap-3"
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

                    {/* Boost Gauge Section */}
                    {
                        currentLevel < 13 && (
                            <div className="bg-[#F5F5DC] border-3 border-black p-4 mb-4">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <span>🧪</span> วัตถุดิบ (Boost Gauge)
                                </h4>

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
                                        {boostGauge.toFixed(1)} / 5.0
                                    </div>
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex-1 border-r-2 border-black/30" />
                                        ))}
                                    </div>
                                </div>

                                {/* Slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={boostGauge}
                                    onChange={(e) => setBoostGauge(parseFloat(e.target.value))}
                                    className="w-full h-3 appearance-none bg-gray-300 border-2 border-black cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #22C55E ${(boostGauge / 5) * 100}%, #ddd ${(boostGauge / 5) * 100}%)`
                                    }}
                                />

                                {/* Preset Buttons */}
                                <div className="flex gap-2 mt-3">
                                    {[1.0, 2.0, 3.0, 4.0, 5.0].map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => setBoostGauge(preset)}
                                            className={`flex-1 py-2 border-2 border-black font-bold text-sm transition-all
                                            ${boostGauge === preset
                                                    ? 'bg-[#22C55E] text-white shadow-none'
                                                    : 'bg-white shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[3px_3px_0px_#1a1a1a]'
                                                }`}
                                        >
                                            {preset.toFixed(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Success Rate Display */}
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white border-2 border-black">
                                        <div className="text-xs text-black/60">เต็มหลอด</div>
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
        </div >
    );
}
