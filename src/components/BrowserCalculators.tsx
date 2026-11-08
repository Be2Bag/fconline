"use client";

import dynamic from "next/dynamic";

// Saved browser data cannot match the server's empty calculator state.
export const BrowserTaxCalculator = dynamic(() => import("./TaxCalculator"), {
    ssr: false,
    loading: () => <p role="status">กำลังโหลดเครื่องคำนวณ…</p>,
});

export const BrowserTradingCalculator = dynamic(() => import("./TradingCalculator"), {
    ssr: false,
    loading: () => <p role="status">กำลังโหลดเครื่องคำนวณ…</p>,
});
