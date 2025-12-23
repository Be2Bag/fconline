'use client';

import { useState, useEffect, useCallback } from 'react';

// Get or create persistent user ID (per browser/device)
// ใช้ localStorage เพื่อให้ทุก Tab ใน browser เดียวกันใช้ userId เดียวกัน
function getOrCreateUserId(): string {
    if (typeof window === 'undefined') return '';

    const STORAGE_KEY = 'fc_online_user_id';
    let userId = localStorage.getItem(STORAGE_KEY);

    if (!userId) {
        // สร้าง userId ใหม่ถ้ายังไม่มี
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(STORAGE_KEY, userId);
    }

    return userId;
}

export default function ActiveUsersSticker() {
    const [activeCount, setActiveCount] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    // Send heartbeat to server
    const sendHeartbeat = useCallback(async () => {
        if (!userId) return; // รอ userId ก่อนส่ง

        try {
            const response = await fetch('/api/active-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: userId }) // ใช้ userId แทน
            });

            if (response.ok) {
                const data = await response.json();
                const newCount = data.count;

                // Trigger animation if count changed
                if (newCount !== activeCount && activeCount !== 0) {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 300);
                }

                setActiveCount(newCount);
                setHasError(false); // Reset error state on success
            } else {
                setHasError(true); // API returned error status
            }
        } catch (error) {
            console.error('Failed to send heartbeat:', error);
            setHasError(true); // Network or Redis error
        }
    }, [userId, activeCount]);

    // Initialize userId from localStorage
    useEffect(() => {
        setUserId(getOrCreateUserId());
    }, []);

    useEffect(() => {
        // Send initial heartbeat
        sendHeartbeat();

        // Set up interval for heartbeat (every 8 seconds)
        const interval = setInterval(sendHeartbeat, 8000);

        // Cleanup on unmount
        return () => {
            clearInterval(interval);
        };
    }, [sendHeartbeat]);

    return (
        <div className="fixed bottom-4 left-4 z-40 hidden lg:block">
            <div
                className={`
                    bg-white border-3 border-black px-4 py-2
                    shadow-[4px_4px_0px_#1a1a1a]
                    flex items-center gap-2
                    transition-all duration-300
                    hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1a1a1a]
                    ${isAnimating ? 'scale-110' : 'scale-100'}
                `}
            >
                {/* Animated dot */}
                <div className="relative">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${hasError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75 ${hasError ? 'bg-red-400' : 'bg-green-400'}`}></div>
                </div>

                {/* User count */}
                <div className="flex items-center gap-1.5">
                    <span className="text-lg">👥</span>
                    <span className={`font-bold text-sm transition-all ${hasError ? 'text-red-600' : ''} ${isAnimating ? 'text-green-600 scale-125' : ''}`}>
                        {hasError ? 'x' : activeCount}
                    </span>
                    <span className="text-xs text-black/70">คนออนไลน์</span>
                </div>
            </div>
        </div>
    );
}
