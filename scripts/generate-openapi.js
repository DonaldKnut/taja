/**
 * Regenerate src/openapi/openapi.json from route inventory.
 * Run: node scripts/generate-openapi.js
 */
const fs = require('fs');
const path = require('path');

const entries = [
  // Auth
  ['POST', '/api/auth/login', 'Auth', 'Login'],
  ['POST', '/api/auth/register', 'Auth', 'Register'],
  ['POST', '/api/auth/logout', 'Auth', 'Logout'],
  ['GET', '/api/auth/profile', 'Auth', 'Profile (session)'],
  ['PUT', '/api/auth/profile', 'Auth', 'Update profile'],
  ['GET', '/api/auth/google', 'Auth', 'Google OAuth start'],
  ['GET', '/api/auth/oauth/google/callback', 'Auth', 'Google callback'],
  ['GET', '/api/auth/oauth/callback', 'Auth', 'OAuth callback'],
  ['POST', '/api/auth/forgot-password', 'Auth', 'Forgot password'],
  ['POST', '/api/auth/reset-password', 'Auth', 'Reset password'],
  ['GET', '/api/auth/verify-reset-token', 'Auth', 'Verify reset token'],
  ['GET', '/api/auth/verify-reset-token/{token}', 'Auth', 'Verify reset token by path'],
  ['POST', '/api/auth/verify-email', 'Auth', 'Verify email'],
  ['POST', '/api/auth/send-email-verification', 'Auth', 'Resend verification'],
  // Users
  ['GET', '/api/users/me', 'Users', 'Current user'],
  ['PUT', '/api/users/me', 'Users', 'Update me'],
  ['DELETE', '/api/users/me', 'Users', 'Delete account'],
  ['GET', '/api/users/addresses', 'Users', 'List addresses'],
  ['POST', '/api/users/addresses', 'Users', 'Add address'],
  ['PATCH', '/api/users/addresses', 'Users', 'Patch address'],
  ['DELETE', '/api/users/addresses', 'Users', 'Delete address'],
  ['PUT', '/api/users/addresses/{id}', 'Users', 'Update address'],
  ['DELETE', '/api/users/addresses/{id}', 'Users', 'Delete address by id'],
  ['POST', '/api/users/select-role', 'Users', 'Select buyer/seller role'],
  ['POST', '/api/users/kyc/submit', 'Users', 'Submit KYC'],
  ['PUT', '/api/users/password', 'Users', 'Change password'],
  ['POST', '/api/users/avatar', 'Users', 'Upload avatar'],
  ['DELETE', '/api/users/avatar', 'Users', 'Remove avatar'],
  ['GET', '/api/users/export', 'Users', 'Export user data'],
  ['GET', '/api/users/payment-methods', 'Users', 'Payment methods'],
  ['POST', '/api/users/payment-methods', 'Users', 'Add payment method'],
  // Shops
  ['GET', '/api/shops', 'Shops', 'List shops'],
  ['POST', '/api/shops', 'Shops', 'Create shop'],
  ['GET', '/api/shops/my', 'Shops', 'My shop'],
  ['GET', '/api/shops/{shopId}', 'Shops', 'Shop by id'],
  ['PUT', '/api/shops/{shopId}', 'Shops', 'Update shop'],
  ['GET', '/api/shops/slug/{slug}', 'Shops', 'Shop by slug'],
  ['GET', '/api/shops/{shopId}/products', 'Shops', 'Shop products'],
  ['GET', '/api/shops/{shopId}/reviews', 'Shops', 'Shop reviews'],
  ['POST', '/api/shops/{shopId}/follow', 'Shops', 'Follow shop'],
  ['DELETE', '/api/shops/{shopId}/follow', 'Shops', 'Unfollow'],
  ['GET', '/api/shops/{shopId}/analytics', 'Shops', 'Shop analytics'],
  ['GET', '/api/shops/{shopId}/delivery-slots', 'Shops', 'Delivery slots'],
  // Products
  ['GET', '/api/products', 'Products', 'List products'],
  ['POST', '/api/products', 'Products', 'Create product'],
  ['GET', '/api/products/featured', 'Products', 'Featured'],
  ['GET', '/api/products/slug/{slug}', 'Products', 'Product by slug'],
  ['GET', '/api/products/{productId}', 'Products', 'Product by id'],
  ['PUT', '/api/products/{productId}', 'Products', 'Update product'],
  ['DELETE', '/api/products/{productId}', 'Products', 'Delete product'],
  // Cart
  ['GET', '/api/cart', 'Cart', 'Get cart'],
  ['POST', '/api/cart', 'Cart', 'Add to cart'],
  ['DELETE', '/api/cart', 'Cart', 'Clear cart'],
  ['PUT', '/api/cart/{itemId}', 'Cart', 'Update line'],
  ['DELETE', '/api/cart/{itemId}', 'Cart', 'Remove line'],
  ['POST', '/api/cart/merge', 'Cart', 'Merge guest cart'],
  // Orders
  ['GET', '/api/orders', 'Orders', 'List orders'],
  ['POST', '/api/orders', 'Orders', 'Create order'],
  ['GET', '/api/orders/{id}', 'Orders', 'Order detail'],
  ['PUT', '/api/orders/{id}', 'Orders', 'Update order'],
  ['DELETE', '/api/orders/{id}', 'Orders', 'Cancel order'],
  ['PATCH', '/api/orders/{id}/status', 'Orders', 'Status (seller/admin)'],
  ['POST', '/api/orders/{id}/confirm', 'Orders', 'Buyer confirm receipt'],
  ['POST', '/api/orders/{id}/confirm-delivery', 'Orders', 'Confirm delivery flow'],
  ['POST', '/api/orders/{id}/tracking', 'Orders', 'Add tracking'],
  ['PUT', '/api/orders/{id}/tracking', 'Orders', 'Update tracking'],
  ['POST', '/api/orders/{id}/dispute', 'Orders', 'Open dispute'],
  ['GET', '/api/orders/{id}/dispute', 'Orders', 'Dispute status'],
  // Payments & wallet
  ['GET', '/api/payments/config', 'Payments', 'Public payment config'],
  ['POST', '/api/payments/initialize', 'Payments', 'Initialize checkout'],
  ['GET', '/api/payments/verify', 'Payments', 'Verify transaction'],
  ['POST', '/api/payments/verify', 'Payments', 'Verify POST'],
  ['POST', '/api/payments/webhook/paystack', 'Payments', 'Paystack webhook'],
  ['POST', '/api/payments/webhook/flutterwave', 'Payments', 'Flutterwave webhook'],
  ['POST', '/api/payments/payout', 'Payments', 'Seller payout'],
  ['GET', '/api/wallet/balance', 'Wallet', 'Balance'],
  ['GET', '/api/wallet/transactions', 'Wallet', 'Transactions'],
  ['POST', '/api/wallet/fund', 'Wallet', 'Fund wallet'],
  ['GET', '/api/wallet/verify', 'Wallet', 'Verify wallet top-up'],
  // Marketplace & search
  ['GET', '/api/marketplace/feed', 'Marketplace', 'Discovery feed'],
  ['GET', '/api/search', 'Search', 'Search'],
  ['GET', '/api/search/suggestions', 'Search', 'Suggestions'],
  // Categories
  ['GET', '/api/categories', 'Categories', 'List categories'],
  ['POST', '/api/categories', 'Categories', 'Create (admin)'],
  ['GET', '/api/categories/{categoryId}', 'Categories', 'Category'],
  ['DELETE', '/api/categories/{categoryId}', 'Categories', 'Delete category'],
  ['GET', '/api/categories/{categoryId}/subcategories', 'Categories', 'Subcategories'],
  // Reviews & wishlist
  ['GET', '/api/reviews', 'Reviews', 'List reviews'],
  ['POST', '/api/reviews', 'Reviews', 'Create review'],
  ['GET', '/api/wishlist', 'Wishlist', 'List'],
  ['POST', '/api/wishlist', 'Wishlist', 'Add'],
  // Notifications
  ['GET', '/api/notifications', 'Notifications', 'List'],
  ['POST', '/api/notifications', 'Notifications', 'Create (internal)'],
  ['PUT', '/api/notifications/{id}', 'Notifications', 'Mark read'],
  ['DELETE', '/api/notifications/{id}', 'Notifications', 'Delete'],
  ['PUT', '/api/notifications/mark-all-read', 'Notifications', 'Mark all read'],
  ['GET', '/api/notifications/stream', 'Notifications', 'SSE stream'],
  // Chat
  ['GET', '/api/chat', 'Chat', 'Threads'],
  ['POST', '/api/chat', 'Chat', 'Start thread'],
  ['GET', '/api/chat/{id}', 'Chat', 'Thread'],
  ['DELETE', '/api/chat/{id}', 'Chat', 'Delete thread'],
  ['POST', '/api/chat/{id}/messages', 'Chat', 'Send message'],
  ['PUT', '/api/chat/{id}/read', 'Chat', 'Mark read'],
  // Support
  ['GET', '/api/support/tickets', 'Support', 'List tickets'],
  ['POST', '/api/support/tickets', 'Support', 'Create ticket'],
  ['GET', '/api/support/tickets/{id}', 'Support', 'Ticket'],
  ['PUT', '/api/support/tickets/{id}', 'Support', 'Update ticket'],
  ['POST', '/api/support/tickets/{id}/seen', 'Support', 'Mark seen (admin)'],
  ['POST', '/api/support/tickets/{id}/messages', 'Support', 'Reply'],
  ['POST', '/api/support/chat-thread', 'Support', 'Link chat to ticket'],
  // Delivery
  ['GET', '/api/delivery', 'Delivery', 'Quotes / options'],
  ['POST', '/api/delivery', 'Delivery', 'Book delivery'],
  ['GET', '/api/delivery/track/{trackingNumber}', 'Delivery', 'Track'],
  ['POST', '/api/delivery/webhook/kwik', 'Delivery', 'Kwik webhook'],
  ['POST', '/api/delivery/webhook/gokada', 'Delivery', 'Gokada webhook'],
  // Tracking
  ['GET', '/api/tracking/{trackingNumber}', 'Tracking', 'Public track'],
  ['GET', '/api/tracking/order/{orderId}', 'Tracking', 'Order tracking'],
  // Seller
  ['GET', '/api/seller/dashboard', 'Seller', 'Dashboard'],
  ['GET', '/api/seller/analytics', 'Seller', 'Analytics'],
  ['GET', '/api/seller/products', 'Seller', 'My products'],
  ['GET', '/api/seller/categories', 'Seller', 'Seller categories'],
  ['POST', '/api/seller/categories', 'Seller', 'Create category'],
  // Referrals
  ['GET', '/api/referrals/me', 'Referrals', 'My referral'],
  ['GET', '/api/referrals/referred-users', 'Referrals', 'Referred users'],
  ['POST', '/api/referrals/apply', 'Referrals', 'Apply code'],
  // Upload & config
  ['POST', '/api/upload', 'Upload', 'Multipart upload'],
  ['GET', '/api/config/paystack', 'Config', 'Paystack public key'],
  // Verify identity
  ['POST', '/api/verify/identity', 'KYC', 'Identity verification provider'],
  // AI
  ['POST', '/api/ai/analyze-image', 'AI', 'Analyze image'],
  ['POST', '/api/ai/generate-description', 'AI', 'Generate description'],
  ['POST', '/api/ai/suggest-tags', 'AI', 'Suggest tags'],
  ['POST', '/api/ai/product/tags', 'AI', 'Product tags'],
  ['POST', '/api/ai/product/description', 'AI', 'Product description'],
  ['POST', '/api/ai/shop-policies', 'AI', 'Shop policies'],
  ['POST', '/api/ai/shop-suggestions', 'AI', 'Shop suggestions'],
  ['POST', '/api/ai/virtual-tryon', 'AI', 'Virtual try-on'],
  ['POST', '/api/ai/style-recommendations', 'AI', 'Style recommendations'],
  ['GET', '/api/ai/inventory', 'AI', 'Inventory insights'],
  ['GET', '/api/ai/recommendations', 'AI', 'Recommendations'],
  ['POST', '/api/ai/recommendations', 'AI', 'Recommendations POST'],
  ['GET', '/api/ai/recommendations/homepage', 'AI', 'Homepage recs'],
  // Assistant
  ['POST', '/api/assistant/chat', 'AI', 'Shopping assistant'],
  // Blog
  ['GET', '/api/blog/posts', 'Blog', 'Posts'],
  ['POST', '/api/blog/posts', 'Blog', 'Create post'],
  ['GET', '/api/blog/posts/{slug}', 'Blog', 'Post by slug'],
  ['PUT', '/api/blog/posts/{slug}', 'Blog', 'Update post'],
  ['DELETE', '/api/blog/posts/{slug}', 'Blog', 'Delete post'],
  ['GET', '/api/blog/categories', 'Blog', 'Categories'],
  ['POST', '/api/blog/categories', 'Blog', 'Create category'],
  // Cron
  ['GET', '/api/cron/auto-confirm', 'Cron', 'Auto-confirm orders'],
  ['POST', '/api/cron/auto-confirm', 'Cron', 'Auto-confirm POST'],
  // Admin (representative)
  ['GET', '/api/admin/stats', 'Admin', 'Dashboard stats'],
  ['GET', '/api/admin/users', 'Admin', 'List users'],
  ['GET', '/api/admin/users/{userId}', 'Admin', 'User detail'],
  ['PUT', '/api/admin/users/{userId}', 'Admin', 'Update user'],
  ['GET', '/api/admin/users/export', 'Admin', 'Export users'],
  ['GET', '/api/admin/orders', 'Admin', 'Orders'],
  ['GET', '/api/admin/orders/export', 'Admin', 'Export orders'],
  ['GET', '/api/admin/shops', 'Admin', 'Shops'],
  ['POST', '/api/admin/shops', 'Admin', 'Create shop'],
  ['PUT', '/api/admin/shops/{shopId}', 'Admin', 'Update shop'],
  ['DELETE', '/api/admin/shops/{shopId}', 'Admin', 'Delete shop'],
  ['GET', '/api/admin/shops/pending', 'Admin', 'Pending shops'],
  ['PUT', '/api/admin/shops/{shopId}/review', 'Admin', 'Approve/reject shop'],
  ['GET', '/api/admin/shops/export', 'Admin', 'Export shops'],
  ['GET', '/api/admin/products', 'Admin', 'Products'],
  ['POST', '/api/admin/products', 'Admin', 'Create product'],
  ['PUT', '/api/admin/products/{productId}', 'Admin', 'Update product'],
  ['GET', '/api/admin/products/stats', 'Admin', 'Product stats'],
  ['GET', '/api/admin/kyc', 'Admin', 'KYC list'],
  ['GET', '/api/admin/kyc/pending', 'Admin', 'Pending KYC'],
  ['PUT', '/api/admin/kyc/{userId}', 'Admin', 'Review KYC'],
  ['POST', '/api/admin/kyc/reminder', 'Admin', 'KYC reminder email'],
  ['GET', '/api/admin/disputes', 'Admin', 'Disputes'],
  ['GET', '/api/admin/disputes/{id}', 'Admin', 'Dispute detail'],
  ['PUT', '/api/admin/disputes/{id}', 'Admin', 'Resolve dispute'],
  ['GET', '/api/admin/sellers/earnings', 'Admin', 'Seller earnings'],
  ['POST', '/api/admin/broadcast', 'Admin', 'Broadcast notification'],
  ['GET', '/api/admin/subscribers', 'Admin', 'Subscribers'],
  ['POST', '/api/admin/notifications', 'Admin', 'Send notification'],
  ['GET', '/api/admin/settings/payments', 'Admin', 'Payment settings'],
  ['PUT', '/api/admin/settings/payments', 'Admin', 'Update payment settings'],
  ['GET', '/api/admin/settings/referral', 'Admin', 'Referral settings'],
  ['PUT', '/api/admin/settings/referral', 'Admin', 'Update referral'],
  ['POST', '/api/admin/search/sync', 'Admin', 'Search sync'],
  ['PUT', '/api/admin/search/sync', 'Admin', 'Search sync PUT'],
  ['GET', '/api/admin/search/sync', 'Admin', 'Search sync status'],
  ['DELETE', '/api/admin/cleanup', 'Admin', 'Cleanup'],
  ['POST', '/api/admin/seed', 'Admin', 'Seed DB'],
  ['DELETE', '/api/admin/seed', 'Admin', 'Clear seed'],
];

