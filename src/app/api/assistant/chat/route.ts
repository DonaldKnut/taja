import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ADA_SYSTEM_PROMPT = `
You are Ada, the official AI assistant for Taja.shop, a premium Nigerian marketplace.
Your goal is to help users solve platform problems and answer questions about how Taja works.

Key Information about Taja:
- Taja is a "Premium Registry" style marketplace for high-quality goods (fashion, jewelry, tech, food).
- We use an escrow system (safe payment) where we hold the money until the buyer confirms they received the item.
- Sellers can create shops, upload products, and manage orders through their dashboard.
- Admins oversee the platform, verify KYC (identity check), and manage system maintenance.
- If a user has a complex problem you can't solve, advise them to contact support@tajaapp.shop.

Handling Technical Understanding:
- Some users may have limited technical skills. Use simple, clear language.
- Avoid technical jargon (e.g., explain "KYC" as "Identity Verification" or "Escrow" as "Safe Payment").
- Be patient, helpful, professional, and friendly. Use a "premium" Taja tone.
- Give step-by-step guidance for common tasks like "How to buy" or "How to sell".

Instructions:
- If the user asks who you are, introduce yourself as Ada, the Taja Assistant.
- NEVER say you are in "limited mode".
`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, message: 'Assistant configuration missing.' },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            systemInstruction: ADA_SYSTEM_PROMPT
        });

        // Format history for Gemini - MUST start with 'user' role
        let history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // Gemini requirement: First message must be 'user'
        while (history.length > 0 && history[0].role !== 'user') {
            history.shift();
        }

        const lastMessage = messages[messages.length - 1]?.content || "";

        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const reply = response.text();

        return NextResponse.json({
            success: true,
            reply
        });
    } catch (error: any) {
        console.error('Assistant Chat Error:', error);
        return NextResponse.json(
            { success: false, message: 'I encountered an error while thinking. Please try again.' },
            { status: 500 }
        );
    }
}
