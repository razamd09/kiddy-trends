# Quick Start Guide - Kiddy Trends Desktop

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- React 19
- Electron
- SQLite3
- Supabase client
- Build tools

## Step 2: Configure Credentials

1. Open `.env.example`
2. Get Supabase credentials from your project
3. Copy to `.env` and fill in values

```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

**Where to find:**
- URL: Supabase Dashboard → Settings → Project API → URL
- Service Key: Supabase Dashboard → Settings → Project API → Service Key

## Step 3: Run in Development

```bash
npm run dev
```

Wait for:
1. React dev server to start (port 3000)
2. Electron window to open
3. Hot reload enabled

## Step 4: Test Offline Workflow

1. **Add a product:**
   - Click "➕ Add Product"
   - Fill in Title, Price, Stock
   - Click "Add Product"
   - See "✅ Product added!" message
   - Notice "1 pending changes" in top right

2. **Disconnect internet** (optional)
   - App still works
   - Products saved locally
   - UI shows "Waiting to sync..."

3. **Connect internet**
   - App auto-syncs
   - Shows "All synced ✅"
   - Check Supabase Dashboard to verify

## Step 5: Build for Distribution

```bash
npm run build
```

Creates:
- `dist/Kiddy Trends Desktop Setup 1.0.0.exe` (installer)
- `dist/Kiddy Trends Desktop 1.0.0 portable.exe` (portable)

Users can download and install on their Windows PC.

## Keyboard Shortcuts

- `Ctrl+Q` - Exit app
- `Ctrl+R` - Reload
- `Ctrl+Shift+I` - Developer tools (dev mode)

## Local Database Location

```
C:\Users\{YourUsername}\.kiddy-trends\products.db
```

Browse with SQLite browser:
- Download: https://sqlitebrowser.org/
- Open: `~/.kiddy-trends/products.db`

## Troubleshooting

### React dev server not starting
```bash
# Kill existing process
npx kill-port 3000

# Try again
npm run dev
```

### Electron not starting
```
Error: Cannot find module 'electron'

Solution:
npm install electron --save-dev
```

### Database errors
```
Clear the local database:
rm -r ~/.kiddy-trends
npm run dev  # Will recreate on startup
```

### Network errors during sync
- Check internet connection
- Verify Supabase credentials
- Check firewall settings

## Daily Workflow

**Morning:**
```bash
npm run dev
# Add/Edit products offline
```

**End of day:**
1. Ensure internet connected
2. Click "🔄 Sync Now" (or wait 30 sec for auto-sync)
3. See "All synced ✅"
4. Close app
5. Changes live on website

## Features You Can Test

✅ Add product → Offline works
✅ Edit product → Stored locally
✅ Delete product → Queued for sync
✅ Disconnect internet → Still works
✅ Reconnect → Auto-syncs
✅ View pending count → Shows changes

## Next: Distribution

When ready to share with team:

```bash
npm run build
# Share: dist/Kiddy Trends Desktop Setup 1.0.0.exe
```

Users double-click → Easy install → Start using!

---

**Questions?** Check README.md for detailed documentation.
