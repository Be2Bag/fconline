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
    expect(container.textContent).toContain('92,000 BP');

    const migrated = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(migrated.version).toBe(2);
    expect(migrated.globalSettings).toEqual({ svipDiscount: 0.2, pcEnabled: true });
    expect(migrated.players).toEqual([
      { id: 'cached-player', name: 'Ronaldo', price: 100000, cpDiscount: 0.5 },
    ]);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));

    expect(container.textContent).toContain('92,000 BP');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(100000);
  });

  it.each([
    [1_000_000_000, 1_000],
    [10_000_000_000, 10_000],
    [800_000_000_000_000, 800_000_000],
    [500_000, 0.5],
  ])('converts cached legacy price %s to %s new BP', async (oldPrice, newPrice) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      globalSettings: { svipDiscount: 0, pcEnabled: false },
      players: [{ id: 'legacy', name: 'Player', price: oldPrice, cpDiscount: 0 }],
    }));

    await act(async () => root.render(<TaxCalculator />));

    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (input) => input.value)).toEqual([String(newPrice), String(newPrice)]);
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(cached.version).toBe(2);
    expect(cached.players[0].price).toBe(newPrice);
  });

  it('uses entered new BP directly and shares the value between responsive layouts', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await enterPrice('1,000');

    expect(container.textContent).toContain('600 BP');
    expect(container.textContent).toContain('400 BP');
    const inputs = container.querySelectorAll<HTMLInputElement>('input[inputmode="decimal"]');
    expect(Array.from(inputs, (input) => input.value)).toEqual(['1,000', '1,000']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(1000);

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<TaxCalculator />));

    expect(container.textContent).toContain('600 BP');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(1000);
  });

  it('preserves decimal edits and clears the price without retaining the draft', async () => {
    await act(async () => root.render(<TaxCalculator />));
    await enterPrice('0.');
    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('0.');
    await enterPrice('0.5');

    expect(container.textContent).toContain('0.3 BP');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(0.5);

    const clearButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('เคลียร์')
    );
    if (!clearButton) throw new Error('Clear button is unavailable');
    await act(async () => clearButton.click());

    expect(container.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.value).toBe('');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').players[0].price).toBe(0);
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
