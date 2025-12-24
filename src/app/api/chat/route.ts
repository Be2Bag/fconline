/**
 * Chat API Route
 * API สำหรับระบบแชทชั่วคราว ใช้ Redis เก็บข้อความ
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { ChatMessage, SendMessagePayload } from '@/types';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Config
const CHAT_KEY = 'chat_messages';
const MAX_MESSAGES = 50;
const MESSAGE_TTL_SECONDS = 300; // 5 minutes

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ensure chat key is a list type, reset if wrong type
 */
async function ensureChatKeyIsList(): Promise<void> {
    try {
        const keyType = await redis.type(CHAT_KEY);
        if (keyType && keyType !== 'list' && keyType !== 'none') {
            console.log(`Chat key has wrong type: ${keyType}, deleting...`);
            await redis.del(CHAT_KEY);
        }
    } catch (err) {
        console.error('Error checking key type:', err);
    }
}

// ========== CONTENT MODERATION ==========

// Rate limiting config
const RATE_LIMIT_KEY_PREFIX = 'chat_rate:';
const RATE_LIMIT_SECONDS = 5; // Min seconds between messages
const RATE_LIMIT_MAX_MESSAGES = 3; // Max messages in rate window

// URL/Link patterns to block
const URL_PATTERNS = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|net|org|io|co|me|xyz|tk|ml|ga|cf|gq|info|biz|online|site|website|link|click|bet|casino|slot|poker|win|money|cash)[^\s]*/gi,
];

// Gambling/betting keywords to block
const GAMBLING_KEYWORDS = [
    'พนัน', 'เดิมพัน', 'คาสิโน', 'บาคาร่า', 'สล็อต', 'แทงบอล', 'แทงหวย',
    'ufabet', 'ufa', 'betway', 'bet365', 'sbobet', '1xbet', 'w88', 'm88',
    'sagame', 'sexybaccarat', 'joker123', 'pg slot', 'pgslot', 'slotxo',
    'เว็บตรง', 'ฝากถอนไม่มีขั้นต่ำ', 'โปรโมชั่น100', 'ฟรีเครดิต', 'โบนัส100',
    'casino', 'gambling', 'betting', 'jackpot', 'luckywin',
];

// Profanity list (Thai + English common bad words - keeping it family-friendly)
const PROFANITY_LIST = [
    // Thai profanity
    'เหี้ย', 'สัตว์', 'ควย', 'หี', 'เย็ด', 'แม่ง', 'มึง', 'กู',
    'สันดาน', 'ชาติหมา', 'ไอ้เวร', 'ไอ้สัตว์', 'ระยำ', 'ชิบหาย',
    'อีดอก', 'อีสัตว์', 'อีหน้าหี', 'หน้าหี', 'ส้นตีน', 'ไอ้หน้าหี',
    'กระหรี่', 'อีกระหรี่', 'โสเภณี', 'แรด', 'อีแรด',
    // English profanity
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
    'cunt', 'whore', 'slut', 'nigger', 'faggot', 'retard',
];

/**
 * Check if message contains URLs/links
 */
function containsUrl(text: string): boolean {
    return URL_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Check if message contains gambling-related content
 */
function containsGamblingContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    return GAMBLING_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Check if message contains profanity
 */
function containsProfanity(text: string): boolean {
    const lowerText = text.toLowerCase();
    return PROFANITY_LIST.some(word => lowerText.includes(word.toLowerCase()));
}

/**
 * Check rate limit for user (anti-spam)
 */
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
    const key = `${RATE_LIMIT_KEY_PREFIX}${userId}`;

    try {
        const count = await redis.incr(key);

        if (count === 1) {
            // First message, set expiry
            await redis.expire(key, RATE_LIMIT_SECONDS);
        }

        if (count > RATE_LIMIT_MAX_MESSAGES) {
            const ttl = await redis.ttl(key);
            return { allowed: false, waitSeconds: ttl > 0 ? ttl : RATE_LIMIT_SECONDS };
        }

        return { allowed: true };
    } catch (err) {
        console.error('Rate limit check error:', err);
        return { allowed: true }; // Allow on error to not block legitimate users
    }
}

