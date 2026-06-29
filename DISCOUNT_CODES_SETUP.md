# Discount Codes System

## Overview
This discount code system allows you to:
- Create discount codes with percentage or fixed amount discounts
- Set codes as enabled/disabled (only enabled codes display on landing page)
- Set expiry as unlimited or limited to a specific date
- Track usage limits (optional)
- Manage codes from admin panel

## Setup Instructions

### 1. Create Database Table
Run the SQL migration in your Supabase console:

```bash
# Open Supabase → SQL Editor → New Query
# Paste the contents of: add_discount_codes.sql
# Click "Run"
```

Or use psql if you have direct database access:
```bash
psql -h <db-host> -U <db-user> -d <db-name> < add_discount_codes.sql
```

### 2. Access Admin Panel
1. Go to: `https://yourdomain.com/admin/discount-codes`
2. Login with your admin password
3. You'll see the discount codes management panel

## Features

### Creating a Discount Code

1. **Code**: The promo code (e.g., `SUMMER20`)
2. **Discount Type**:
   - `Percentage`: Apply a % discount (e.g., 20% OFF)
   - `Fixed Amount`: Apply a fixed PKR amount (e.g., PKR 500 OFF)
3. **Discount Value**: The amount (e.g., 20 for percentage, 500 for amount)
4. **Expiry**:
   - `Unlimited`: Code never expires
   - `Limited`: Code expires on a specific date
5. **Max Usage**: (Optional) Limit how many times code can be used
6. **Enable Code**: Toggle to show/hide on landing page
   - **ENABLED** ✅: Code displays on landing page banner
   - **DISABLED** ❌: Code hidden from customers

### Display Logic

Discount codes appear on the landing page ONLY when:
- ✅ `enabled = true`
- ✅ Expiry is either:
  - `unlimited`, OR
  - `limited` with `expiry_date` in the future

## API Routes

### Public Routes (No Auth Required)

#### Get Active Discount Codes
```
GET /api/discount-codes
```

Returns only enabled codes that haven't expired:
```json
{
  "codes": [
    {
      "code": "SUMMER20",
      "discount_type": "percentage",
      "discount_value": 20,
      "expiry_type": "limited",
      "expiry_date": "2026-12-31T23:59:59"
    }
  ]
}
```

### Admin Routes (Requires x-admin-token header)

#### List All Codes (Paginated)
```
GET /api/admin/discount-codes?page=1
```

#### Create Code
```
POST /api/admin/discount-codes
Content-Type: application/json
x-admin-token: <token>

{
  "code": "SUMMER20",
  "discount_type": "percentage",
  "discount_value": 20,
  "enabled": true,
  "expiry_type": "limited",
  "expiry_date": "2026-12-31",
  "max_usage": null
}
```

#### Update Code
```
PUT /api/admin/discount-codes
Content-Type: application/json
x-admin-token: <token>

{
  "id": "uuid-here",
  "enabled": false,
  ...otherFields
}
```

#### Delete Code
```
DELETE /api/admin/discount-codes?id=uuid-here
x-admin-token: <token>
```

## Landing Page Display

The discount banner automatically appears at the top of the homepage when there are enabled codes.

### Component: `components/DiscountBanner.js`
- Fetches active codes from `/api/discount-codes`
- Displays codes in a banner with:
  - Code value
  - Discount type and amount
  - "No codes available" message if none are active

### Example Display
```
🎉 Active Discount Codes:
┌─────────────────┐  ┌─────────────────┐
│ SUMMER20        │  │ FLAT500         │
│ 20% OFF         │  │ PKR 500 OFF     │
└─────────────────┘  └─────────────────┘
```

## Database Schema

```sql
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL ('percentage' | 'amount'),
    discount_value DECIMAL(10, 2) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    expiry_type VARCHAR(20) NOT NULL ('unlimited' | 'limited'),
    expiry_date TIMESTAMP NULL,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Examples

### Example 1: 20% Summer Discount (Unlimited)
- Code: `SUMMER20`
- Type: Percentage
- Value: 20
- Enabled: ✅
- Expiry: Unlimited
- Result: Shows on landing page indefinitely

### Example 2: New Year Flash Sale (Limited, Expired)
- Code: `NEWYEAR500`
- Type: Fixed Amount
- Value: 500 (PKR)
- Enabled: ✅
- Expiry: Limited → 2026-01-31
- Result: **Not shown** on landing page (expired)

### Example 3: Disabled Code
- Code: `OLDCODE`
- Type: Percentage
- Value: 10
- Enabled: ❌ **DISABLED**
- Expiry: Unlimited
- Result: **Not shown** on landing page (disabled)

## Troubleshooting

### Codes not showing on landing page?
1. Check if code is **enabled** (not disabled)
2. Check if expiry date is in the future (if limited)
3. Check browser console for errors
4. Verify `/api/discount-codes` returns codes in API response

### Code appears but wrong format?
- Check `discount_type` is `percentage` or `amount`
- Verify `discount_value` is a valid number
- Clear browser cache and refresh

### Can't access admin panel?
1. Ensure you're logged in with correct admin token
2. Check `/admin` login page
3. Verify token is saved in localStorage

## File Structure

```
app/
├── page.js (UPDATED - Added DiscountBanner)
├── admin/
│   └── discount-codes/
│       └── page.js (New - Admin management page)
├── api/
│   ├── discount-codes/
│   │   └── route.js (New - Public API)
│   └── admin/
│       └── discount-codes/
│           └── route.js (New - Admin API)
components/
└── DiscountBanner.js (New - Landing page display)
add_discount_codes.sql (Migration file)
```

## Next Steps

1. Run the SQL migration in Supabase
2. Visit `/admin/discount-codes` to create your first code
3. Toggle `Enable Code` to make it visible on landing page
4. Refresh homepage to see the banner
5. Adjust expiry dates as needed for promotional campaigns
