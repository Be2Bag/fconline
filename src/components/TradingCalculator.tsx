"use client";

import { useEffect, useState } from "react";
import { TAX_CONFIG } from "@/config/tax.config";
import { formatBPAmount, formatBPInput, parseBPInput } from "@/services/taxService";
import { analyzeTrade } from "@/services/tradingService";
import type { CPDiscountRate, SVIPDiscountRate, TaxPriceUnit } from "@/types/tax";

export const TRADING_CALCULATOR_STORAGE_KEY = "fc_online_trading_calculator_state";

interface TradingFormState {
    purchaseInput: string;
    saleInput: string;
    purchaseUnit: TaxPriceUnit;
    saleUnit: TaxPriceUnit;
    svipDiscount: SVIPDiscountRate;
    cpDiscount: CPDiscountRate;
}

const defaultState: TradingFormState = {
    purchaseInput: "", saleInput: "", purchaseUnit: "B", saleUnit: "B", svipDiscount: 0, cpDiscount: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

type Player = TradingFormState & { id: number; name: string };
const blankPlayer = (id: number): Player => ({ ...defaultState, id, name: "" });

function parseForm(value: unknown): TradingFormState | null {
    if (!isRecord(value)) return null;
        const { purchaseInput, saleInput, purchaseUnit, saleUnit } = value;
        const svip = TAX_CONFIG.SVIP_DISCOUNT_OPTIONS.find(option => option.value === value.svipDiscount);
        const cp = TAX_CONFIG.CP_DISCOUNT_OPTIONS.find(option => option.value === value.cpDiscount);
        if (typeof purchaseInput !== "string" || typeof saleInput !== "string" ||
            (purchaseUnit !== "M" && purchaseUnit !== "B") || (saleUnit !== "M" && saleUnit !== "B") ||
            !svip || !cp || parseBPInput(purchaseInput, purchaseUnit) === null || parseBPInput(saleInput, saleUnit) === null) {
            return null;
        }
        return { purchaseInput, saleInput, purchaseUnit, saleUnit, svipDiscount: svip.value, cpDiscount: cp.value };
}

function readState() {
    const initial = { players: [blankPlayer(1)], active: 1 };
    try {
        const value: unknown = JSON.parse(localStorage.getItem(TRADING_CALCULATOR_STORAGE_KEY) ?? "null");
        if (!isRecord(value)) return initial;
        if (value.version === 1) {
            const form = parseForm(value);
            return form ? { ...initial, players: [{ ...blankPlayer(1), ...form }] } : initial;
        }
        if (value.version !== 2 || !Array.isArray(value.players)) return initial;
        const players: Player[] = [];
        for (const row of value.players) {
            const form = parseForm(row);
            if (form && isRecord(row) && typeof row.id === "number" && Number.isSafeInteger(row.id) &&
                row.id > 0 && typeof row.name === "string" && !players.some(p => p.id === row.id)) {
                players.push({ ...form, id: row.id, name: row.name });
            }
        }
        return players.length ? { players, active: players.find(p => p.id === value.active)?.id ?? players[0].id } : initial;
    } catch { return initial; }
}

interface MoneyInputProps {
    id: string;
    label: string;
    value: string;
    unit: TaxPriceUnit;
    placeholder: string;
    onChange: (value: string) => void;
    onUnitChange: (value: string) => void;
}

function MoneyInput({ id, label, value, unit, placeholder, onChange, onUnitChange }: MoneyInputProps) {
    return (
        <div className="min-w-0">
            <label htmlFor={id} className="block font-bold text-xs mb-1 lg:sr-only">{label}</label>
            <div className="flex gap-1">
                <input id={id} type="text" inputMode="decimal" value={value} placeholder={placeholder}
                    onChange={event => onChange(event.target.value)}
                    className="min-w-0 flex-1 border-2 border-black px-1 py-2 text-center font-bold text-sm bg-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFDE00]" />
                <select aria-label={`หน่วย${label}`} value={unit} onChange={event => onUnitChange(event.target.value)}
                    className="w-12 shrink-0 border-2 border-black bg-white text-black font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#FFDE00]">
                    <option value="M">M</option><option value="B">B</option>
                </select>
            </div>
        </div>
    );
}

function signedAmount(value: number): string {
    return `${value > 0 ? "+" : ""}${formatBPAmount(value)}`;
}

const columns = "lg:grid-cols-[32px_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,1fr)_32px]";

const validationMessages = {
    "purchase-price": "กรอกราคาซื้อมากกว่า 0 เพื่อเริ่มคำนวณ",
    "sale-price": "ราคาขายต้องมากกว่า 0 หรือเว้นว่างเพื่อดูราคาขายขั้นต่ำที่ไม่ขาดทุนอย่างเดียว",
    "range": "ราคาอยู่นอกช่วงที่คำนวณได้อย่างแม่นยำ กรุณาตรวจตัวเลขและหน่วย M/B",
};

export default function TradingCalculator() {
    const [list, setList] = useState(readState);
    function addPlayer() {
        setList(previous => {
            const id = Math.max(...previous.players.map(p => p.id)) + 1;
            return { players: [...previous.players, { ...blankPlayer(id), svipDiscount: previous.players.find(p => p.id === previous.active)!.svipDiscount }], active: id };
        });
    }
    function removePlayer(id: number) {
        setList(previous => {
            const players = previous.players.filter(p => p.id !== id);
            return players.length ? { players, active: previous.active === id ? players[0].id : previous.active } : previous;
        });
    }
    useEffect(() => {
        try {
            window.localStorage.setItem(TRADING_CALCULATOR_STORAGE_KEY, JSON.stringify({ version: 2, ...list }));
        } catch {
            // คำนวณต่อได้แม้เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล
        }
    }, [list]);

    function editPlayer(id: number, patch: Partial<Player>) {
        setList(previous => ({ active: id, players: previous.players.map(p => p.id === id ? { ...p, ...patch } : p) }));
    }
    function priceField(player: Player, field: "purchase" | "sale") {
        const inputKey = field === "purchase" ? "purchaseInput" : "saleInput";
        const unitKey = field === "purchase" ? "purchaseUnit" : "saleUnit";
        const unit = player[unitKey];
        return <MoneyInput id={fieldId(player, field)} label={field === "purchase" ? "ราคาซื้อ" : "ราคาขายที่คาดไว้"}
            value={player[inputKey]} unit={unit} placeholder="0"
            onChange={value => { if (parseBPInput(value, unit) !== null) editPlayer(player.id, { [inputKey]: value }); }}
            onUnitChange={next => {
                if (next !== "B" && next !== "M") return;
                editPlayer(player.id, { [unitKey]: next, [inputKey]: formatBPInput(parseBPInput(player[inputKey], unit) ?? 0, next) });
            }} />;
    }
    function fieldId(player: Player, field: string) {
        return player.id === list.active ? `trade-${field}` : `trade-${field}-${player.id}`;
    }
    const rows = list.players.map(player => {
        const cost = parseBPInput(player.purchaseInput, player.purchaseUnit) ?? 0;
        const expected = player.saleInput.trim() ? parseBPInput(player.saleInput, player.saleUnit) : null;
        const result = analyzeTrade({ purchasePrice: cost, salePrice: expected, svipDiscount: player.svipDiscount, cpDiscount: player.cpDiscount });
        return { player, cost, result, sale: result.status === "ready" ? result.sale : null };
    });
    const totals = rows.reduce((sum, row) => row.sale ? {
        count: sum.count + 1, cost: sum.cost + row.cost, fee: sum.fee + row.sale.effectiveTax, profit: sum.profit + row.sale.profit
    } : sum, { count: 0, cost: 0, fee: 0, profit: 0 });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <section className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6">
                <div className="flex items-center flex-wrap gap-3 mb-4">
                    <span className="text-3xl">📈</span><h2 className="text-xl md:text-2xl font-bold uppercase">Trading Calculator</h2>
                    <span className="sticker-green sticker text-xs">ภาษี 40%</span>
                </div>
                <p className="text-sm mb-1">เลือกราคาซื้อและราคาขายเป็น M หรือ B เพื่อคำนวณกำไรหลังภาษี</p>
                <p className="text-xs mb-4">1B = 1,000M · เว้นราคาขายว่างได้เพื่อดูราคาขายขั้นต่ำที่ไม่ขาดทุน</p>
                <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-sm mr-3">SVIP ทุกคน</span>
                    {TAX_CONFIG.SVIP_DISCOUNT_OPTIONS.map(option => {
                        const selected = list.players.every(p => p.svipDiscount === option.value);
                        return <button key={option.value} aria-pressed={selected}
                            onClick={() => setList(previous => ({ ...previous, players: previous.players.map(p => ({ ...p, svipDiscount: option.value })) }))}
                            className={`border-2 border-black px-3 py-2 font-bold text-xs shadow-[3px_3px_0px_#1a1a1a] ${selected ? "bg-[#FFD700]" : "bg-white"}`}>{option.label}</button>;
                    })}
                </div>
            </section>
            <section className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <h3 className="font-black">📋 รายการนักเตะ</h3>
                    <div className="flex gap-2 text-xs font-bold">
                        <button onClick={() => setList({ players: [blankPlayer(1)], active: 1 })} className="border-2 border-black bg-gray-200 px-3 py-2 shadow-[3px_3px_0px_#1a1a1a]">ล้างค่า</button>
                        <button onClick={addPlayer} className="border-2 border-black bg-[#7BF1A8] px-3 py-2 shadow-[3px_3px_0px_#1a1a1a]">+ เพิ่มนักเตะ</button>
                    </div>
                </div>
                <p className="text-xs text-black/80 mb-3">ราคาขายขั้นต่ำที่ไม่ขาดทุน คำนวณหลังหักภาษีตาม SVIP และคูปองที่เลือกแล้ว</p>
                <div className={`hidden lg:grid ${columns} bg-black text-white text-center text-xs font-bold gap-2 p-3`}>
                    {["#", "ชื่อ", "ราคาซื้อ", "ราคาขาย", "คูปอง", "ราคาขายขั้นต่ำที่ไม่ขาดทุน", "กำไร / ขาดทุน", "ลบ"].map(title => <span key={title}>{title}</span>)}
                </div>
                {rows.map(({ player, result, sale }, i) => <div key={player.id}
                    className={`grid grid-cols-2 gap-2 items-center border-3 border-black bg-gray-50 p-3 mt-2 text-sm font-bold ${columns}`}>
                    <span className="justify-self-start px-2 py-1">{i + 1}</span>
                    <input id={fieldId(player,"name")} aria-label={`ชื่อนักเตะ${i + 1}`} placeholder={`ชื่อนักเตะ${i + 1}`}
                        value={player.name} onChange={e => editPlayer(player.id, { name: e.target.value })} className="min-w-0 border-2 border-black bg-white p-2 text-center" />
                    {priceField(player, "purchase")}{priceField(player, "sale")}
                    <label><span className="lg:sr-only block text-xs">คูปอง CP ที่จะใช้</span>
                        <select id={fieldId(player,"coupon")} value={player.cpDiscount} className="w-full bg-white border-2 border-black p-2"
                            onChange={e => { const cp = TAX_CONFIG.CP_DISCOUNT_OPTIONS.find(o => String(o.value) === e.target.value); if (cp) editPlayer(player.id, { cpDiscount: cp.value }); }}>
                            {TAX_CONFIG.CP_DISCOUNT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select></label>
                    <span className="text-center"><span className="block lg:hidden text-xs">ราคาขายขั้นต่ำที่ไม่ขาดทุน</span>{result.status === "ready" ? formatBPAmount(result.minimumSalePrice) : "—"}</span>
                    <span className="text-center"><span className="block lg:hidden text-xs">กำไร / ขาดทุน</span>{sale ? signedAmount(sale.profit) : "—"}</span>
                    <button aria-label={`ลบ ${player.name || "ชื่อนักเตะ" + (i+1)}`} disabled={list.players.length === 1} onClick={() => removePlayer(player.id)}
                        className="justify-self-end px-2 border-2 border-black bg-[#FF6B6B] disabled:bg-gray-200">×</button>
                    {result.status === "invalid" && <p role="status" className="col-span-full text-xs text-red-800">{validationMessages[result.reason]}</p>}
                </div>)}
            </section>
            <section className="bg-white border-4 border-black shadow-[8px_8px_0px_#1a1a1a] p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-[#FFD700] border-4 border-black p-2 shadow-[4px_4px_0px_black]">📊</span>
                    <div><h3 className="font-black text-xl">สรุปยอดรวม</h3><p className="text-xs">คำนวณแล้ว {totals.count} / {rows.length} รายการ</p></div>
                    <span className="sticker sticker-blue ml-auto text-xs">SUMMARY</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-100 border-3 border-black p-4 shadow-[4px_4px_0px_black]"><small>💵 ราคาซื้อรวม</small><div className="text-2xl font-black">{formatBPAmount(totals.cost)}</div></div>
                    <div className="bg-[#FF6B6B] border-3 border-black p-4 shadow-[4px_4px_0px_black]"><small>📉 ภาษีหลังส่วนลดรวม</small><div className="text-2xl font-black">{formatBPAmount(totals.fee)}</div></div>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap bg-[#FFD700] border-4 border-black p-5 shadow-[6px_6px_0px_black]"><strong>💰 กำไร / ขาดทุนสุทธิรวม</strong><strong className="text-3xl">{signedAmount(totals.profit)}</strong></div>
            </section>

        </div>
    );
}
