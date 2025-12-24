/**
 * Chat Message Types
 * Types สำหรับระบบแชทชั่วคราว
 */

export interface ChatMessage {
    id: string;
    userId: string;
    nickname: string;
    message: string;
    timestamp: number;
}

export interface SendMessagePayload {
    userId: string;
    nickname: string;
    message: string;
}

export interface ChatResponse {
    success: boolean;
    messages?: ChatMessage[];
    error?: string;
}
