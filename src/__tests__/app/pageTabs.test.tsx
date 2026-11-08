import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import OvrPage from '@/app/ovr/page';
import TaxPage from '@/app/tax/page';
import TradingPage from '@/app/trading/page';

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

jest.mock('@/components/BrowserCalculators', () => ({
    BrowserTaxCalculator: function MockTaxCalculator() {
        return <div>Tax calculator content</div>;
    },
    BrowserTradingCalculator: function MockTradingCalculator() {
        return <div>Trading calculator content</div>;
    },
}));

describe('Tool page navigation', () => {
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

    it.each([
        { Page: OvrPage, path: '/ovr', heading: 'OVR Calculator', content: 'Calculator content' },
        { Page: TaxPage, path: '/tax', heading: 'Tax Calculator', content: 'Tax calculator content' },
        { Page: TradingPage, path: '/trading', heading: 'Trading Calculator', content: 'Trading calculator content' },
    ])('renders $path with real navigation links and its own content', ({ Page, path, heading, content }) => {
        act(() => root.render(<Page />));
        const links = Array.from(container.querySelectorAll('nav a'));
        expect(links.map(link => link.getAttribute('href'))).toEqual(['/ovr', '/tax', '/trading']);
        expect(container.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(path);
        expect(container.querySelector('h1')?.textContent?.trim()).toBe(heading);
        expect(container.querySelector('main')?.textContent).toBe(content);
        expect(container.querySelector('nav')?.textContent).not.toContain('เปิดกล่อง');
    });
});
