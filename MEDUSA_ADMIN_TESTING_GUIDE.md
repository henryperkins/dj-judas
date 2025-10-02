# Medusa Admin Testing Guide
**Complete Workflow for Testing Checkout Enhancements**

## Our Admin Implementation

### ✅ What We Built

We created a **secure proxy layer** between your frontend and Medusa Admin API:

```
Frontend (React) → Worker (Hono) → Medusa Admin API
                    ↑
                 Auth layer
              (JWT + HttpOnly cookies)
```

### Available Admin Endpoints

| Endpoint | Method | Purpose | Medusa API |
|----------|--------|---------|------------|
| `/api/admin/login` | POST | Authenticate admin user | `POST /admin/auth` |
| `/api/admin/logout` | POST | Clear admin session | Custom |
| `/api/admin/session` | GET | Check if authenticated | Validates token |
| `/api/admin/products` | GET | List products | `GET /admin/products` |
| `/api/admin/products` | POST | Create product | `POST /admin/products` |
| `/api/admin/products/:id` | GET | Get product | `GET /admin/products/:id` |
| `/api/admin/products/:id` | PATCH | Update product | `PATCH /admin/products/:id` |
| `/api/admin/products/:id/variants` | POST | Add variant | `POST /admin/products/:id/variants` |
| `/api/admin/variants/:id` | PATCH | Update variant | `PATCH /admin/variants/:id` |
| `/api/admin/variants/:id` | DELETE | Remove variant | `DELETE /admin/variants/:id` |

**Authentication:** Uses JWT Bearer tokens stored in HttpOnly cookies (`medusa_admin_jwt`)

---

## Setting Up Test Data

Once you have Medusa access (Cloud or local), follow these steps:

### Step 1: Access Admin Panel

**Option A: Medusa Cloud**
```
URL: https://app.medusajs.com
Login with your Medusa account
```

**Option B: Local Medusa**
```
URL: http://localhost:9000/app
Default: admin@medusa-test.com / supersecret
```

**Option C: Our Custom Admin UI**
```
URL: http://localhost:5173/admin/login
Login with Medusa credentials
Uses our worker proxy layer
```

---

### Step 2: Create Products

#### Via Medusa Admin UI:

1. **Navigate to Products** → **Add Product**

2. **Fill Basic Info:**
   ```
   Title: Gospel Album - Vol 1
   Description: Powerful worship music for your soul
   Handle: gospel-album-vol-1 (auto-generated)
   ```

3. **Add Images:**
   - Upload product photo
   - Set as thumbnail

4. **Add Variant (Pricing):**
   ```
   Title: Default
   SKU: GOSPEL-001
   Price: $15.00 USD
   Inventory: 100 units
   ```

5. **Set Status:** Published

6. **Repeat for 2-3 more products**

---

### Step 3: Create Promotion/Discount

This is **critical** for testing our discount display features!

#### Via Medusa Admin UI:

1. **Navigate to Promotions** → **Create Promotion**

2. **Basic Settings:**
   ```
   Name: 20% Off Spring Sale
   Code: SPRING20
   Type: Percentage
   Value: 20
   ```

3. **Application:**
   ```
   Apply to: All Products
   OR
   Apply to: Specific Products (select your test products)
   ```

4. **Rules (Optional):**
   ```
   Minimum Purchase Amount: $10.00
   Maximum Discount: $50.00
   Usage Limit: Unlimited (for testing)
   ```

5. **Schedule:**
   ```
   Start: Today
   End: 30 days from now
   ```

6. **Save & Activate**

#### Via API (Advanced):

```bash
curl -X POST https://your-medusa.app/admin/promotions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SPRING20",
    "type": "percentage",
    "value": 20,
    "is_automatic": false
  }'
```

---

### Step 4: Configure Shipping Options

#### Via Medusa Admin UI:

1. **Navigate to Settings** → **Regions**

2. **Select Region** (e.g., "United States")

3. **Scroll to Shipping Options** → **Add Shipping Option**

4. **Configure:**
   ```
   Name: Standard Shipping
   Price Type: Flat Rate
   Price: $5.00
   Provider: Manual Fulfillment (default)
   ```

5. **Add More Options (Optional):**
   ```
   Name: Express Shipping
   Price: $15.00

   Name: Free Shipping
   Price: $0.00
   Requirement: Min order $50
   ```

6. **Save**

#### Via API (Advanced):

```bash
curl -X POST https://your-medusa.app/admin/shipping-options \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Shipping",
    "region_id": "reg_xxx",
    "provider_id": "manual",
    "price_type": "flat_rate",
    "amount": 500,
    "requirements": []
  }'
```

