/**
 * Tests for playerService
 * ทดสอบฟังก์ชันเกี่ยวกับนักเตะ
 */

import {
    getPlayerImageUrl,
    isHashId,
    getDirectImageUrl,
} from '@/services/playerService';

// Note: searchPlayers and getPlayerOvr require mocking fetch
// They are async API calls, tested separately or in integration tests

describe('playerService', () => {
    describe('getPlayerImageUrl', () => {
        it('should generate correct URL with default type', () => {
            const url = getPlayerImageUrl('12345');

            expect(url).toContain('/api/player-image');
            expect(url).toContain('spid=12345');
            expect(url).toContain('type=action');
        });

        it('should generate correct URL with action type', () => {
            const url = getPlayerImageUrl('12345', 'action');

            expect(url).toContain('type=action');
        });

        it('should generate correct URL with normal type', () => {
            const url = getPlayerImageUrl('12345', 'normal');

            expect(url).toContain('type=normal');
        });

        it('should handle hash ID', () => {
            const url = getPlayerImageUrl('abcdef');

            expect(url).toContain('spid=abcdef');
        });
    });

    describe('isHashId', () => {
        it('should return true for alphabetic IDs', () => {
            expect(isHashId('abcdef')).toBe(true);
            expect(isHashId('ABCDEF')).toBe(true);
            expect(isHashId('AbCdEf')).toBe(true);
        });

        it('should return false for numeric IDs', () => {
            expect(isHashId('12345')).toBe(false);
            expect(isHashId('100001234')).toBe(false);
        });

        it('should return false for mixed alphanumeric', () => {
            expect(isHashId('abc123')).toBe(false);
            expect(isHashId('123abc')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isHashId('')).toBe(false);
        });

        it('should return false for special characters', () => {
            expect(isHashId('abc-123')).toBe(false);
            expect(isHashId('abc_def')).toBe(false);
        });
    });

    describe('getDirectImageUrl', () => {
        it('should generate fifaaddict CDN URL by default', () => {
            const url = getDirectImageUrl('12345');

            expect(url).toContain('12345.png');
        });

        it('should generate fifaaddict CDN URL explicitly', () => {
            const url = getDirectImageUrl('12345', 'fifaaddict');

            expect(url).toContain('12345.png');
        });

        it('should generate nexon CDN URL', () => {
            const url = getDirectImageUrl('12345', 'nexon');

            expect(url).toContain('playersAction');
            expect(url).toContain('p12345.png');
        });

        it('should handle different SPID formats', () => {
            const url1 = getDirectImageUrl('100001234');
            const url2 = getDirectImageUrl('200001234');

            expect(url1).toContain('100001234');
            expect(url2).toContain('200001234');
        });
    });

    // Tests for async functions (with mocked fetch)
    describe('searchPlayers (mocked)', () => {
        beforeEach(() => {
            // Reset any mocks
            jest.resetAllMocks();
        });

        it('should return empty array for short query', async () => {
            const { searchPlayers } = await import('@/services/playerService');

            const result = await searchPlayers('a');
            expect(result).toEqual([]);
        });

        it('should return empty array for empty query', async () => {
            const { searchPlayers } = await import('@/services/playerService');

            const result = await searchPlayers('');
            expect(result).toEqual([]);
        });
    });

    describe('getPlayerOvr (mocked)', () => {
        beforeEach(() => {
            // Reset mocks
            global.fetch = jest.fn();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should return null on fetch error', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            const { getPlayerOvr } = await import('@/services/playerService');
            const result = await getPlayerOvr('12345');

            expect(result).toBeNull();
        });

        it('should return null on non-ok response', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 404,
            });

            const { getPlayerOvr } = await import('@/services/playerService');
            const result = await getPlayerOvr('12345');

            expect(result).toBeNull();
        });

        it('should return data on success', async () => {
            const mockData = { ovr: 95, position: 'ST' };
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

            const { getPlayerOvr } = await import('@/services/playerService');
            const result = await getPlayerOvr('12345');

            expect(result).toEqual(mockData);
        });
    });
});
