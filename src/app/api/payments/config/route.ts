import { NextResponse } from "next/server";

export async function GET() {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY;

    if (!publicKey) {
        return NextResponse.json(
            { success: false, message: "Paystack public key not configured" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        publicKey
    });
}