---

### Step 5: Set Up Environment Variables

Update your `.env` file:

```bash
# Medusa Storefront
VITE_MEDUSA_URL=https://your-store.medusajs.app
VITE_MEDUSA_PUBLISHABLE_KEY=pk_01J1X2Y3Z4...

# Medusa Admin (Worker)
MEDUSA_URL=https://your-store.medusajs.app
```

**Get Publishable Key:**
- Medusa Admin → Settings → Publishable API Keys
- Copy the key starting with `pk_`

---

## Testing Workflow

### Phase 1: Basic Cart Operations

1. **Start Dev Server:**
   ```bash
   npm run dev
   # Visit: http://localhost:5173
   ```

2. **Test Product Display:**
   - [ ] Products load on homepage
   - [ ] Images display correctly
   - [ ] Prices show in correct format

3. **Test Add to Cart:**
   - [ ] Click "Add to Cart" on a product
   - [ ] Redirects to `/checkout`
   - [ ] Item appears in Order Summary
   - [ ] Quantity shows as 1

### Phase 2: Quantity Controls

4. **Test Increase Quantity:**
   - [ ] Click `+` button
   - [ ] Quantity updates to 2
   - [ ] Line total updates (2 × price)
   - [ ] Subtotal updates
   - [ ] Grand total updates

5. **Test Decrease Quantity:**
   - [ ] Click `-` button
   - [ ] Quantity decreases
   - [ ] Totals recalculate

6. **Test Remove Item:**
   - [ ] Decrease to 0
   - [ ] Item removed from cart
   - [ ] Or use remove button (if implemented)

### Phase 3: Discount Features

7. **Apply Promotion Code:**

   **In Browser Console:**
   ```javascript
   // Add discount code to cart
   fetch('/api/medusa-proxy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       path: `/store/carts/${localStorage.getItem('medusa_cart_id')}/discounts`,
       body: { code: 'SPRING20' }
     })
   }).then(() => location.reload())
   ```

   **OR use Medusa SDK if exposed in UI**

8. **Verify Discount Display:**

   **Line-Item Discounts:**
   - [ ] Green text appears under each item
   - [ ] Shows: "Discount: -$X.XX"
   - [ ] Amount is 20% of item total

   **Applied Promotions Section:**
   - [ ] "Applied Promotions:" header appears
   - [ ] Shows "SPRING20"
   - [ ] Shows "20% off"

   **Discount Total Row:**
   - [ ] "Discount" row in summary (green)
   - [ ] Shows: "-$X.XX"
   - [ ] Placed between Shipping and Tax

9. **Verify Total Calculation:**
   ```
   Subtotal:  $30.00
   Shipping:  $ 5.00
   Discount: -$ 6.00  ← Should be 20% of subtotal
   Tax:       $ 2.32
   ─────────────────
   Total:     $31.32
   ```

### Phase 4: Shipping Options

10. **Enter Shipping Address:**
    - [ ] Fill email, name, address
    - [ ] Click "Save address"
    - [ ] Loading state shows
    - [ ] Success confirmation

11. **Load Shipping Options:**
    - [ ] Click "Load options" button
    - [ ] Options appear (Standard, Express, Free)
    - [ ] Prices display correctly

12. **Select Shipping Method:**
    - [ ] Click a shipping option
    - [ ] Loading spinner shows ✨ (NEW)
    - [ ] Option highlights as selected
    - [ ] Shipping total updates in summary ✨ (NEW)
    - [ ] Grand total recalculates ✨ (NEW)

13. **Change Shipping Method:**
    - [ ] Click different option
    - [ ] Previous option deselects
    - [ ] New option selected
    - [ ] Totals update again

### Phase 5: Complete Checkout

14. **Payment:**
    - [ ] Click "Pay (Medusa provider)" OR "Pay with Stripe"
    - [ ] Loading state shows
    - [ ] Redirects to success page

15. **Success Page:**
    - [ ] Green success alert displays
    - [ ] Order ID shown
    - [ ] Cart cleared (localStorage)

---

## API Response Examples

### Cart with Discounts (What to Expect):

