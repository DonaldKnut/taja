/**
 * Fallback OpenAPI document if openapi.json is missing.
 * Prefer editing src/openapi/openapi.json for Swagger.
 */
export function getOpenApiDocument(serverUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Taja Shop API',
      description:
        'Next.js App Router API routes. Use **/docs/api** for Swagger UI. See **docs/BACKEND_BUSINESS_LOGIC.md** for NestJS parity.',
      version: '1.0.0',
    },
    servers: [{ url: serverUrl, description: 'API base' }],
    tags: [
      { name: 'Auth', description: 'Login, register, OAuth, password, email verification' },
      { name: 'Users', description: 'Profile, addresses, KYC, role' },
      { name: 'Shops', description: 'Shop CRUD, slug, follow, analytics' },
      { name: 'Products', description: 'Catalog, featured, seller products' },
      { name: 'Cart', description: 'Cart and merge' },
      { name: 'Orders', description: 'Checkout, tracking, confirm, disputes' },
      { name: 'Payments', description: 'Initialize, verify, webhooks, payout' },
      { name: 'Wallet', description: 'Balance, fund, transactions' },
      { name: 'Admin', description: 'Admin-only operations' },
      { name: 'Support', description: 'Tickets and chat thread' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Delivery', description: 'Delivery quotes and carrier webhooks' },
      { name: 'AI', description: 'AI-assisted seller features' },
    ],
    paths: {
      '/api/auth/login': {
        post: { tags: ['Auth'], summary: 'Email/password login', responses: { '200': { description: 'Tokens / user' } } },
      },
      '/api/auth/register': {
        post: { tags: ['Auth'], summary: 'Register buyer/seller', responses: { '201': { description: 'Created' } } },
      },
      '/api/auth/logout': {
        post: { tags: ['Auth'], summary: 'Invalidate session', responses: { '200': { description: 'OK' } } },
      },
      '/api/users/me': {
        get: { tags: ['Users'], summary: 'Current user', security: [{ bearerAuth: [] }] },
        put: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }] },
      },
      '/api/shops': {
        get: { tags: ['Shops'], summary: 'List shops (public filters)' },
        post: { tags: ['Shops'], summary: 'Create shop', security: [{ bearerAuth: [] }] },
      },
      '/api/shops/slug/{slug}': {
        get: { tags: ['Shops'], summary: 'Shop by slug (404 if pending unless owner/admin)' },
      },
      '/api/products': {
        get: { tags: ['Products'], summary: 'List/search products' },
        post: { tags: ['Products'], summary: 'Create product', security: [{ bearerAuth: [] }] },
      },
      '/api/orders': {
        get: { tags: ['Orders'], summary: 'User orders', security: [{ bearerAuth: [] }] },
        post: { tags: ['Orders'], summary: 'Create order', security: [{ bearerAuth: [] }] },
      },
      '/api/cart': {
        get: { tags: ['Cart'], summary: 'Get cart' },
        post: { tags: ['Cart'], summary: 'Add item' },
        delete: { tags: ['Cart'], summary: 'Clear cart' },
      },
      '/api/payments/initialize': {
        post: { tags: ['Payments'], summary: 'Start Paystack/Flutterwave payment', security: [{ bearerAuth: [] }] },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Authorization: Bearer <access_token>',
        },
      },
    },
  };
}
