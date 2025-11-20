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
- Google OAuth credentials (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Canteen Management"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database:
   - Run the migrations in `supabase/migrations/` in your Supabase project
   - Or use Supabase CLI: `supabase db push`

5. Configure Google OAuth in Supabase Dashboard:
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Add your Google OAuth credentials

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

