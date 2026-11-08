import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Calculator from '@/components/Calculator';
import { useOvrCalculator } from '@/hooks/useOvrCalculator';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function HookCalculator() {
  const calculator = useOvrCalculator();

  return (
    <>
      <button onClick={() => calculator.positionStats.forEach(({ stat }) => calculator.setStat(stat, 100))}>
        Fill stats
      </button>
      <button onClick={() => calculator.setStat('จบสกอร์', 0)}>Clear stat</button>
      <output>
        {calculator.isCalculating ? 'calculating' : calculator.showResults ? calculator.baseOvr.toFixed(2) : 'incomplete'}
      </output>
    </>
  );
}

describe('OVR calculation lifecycle', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    jest.useRealTimers();
  });

  function fillStats() {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Input setter is unavailable');

    act(() => {
      container.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]').forEach((input) => {
        setter.call(input, '100');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  it('waits for the new calculation after resetting during the previous calculation', () => {
    act(() => root.render(<Calculator />));
    fillStats();
    expect(container.textContent).toContain('กำลังคำนวณ...');
    act(() => jest.advanceTimersByTime(500));

    const resetButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('รีเซ็ต')
    );
    if (!resetButton) throw new Error('Reset button is unavailable');
    act(() => resetButton.click());
    fillStats();
    act(() => jest.advanceTimersByTime(500));

    expect(container.textContent).toContain('กำลังคำนวณ...');
    act(() => jest.advanceTimersByTime(500));
    expect(container.textContent).not.toContain('กำลังคำนวณ...');
    expect(container.textContent).toContain('100.00');
  });

  it('stops calculating when a stat is cleared and calculates again after refilling', () => {
    act(() => root.render(<HookCalculator />));
    const [fillButton, clearButton] = container.querySelectorAll('button');
    act(() => fillButton.click());
    expect(container.querySelector('output')?.textContent).toBe('calculating');

    act(() => clearButton.click());
    expect(container.querySelector('output')?.textContent).toBe('incomplete');
    act(() => jest.advanceTimersByTime(1000));
    expect(container.querySelector('output')?.textContent).toBe('incomplete');

    act(() => fillButton.click());
    expect(container.querySelector('output')?.textContent).toBe('calculating');
    act(() => jest.advanceTimersByTime(1000));
    expect(container.querySelector('output')?.textContent).toBe('100.00');
  });
});