```json
{
  "cart": {
    "id": "cart_01J...",
    "items": [
      {
        "id": "item_01J...",
        "title": "Gospel Album - Vol 1",
        "quantity": 2,
        "unit_price": 1500,
        "subtotal": 3000,
        "total": 2400,
        "adjustments": [
          {
            "id": "adj_01J...",
            "amount": 600,
            "code": "SPRING20",
            "description": "20% Off Spring Sale"
          }
        ]
      }
    ],
    "promotions": [
      {
        "id": "promo_01J...",
        "code": "SPRING20",
        "is_automatic": false,
        "application_method": {
          "type": "percentage",
          "value": "20",
          "currency_code": "usd"
        }
      }
    ],
    "region": {
      "currency_code": "usd"
    },
    "shipping_methods": [
      {
        "id": "sm_01J...",
        "shipping_option_id": "so_01J...",
        "amount": 500,
        "name": "Standard Shipping"
      }
    ],
    "subtotal": 3000,
    "discount_total": 600,
    "shipping_total": 500,
    "tax_total": 272,
    "total": 3172
  }
}
```

---

## Troubleshooting

### Products Don't Load
**Check:**
- [ ] `VITE_MEDUSA_URL` is set correctly
- [ ] Products are "Published" status in Medusa
- [ ] CORS is enabled on Medusa backend
- [ ] Browser console for errors

**Fix:**
```bash
# Verify connection
curl https://your-medusa.app/store/products?limit=1
```

### Discounts Don't Show
**Check:**
- [ ] Promotion is active (not expired)
- [ ] Promotion code is correct (case-sensitive)
- [ ] Promotion applies to products in cart
- [ ] Cart total meets minimum requirements

**Debug:**
```javascript
// In browser console
const cart = await fetch(`${VITE_MEDUSA_URL}/store/carts/${localStorage.getItem('medusa_cart_id')}`).then(r => r.json())
console.log('Promotions:', cart.cart.promotions)
console.log('Item adjustments:', cart.cart.items[0].adjustments)
```

### Shipping Options Empty
**Check:**
- [ ] Shipping address is saved first
- [ ] Shipping options configured for region
- [ ] Fulfillment provider is enabled

**Fix:**
```bash
# Check region has shipping options
curl https://your-medusa.app/admin/regions/reg_xxx \
  -H "Authorization: Bearer YOUR_JWT"
```

### Loading States Don't Show
**Check:**
- [ ] Latest code deployed (`npm run build`)
- [ ] Browser cache cleared
- [ ] Dev server restarted

**Verify in Code:**
```typescript
// CheckoutPage.tsx should have:
const [shippingBusy, setShippingBusy] = useState(false)
```

---

## Quick Reference: Admin API Endpoints

### Authentication
```bash
POST /admin/auth
Body: { "email": "admin@example.com", "password": "secret" }
Response: { "token": "jwt_token..." }
```

### Products
```bash
GET    /admin/products              # List all
POST   /admin/products              # Create
GET    /admin/products/:id          # Get one
PATCH  /admin/products/:id          # Update
DELETE /admin/products/:id          # Delete
```

### Promotions
```bash
GET    /admin/promotions            # List all
POST   /admin/promotions            # Create
GET    /admin/promotions/:id        # Get one
PATCH  /admin/promotions/:id        # Update
DELETE /admin/promotions/:id        # Delete
```

### Shipping Options
```bash
GET    /admin/shipping-options      # List all
POST   /admin/shipping-options      # Create
PATCH  /admin/shipping-options/:id  # Update
DELETE /admin/shipping-options/:id  # Delete
```

### Regions
```bash
GET    /admin/regions               # List all
GET    /admin/regions/:id           # Get one (includes shipping options)
```

**All requests require:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## Next Steps After Testing

Once you verify everything works:

1. **Deploy to Production:**
   ```bash
   npm run build
   npm run deploy
   ```

2. **Set Production Env Vars:**
   - Update Cloudflare Worker secrets
   - Use production Medusa URL
   - Configure real Stripe keys

3. **Create Real Products:**
   - Add actual merchandise
   - Upload high-quality images
   - Set real pricing

4. **Configure Real Promotions:**
   - Seasonal sales
   - First-time buyer discounts
   - Newsletter signup rewards

5. **Set Up Real Shipping:**
   - Integrate with carrier APIs (optional)
   - Or use manual fulfillment
   - Configure shipping zones/rates

---

## Summary Checklist

Before testing, ensure you have:

- [ ] Medusa instance running (Cloud or local)
- [ ] Admin account credentials
- [ ] At least 2-3 test products created
- [ ] At least 1 promotion/discount configured
- [ ] At least 1 shipping option configured
- [ ] Environment variables set in `.env`
- [ ] Dev server running (`npm run dev`)

Then test in this order:

1. [ ] Cart operations (add, update quantity, remove)
2. [ ] Discount application and display
3. [ ] Shipping selection and totals update
4. [ ] Complete checkout flow

**Expected Result:** All ✨ (NEW) features should work:
- Loading states on shipping selection
- Discount amounts under line items
- Applied promotion codes display
- Total discount row in summary
- Totals recalculate automatically
