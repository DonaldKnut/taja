# Cart Components - Usage Examples

## Quick Start

### 1. Using CartIcon in Navigation Bar

```tsx
import { CartIcon } from "@/components/cart";

function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4">
      <Logo />
      <CartIcon 
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        iconSize="h-5 w-5"
      />
    </nav>
  );
}
```

### 2. Using CartIcon in Header

```tsx
import { CartIcon } from "@/components/cart";

function Header() {
  return (
    <header className="sticky top-0 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Logo />
        <div className="flex items-center gap-4">
          <CartIcon 
            className="relative"
            ariaLabel="View shopping cart"
          />
        </div>
      </div>
    </header>
  );
}
```

### 3. Using CartIcon as Floating Button

```tsx
import { CartIcon } from "@/components/cart";

function FloatingCartButton() {
  return (
    <CartIcon
      className="fixed bottom-6 right-6 z-50 bg-taja-primary text-white p-4 rounded-full shadow-lg hover:bg-emerald-600 transition-all"
      iconClassName="text-white"
    />
  );
}
```

### 4. Using CartIcon with Custom Click Handler

```tsx
import { CartIcon, useCartStore } from "@/components/cart";

function CustomCartButton() {
  const { toggleCart } = useCartStore();
  
  const handleClick = () => {
    console.log("Cart clicked!");
    toggleCart();
  };
  
  return (
    <CartIcon 
      onClick={handleClick}
      className="p-2"
    />
  );
}
```

### 5. Using CartIcon Without Badge

```tsx
import { CartIcon } from "@/components/cart";

function SimpleCartIcon() {
  return (
    <CartIcon 
      showBadge={false}
      className="p-2"
    />
  );
}
```

### 6. Using CartDrawer Standalone

```tsx
import { CartDrawer, useCartStore } from "@/components/cart";
import { useState } from "react";

function MyCartPage() {
  const { isOpen, toggleCart } = useCartStore();
  
  return (
    <div>
      <button onClick={toggleCart}>Open Cart</button>
      <CartDrawer 
        isOpen={isOpen}
        onClose={toggleCart}
      />
    </div>
  );
}
```

### 7. Using CartItem in Custom Layout

```tsx
import { CartItem, useCartStore } from "@/components/cart";

function CustomCartList() {
  const { items } = useCartStore();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <CartItem 
          key={item._id} 
          item={item}
          imageSize={120}
          formatPrice={(price) => `$${price.toFixed(2)}`}
        />
      ))}
    </div>
  );
}
```

### 8. Complete Example: Cart in Product Page

```tsx
import { CartIcon, CartDrawer, useCartStore } from "@/components/cart";
import { useCartStore as useCart } from "@/stores/cartStore";

function ProductPage() {
  const { isOpen, toggleCart, addItem } = useCart();
  const product = { /* product data */ };
  
  const handleAddToCart = () => {
    addItem({
      _id: product.id,
      title: product.title,
      price: product.price,
      images: product.images,
      seller: product.sellerId,
      shopSlug: product.shopSlug,
    });
    toggleCart(); // Open cart after adding
  };
  
  return (
    <div>
      <button onClick={handleAddToCart}>Add to Cart</button>
      
      {/* Cart Icon in Header */}
      <CartIcon 
        className="fixed top-4 right-4 z-50"
        onClick={toggleCart}
      />
      
      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isOpen}
        onClose={toggleCart}
      />
    </div>
  );
}
```

### 9. Using CartIcon with Different Sizes

```tsx
import { CartIcon } from "@/components/cart";

function DifferentSizes() {
  return (
    <div className="flex items-center gap-4">
      <CartIcon iconSize="h-4 w-4" />
      <CartIcon iconSize="h-5 w-5" />
      <CartIcon iconSize="h-6 w-6" />
      <CartIcon iconSize="h-8 w-8" />
    </div>
  );
}
```

### 10. Custom Badge Position

```tsx
import { CartIcon } from "@/components/cart";

function CustomBadge() {
  return (
    <div className="flex items-center gap-4">
      <CartIcon badgePosition="top-right" />
      <CartIcon badgePosition="top-left" />
      <CartIcon badgePosition="bottom-right" />
      <CartIcon badgePosition="bottom-left" />
    </div>
  );
}
```

---

## Benefits of Modular Design

✅ **Reusable** - Use `CartIcon` anywhere in your app  
✅ **DRY** - No code duplication  
✅ **Maintainable** - Single source of truth for cart UI  
✅ **Flexible** - Extensive customization options  
✅ **Type-safe** - Full TypeScript support  









