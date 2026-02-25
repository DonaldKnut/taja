# 🌱 Database Seeding Guide

## ✅ **Yes, You Should Seed Products!**

Seeding demo products is **highly recommended** because:

1. **Better User Experience** - New users see an active marketplace
2. **Examples for Sellers** - Shows sellers what good listings look like
3. **Testing** - Helps test all features with real data
4. **Marketing** - Makes the platform look established and trustworthy
5. **Onboarding** - Users can browse and understand the platform immediately

---

## 🚀 **How to Seed the Database**

### **Option 1: API Endpoint (Easiest)**

1. **Make sure you're logged in as admin** (or in development mode)
2. **Call the seed endpoint:**

```bash
# Using curl
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or use the browser console while logged in
fetch('/api/admin/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### **Option 2: Script (For Development)**

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the seed script
npm run seed
```

---

## 📦 **What Gets Seeded**

### **Categories (5)**
- Fashion & Clothing
- Handmade Crafts
- Accessories
- Vintage Items
- Home & Decor

### **Demo Shops (3)**
1. **Vintage Finds Lagos** - Vintage clothing and accessories
2. **Handmade by Chioma** - Handmade Ankara products
3. **Thrift Fashion Hub** - Affordable thrift fashion

### **Demo Products (7+)**
- Vintage Denim Jacket
- Leather Handbag
- Designer Sunglasses
- Handmade Ankara Bag
- Beaded Ankara Jewelry Set
- Classic White Sneakers
- Vintage Floral Dress
- And more...

---

## 🎯 **Features of Seeded Data**

✅ **Realistic Nigerian Products**
- Authentic product names and descriptions
- Nigerian pricing (₦)
- Local shipping addresses (Lagos, Abuja, Port Harcourt)
- Nigerian-focused categories (Ankara, thrift fashion)

✅ **Complete Shop Profiles**
- Verified shops with KYC approved
- Shop descriptions and addresses
- Shop stats (followers, reviews, ratings)
- Active status

✅ **Realistic Product Data**
- Varied prices (₦8,000 - ₦18,000)
- Different conditions (new, like-new, good)
- Shipping costs and processing times
- Product specifications
- SEO tags
- Ratings and reviews

---

## 🔄 **Running Seed Multiple Times**

The seed script is **idempotent** - it's safe to run multiple times:
- ✅ Won't create duplicate categories
- ✅ Won't create duplicate shops
- ✅ Won't create duplicate products
- ✅ Updates existing data if needed

---

## 🎨 **Customizing Seed Data**

To add more products or shops, edit:
- `src/app/api/admin/seed/route.ts` - API endpoint version
- `src/scripts/seedDatabase.ts` - Script version

Add your products to the `demoProducts` array following the same structure.

---

## 📊 **After Seeding**

After running the seed:

1. **Visit Marketplace** - You'll see demo products
2. **Visit Shop Pages** - Each shop will have products
3. **Test Features** - Try adding to cart, checkout, etc.
4. **Show Users** - New users will see an active platform

---

## ⚠️ **Important Notes**

1. **Demo Accounts:**
   - Demo sellers have password: `DemoSeller123!`
   - Emails: `demo.*@taja.shop`
   - These are for demonstration only

2. **Production:**
   - Consider removing or clearly marking demo products in production
   - Or keep them as examples for new sellers

3. **Images:**
   - Currently uses placeholder images (`/placeholder-product.jpg`)
   - Replace with real product images for better presentation

---

## ✅ **Recommendation**

**Yes, definitely seed the database!** It makes your platform:
- Look professional and active
- Provide examples for new sellers
- Enable better testing
- Improve user onboarding experience

Run the seed now and your marketplace will look amazing! 🎉





