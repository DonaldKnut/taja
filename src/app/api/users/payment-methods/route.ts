import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        success: true,
        data: [],
        message: "Payment methods retrieved successfully"
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        return NextResponse.json({
            success: true,
            data: body,
            message: "Payment method added successfully (stub)"
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Invalid request body" },
            { status: 400 }
        );
    }
}
