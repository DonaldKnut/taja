# Cart Components

Modular, reusable cart components following DRY (Don't Repeat Yourself) principles.

## Components

### `CartIcon`
A reusable cart icon button with optional badge showing item count.

**Usage:**
```tsx
import { CartIcon } from "@/components/cart";

// Basic usage
<CartIcon />

// With custom styling
<CartIcon 
  className="fixed bottom-6 right-6 z-50 bg-taja-primary text-white p-4 rounded-full"
  iconClassName="text-white"
  onClick={() => toggleCart()}
/>

// Without badge
<CartIcon showBadge={false} />

// Custom badge position
<CartIcon badgePosition="bottom-left" />
```

**Props:**
- `onClick?: () => void` - Click handler (defaults to `toggleCart`)
- `className?: string` - Custom button className
- `iconSize?: "h-4 w-4" | "h-5 w-5" | "h-6 w-6" | "h-8 w-8"` - Icon size
- `showBadge?: boolean` - Show item count badge (default: true)
- `badgePosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left"` - Badge position
- `badgeClassName?: string` - Custom badge className
- `iconClassName?: string` - Custom icon className
- `disabled?: boolean` - Disable button
- `ariaLabel?: string` - Accessibility label

---

### `CartItem`
Displays a single cart item with image, title, price, quantity controls, and remove button.

**Usage:**
```tsx
import { CartItem, useCartStore } from "@/components/cart";

function MyCartList() {
  const { items } = useCartStore();
  
  return (
    <div>
      {items.map((item) => (
        <CartItem key={item._id} item={item} />
      ))}
    </div>
  );
}
```

**Props:**
- `item: CartItem` - Cart item data
- `className?: string` - Custom container className
- `showLink?: boolean` - Show product link (default: true)
- `formatPrice?: (price: number) => string` - Custom price formatter
- `imageSize?: number` - Image size in pixels (default: 80)

---

### `CartDrawer`
A slide-out cart drawer with cart items, total, and checkout button.

**Usage:**
```tsx
import { CartDrawer, useCartStore } from "@/components/cart";

function MyComponent() {
  const { isOpen, toggleCart } = useCartStore();
  
  return (
    <CartDrawer 
      isOpen={isOpen} 
      onClose={toggleCart}
    />
  );
}
```

**Props:**
- `isOpen: boolean` - Whether drawer is open
- `onClose: () => void` - Function to close drawer
- `className?: string` - Custom drawer className
- `overlayClassName?: string` - Custom overlay className
- `formatPrice?: (price: number) => string` - Custom price formatter
- `emptyMessage?: { title?: string; subtitle?: string }` - Custom empty message
- `checkoutButtonText?: string` - Checkout button text
- `checkoutUrl?: string` - Checkout URL (default: "/checkout")
- `showCheckout?: boolean` - Show checkout button (default: true)

---

## Examples

### Using CartIcon in Navigation
```tsx
import { CartIcon } from "@/components/cart";

function Navigation() {
  return (
    <nav>
      <CartIcon 
        className="p-2 hover:bg-gray-100 rounded-lg"
        iconSize="h-5 w-5"
      />
    </nav>
  );
}
```

### Using CartIcon in Header
```tsx
import { CartIcon } from "@/components/cart";

function Header() {
  return (
    <header>
      <div className="flex items-center gap-4">
        <Logo />
        <CartIcon 
          className="ml-auto"
          ariaLabel="View shopping cart"
        />
      </div>
    </header>
  );
}
```

### Custom Cart Display
```tsx
import { CartItem, CartDrawer, useCartStore } from "@/components/cart";

function CustomCartPage() {
  const { items, isOpen, toggleCart } = useCartStore();
  
  return (
    <div>
      <h1>My Cart</h1>
      {items.map((item) => (
        <CartItem 
          key={item._id} 
          item={item}
          formatPrice={(price) => `$${price.toFixed(2)}`}
          imageSize={120}
        />
      ))}
      
      <CartDrawer 
        isOpen={isOpen}
        onClose={toggleCart}
        checkoutUrl="/custom-checkout"
      />
    </div>
  );
}
```

---

## Store

The cart state is managed by Zustand store at `@/stores/cartStore`.

**Available hooks:**
```tsx
import { useCartStore } from "@/components/cart";

const {
  items,              // Cart items array
  isOpen,             // Drawer open state
  addItem,            // Add item to cart
  removeItem,         // Remove item from cart
  updateQuantity,     // Update item quantity
  clearCart,          // Clear all items
  toggleCart,         // Toggle drawer
  getTotalPrice,      // Get total price
  getTotalItems,      // Get total item count
} = useCartStore();
```

---

## Benefits

✅ **DRY Principle** - No code duplication  
✅ **Reusable** - Use cart icon anywhere in the app  
✅ **Modular** - Each component has a single responsibility  
✅ **Type-safe** - Full TypeScript support  
✅ **Customizable** - Extensive prop options  
✅ **Accessible** - ARIA labels and semantic HTML  