const methodLower = (m) => m.toLowerCase();
const paths = {};
const tagSet = new Set();

for (const [method, p, tag, summary] of entries) {
  tagSet.add(tag);
  if (!paths[p]) paths[p] = {};
  paths[p][methodLower(method)] = {
    tags: [tag],
    summary,
    responses: {
      '200': { description: 'Success (see route implementation for shape)' },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden' },
      '404': { description: 'Not found' },
    },
  };
}

const tags = [...tagSet].sort().map((name) => ({ name, description: `${name} endpoints` }));

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Authorization: Bearer <token> where required',
    },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
      },
      required: ['success', 'message'],
    },
    PaymentInitializeRequest: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: '65f2f3c5aa1c9f0012345678' },
        provider: { type: 'string', enum: ['auto', 'paystack', 'flutterwave'], default: 'auto' },
      },
      required: ['orderId'],
    },
    PaymentInitializeResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment initialized successfully' },
        data: {
          type: 'object',
          properties: {
            paymentUrl: { type: 'string', format: 'uri' },
            reference: { type: 'string' },
            orderId: { type: 'string' },
          },
          required: ['paymentUrl', 'reference', 'orderId'],
        },
      },
    },
    PaymentVerifyWebhookRequest: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['auto', 'paystack', 'flutterwave'], default: 'auto' },
        reference: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            reference: { type: 'string' },
            tx_ref: { type: 'string' },
          },
        },
      },
    },
    OrderDisputeCreateRequest: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['not_received', 'damaged', 'wrong_item', 'not_as_described', 'other'],
        },
        description: { type: 'string', minLength: 3 },
        evidence: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
        },
      },
      required: ['reason', 'description'],
    },
    OrderDisputeCreateResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Dispute opened successfully' },
        data: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            status: { type: 'string', example: 'disputed' },
            dispute: {
              type: 'object',
              properties: {
                openedAt: { type: 'string', format: 'date-time' },
                reason: { type: 'string' },
                status: { type: 'string', example: 'open' },
              },
            },
          },
        },
      },
    },
  },
};

