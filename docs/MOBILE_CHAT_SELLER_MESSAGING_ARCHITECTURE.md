# Seller Messaging Architecture + Mobile Implementation Guide

This document explains how buyer-to-seller messaging is built in the web app and how to implement the same behavior in React Native.

Primary references:

- `src/app/chat/page.tsx`
- `src/app/api/chat/route.ts`
- `src/app/api/chat/[id]/route.ts`
- `src/app/api/chat/[id]/messages/route.ts`
- `src/app/api/chat/[id]/read/route.ts`
- `src/models/Chat.ts`
- `src/lib/socket.ts`

---

## 1) Architecture overview

Messaging uses a **hybrid model**:

- **REST API** for bootstrap, chat creation, read state, fallback send.
- **Socket.IO** for real-time incoming messages + typing indicators.
- **MongoDB Chat model** as source of truth for threads and messages.

### Core entities

- **Chat**
  - participants[]
  - optional `product`
  - required `shop`
  - messages[]
  - `lastMessage`, `lastMessageAt`
  - per-user `unreadCount` map
  - `deletedBy` for soft delete per user

- **Message**
  - sender
  - content
  - type (`text | image | product | order`)
  - attachments[] (image URLs)
  - timestamps / read metadata

---

## 2) Endpoints consumed

## A) List user chats

- **GET** `/api/chat`
- Returns all chats where current user is participant and has not soft-deleted the thread.

Used on page load / refresh to populate sidebar.

---

## B) Create or get chat thread

- **POST** `/api/chat`
- Used when user opens chat from product/shop CTA.

Example payload (1:1 chat):

```json
{
  "sellerId": "SELLER_USER_ID",
  "productId": "optional_PRODUCT_ID",
  "shopId": "optional_SHOP_ID"
}
```

Server behavior:

- Resolves shop from `shopId`, or product, or seller’s shop.
- Reuses existing 1:1 chat if found.
- Creates new chat if not found.

Also supports group creation with `isGroup`, `name`, `additionalParticipants`.

---

## C) Get single chat details

- **GET** `/api/chat/:id`
- Returns one thread with participants/product/shop/messages.
- Validates current user is participant.

---

## D) Send message (REST fallback path)

- **POST** `/api/chat/:id/messages`

Payload:

```json
{
  "content": "hello",
  "type": "text",
  "attachments": ["https://..."]
}
```

Validation:

- content or attachments is required.
- sender must be a participant.

Used when socket is unavailable or as explicit fallback.

---

## E) Mark as read

- **PUT** `/api/chat/:id/read`
- Resets current user unread count for the thread.

Call this when user opens a conversation.

---

## F) Soft-delete chat

- **DELETE** `/api/chat/:id`
- Adds user to `deletedBy`.
- Thread disappears for that user only.

---

## 3) Real-time socket events

Socket is initialized with auth token:

- `io(NEXT_PUBLIC_SOCKET_URL || API_BASE_URL, { auth: { token } })`

## Client emits

- `join_chat` (chatId)
- `leave_chat` (chatId) optional
- `send_message` ({ chatId, content, type, attachments })
- `typing_start` (chatId)
- `typing_stop` (chatId)

## Client listens

- `new_message` -> append to thread + reorder chat list
- `user_typing` -> show typing indicator
- `user_stopped_typing` -> hide typing indicator
- `messages_read` -> update bubble read receipts instantly (`{ chatId, userId, readAt }`)

Server emits these from `src/lib/socket.ts`.

---

## 4) Mobile flow blueprint (React Native)

## Screen layout

- Left panel/right panel on web becomes:
  - `ChatListScreen`
  - `ChatThreadScreen`
  - or one screen with conditional views

## Startup flow

1. Load token from secure storage.
2. `GET /api/chat`.
3. If user came from product/shop “Message seller” CTA:
   - call `POST /api/chat` with seller/product/shop context.
   - navigate directly to that thread.

## Open thread flow

1. `join_chat(chatId)` socket event
2. `PUT /api/chat/:id/read`
3. Show messages sorted by timestamp

## Send flow

Preferred:

1. `socket.emit("send_message", payload)`
2. Optimistically render pending bubble (optional)
3. On `new_message`, replace/append final server message

Fallback:

1. `POST /api/chat/:id/messages`
2. Append returned message

## Attachment flow

1. Upload image to `/api/upload` (type `general`)
2. Receive URL
3. Send message with `attachments: [url]` and `type: "image"` (or `text` + attachment)

---

## 5) Suggested RN data models

```ts
type ChatUser = {
  _id: string;
  fullName: string;
  avatar?: string;
};

type ChatMessage = {
  _id: string;
  sender: string;
  content: string;
  type: "text" | "image" | "product" | "order";
  attachments?: string[];
  timestamp: string;
  readBy?: Array<{ user: string; readAt: string }>;
};

type ChatThread = {
  _id: string;
  participants: ChatUser[];
  product?: { _id: string; title: string; images?: string[]; price?: number; slug?: string };
  shop: { _id: string; shopName: string; shopSlug: string };
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  isGroup?: boolean;
  name?: string;
};
```

---

## 6) Auth and permissions

- All chat routes are protected with auth middleware.
- Required header for mobile:
  - `Authorization: Bearer <access_token>`
- Common auth errors:
  - `Unauthorized: missing token`
  - `Unauthorized: invalid token`

Thread-level authorization:

- user must be chat participant (or admin for specific cases).

---

## 7) Error-handling recommendations for mobile

- If `GET /api/chat` fails -> show retry + empty state.
- If socket fails -> stay in REST mode (`POST /messages`, periodic refresh optional).
- If message send fails -> keep draft in input and show toast/snackbar.
- If `403` on chat access -> show “You don’t have access to this conversation”.

---

## 8) Polling fallback (optional)

If socket is unstable in mobile networks:

- poll active thread every 3–5s with `GET /api/chat/:id`
- stop polling in background/inactive app state
- resume and mark read when app returns

---

## 9) Minimal endpoint checklist for mobile team

- `GET /api/chat`
- `POST /api/chat`
- `GET /api/chat/:id`
- `POST /api/chat/:id/messages`
- `PUT /api/chat/:id/read`
- `DELETE /api/chat/:id` (optional UX)
- `POST /api/upload` (for attachments)
- Socket events: `join_chat`, `send_message`, `typing_start`, `typing_stop`, `new_message`, `messages_read`

