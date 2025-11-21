# FoodieHub

A comprehensive canteen management system built with Next.js 14, TypeScript, Supabase, and Tailwind CSS. This platform allows students to order food from college canteens, canteen owners to manage their menus and orders, and admins to oversee the entire platform.

## Features

### Student Panel
- Browse canteens and menus
- Add items to cart
- Place orders with unique tokens
- Track order status in real-time
- View order history
- Rate and review orders
- Save favorites

### Canteen Owner Panel
- Manage menu items and categories
- View and update order status
- Process payments
- View analytics and sales reports
- Manage promotions and offers
- Respond to customer reviews

### Admin Panel
- Manage users and canteens
- Approve/reject promotions
- Moderate reviews
- View platform-wide analytics
- Send bulk notifications

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **QR Codes**: qrcode.react, html5-qrcode

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Google OAuth credentials (optional, for OAuth authentication)

### Quick Setup

1. **Clone and Install**:
```bash
git clone <repository-url>
cd "Canteen Management"
npm install
```

2. **Environment Variables**:
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Database Setup**:
   - Go to Supabase Dashboard > SQL Editor
   - Run migrations in order from `supabase/migrations/`
   - **IMPORTANT**: Make sure to run `017_fix_recursive_policies.sql` to fix RLS issues

4. **Storage Setup**:
   - Create buckets: `items`, `canteens`, `reviews`
   - Set public read access

5. **Run Development Server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── home/              # Student home page
│   ├── canteen/           # Canteen menu pages
│   ├── cart/              # Shopping cart
│   ├── orders/            # Order management
│   ├── profile/           # User profile
│   ├── favorites/         # Favorites page
│   ├── login/             # Authentication
│   └── auth/              # Auth callbacks
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   ├── canteen/           # Canteen-related components
│   ├── menu/              # Menu item components
│   ├── cart/              # Cart components
│   └── orders/            # Order components
├── lib/                   # Utility functions
│   ├── supabase/          # Supabase client/server utilities
│   └── utils/             # Helper functions
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
└── supabase/              # Database migrations
    └── migrations/        # SQL migration files
```

## Database Schema

The database includes the following main tables:
- `users` - User profiles with roles
- `canteens` - Canteen information
- `categories` - Food categories
- `items` - Menu items
- `orders` - Order records
- `order_items` - Order line items
- `reviews` - Customer reviews
- `offers` - Promotions and offers
- `notifications` - User notifications
- `favorites` - User favorites

See `supabase/migrations/` for the complete schema.

## Key Features Implementation

### Authentication
- Google OAuth integration via Supabase Auth
- Role-based access control (Student, Canteen Owner, Admin)
- Protected routes with middleware

### Order System
- Unique token generation for each order
- QR code generation for easy order collection
- Real-time order status updates
- On-shop payment processing

### Real-time Updates
- Supabase Realtime for order status changes
- WebSocket connections for live updates

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- ESLint for linting
- Prettier for code formatting
- TypeScript for type safety

## Deployment

### Render

1. Push your code to GitHub (already done)

2. Go to [Render Dashboard](https://dashboard.render.com/) and sign up/login

3. Click **"New +"** and select **"Web Service"**

4. Connect your GitHub account and select the `FoodieHub` repository

5. Configure the service:
   - **Name**: `foodiehub` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose a plan (Starter plan is recommended for getting started)

6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `NEXT_PUBLIC_APP_URL` - Your Render app URL (e.g., `https://foodiehub.onrender.com`)
   - `NODE_VERSION` - Set to `18.x` (or your preferred Node version)

7. Click **"Create Web Service"**

8. Render will automatically deploy your application. The first deployment may take several minutes.

9. Once deployed, update `NEXT_PUBLIC_APP_URL` in Render environment variables with your actual Render URL

10. Update your Supabase project settings:
    - Go to Authentication > URL Configuration in Supabase Dashboard
    - Add your Render URL to "Site URL" and "Redirect URLs"
    - Add `https://your-app.onrender.com/auth/callback` to redirect URLs

**Note**: Render's free tier may spin down after inactivity. For production use, consider upgrading to a paid plan.

### Vercel (Alternative)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Your production app URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

