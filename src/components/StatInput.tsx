"use client";

interface StatInputProps {
    stat: string;
    weight: number;
    value: number;
    isUpgraded: boolean;
    canUpgrade: boolean;
    onValueChange: (value: number) => void;
    onToggleUpgrade: () => void;
}

export default function StatInput({
    stat,
    weight,
    value,
    isUpgraded,
    canUpgrade,
    onValueChange,
    onToggleUpgrade,
}: StatInputProps) {
    const displayValue = isUpgraded ? value + 2 : value;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        if (rawValue === "") {
            onValueChange(0);
            return;
        }

        const cleanedValue = rawValue.replace(/^0+/, "").replace(/[^0-9]/g, "");
        const numValue = parseInt(cleanedValue) || 0;
        const clampedValue = Math.min(200, Math.max(0, numValue));

        onValueChange(clampedValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <div
            className={`
        stat-input-row flex items-center gap-2 md:gap-3 p-2.5 md:p-3
        border-3 border-black transition-all
        ${isUpgraded
                    ? "bg-[#7BF1A8] shadow-[3px_3px_0px_#1a1a1a]"
                    : "bg-[#FFFFF0] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1a1a1a]"
                }
      `}
        >
            {/* Stat Name and Weight */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-black font-bold text-xs md:text-sm truncate">
                        {stat}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-mono font-bold bg-[#FFDE00] text-black px-1.5 py-0.5 border-2 border-black">
                        {weight}%
                    </span>
                </div>
            </div>

            {/* Input Field */}
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value === 0 ? "" : value.toString()}
                    placeholder="0"
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    className={`
            w-14 md:w-16 px-2 py-2 text-center font-mono font-bold
            text-sm md:text-base border-3 border-black
            transition-all outline-none
            ${isUpgraded
                            ? "bg-white shadow-[2px_2px_0px_#1a1a1a]"
                            : "bg-white shadow-[2px_2px_0px_#1a1a1a] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0px_#1a1a1a]"
                        }
          `}
                />
                {isUpgraded && (
                    <span className="absolute -top-2 -right-2 text-[10px] bg-[#FF6B6B] text-black px-1.5 py-0.5 border-2 border-black font-bold">
                        +2
                    </span>
                )}
            </div>

            {/* Upgraded Value Display */}
            {isUpgraded && (
                <div className="text-black font-bold font-mono text-sm md:text-base min-w-8 md:min-w-10 text-center">
                    →{displayValue}
                </div>
            )}

            {/* +2 Toggle Button */}
            <button
                onClick={onToggleUpgrade}
                disabled={!canUpgrade && !isUpgraded}
                tabIndex={-1}
                className={`
          px-2.5 md:px-3 py-2 font-bold text-xs md:text-sm
          border-3 border-black transition-all min-w-[40px] md:min-w-[48px]
          ${isUpgraded
                        ? "bg-[#FF6B6B] shadow-[2px_2px_0px_#1a1a1a] text-black"
                        : canUpgrade
                            ? "bg-[#6EB5FF] shadow-[2px_2px_0px_#1a1a1a] text-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#1a1a1a]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-gray-300"
                    }
        `}
            >
                {isUpgraded ? "✓" : "+2"}
            </button>
        </div>
    );
}
