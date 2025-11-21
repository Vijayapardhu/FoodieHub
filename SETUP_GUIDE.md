# FoodieHub Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run all migrations in order from `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_create_user_profile_trigger.sql`
   - ... (all other migrations in order)
   - `017_fix_recursive_policies.sql` (IMPORTANT: Fixes RLS issues)

### 4. Storage Setup

1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `items` - For menu item images
   - `canteens` - For canteen logos and banners
   - `reviews` - For review photos

3. Set bucket policies (or use RLS):
   - Public read access for all buckets
   - Authenticated write access

### 5. Authentication Setup

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Email provider
3. Enable Google OAuth (optional):
   - Add Google OAuth credentials
   - Set redirect URL: `http://localhost:3000/auth/callback`

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Common Issues & Solutions

### Issue: "Infinite recursion detected in policy"
**Solution**: Run migration `017_fix_recursive_policies.sql` in Supabase SQL Editor

### Issue: "Failed to fetch" errors
**Solution**: 
1. Check environment variables are set correctly
2. Verify Supabase project is active
3. Check RLS policies are enabled

### Issue: Images not loading
**Solution**:
1. Verify storage buckets exist
2. Check bucket policies allow public read
3. Verify image URLs are correct

### Issue: Authentication not working
**Solution**:
1. Check redirect URLs in Supabase Auth settings
2. Verify OAuth credentials (if using Google)
3. Check browser console for errors

## Production Deployment

### Environment Variables for Production

Set these in your hosting platform (Vercel, Render, etc.):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Update Supabase Settings

1. Go to Authentication > URL Configuration
2. Add production URL to:
   - Site URL
   - Redirect URLs (add `/auth/callback`)

## Testing

### Create Test Users

1. Sign up through the app
2. Or create directly in Supabase Auth:
   - Go to Authentication > Users
   - Click "Add user"
   - Set email and password

### Create Test Canteen

1. Sign in as a user with `canteen_owner` role
2. Go to `/canteen/register`
3. Fill in canteen details

### Test Orders

1. Sign in as regular user
2. Browse canteens
3. Add items to cart
4. Place order
5. Check order appears in owner dashboard

## Features Checklist

- [x] User authentication
- [x] Role-based access control
- [x] Canteen browsing
- [x] Menu display
- [x] Shopping cart
- [x] Order placement
- [x] Order tracking
- [x] Payment processing
- [x] Reviews and ratings
- [x] Favorites
- [x] Notifications
- [x] Analytics
- [x] Admin panel
- [x] Owner dashboard

## Support

For issues, check:
1. Browser console for errors
2. Supabase logs
3. Network tab for failed requests
4. Database RLS policies

