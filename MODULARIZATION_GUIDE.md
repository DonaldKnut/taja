# 🎯 Component Modularization Guide

## Overview

All components in the app have been modularized following **DRY (Don't Repeat Yourself)** principles. This guide shows you how to use the modular components.

## 📦 Component Categories

### 1. **Product Components** (`@/components/product`)

#### `ProductCard`
Reusable product card with image, title, price, shop info, and actions.

```tsx
import { ProductCard } from "@/components/product";

<ProductCard 
  product={product} 
  variant="default" // or "minimal" | "emphasis_modal"
  showWishlist={true}
  showDiscount={true}
  showCondition={true}
/>
```

#### `ProductPrice`
Displays product price with optional compare-at price.

```tsx
import { ProductPrice } from "@/components/product";

<ProductPrice 
  price={10000} 
  compareAtPrice={15000}
  formatPrice={(p) => `₦${p.toLocaleString()}`}
/>
```

#### `ProductBadge`
Badges for products (discount, condition, verified, etc.).

```tsx
import { ProductBadge } from "@/components/product";

<ProductBadge variant="discount" value="20% OFF" />
<ProductBadge variant="condition" value="new" />
<ProductBadge variant="verified" value="Verified" />
```

---

### 2. **Cart Components** (`@/components/cart`)

#### `CartIcon`
Reusable cart icon with badge.

```tsx
import { CartIcon } from "@/components/cart";

<CartIcon 
  onClick={() => toggleCart()}
  className="p-2"
  iconSize="h-5 w-5"
/>
```

#### `CartItem`
Individual cart item display.

```tsx
import { CartItem } from "@/components/cart";

<CartItem item={cartItem} />
```

#### `CartDrawer`
Slide-out cart drawer.

```tsx
import { CartDrawer } from "@/components/cart";

<CartDrawer isOpen={isOpen} onClose={toggleCart} />
```

---

### 3. **Common Components** (`@/components/common`)

#### `IconButton`
Reusable icon button.

```tsx
import { IconButton } from "@/components/common";
import { Heart } from "lucide-react";

<IconButton 
  icon={Heart}
  onClick={handleWishlist}
  variant="default" // or "ghost" | "outline" | "primary" | "danger"
  size="md" // or "sm" | "lg"
  ariaLabel="Add to wishlist"
/>
```

---

### 4. **Shop Components** (`@/components/shop`)

#### `ShopLink`
Link to shop page.

```tsx
import { ShopLink } from "@/components/shop";

<ShopLink shopSlug="my-shop" shopName="My Shop" />
```

---

### 5. **Form Components** (`@/components/form`)

#### `FormField`
Wraps form inputs with label, error, and helper text.

```tsx
import { FormField } from "@/components/form";
import { Input } from "@/components/ui/Input";

<FormField 
  label="Email" 
  htmlFor="email"
  error={errors.email}
  helperText="Enter your email address"
  required
>
  <Input id="email" name="email" type="email" />
</FormField>
```

---

### 6. **Status Components** (`@/components/status`)

#### `StatusBadge`
Status badges with icons for orders, accounts, etc.

```tsx
import { StatusBadge } from "@/components/status";

<StatusBadge status="delivered" />
<StatusBadge status="pending" label="Awaiting Payment" />
<StatusBadge status="shipped" showIcon={true} size="lg" />
```

**Available statuses:**
- `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- `active`, `inactive`, `success`, `error`, `warning`, `info`

---

### 7. **Layout Components** (`@/components/layout`)

#### `Container`
Consistent container widths.

```tsx
import { Container } from "@/components/layout";

<Container size="lg" padding>
  <YourContent />
</Container>
```

#### `Section`
Consistent section spacing.

```tsx
import { Section } from "@/components/layout";

<Section variant="muted" padding="lg">
  <YourContent />
</Section>
```

---

### 8. **Modal Components** (`@/components/modal`)

#### `Modal`
Reusable modal/dialog.

```tsx
import { Modal } from "@/components/modal";

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
  description="Modal description"
  size="md" // or "sm" | "lg" | "xl" | "full"
>
  <p>Modal content</p>
</Modal>
```

---

## 🚀 Quick Import

Import from the main index for convenience:

```tsx
import { 
  ProductCard, 
  CartIcon, 
  IconButton, 
  StatusBadge,
  FormField,
  Container,
  Section,
  Modal
} from "@/components";
```

---

## 📝 Migration Guide

### Before (Duplicated Code):
```tsx
// In marketplace/page.tsx
const ProductCard = ({ product }) => {
  // 100+ lines of duplicated code
};

// In shop/page.tsx  
const ProductCard = ({ product }) => {
  // Same 100+ lines duplicated again
};
```

### After (Modular):
```tsx
// Anywhere in the app
import { ProductCard } from "@/components/product";

<ProductCard product={product} />
```

---

## ✅ Benefits

1. **DRY** - No code duplication
2. **Reusable** - Use components anywhere
3. **Maintainable** - Single source of truth
4. **Type-safe** - Full TypeScript support
5. **Consistent** - Same look and feel everywhere
6. **Customizable** - Extensive prop options

---

## 📚 Component Documentation

Each component category has its own README:
- `src/components/product/README.md` (if exists)
- `src/components/cart/README.md`
- `src/components/common/README.md` (if exists)
- etc.

---

## 🎨 Customization

All components accept `className` props for custom styling:

```tsx
<ProductCard 
  product={product}
  className="custom-class"
/>
```

Most components also have variant props for different styles:

```tsx
<IconButton 
  icon={Heart}
  variant="primary"
  size="lg"
/>
```

---

## 🔄 Updating Components

When you need to update a component:

1. **Update the modular component** in `src/components/[category]/`
2. **All usages automatically update** - no need to change multiple files!

---

## 📦 Component Structure

```
src/components/
├── product/          # Product-related components
│   ├── ProductCard.tsx
│   ├── ProductPrice.tsx
│   ├── ProductBadge.tsx
│   └── index.ts
├── cart/             # Cart components
│   ├── CartIcon.tsx
│   ├── CartItem.tsx
│   ├── CartDrawer.tsx
│   └── index.ts
├── common/           # Common reusable components
│   ├── IconButton.tsx
│   └── index.ts
├── form/             # Form components
│   ├── FormField.tsx
│   └── index.ts
├── status/           # Status components
│   ├── StatusBadge.tsx
│   └── index.ts
├── layout/           # Layout components
│   ├── Container.tsx
│   ├── Section.tsx
│   └── index.ts
├── modal/            # Modal components
│   ├── Modal.tsx
│   └── index.ts
└── index.ts          # Main export file
```

---

## 🎯 Best Practices

1. **Always use modular components** instead of duplicating code
2. **Import from `@/components`** for convenience
3. **Use TypeScript types** for better IDE support
4. **Customize with props** instead of modifying components
5. **Check component READMEs** for detailed usage examples

---

## 🐛 Need Help?

- Check component README files
- Look at usage examples in `USAGE_EXAMPLES.md`
- Check TypeScript types for available props
- Review existing implementations in the codebase

---

**Happy coding! 🚀**









