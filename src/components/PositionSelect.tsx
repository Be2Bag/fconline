"use client";

import { ovrWeights, positionList } from "@/data/ovrWeights";

interface PositionSelectProps {
    selectedPosition: string;
    onPositionChange: (position: string) => void;
}

export default function PositionSelect({
    selectedPosition,
    onPositionChange,
}: PositionSelectProps) {
    // Group positions by type
    const positionGroups = {
        attackers: ["ST", "CF", "LW/RW"],
        midfielders: ["LM/RM", "CAM", "CM", "CDM"],
        defenders: ["CB", "LB/RB", "LWB/RWB"],
        goalkeeper: ["GK"],
    };

    const groupLabels: Record<string, string> = {
        attackers: "⚔️ กองหน้า",
        midfielders: "🎯 กองกลาง",
        defenders: "🛡️ กองหลัง",
        goalkeeper: "🧤 ผู้รักษาประตู",
    };

    const groupColors: Record<string, string> = {
        attackers: "#FF6B6B",
        midfielders: "#FFDE00",
        defenders: "#6EB5FF",
        goalkeeper: "#7BF1A8",
    };

    return (
        <div className="position-select">
            <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                เลือกตำแหน่ง
            </label>

            <div className="space-y-4">
                {Object.entries(positionGroups).map(([group, positions]) => (
                    <div key={group}>
                        <div className="text-xs font-bold uppercase tracking-wide text-black/60 mb-2">
                            {groupLabels[group]}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {positions
                                .filter((pos) => positionList.includes(pos))
                                .map((position) => {
                                    const isSelected = selectedPosition === position;
                                    return (
                                        <button
                                            key={position}
                                            onClick={() => onPositionChange(position)}
                                            style={{
                                                backgroundColor: isSelected ? groupColors[group] : '#FFFFF0',
                                            }}
                                            className={`
                        position-chip px-3 md:px-4 py-2 font-bold text-xs md:text-sm
                        border-3 border-black transition-all min-w-[70px]
                        ${isSelected
                                                    ? "shadow-[3px_3px_0px_#1a1a1a] translate-x-0 translate-y-0"
                                                    : "shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a1a1a]"
                                                }
                      `}
                                        >
                                            <span className="block font-bold text-black">{position}</span>
                                            <span className="block text-[9px] md:text-[10px] text-black/70">
                                                {ovrWeights[position]?.thaiName}
                                            </span>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
