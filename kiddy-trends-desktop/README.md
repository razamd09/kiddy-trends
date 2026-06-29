# 📦 Kiddy Trends Desktop - Offline Product Manager

Windows desktop utility for managing products offline and syncing to production at day end.

## Features

✅ **Offline Capability**
- Add/Edit/Delete products without internet
- Data stored locally in SQLite database
- Works completely offline

✅ **Automatic Sync**
- Auto-syncs every 30 seconds when online
- Manual sync button for immediate upload
- Shows pending changes count

✅ **Sync Queue**
- Tracks all changes waiting to sync
- Retry failed syncs
- Sync history & logs

✅ **Beautiful UI**
- Product list with search
- Form for adding/editing
- Real-time sync status
- Responsive design

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation

1. **Clone/Navigate to project**
```bash
cd C:\Users\hdin01\Downloads\kiddy-trends-desktop
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Supabase credentials**
Create `.env` file in root:
```
REACT_APP_SUPABASE_URL=https://your-supabase.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Development

**Run in development mode:**
```bash
npm run dev
```

This will:
- Start React dev server on http://localhost:3000
- Launch Electron app
- Enable hot reload

### Build

**Build Windows installer:**
```bash
npm run build
```

Output: `dist/Kiddy Trends Desktop Setup 1.0.0.exe`

## How It Works

### 1. **Offline Workflow**
```
User adds product → Saved locally → Added to sync queue → UI shows "pending changes"
```

### 2. **Auto Sync Workflow**
```
Internet connected? → Check sync queue → Send to Supabase → Mark as synced → Update UI
```

### 3. **Manual Sync**
```
User clicks "Sync Now" → Upload pending changes → Show success → Refresh list
```

## File Structure

```
kiddy-trends-desktop/
├── main.js                 # Electron main process
├── preload.js             # IPC bridge
├── database.js            # SQLite operations
├── sync.js                # Auto-sync engine
├── package.json
├── src/
│   ├── App.js            # Main React component
│   ├── index.js          # React entry
│   ├── App.css           # Styles
│   └── components/
│       ├── ProductForm.js
│       ├── ProductList.js
│       └── SyncStatus.js
└── public/
    └── index.html
```

## Database Schema

### products table
```
id TEXT PRIMARY KEY
title TEXT
description TEXT
category TEXT
price REAL
compare_at_price REAL
stock INTEGER
images TEXT (JSON)
variants TEXT (JSON)
created_at DATETIME
updated_at DATETIME
```

### sync_queue table
```
id INTEGER PRIMARY KEY
product_id TEXT
action TEXT (create/update/delete)
data TEXT (JSON)
status TEXT (pending/synced/error)
created_at DATETIME
synced_at DATETIME
```

## IPC Commands (Main ↔ Renderer)

```javascript
// Add product
await window.electron.addProduct(product)

// Get products
await window.electron.getProducts(limit, offset)

// Update product
await window.electron.updateProduct(id, updates)

// Delete product
await window.electron.deleteProduct(id)

// Check sync status
await window.electron.getSyncStatus()

// Manual sync
await window.electron.manualSync()
```

## Troubleshooting

### Database Connection Error
```
Error: Database connection error
```
- Check if `.kiddy-trends` folder exists in home directory
- Delete database and restart app to recreate

### Sync Not Working
1. Check internet connection
2. Verify Supabase credentials in .env
3. Check sync log in database
4. Click "Sync Now" manually

### App Won't Start
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install
npm run dev
```

## Workflow Example

### Day Workflow

**Morning (Offline)**
1. Open Kiddy Trends Desktop app
2. Add 10 new products (no internet needed)
3. Edit 3 existing products
4. App shows: "13 pending changes"

**Evening (Online)**
1. Connect to internet
2. App auto-syncs → "All synced ✅"
3. All changes uploaded to production
4. Website shows new products immediately

## Security

- Service key stored locally in .env (not in app)
- All database operations are local-first
- Supabase acts as sync destination only
- No sensitive data transmitted until sync

## Support

For issues:
1. Check troubleshooting section
2. Review console logs (Dev Tools)
3. Check database using SQLite browser

## Future Enhancements

- [ ] Bulk product import (CSV/Excel)
- [ ] Conflict resolution UI
- [ ] Sync history viewer
- [ ] Cloud backup
- [ ] Multi-user support
- [ ] Product image upload
- [ ] Advanced filtering/search

---

**Version:** 1.0.0  
**Platform:** Windows 10+  
**License:** Private
