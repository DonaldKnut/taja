// Use internal API routes
export async function getCart(token?: string) {
  const res = await fetch(`/api/cart`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}

export async function mergeCart(
  items: Array<{ product: string; quantity: number }>,
  token?: string
) {
  const res = await fetch(`/api/cart/merge`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function addOrUpdateItem(
  productId: string,
  quantity?: number,
  token?: string
) {
  const res = await fetch(`/api/cart`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productId, quantity }),
  });
  return res.json();
}

export async function updateQuantity(
  itemId: string,
  quantity: number,
  token?: string
) {
  const res = await fetch(`/api/cart/${itemId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function removeItem(itemId: string, token?: string) {
  const res = await fetch(`/api/cart/${itemId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}

export async function clearCart(token?: string) {
  const res = await fetch(`/api/cart`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}









