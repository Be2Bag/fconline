import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TradingCalculator, { TRADING_CALCULATOR_STORAGE_KEY } from '@/components/TradingCalculator';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const taxKey = 'fc_online_tax_calculator_state';

describe('TradingCalculator', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        jest.restoreAllMocks();
        localStorage.clear();
    });
    const render = async () => act(async () => root.render(<TradingCalculator />));

    async function enter(id: string, value: string) {
        const input = container.querySelector<HTMLInputElement>(`#${id}`);
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        if (!input || !setter) throw new Error('Missing price input');
        await act(async () => {
            setter.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }
    async function choose(selector: string, value: string) {
        const select = container.querySelector<HTMLSelectElement>(selector);
        if (!select) throw new Error('Missing selector');
        await act(async () => {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
    async function click(label: string) {
        const button = Array.from(container.querySelectorAll('button')).find(element => element.textContent?.trim() === label);
        if (!button) throw new Error(`Missing button: ${label}`);
        await act(async () => button.click());
    }

    it('asks for purchase cost and calculates a safe minimum with no expected sale', async () => {
        await render();
        expect(container.textContent).toContain('กรอกราคาซื้อมากกว่า 0');
        await enter('trade-purchase', '1');
        expect(container.textContent).toContain('1.667B');
        expect(container.textContent).toContain('กรอกราคาขายที่คาดไว้เพื่อดูกำไรหรือขาดทุน');
        expect(container.textContent).not.toContain('Infinity');
    });

    it('changes a 280M loss into 8M profit with the suggested CP60 and remembers it without touching tax data', async () => {
        const taxCache = JSON.stringify({ sentinel: 'unchanged' });
        localStorage.setItem(taxKey, taxCache);
        await render();
        await enter('trade-purchase', '1');
        await enter('trade-sale', '1.2');
        expect(container.textContent).toContain('-280M');
        expect(container.textContent).toContain('CP 60%');
        await choose('#trade-coupon', '0.55');
        expect(container.textContent).toContain('-16M');
        await click('ใช้คูปองที่แนะนำ');
        expect(container.textContent).toContain('+8M');
        expect(container.textContent).toContain('+0.8%');
        expect(container.querySelector<HTMLSelectElement>('#trade-coupon')?.value).toBe('0.6');
        expect(localStorage.getItem(taxKey)).toBe(taxCache);
        const saved = JSON.parse(localStorage.getItem(TRADING_CALCULATOR_STORAGE_KEY) ?? 'null');
        expect(saved.version).toBe(2);
        expect(saved.players[0].cpDiscount).toBe(0.6);

        await act(async () => root.unmount());
        root = createRoot(container);
        await render();
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('1');
        expect(container.querySelector<HTMLInputElement>('#trade-sale')?.value).toBe('1.2');
        expect(container.textContent).toContain('+8M');
    });

    it('recommends CP40 with SVIP20 for a sale of 1.2B', async () => {
        await render();
        await enter('trade-purchase', '1');
        await enter('trade-sale', '1.2');
        await click('SVIP 20%');
        await click('ใช้คูปองที่แนะนำ');
        expect(container.querySelector<HTMLSelectElement>('#trade-coupon')?.value).toBe('0.4');
        expect(container.textContent).toContain('+8M');
    });

    it('explains when even CP60 cannot cover the cost', async () => {
        await render();
        await enter('trade-purchase', '1');
        await enter('trade-sale', '1');
        await click('SVIP 20%');
        expect(container.textContent).toContain('คูปองสูงสุดยังไม่คุ้มทุน');
        expect(container.textContent).toContain('ยังขาด 80M');
        expect(container.textContent).toContain('ควรขายอย่างน้อย 1.087B');
        expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent === 'ใช้คูปองที่แนะนำ')).toBe(false);
    });

    it('switches both M/B inputs without changing their value and preserves decimal edits', async () => {
        await render();
        await enter('trade-purchase', '1.');
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('1.');
        await enter('trade-sale', '1.2');
        await choose('select[aria-label="หน่วยราคาซื้อ"]', 'M');
        await choose('select[aria-label="หน่วยราคาขายที่คาดไว้"]', 'M');
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('1000');
        expect(container.querySelector<HTMLInputElement>('#trade-sale')?.value).toBe('1200');
        expect(container.textContent).toContain('-280M');
    });

    it('validates zero sale and excessive numbers without displaying invalid results', async () => {
        await render();
        await enter('trade-purchase', '1');
        await enter('trade-sale', '0');
        expect(container.textContent).toContain('ราคาขายต้องมากกว่า 0');
        await enter('trade-sale', '');
        await enter('trade-purchase', '10000000');
        expect(container.textContent).toContain('ราคาอยู่นอกช่วง');
        expect(container.textContent).not.toContain('Infinity');
    });

    const validCache = { version: 1, purchaseInput: '1', saleInput: '1.2', purchaseUnit: 'B', saleUnit: 'B', svipDiscount: 0, cpDiscount: 0 };
    it.each([
        '{bad json',
        JSON.stringify({ ...validCache, version: 2 }),
        JSON.stringify({ ...validCache, purchaseUnit: 'T' }),
        JSON.stringify({ ...validCache, cpDiscount: 0.8 }),
        JSON.stringify({ ...validCache, purchaseInput: 'Infinity' }),
    ])('recovers from an invalid saved state %s', async (cache) => {
        localStorage.setItem(TRADING_CALCULATOR_STORAGE_KEY, cache);
        await render();
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('');
        expect(container.textContent).toContain('กรอกราคาซื้อมากกว่า 0');
    });

    it('migrates the first player, saves another and preserves the first after deletion', async () => {
        localStorage.setItem(TRADING_CALCULATOR_STORAGE_KEY, JSON.stringify(validCache));
        await render();
        await enter('trade-name', 'Messi');
        await click('+ เพิ่มนักเตะ');
        await enter('trade-name', 'Paz');
        await enter('trade-purchase', '2');
        await act(async () => root.unmount());
        root = createRoot(container);
        await render();
        expect(container.querySelector<HTMLInputElement>('#trade-name')?.value).toBe('Paz');
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('2');
        await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="ลบ Paz"]')!.click());
        expect(container.querySelector<HTMLInputElement>('#trade-name')?.value).toBe('Messi');
        expect(container.textContent).toContain('-280M');
        expect(JSON.parse(localStorage.getItem(TRADING_CALCULATOR_STORAGE_KEY)!).players).toHaveLength(1);
    });

    it('keeps calculating when storage access is blocked', async () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
        await render();
        await enter('trade-purchase', '1');
        expect(container.textContent).toContain('1.667B');
    });

    it('clears this calculator and leaves the tax calculator cache intact', async () => {
        localStorage.setItem(taxKey, 'original tax data');
        await render();
        await enter('trade-purchase', '1');
        await enter('trade-sale', '1.2');
        await choose('#trade-coupon', '0.6');
        await click('ล้างค่า');
        expect(container.querySelector<HTMLInputElement>('#trade-purchase')?.value).toBe('');
        expect(container.querySelector<HTMLInputElement>('#trade-sale')?.value).toBe('');
        expect(container.querySelector<HTMLSelectElement>('#trade-coupon')?.value).toBe('0');
        expect(localStorage.getItem(taxKey)).toBe('original tax data');
    });
});
