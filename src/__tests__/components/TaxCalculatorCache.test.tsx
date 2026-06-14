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

  it('loads cached tax calculator state from localStorage', async () => {
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

    const textInputs = Array.from(container.querySelectorAll('input[type="text"]')) as HTMLInputElement[];

    expect(textInputs.some((input) => input.value === 'Ronaldo')).toBe(true);
    expect(container.textContent).toContain('92B');
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

    expect(cachedState.globalSettings.svipDiscount).toBe(0.2);
    expect(cachedState.players).toHaveLength(1);
  });
});
