'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: Record<string, unknown>) => unknown;
  }
}

/**
 * Interactive API docs. Spec: GET /api/openapi (OpenAPI 3 JSON).
 * Regenerate catalog: `node scripts/generate-openapi.js`
 */
export default function ApiDocsPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const ver = '5.11.0';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://unpkg.com/swagger-ui-dist@${ver}/swagger-ui.css`;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = `https://unpkg.com/swagger-ui-dist@${ver}/swagger-ui-bundle.js`;
    script.async = true;
    script.onload = () => {
      window.SwaggerUIBundle?.({
        dom_id: '#swagger-ui',
        url: '/api/openapi',
        persistAuthorization: true,
        tryItOutEnabled: true,
        filter: true,
        displayRequestDuration: true,
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
        <strong className="text-neutral-900">Taja API</strong>
        {' · '}
        OpenAPI served at <code className="rounded bg-neutral-100 px-1">/api/openapi</code>
        {' · '}
        Nest handoff: <code className="rounded bg-neutral-100 px-1">docs/BACKEND_BUSINESS_LOGIC.md</code>
      </header>
      <div id="swagger-ui" className="swagger-ui-wrap" />
    </div>
  );
}
