import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        // This is a placeholder for a real AI assistant integration.
        // In a real scenario, you'd call an LLM (like Gemini or OpenAI) here.

        const lastMessage = messages[messages.length - 1]?.content || "";
        let reply = "I'm Ada, your Taja assistant. I'm currently in a limited mode, but I can help you with basic questions about our marketplace!";

        if (lastMessage.toLowerCase().includes("shipping")) {
            reply = "We offer 1-2 day processing for most items. Shipping costs are calculated based on weight and your location.";
        } else if (lastMessage.toLowerCase().includes("return") || lastMessage.toLowerCase().includes("refund")) {
            reply = "Our return policy depends on the specific merchant, but general Taja guidelines apply for escrowed payments.";
        }

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
