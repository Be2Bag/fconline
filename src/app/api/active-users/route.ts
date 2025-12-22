// API Route: Track active users using in-memory storage
// ใช้ heartbeat mechanism เพื่อติดตามผู้ใช้งาน

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for active sessions
// Key: sessionId, Value: last heartbeat timestamp
const activeSessions = new Map<string, number>();

// Session timeout: 15 seconds (if no heartbeat, consider inactive)
const SESSION_TIMEOUT = 15000;

// Clean up expired sessions
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, timestamp] of activeSessions.entries()) {
        if (now - timestamp > SESSION_TIMEOUT) {
            activeSessions.delete(sessionId);
        }
    }
}

// POST: Register/update heartbeat for a session
// GET: Get current active user count
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        // Update or create session
        activeSessions.set(sessionId, Date.now());

        // Clean up expired sessions
        cleanupExpiredSessions();

        // Return current count
        return NextResponse.json({
            count: activeSessions.size,
            sessionId
        });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

export async function GET() {
    // Clean up expired sessions before counting
    cleanupExpiredSessions();

    return NextResponse.json({
        count: activeSessions.size
    });
}
