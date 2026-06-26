# Supabase CDN Image Management Setup

## What's Been Implemented

Your project now has a **full image CDN system** powered by Supabase Storage:

### 1. **Direct Image Uploads** (`/api/admin/upload-image`)
- Upload images directly to Supabase Storage from product form
- Auto-optimized to WebP format (85% quality)
- Resized to 1200x1200px for consistent display
- 30-year cache headers for performance

### 2. **Bulk Image Migration** (`/api/admin/sync-images`)
- One-click migration of ALL existing Shopify images → Supabase
- Downloads from Shopify CDN
- Uploads to Supabase Storage
- Updates product records automatically
- Keeps original URLs as fallback

### 3. **Enhanced Product Form**
- Image file upload input (supports multiple files)
- Auto-adds uploaded URLs to product
- Fallback support for manual URLs

---

## Setup Steps (Required)

### Step 1: Create Supabase Storage Bucket
1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create new bucket**
3. Name it: `products`
4. Select **Private** (recommended for control)
5. Click **Create**

### Step 2: Add Environment Variables
Update your `.env.local`:

```env
# Already exists - keep it
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# For sharp image optimization (already in dependencies)
SHARP_IGNORE_GLOBAL_LIBVIPS=1
```

### Step 3: Install Dependencies (if not already done)
```bash
npm install sharp
```

---

## Usage

### **For New Products:**
1. Go to **Admin → Products**
2. Click **+ Add Product**
3. In image section, click **Choose Files** to upload
4. Images auto-upload to Supabase CDN
5. URLs auto-added to image list
6. Save product

### **For Existing Products (Migrate Shopify Images):**
1. Go to **Admin → Products**
2. Click **🖼️ Sync All Images to CDN** button
3. Wait for migration (shows progress)
4. All products now use Supabase URLs

### **Manual URL Entry:**
- Paste any image URL in the textarea (one per line)
- Supports both Shopify and Supabase URLs

---

## How It Works

### Image Flow
```
User uploads image
    ↓
Optimized with Sharp (WebP, 1200x1200px)
    ↓
Uploaded to Supabase Storage (/products/images/...)
    ↓
Public URL returned
    ↓
Added to product.images array
    ↓
Frontend displays CDN image (fast, optimized)
```

### Migration Flow
```
Loop through all products
    ↓
For each image URL:
    - If already Supabase → Skip
    - If Shopify → Download + Re-upload to Supabase
    ↓
Update product with new URLs
    ↓
Keep old Shopify URLs as fallback
```

---

## Performance Benefits

- **Faster loading**: WebP is 25-35% smaller than JPEG
- **Optimized size**: 1200x1200px covers all use cases
- **30-year cache**: Browser caches images, zero re-downloads
- **Fallback**: If Supabase fails, falls back to original Shopify URL

---

## Troubleshooting

### Images not uploading?
- Ensure Supabase bucket `products` is created
- Check `SUPABASE_SERVICE_KEY` is valid
- Verify image file is < 10MB

### Sync fails for some products?
- Check network (might be rate-limited by Shopify)
- Verify Shopify URLs are still accessible
- Failed products fall back to original URLs

### Images not showing on live site?
- Clear browser cache (images are cached 30 years)
- Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check ProductCard is using new CDN URLs

---

## API Endpoints

### POST `/api/admin/upload-image`
Upload a single image file
```bash
curl -X POST http://localhost:3000/api/admin/upload-image \
  -F "file=@image.jpg"
```

### POST `/api/admin/sync-images`
Migrate all Shopify images to Supabase
```bash
curl -X POST http://localhost:3000/api/admin/sync-images \
  -H "x-admin-token: your_token"
```

---

## Next Steps

1. ✅ Create Supabase bucket `products`
2. ✅ Test uploading a new product with images
3. ✅ Run "Sync All Images" to migrate existing products
4. ✅ Verify images load on home page and collections

That's it! Your CDN is ready.