/**
 * Validate message content
 */
function validateMessageContent(message: string): { valid: boolean; error?: string } {
    // Check for URLs
    if (containsUrl(message)) {
        return { valid: false, error: '❌ ไม่อนุญาตให้ส่งลิงค์' };
    }

    // Check for gambling content
    if (containsGamblingContent(message)) {
        return { valid: false, error: '❌ ไม่อนุญาตให้โฆษณาเว็บพนัน' };
    }

    // Check for profanity
    if (containsProfanity(message)) {
        return { valid: false, error: '❌ กรุณาใช้ภาษาสุภาพ' };
    }

    return { valid: true };
}

/**
 * POST: Send a new message
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SendMessagePayload;
        const { userId, nickname, message } = body;

        // Validate input
        if (!userId || !nickname || !message) {
            return NextResponse.json(
                { success: false, error: 'userId, nickname, and message are required' },
                { status: 400 }
            );
        }

        // Ensure key is correct type
        await ensureChatKeyIsList();

        // Sanitize message (max 200 chars)
        const sanitizedMessage = message.trim().slice(0, 200);
        if (!sanitizedMessage) {
            return NextResponse.json(
                { success: false, error: 'Message cannot be empty' },
                { status: 400 }
            );
        }

        // Check rate limit (anti-spam)
        const rateCheck = await checkRateLimit(userId);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: `⏳ รอ ${rateCheck.waitSeconds} วินาทีก่อนส่งข้อความใหม่` },
                { status: 429 }
            );
        }

        // Validate content (links, gambling, profanity)
        const contentCheck = validateMessageContent(sanitizedMessage);
        if (!contentCheck.valid) {
            return NextResponse.json(
                { success: false, error: contentCheck.error },
                { status: 400 }
            );
        }

        // Create message object
        const chatMessage: ChatMessage = {
            id: generateMessageId(),
            userId,
            nickname: nickname.trim().slice(0, 20),
            message: sanitizedMessage,
            timestamp: Date.now(),
        };

        // Add to Redis list (left push - newest first)
        await redis.lpush(CHAT_KEY, JSON.stringify(chatMessage));

        // Trim to keep only last MAX_MESSAGES
        await redis.ltrim(CHAT_KEY, 0, MAX_MESSAGES - 1);

        // Set expiry on the list
        await redis.expire(CHAT_KEY, MESSAGE_TTL_SECONDS);

        return NextResponse.json({
            success: true,
            message: chatMessage,
        });
    } catch (error) {
        console.error('Chat POST error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: 'Server error', details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * GET: Fetch all messages
 */
export async function GET() {
    try {
        // Ensure key is correct type
        await ensureChatKeyIsList();

        // Get all messages from list
        const rawMessages = await redis.lrange(CHAT_KEY, 0, MAX_MESSAGES - 1);

        // Parse messages and filter expired ones
        const now = Date.now();
        const expiryTime = MESSAGE_TTL_SECONDS * 1000;

        const messages: ChatMessage[] = rawMessages
            .map((raw) => {
                try {
                    // Handle both string and object types from Redis
                    if (typeof raw === 'string') {
                        return JSON.parse(raw) as ChatMessage;
                    }
                    return raw as ChatMessage;
                } catch {
                    return null;
                }
            })
            .filter((msg): msg is ChatMessage => {
                if (!msg) return false;
                // Filter out expired messages
                return (now - msg.timestamp) < expiryTime;
            })
            .reverse(); // Reverse to show oldest first (chronological order)

        return NextResponse.json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error('Chat GET error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: 'Server error', details: errorMessage },
            { status: 500 }
        );
    }
}
