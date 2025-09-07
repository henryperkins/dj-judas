# How to Add Products to Your Medusa Store

This guide explains the different methods to add products to your Medusa backend for the DJ Judas store.

## Prerequisites

- A running Medusa backend server
- Admin credentials or API token
- Product information (title, description, images, prices, variants)

## Method 1: Using Medusa Admin Dashboard (Recommended)

The easiest way to add products is through the Medusa Admin Dashboard UI:

1. **Access Admin Dashboard**
   - Navigate to `https://your-medusa-backend.com/app` (or `http://localhost:9000/app` for local)
   - Login with your admin credentials

2. **Navigate to Products**
   - Click on "Products" in the sidebar
   - Click "Add Product" button

3. **Fill Product Details**
   - **Title**: Product name (e.g., "DJ Lee T-Shirt")
   - **Handle**: URL-friendly slug (auto-generated)
   - **Description**: Product description
   - **Type**: Product category
   - **Collection**: Group similar products
   - **Tags**: For search and filtering

4. **Add Variants**
   - Click "Add Variant"
   - Set variant title (e.g., "Small", "Medium", "Large")
   - Set SKU, barcode (optional)
   - Set prices for each currency/region
   - Set inventory quantity

5. **Upload Images**
   - Drag and drop or click to upload product images
   - Set thumbnail image

6. **Configure Shipping**
   - Select shipping profile
   - Set dimensions and weight if needed

7. **Save Product**
   - Click "Publish" to make it available in store
   - Or "Save as draft" to finish later

## Method 2: Using Admin API

### Authentication
First, get an admin JWT token:

```bash
curl -X POST 'https://your-medusa-backend.com/admin/auth' \
  -H 'Content-Type: application/json' \
  --data '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

### Create Product via API

```javascript
// Using fetch
const createProduct = async () => {
  const response = await fetch('https://your-medusa-backend.com/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: JSON.stringify({
      title: "Voices of Judah Album",
      description: "Latest gospel album from DJ Lee & Voices of Judah",
      handle: "voices-of-judah-album",
      is_giftcard: false,
      discountable: true,
      options: [
        {
          title: "Format",
          values: ["CD", "Digital Download"]
        }
      ],
      variants: [
        {
          title: "CD Version",
          prices: [
            {
              amount: 1999, // $19.99 in cents
              currency_code: "usd"
            }
          ],
          options: {
            "Format": "CD"
          },
          inventory_quantity: 100
        },
        {
          title: "Digital Download",
          prices: [
            {
              amount: 999, // $9.99 in cents
              currency_code: "usd"
            }
          ],
          options: {
            "Format": "Digital Download"
          },
          inventory_quantity: 999999 // Unlimited digital copies
        }
      ],
      status: "published"
    })
  });
  
  const product = await response.json();
  console.log('Product created:', product);
};
```

## Method 3: Using Medusa JS SDK

If you have the Medusa JS SDK installed:

```javascript
import Medusa from "@medusajs/js-sdk"

const medusa = new Medusa({
  baseUrl: "https://your-medusa-backend.com",
  auth: {
    type: "jwt",
    token: "YOUR_JWT_TOKEN"
  }
})

