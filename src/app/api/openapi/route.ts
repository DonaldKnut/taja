import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import { getOpenApiDocument } from '@/openapi/spec';

/**
 * OpenAPI 3.0 JSON for Swagger UI and for NestJS / codegen tooling.
 * Raw file: src/openapi/openapi.json (optional override).
 */
export async function GET() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  try {
    const filePath = path.join(process.cwd(), 'src', 'openapi', 'openapi.json');
    const raw = readFileSync(filePath, 'utf-8');
    const doc = JSON.parse(raw) as Record<string, unknown>;
    if (doc.servers && Array.isArray(doc.servers)) {
      (doc.servers as { url: string }[])[0] = { url: base, description: 'API base' };
    }
    return NextResponse.json(doc, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    const doc = getOpenApiDocument(base);
    return NextResponse.json(doc, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
