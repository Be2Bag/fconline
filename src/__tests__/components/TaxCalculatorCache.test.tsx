import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TaxCalculator from '@/components/TaxCalculator';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const STORAGE_KEY = 'fc_online_tax_calculator_state';

describe('TaxCalculator local cache', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
    localStorage.clear();
  });

  async function enterPrice(value: string) {
    const input = container.querySelector<HTMLInputElement>('input[inputmode="decimal"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!input || !setter) throw new Error('Price input is unavailable');

    await act(async () => {
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  async function selectPriceUnit(unit: 'M' | 'B', row = 1) {
    const select = container.querySelector<HTMLSelectElement>(`select[aria-label="หน่วยราคาขายรายการที่ ${row}"]`);
    if (!select) throw new Error('Price unit selector is unavailable');
    await act(async () => {
      select.value = unit;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  it('migrates legacy BP once while preserving player and discount settings', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        globalSettings: { svipDiscount: 0.2, pcEnabled: true },
        players: [
          {
            id: 'cached-player',
            name: 'Ronaldo',
            price: 100000000000,
            cpDiscount: 0.5,
          },
        ],
      })
    );

    await act(async () => {
      root.render(<TaxCalculator />);
    });

    const textInputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="text"]'));

    expect(textInputs.some((input) => input.value === 'Ronaldo')).toBe(true);
    expect(container.textContent).toContain('0.088M');

    const migrated = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(migrated.version).toBe(2);
    expect(migrated.globalSettings).toEqual({ svipDiscount: 0.2 });
    expect(container.textContent).not.toMatch(/\bPC\b/);
    expect(migrated.players).toEqual([
      { id: 'cached-player', name: 'Ronaldo', price: 100000, cpDiscount: 0.5 },
    ]);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));

    expect(container.textContent).toContain('0.088M');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(100000);
  });

  it.each([
    [1_000_000_000, 1_000, '0.001'],
    [10_000_000_000, 10_000, '0.01'],
    [800_000_000_000_000, 800_000_000, '800'],
    [500_000, 0.5, '0.0000005'],
  ])('converts cached legacy price %s to %s new BP', async (oldPrice, newPrice, input) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      globalSettings: { svipDiscount: 0 },
      players: [{ id: 'legacy', name: 'Player', price: oldPrice, cpDiscount: 0 }],
    }));

    await act(async () => root.render(<TaxCalculator />));

    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (element) => element.value)).toEqual([input, input]);
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.version).toBe(2);
    expect(cached.players[0].price).toBe(newPrice);
  });

  it.each([true, false])('removes obsolete PC=%s from v2 cache while preserving the price and unit', async (pcEnabled) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      globalSettings: { svipDiscount: 0.2, pcEnabled },
      players: [{ id: 'cached', name: 'Player', price: 10_000_000_000, cpDiscount: 0 }],
      priceUnits: { cached: 'B' },
    }));
    await act(async () => root.render(<TaxCalculator />));

    expect(container.textContent).toContain('6.8B');
    expect(container.textContent).not.toContain('7.2B');
    expect(container.textContent).not.toMatch(/\bPC\b/);
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.globalSettings).toEqual({ svipDiscount: 0.2 });
    expect(cached.players[0].price).toBe(10_000_000_000);
    expect(cached.priceUnits).toEqual({ cached: 'B' });
  });

  it.each([
    [0.55, '9M', 0.60, '9.2M'],
    [0.60, '9.2M', 0.55, '9M'],
  ])('restores CP %s and remembers a newly chosen coupon after reload', async (cpDiscount, initialNet, nextCoupon, nextNet) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      globalSettings: { svipDiscount: 0.2 },
      players: [{ id: 'new-coupon', name: 'Player', price: 10_000_000, cpDiscount }],
      priceUnits: { 'new-coupon': 'M' },
    }));
    await act(async () => root.render(<TaxCalculator />));
    expect(container.textContent).toContain(initialNet);
    const select = container.querySelector<HTMLSelectElement>('select[aria-label="คูปอง CP รายการที่ 1"]');
    if (!select) throw new Error('CP coupon selector unavailable');
    expect(select.value).toBe(String(cpDiscount));
    expect(Array.from(select.options, option => option.text)).toEqual(expect.arrayContaining(['CP 55%', 'CP 60%']));
    await act(async () => {
      select.value = String(nextCoupon);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.textContent).toContain(nextNet);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(saved.players[0].cpDiscount).toBe(nextCoupon);
    expect(saved.players[0].price).toBe(10_000_000);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));
    expect(container.textContent).toContain(nextNet);
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="คูปอง CP รายการที่ 1"]')?.value).toBe(String(nextCoupon));
  });

  it('uses M inputs and shares the price between responsive layouts without rescaling on reload', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await enterPrice('10');

    expect(container.textContent).toContain('6M');
    expect(container.textContent).toContain('4M');
    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (input) => input.value)).toEqual(['10', '10']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(10_000_000);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));

    expect(container.textContent).toContain('6M');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(10_000_000);
  });

  it('preserves decimal edits and clears the price without retaining the draft', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await enterPrice('0.');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('0.');
    await enterPrice('0.5');

    expect(container.textContent).toContain('0.3M');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(500_000);

    const clearButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('เคลียร์')
    );
    if (!clearButton) throw new Error('Clear button is unavailable');
    await act(async () => clearButton.click());

    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(0);
  });

  it('updates the CP coupon and total without changing another player', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      globalSettings: { svipDiscount: 0 },
      players: [
        { id: 'first', name: 'First', price: 1000, cpDiscount: 0 },
        { id: 'second', name: 'Second', price: 2000, cpDiscount: 0 },
      ],
    }));
    await act(async () => root.render(<TaxCalculator />));

    await selectPriceUnit('B', 2);
    const select = container.querySelector<HTMLSelectElement>('select[aria-label="คูปอง CP รายการที่ 1"]');
    if (!select) throw new Error('CP coupon selector is unavailable');
    await act(async () => {
      select.value = '0.5';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(Array.from(container.querySelectorAll<HTMLSelectElement>('select[aria-label^="คูปอง CP"]'), (element) => element.value))
      .toEqual(['0.5', '0.5', '0', '0']);
    expect(container.textContent).toContain('0.0008M');
    expect(container.textContent).toContain('0.002M');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players).toEqual([
      { id: 'first', name: 'First', price: 1000, cpDiscount: 0.5 },
      { id: 'second', name: 'Second', price: 2000, cpDiscount: 0 },
    ]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').priceUnits).toEqual({ first: 'M', second: 'B' });
  });

  it('shows B/M inputs and results while storing the full BP amount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      globalSettings: { svipDiscount: 0 },
      players: [{ id: 'compact', name: 'Nico Paz', price: 3_130_000_000, cpDiscount: 0 }],
    }));
    await act(async () => root.render(<TaxCalculator />));

    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (input) => input.value)).toEqual(['3.13', '3.13']);
    expect(container.textContent).toContain('3.13B');
    expect(container.textContent).toContain('1.878B');
    expect(container.textContent).not.toContain('1878M');
    expect(container.textContent).not.toContain('1,878,000,000 BP');
    expect(container.querySelector('[title="1.878B"]')?.textContent).toBe('1.878B');

    await selectPriceUnit('M');
    await enterPrice('218.152292');
    expect(container.textContent).toContain('130.891M');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(218_152_292);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));
    expect(container.textContent).toContain('130.891M');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('218.152292');
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="หน่วยราคาขายรายการที่ 1"]')?.value).toBe('M');
  });

  it('converts M/B display units without changing the amount and remembers the selected unit', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await enterPrice('10.');
    await selectPriceUnit('B');

    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (input) => input.value)).toEqual(['0.01', '0.01']);
    expect(container.textContent).toContain('6M');
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.players[0].price).toBe(10_000_000);
    expect(cached.priceUnits[cached.players[0].id]).toBe('B');

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="หน่วยราคาขายรายการที่ 1"]')?.value).toBe('B');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('0.01');

    await selectPriceUnit('M');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('10');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(10_000_000);
  });

  it('calculates 10B with SVIP 20% as 6.8B', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await selectPriceUnit('B');
    await enterPrice('10');
    const svip = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'SVIP 20%');
    if (!svip) throw new Error('SVIP selector unavailable');
    await act(async () => svip.click());

    expect(container.textContent).toContain('6.8B');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(10_000_000_000);
  });

  it('falls back from an invalid cached unit without changing prices and removes deleted unit preferences', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      globalSettings: { svipDiscount: 0 },
      players: [
        { id: 'first', name: 'First', price: 3_130_000_000, cpDiscount: 0 },
        { id: 'second', name: 'Second', price: 10_000_000, cpDiscount: 0 },
      ],
      priceUnits: { first: 'invalid', second: 'M' },
    }));
    await act(async () => root.render(<TaxCalculator />));
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="หน่วยราคาขายรายการที่ 1"]')?.value).toBe('B');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('3.13');
    const remove = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.trim() === '✕');
    if (!remove) throw new Error('Remove player unavailable');
    await act(async () => remove.click());
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.priceUnits).toEqual({ second: 'M' });
    expect(cached.players).toEqual([{ id: 'second', name: 'Second', price: 10_000_000, cpDiscount: 0 }]);
  });

  it('rejects an input that overflows after conversion and clears a B draft with its unit', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await selectPriceUnit('B');
    await enterPrice('3.13');
    await enterPrice('9'.repeat(305));
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('3.13');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(3_130_000_000);
    const clear = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('เคลียร์'));
    if (!clear) throw new Error('Clear unavailable');
    await act(async () => clear.click());
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('');
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="หน่วยราคาขายรายการที่ 1"]')?.value).toBe('M');
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.priceUnits).toEqual({ [cached.players[0].id]: 'M' });
  });

  it('saves tax calculator state to localStorage after changes', async () => {
    await act(async () => {
      root.render(<TaxCalculator />);
    });

    const svip20Button = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('SVIP 20%')
    );

    expect(svip20Button).toBeDefined();

    await act(async () => {
      svip20Button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const cachedState = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

    expect(cachedState.version).toBe(2);
    expect(cachedState.globalSettings.svipDiscount).toBe(0.2);
    expect(cachedState.players).toHaveLength(1);
  });
});
