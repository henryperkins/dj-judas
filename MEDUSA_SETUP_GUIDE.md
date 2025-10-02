# Medusa Backend Setup Guide

## Current Status

**Backend Status:** ❌ Not configured
**Frontend Status:** ✅ Code ready, waiting for backend

## What's Missing

1. **No Medusa Backend Running**
   - `medusa-backend/` directory exists but no `.env` file
   - Backend not running on default port 9000

2. **No Environment Variables**
   - Missing `VITE_MEDUSA_URL` in main `.env`
   - Missing `VITE_MEDUSA_PUBLISHABLE_KEY`
   - Missing `MEDUSA_URL` for worker

## Quick Test Options

### Option 1: Use Medusa Cloud (Recommended for Testing)

1. **Sign up for Medusa Cloud** (free tier available)
   - Visit: https://medusajs.com/cloud/
   - Create a new store instance

2. **Get your API credentials**
   - Copy your store URL (e.g., `https://your-store.medusajs.app`)
   - Copy your publishable API key from dashboard

3. **Update your `.env` file:**
   ```bash
   VITE_MEDUSA_URL=https://your-store.medusajs.app
   VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
   MEDUSA_URL=https://your-store.medusajs.app
   ```

4. **Add test products with promotions:**
   - Use Medusa Admin UI to create products
   - Create a promotion/discount code
   - Test the checkout flow

### Option 2: Run Local Medusa Backend

1. **Set up local database:**
   ```bash
   cd medusa-backend
   docker-compose -f docker-compose.db.yml up -d
   ```

2. **Create `.env` file in `medusa-backend/`:**
   ```bash
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-store
   STORE_CORS=http://localhost:5173
   ADMIN_CORS=http://localhost:5173
   AUTH_CORS=http://localhost:5173
   JWT_SECRET=your-jwt-secret-here
   COOKIE_SECRET=your-cookie-secret-here
   ```

3. **Install dependencies and run migrations:**
   ```bash
   cd medusa-backend
   yarn install  # or npm install
   npx medusa db:migrate
   ```

4. **Seed with demo data:**
   ```bash
   npm run seed
   ```

5. **Start Medusa backend:**
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:9000

6. **Update main `.env`:**
   ```bash
   VITE_MEDUSA_URL=http://localhost:9000
   VITE_MEDUSA_PUBLISHABLE_KEY=pk_01J1X2Y3Z4  # Get from Medusa admin
   MEDUSA_URL=http://localhost:9000
   ```

### Option 3: Mock Testing (No Backend Required)

For UI testing without a real backend, we can create a mock cart response:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console and inject mock data:**
   ```javascript
   // Mock cart with discounts
   localStorage.setItem('medusa_cart_id', 'test_cart_123');

   // The app will try to fetch this cart and fail gracefully
   // showing the UI structure
   ```

## Testing the Enhancements

Once Medusa is configured, test these features:

### 1. Quantity Controls
- [ ] Add product to cart
- [ ] Increase quantity - verify totals update
- [ ] Decrease quantity - verify totals update
- [ ] Decrease to 0 - verify item removed

### 2. Shipping Options
- [ ] Add product and address
- [ ] Click "Load options"
- [ ] Select shipping method
- [ ] Verify loading state shows
- [ ] Verify shipping total updates in summary

### 3. Line-Item Discounts
- [ ] Apply a promotion code
- [ ] Verify discount shows under each item (green text)
- [ ] Verify format: "Discount: -$X.XX"

### 4. Promotion Codes Display
- [ ] Apply promotion code
- [ ] Verify "Applied Promotions" section appears
- [ ] Verify code name and discount value shown
- [ ] Test automatic promotions (shows "Auto-applied")

### 5. Total Discounts
- [ ] Apply discount
- [ ] Verify "Discount" row appears in totals
- [ ] Verify negative amount in green
- [ ] Verify final total is correct

## Expected API Responses

### Cart with Discount (what we're looking for):

```json
{
  "cart": {
    "id": "cart_123",
    "items": [
      {
        "id": "item_1",
        "title": "Test Product",
        "quantity": 2,
        "unit_price": 2000,
        "adjustments": [
          {
            "id": "adj_1",
            "amount": 400,
            "code": "SAVE20"
          }
        ]
      }
    ],
    "promotions": [
      {
        "id": "promo_1",
        "code": "SAVE20",
        "is_automatic": false,
        "application_method": {
          "type": "percentage",
          "value": "20",
          "currency_code": "usd"
        }
      }
    ],
    "subtotal": 4000,
    "discount_total": 800,
    "shipping_total": 500,
    "tax_total": 320,
    "total": 4020
  }
}
```

## Troubleshooting

### Products not loading
- Check `VITE_MEDUSA_URL` is correct
- Verify CORS is enabled on Medusa backend
- Check browser console for errors

### Cart not persisting
- Verify `medusa_cart_id` in localStorage
- Check Medusa API is responding to `/store/carts`

### Discounts not showing
- Ensure promotions are configured in Medusa admin
- Apply a valid promotion code
- Check API response includes `adjustments` and `promotions`

### TypeScript errors
- Run `npm run cf-typegen` to regenerate types
- Ensure `@medusajs/types` version matches backend

## Next Steps After Setup

Once Medusa is running:

1. **Create test products** with various prices
2. **Create promotions** to test discount display
3. **Configure shipping options** to test selection
4. **Test full checkout flow** from cart to completion
5. **Verify analytics tracking** (if configured)

---

**Need Help?**
- Medusa Docs: https://docs.medusajs.com
- Medusa Discord: https://discord.gg/medusajs
