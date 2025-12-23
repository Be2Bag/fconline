// API Route: Track active users using Upstash Redis
// ใช้ Redis เพื่อให้ทำงานได้ถูกต้องบน Vercel Serverless

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Session timeout: 15 seconds (if no heartbeat, consider inactive)
const SESSION_TIMEOUT_SECONDS = 15;

// Redis key for storing active sessions
const SESSIONS_KEY = 'active_sessions';

// POST: Register/update heartbeat for a session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        // Use Redis pipeline for atomic operations
        const now = Date.now();
        const expireTime = now - (SESSION_TIMEOUT_SECONDS * 1000);

        // Add/update session with current timestamp as score
        // ZADD with score = current timestamp
        await redis.zadd(SESSIONS_KEY, { score: now, member: sessionId });

        // Remove expired sessions (score < expireTime)
        await redis.zremrangebyscore(SESSIONS_KEY, 0, expireTime);

        // Count active sessions
        const count = await redis.zcard(SESSIONS_KEY);

        return NextResponse.json({
            count,
            sessionId
        });
    } catch (error) {
        console.error('Redis error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// GET: Get current active user count
export async function GET() {
    try {
        const now = Date.now();
        const expireTime = now - (SESSION_TIMEOUT_SECONDS * 1000);

        // Remove expired sessions first
        await redis.zremrangebyscore(SESSIONS_KEY, 0, expireTime);

        // Count remaining active sessions
        const count = await redis.zcard(SESSIONS_KEY);

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Redis error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
