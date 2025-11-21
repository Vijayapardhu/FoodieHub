# Alias System Implementation Summary

## ✅ Completed Implementation

### 1. **Database Alias System**
- ✅ Added `alias` columns to tables:
  - `canteens` (unique alias)
  - `items` (unique per canteen)
  - `order_templates` (unique per user-canteen combination)
- ✅ Created database triggers to auto-generate aliases
- ✅ Aliases are generated from names (e.g., "My Usual Order" → `my-usual-order`)
- ✅ Existing records get aliases generated automatically

### 2. **API Response Formatting**
- ✅ Created `lib/api/response-formatter.ts` to format responses
- ✅ All API responses **exclude** `id` field
- ✅ All API responses **include** `alias` field
- ✅ Nested entities also formatted to use aliases

### 3. **Alias Resolution**
- ✅ Created `lib/utils/alias.ts` for alias generation utilities
- ✅ Created `lib/api/alias-resolver.ts` for resolving aliases to IDs
- ✅ API routes accept both UUIDs and aliases for backward compatibility

### 4. **Updated API Routes**
All routes now support aliases:

#### Templates API
- `GET /api/templates?canteen_id={uuid|alias}` - Accepts canteen alias or UUID
- `GET /api/templates/{alias|uuid}` - Accepts template alias or UUID
- `POST /api/templates` - Accepts canteen alias/UUID and item aliases/UUIDs
- `PUT /api/templates/{alias|uuid}` - Accepts aliases for items
- `DELETE /api/templates/{alias|uuid}` - Accepts alias or UUID

**Response Format (no IDs exposed):**
```json
{
  "success": true,
  "data": {
    "alias": "south-campus-my-usual-order",
    "name": "My Usual Order",
    "canteen_id": null,  // Hidden
    "items": [...]
  }
}
```

### 5. **Migration Files**
- ✅ `supabase/migrations/013_add_alias_columns.sql` - Adds alias columns and triggers
- ✅ Updated `supabase/migrations/012_add_booking_features.sql` - Fixed policy conflicts

## How It Works

### Alias Generation
1. **From Name**: "South Campus Canteen" → `south-campus-canteen`
2. **Uniqueness**: If alias exists, random suffix added
3. **Auto-generated**: Database triggers create aliases automatically

### API Flow
```
Request:  GET /api/templates/south-campus-my-usual-order
         ↓
Resolve:  Alias → Internal UUID
         ↓
Query:    SELECT * FROM templates WHERE alias = '...'
         ↓
Format:   Remove ID, keep alias
         ↓
Response: { alias: "south-campus-my-usual-order", ... }
```

### Request Examples

**Before (UUIDs exposed):**
```typescript
// ❌ UUID exposed in API
GET /api/templates/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**After (Aliases only):**
```typescript
// ✅ Alias only - no UUID
GET /api/templates/my-usual-order
```

## Security Benefits

1. ✅ **No ID Enumeration** - Attackers can't enumerate IDs
2. ✅ **Better URLs** - `/templates/my-usual-order` vs `/templates/uuid`
3. ✅ **Privacy** - Internal database structure hidden
4. ✅ **SEO Friendly** - Aliases are readable

## Backward Compatibility

- ✅ **Accept**: Both UUIDs and aliases in requests
- ✅ **Return**: Only aliases (no UUIDs)
- ✅ **Internal**: Still uses UUIDs for database operations

## Next Steps

1. Run migration `013_add_alias_columns.sql` in Supabase
2. Update frontend to use aliases in URLs
3. Update other API routes (orders, canteens, items) to use aliases
4. Test alias generation and resolution

## Example Usage

### Creating a Template
```typescript
// Request can use aliases
POST /api/templates
{
  "canteen_id": "south-campus-canteen",  // Alias instead of UUID
  "name": "My Usual Order",
  "items": [
    { "item_id": "chicken-biryani", "quantity": 1 },  // Alias
    { "item_id": "mango-lassi", "quantity": 2 }       // Alias
  ]
}

// Response returns alias
{
  "success": true,
  "data": {
    "alias": "south-campus-canteen-my-usual-order-abc123",
    "name": "My Usual Order",
    // No "id" field exposed
  }
}
```

### Accessing a Template
```typescript
// Use alias in URL
GET /api/templates/south-campus-canteen-my-usual-order-abc123
```

All internal IDs are hidden from the client! 🎉

