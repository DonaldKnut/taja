import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Consume the analytics payload from the client
    await req.json().catch(() => ({}));
    
    // Return a successful response to stop 404 errors in the console
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
