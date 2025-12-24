'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '@/types';

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

// Get or create nickname
function getOrCreateNickname(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('fc_online_nickname') || '';
}

function saveNickname(nickname: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('fc_online_nickname', nickname);
    }
}

export default function ActiveUsersSticker() {
    const [activeCount, setActiveCount] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [hasError, setHasError] = useState(false);

    // Chat states
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [nickname, setNickname] = useState<string>('');
    const [nicknameInput, setNicknameInput] = useState<string>('');
    const [isNicknameSet, setIsNicknameSet] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [showHint, setShowHint] = useState<boolean>(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatPollRef = useRef<NodeJS.Timeout | null>(null);
    const hasOpenedChatRef = useRef(false);

    // Auto scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch messages from server
    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch('/api/chat');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, []);

    // Send message to server
    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || !userId || !nickname || isSending) return;

        setIsSending(true);
        setSendError(''); // Clear previous error
        const messageText = inputMessage.trim();
        setInputMessage('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    nickname,
                    message: messageText,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Fetch updated messages
                await fetchMessages();
                scrollToBottom();
            } else {
                // Show error from server
                setSendError(data.error || 'ส่งข้อความไม่สำเร็จ');
                setInputMessage(messageText); // Restore message
                // Auto clear error after 3 seconds
                setTimeout(() => setSendError(''), 3000);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setSendError('เกิดข้อผิดพลาด กรุณาลองใหม่');
            setInputMessage(messageText);
            setTimeout(() => setSendError(''), 3000);
        } finally {
            setIsSending(false);
        }
    }, [inputMessage, userId, nickname, isSending, fetchMessages, scrollToBottom]);

    // Handle nickname submit
    const handleNicknameSubmit = useCallback(() => {
        const trimmedNickname = nicknameInput.trim().slice(0, 20);
        if (trimmedNickname) {
            setNickname(trimmedNickname);
            saveNickname(trimmedNickname);
            setIsNicknameSet(true);
            fetchMessages();
        }
    }, [nicknameInput, fetchMessages]);

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

    // Initialize userId and nickname from localStorage
    useEffect(() => {
        setUserId(getOrCreateUserId());
        const savedNickname = getOrCreateNickname();
        if (savedNickname) {
            setNickname(savedNickname);
            setNicknameInput(savedNickname);
            setIsNicknameSet(true);
        }
    }, []);

    // Heartbeat effect
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

    // Chat polling effect
    useEffect(() => {
        if (isChatOpen && isNicknameSet) {
            // Mark as opened and clear unread
            hasOpenedChatRef.current = true;
            setUnreadCount(0);
            setShowHint(false); // Hide hint when chat is opened

            // Fetch immediately when opening
            fetchMessages();

            // Poll every 3 seconds
            chatPollRef.current = setInterval(fetchMessages, 3000);
        }

        return () => {
            if (chatPollRef.current) {
                clearInterval(chatPollRef.current);
                chatPollRef.current = null;
            }
        };
    }, [isChatOpen, isNicknameSet, fetchMessages]);

    // Check for unread messages when component mounts (for new visitors)
    useEffect(() => {
        const checkUnreadMessages = async () => {
            if (hasOpenedChatRef.current) return; // Skip if already opened chat

            try {
                const response = await fetch('/api/chat');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.messages) {
                        setUnreadCount(data.messages.length);
                    }
                }
            } catch (error) {
                console.error('Failed to check unread messages:', error);
            }
        };

        // Check after a short delay to let component initialize
        const timer = setTimeout(checkUnreadMessages, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, isChatOpen, scrollToBottom]);

    // Handle Enter key for nickname and message input
    const handleKeyDown = (e: React.KeyboardEvent, action: 'nickname' | 'message') => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (action === 'nickname') {
                handleNicknameSubmit();
            } else {
                sendMessage();
            }
        }
    };

    // Format timestamp
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    const showChatButton = activeCount >= 2;

    return (
        <div className="fixed bottom-4 left-4 z-40 hidden lg:block">
            {/* Active Users Badge */}
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

                {/* Chat button - show when 2+ users online */}
                {showChatButton && (
                    <div className="relative flex items-center">
                        {/* Floating Hint */}
                        {!isChatOpen && showHint && (
                            <div className="absolute -top-12 left-0 whitespace-nowrap animate-bounce z-50">
                                <div className="bg-[var(--color-primary)] border-2 border-black px-3 py-1 shadow-[3px_3px_0px_#000] relative">
                                    <span className="text-[10px] font-bold">หาเพื่อนทำเควสที่นี่! 🔍</span>
                                    {/* Arrow pointer */}
                                    <div className="absolute -bottom-2 left-4 w-3 h-3 bg-[var(--color-primary)] border-r-2 border-b-2 border-black rotate-45"></div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setIsChatOpen(!isChatOpen);
                                setShowHint(false);
                            }}
                            className={`
                                ml-2 px-2.5 py-1 flex items-center gap-1
                                border-2 border-black
                                transition-all duration-200
                                relative
                                ${isChatOpen
                                    ? 'bg-[var(--color-primary)] shadow-none translate-x-[2px] translate-y-[2px]'
                                    : 'bg-[var(--color-green)] shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                }
                            `}
                            title={isChatOpen ? 'ปิดแชท' : `เปิดแชท${unreadCount > 0 ? ` (${unreadCount} ข้อความ)` : ''}`}
                        >
                            <span className="text-sm">{isChatOpen ? '✕' : '💬'}</span>
                            <span className="text-xs font-bold">
                                {isChatOpen ? 'ปิด' : 'แชท!'}
                            </span>
                            {/* Unread message badge */}
                            {!isChatOpen && unreadCount > 0 && (
                                <span className="
                                    absolute -top-2 -right-2
                                    min-w-5 h-5 px-1
                                    bg-[var(--color-primary)] text-black text-xs font-bold
                                    border-2 border-black
                                    flex items-center justify-center
                                    animate-bounce
                                ">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            {isChatOpen && showChatButton && (
                <div
                    className="
                        absolute bottom-14 left-0
                        w-80 h-96
                        bg-white border-3 border-black
                        shadow-[6px_6px_0px_#1a1a1a]
                        flex flex-col
                        overflow-hidden
                    "
                >
                    {/* Chat Header */}
                    <div className="bg-[var(--color-primary)] border-b-3 border-black px-3 py-2 flex items-center justify-between">
                        <span className="font-bold text-sm">💬 หาเพื่อนทำภารกิจ</span>
                        <span className="text-xs bg-black text-white px-2 py-0.5">{activeCount} ออนไลน์</span>
                    </div>

                    {/* Content Area */}
                    {!isNicknameSet ? (
                        /* Nickname Input */
                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                            <span className="text-2xl">👋</span>
                            <p className="text-sm text-center font-medium">ตั้งชื่อเล่นก่อนเริ่มแชท</p>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'nickname')}
                                placeholder="ชื่อเล่น..."
                                maxLength={20}
                                className="
                                    w-full px-3 py-2
                                    border-2 border-black
                                    shadow-[3px_3px_0px_#1a1a1a]
                                    focus:outline-none focus:shadow-[4px_4px_0px_#1a1a1a]
                                    text-sm
                                "
                            />
                            <button
                                onClick={handleNicknameSubmit}
                                disabled={!nicknameInput.trim()}
                                className="
                                    px-4 py-2
                                    bg-[var(--color-green)] border-2 border-black
                                    shadow-[3px_3px_0px_#1a1a1a]
                                    font-bold text-sm
                                    hover:shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]
                                    active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all duration-100
                                "
                            >
                                เริ่มแชท 🚀
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="text-center text-sm text-black/50 py-8">
                                        <span className="text-2xl block mb-2">💭</span>
                                        ยังไม่มีข้อความ<br />เริ่มสนทนาเลย!
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`
                                                text-sm p-2 border-2 border-black
                                                ${msg.userId === userId
                                                    ? 'bg-[var(--color-blue)] ml-4 shadow-[2px_2px_0px_#1a1a1a]'
                                                    : 'bg-[var(--color-white)] mr-4 shadow-[2px_2px_0px_#1a1a1a]'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-bold text-xs truncate">
                                                    {msg.userId === userId ? '🫵 คุณ' : `👤 ${msg.nickname}`}
                                                </span>
                                                <span className="text-[10px] opacity-60">{formatTime(msg.timestamp)}</span>
                                            </div>
                                            <p className="break-words">{msg.message}</p>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="border-t-3 border-black p-2 bg-gray-50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'message')}
                                        placeholder="พิมพ์ข้อความ..."
                                        maxLength={200}
                                        disabled={isSending}
                                        className="
                                            flex-1 px-3 py-2
                                            border-2 border-black
                                            shadow-[2px_2px_0px_#1a1a1a]
                                            focus:outline-none focus:shadow-[3px_3px_0px_#1a1a1a]
                                            text-sm
                                            disabled:opacity-50
                                        "
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || isSending}
                                        className="
                                            px-3 py-2
                                            bg-[var(--color-green)] border-2 border-black
                                            shadow-[2px_2px_0px_#1a1a1a]
                                            font-bold text-sm
                                            hover:shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]
                                            active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            transition-all duration-100
                                        "
                                    >
                                        {isSending ? '...' : '➤'}
                                    </button>
                                </div>
                                {/* Error message display */}
                                {sendError && (
                                    <div className="
                                        mt-1 px-2 py-1
                                        bg-[var(--color-primary)] border-2 border-black
                                        text-xs font-medium text-center
                                    ">
                                        {sendError}
                                    </div>
                                )}
                                <p className="text-[10px] text-black/50 mt-1 text-center">
                                    ข้อความจะหายหลัง 5 นาที • แชทในฐานะ &quot;{nickname}&quot;
                                    <button
                                        onClick={() => {
                                            setIsNicknameSet(false);
                                            setNicknameInput(nickname);
                                        }}
                                        className="ml-1 text-blue-600 hover:text-blue-800 hover:underline transition-all"
                                        title="แก้ไขชื่อเล่น"
                                    >
                                        (แก้ไข)
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