// Create a product
const createProduct = async () => {
  const { product } = await medusa.admin.product.create({
    title: "DJ Lee Merchandise Bundle",
    description: "Exclusive merchandise bundle",
    handle: "dj-lee-merch-bundle",
    options: [
      {
        title: "Size",
        values: ["S", "M", "L", "XL"]
      }
    ],
    variants: [
      {
        title: "Small",
        sku: "DJLEE-MERCH-S",
        prices: [
          {
            amount: 3500, // $35.00
            currency_code: "usd"
          }
        ],
        options: {
          "Size": "S"
        },
        inventory_quantity: 50
      },
      {
        title: "Medium",
        sku: "DJLEE-MERCH-M",
        prices: [
          {
            amount: 3500,
            currency_code: "usd"
          }
        ],
        options: {
          "Size": "M"
        },
        inventory_quantity: 75
      },
      // Add more size variants...
    ],
    status: "published"
  });
  
  console.log("Product created:", product);
};
```

## Method 4: Bulk Import via CSV

### Prepare CSV File

Create a CSV file with the following structure:

```csv
Product Id,Product Handle,Product Title,Product Subtitle,Product Description,Product Status,Product Thumbnail,Product Weight,Product Length,Product Width,Product Height,Product HS Code,Product Origin Country,Product MID Code,Product Material,Product Collection Title,Product Collection Handle,Product Type,Product Tags,Product Discountable,Product External Id,Product Profile Name,Product Profile Type,Variant Id,Variant Title,Variant SKU,Variant Barcode,Variant Inventory Quantity,Variant Allow Backorder,Variant Manage Inventory,Variant Weight,Variant Length,Variant Width,Variant Height,Variant HS Code,Variant Origin Country,Variant MID Code,Variant Material,Option 1 Name,Option 1 Value,Option 2 Name,Option 2 Value,Price USD,Price EUR
,gospel-album-001,Voices of Judah Album,,Latest gospel album,published,https://example.com/album-cover.jpg,0.1,,,,,,,,,Gospel Music,gospel-music,Album,"gospel,music",true,,Default,default,,CD Version,VOJ-CD-001,,100,false,true,0.1,,,,,,,,"Format","CD",,,19.99,
,gospel-album-001,Voices of Judah Album,,Latest gospel album,published,https://example.com/album-cover.jpg,0.1,,,,,,,,,Gospel Music,gospel-music,Album,"gospel,music",true,,Default,default,,Digital Download,VOJ-DD-001,,999999,false,false,0,,,,,,,,"Format","Digital Download",,,9.99,
```

### Import via Admin Dashboard

1. Go to Products section in Admin
2. Click "Import Products"
3. Upload your CSV file
4. Review the import preview
5. Confirm import

### Import via API

```javascript
const importProducts = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Start import
  const importResponse = await fetch('https://your-medusa-backend.com/admin/products/import', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: formData
  });
  
  const { transaction_id } = await importResponse.json();
  
  // Confirm import
  const confirmResponse = await fetch(`https://your-medusa-backend.com/admin/products/import/${transaction_id}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });
  
  console.log('Import confirmed');
};
```

## Product Best Practices for DJ Judas Store

### Recommended Product Structure

1. **Music Products**
   - Albums (Physical CD, Digital Download, Vinyl)
   - Singles
   - Sheet Music

2. **Merchandise**
   - T-Shirts (Multiple sizes)
   - Hoodies
   - Accessories (Hats, Bags)

3. **Event Tickets**
   - Concert tickets
   - Workshop passes
   - VIP experiences

### Pricing Strategy

- Always price in cents (e.g., 1999 for $19.99)
- Set prices for multiple currencies if selling internationally
- Consider regional pricing variations

### Inventory Management

- Physical products: Track actual inventory
- Digital products: Set high inventory (999999)
- Pre-orders: Allow backorder = true

### Image Guidelines

- Product images: 1200x1200px minimum
- Thumbnail: 500x500px
- Format: JPG or PNG
- Multiple angles for physical products

## Troubleshooting

### Common Issues

1. **Products not showing in store**
   - Ensure status is "published"
   - Check if product has at least one variant with price
   - Verify inventory quantity > 0

2. **Import failing**
   - Check CSV format matches template
   - Ensure all required fields are filled
   - Verify image URLs are accessible

3. **API authentication errors**
   - Token may be expired, get a new one
   - Check API endpoint URL
   - Verify admin permissions

## Next Steps

After adding products:

1. Test product display on your storefront (`/products` page)
2. Verify checkout flow works with new products
3. Set up shipping options for physical products
4. Configure tax rates if needed
5. Create collections to organize products
6. Add product images and optimize SEO

## Additional Resources

- [Medusa Product Documentation](https://docs.medusajs.com/modules/products)
- [Admin API Reference](https://docs.medusajs.com/api/admin#products)
- [JS SDK Documentation](https://docs.medusajs.com/js-client/overview)
- [Import/Export Guide](https://docs.medusajs.com/admin/import-export)

---

*Note: Replace `https://your-medusa-backend.com` with your actual Medusa backend URL throughout this guide.*

## Method 5: Built-in Admin UI (in this project)

This project now includes a lightweight admin interface to add products via your Medusa Admin API without leaving the site.

How to use:

1. Configure `MEDUSA_URL` in your environment (see `.env.example`). This must point to your Medusa backend (same base as `VITE_MEDUSA_URL`).
2. Start the app (`npm run dev`) or deploy (Worker reads `MEDUSA_URL`).
3. Visit `/admin/login` on your site and sign in with your Medusa admin email/password. This stores a short‑lived HttpOnly JWT cookie in your browser.
4. Go to `/admin/products/new`, fill in the form (title, description, thumbnail, USD price, inventory) and click “Create Product”.

Notes:

- The UI posts to `/api/admin/*` endpoints, which the Cloudflare Worker proxies to your Medusa Admin API using the JWT cookie.
- Only a single default variant is supported in this first version. Extend as needed for multiple variants/options.
- Status can be set to `draft` or `published`.

### Optional: One‑click Photo Upload + AI Titles

You can enable a simpler flow that lets you upload a photo, pick price and publish state (Live or Preview), and auto‑generate a title/description from the image.

Setup:

- Set `CF_IMAGES_ACCOUNT_ID` and `CF_IMAGES_API_TOKEN` (Cloudflare Images token with Images:Edit) to enable direct uploads.
- Set `OPENAI_API_KEY` to enable AI title/description suggestions from the uploaded image.
- Optionally set `CF_IMAGES_VARIANT` (e.g., `public`) to control the delivery size.

Usage:

1. Go to `/admin/products/new`.
2. Click “Upload Photo” and choose an image.
3. Click “Suggest title & description” to auto‑fill.
4. Enter price and choose publish state: Live (published) or Preview (draft).
5. Create Product.
