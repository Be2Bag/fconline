import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Home from '@/app/page';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('next/image', () => ({
    __esModule: true,
    default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''} />;
    },
}));

jest.mock('@/components/Calculator', () => ({
    __esModule: true,
    default: function MockCalculator() {
        return <div>Calculator content</div>;
    },
}));

jest.mock('@/components/BestPositionFinder', () => ({
    __esModule: true,
    default: function MockBestPositionFinder() {
        return <div>Best position content</div>;
    },
}));

jest.mock('@/components/BoxSimulator', () => ({
    __esModule: true,
    default: function MockBoxSimulator() {
        return <div>Box simulator content</div>;
    },
}));

jest.mock('@/components/TaxCalculator', () => ({
    __esModule: true,
    default: function MockTaxCalculator() {
        return <div>Tax calculator content</div>;
    },
}));

describe('Home tab navigation', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => {
            root.unmount();
        });
        document.body.removeChild(container);
    });

    it('does not show the best position finder tab', () => {
        act(() => {
            root.render(<Home />);
        });

        const buttonLabels = Array.from(container.querySelectorAll('button')).map(
            (button) => button.textContent
        );

        expect(buttonLabels.join(' ')).not.toContain('หาตำแหน่ง');
    });
});
