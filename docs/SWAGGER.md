# Swagger / OpenAPI

| Resource | URL |
|----------|-----|
| **Swagger UI** | [`/docs/api`](http://localhost:3000/docs/api) (dev) |
| **OpenAPI JSON** | [`/api/openapi`](http://localhost:3000/api/openapi) |

## Regenerate the path catalog

After adding or renaming API routes, refresh the spec:

```bash
node scripts/generate-openapi.js
```

This rewrites `src/openapi/openapi.json`. Edit `scripts/generate-openapi.js` to add rows for new endpoints.

## NestJS / codegen

- Import `/api/openapi` into Swagger Editor, Postman, or `openapi-generator`.
- Business rules and domain model (for implementing the same logic in Nest) are in **`docs/BACKEND_BUSINESS_LOGIC.md`**.

## Base URL

`NEXT_PUBLIC_APP_URL` (or Vercel URL) is injected into the OpenAPI `servers[0]` entry when you hit `/api/openapi`.