const setOperation = (pathKey, method, patch) => {
  if (!paths[pathKey] || !paths[pathKey][method]) return;
  paths[pathKey][method] = { ...paths[pathKey][method], ...patch };
};

setOperation('/api/payments/initialize', 'post', {
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/PaymentInitializeRequest' },
      },
    },
  },
  responses: {
    '200': {
      description: 'Payment initialized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PaymentInitializeResponse' },
        },
      },
    },
    '400': { description: 'Validation error' },
    '403': { description: 'Unauthorized buyer/order mismatch' },
    '404': { description: 'Order not found' },
  },
});

setOperation('/api/payments/verify', 'post', {
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/PaymentVerifyWebhookRequest' },
      },
    },
  },
  responses: {
    '200': { description: 'Webhook processed or already processed' },
    '400': { description: 'Reference missing' },
    '404': { description: 'Order not found' },
  },
});

setOperation('/api/orders/{id}/dispute', 'post', {
  security: [{ bearerAuth: [] }],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/OrderDisputeCreateRequest' },
      },
    },
  },
  responses: {
    '200': {
      description: 'Dispute opened',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/OrderDisputeCreateResponse' },
        },
      },
    },
    '400': { description: 'Validation or rule check failed' },
    '403': { description: 'Only buyer can dispute' },
    '404': { description: 'Order not found' },
  },
});

const doc = {
  openapi: '3.0.3',
  info: {
    title: 'Taja Shop API',
    description:
      'OpenAPI map of Next.js `/api/*` routes. Request/response bodies match Zod/Mongoose usage in each `route.ts`. Full business rules: **docs/BACKEND_BUSINESS_LOGIC.md**. Swagger UI: `/docs/api`.',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Override via NEXT_PUBLIC_APP_URL' }],
  tags,
  paths,
  components,
};

const out = path.join(__dirname, '..', 'src', 'openapi', 'openapi.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 2));
console.log('Wrote', out, 'paths:', Object.keys(paths).length);
