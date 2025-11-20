<!-- a8fb14d3-2b7b-4308-b6d4-fac2123ffcd4 994e9922-a1e6-4768-9755-6859c6ffd4b3 -->
# FoodieHub - Complete Implementation Plan

## Project Setup and Configuration

### 1. Initialize Next.js 14 Project

- Create Next.js 14 project with TypeScript and App Router
- Configure Tailwind CSS with custom theme matching Zomato-inspired design
- Set up Shadcn/ui component library
- Configure ESLint and Prettier
- Set up project folder structure (feature-based architecture)

### 2. Install Core Dependencies

- React 18.x, Next.js 14.x, TypeScript 5.x
- Tailwind CSS 3.x with custom configuration
- Shadcn/ui components
- React Query 5.x for data fetching
- Zustand 4.x for state management
- React Hook Form 7.x + Zod 3.x for forms
- QR code libraries (html5-qrcode, qrcode.react)
- Supabase client libraries

### 3. Supabase Configuration

- Set up Supabase client configuration
- Configure environment variables (.env.local)
- Set up Supabase Auth helpers for Next.js
- Create database migration files for all tables
- Set up Row-Level Security (RLS) policies
- Configure Supabase Storage buckets and policies

## Database Schema Implementation

### 4. Database Migrations

- Create users table with role-based structure
- Create canteens table with operating hours (JSONB)
- Create categories table
- Create items table with nutritional info (JSONB)
- Create orders table with status enums
- Create order_items table
- Create tokens table with QR code storage
- Create reviews table with photos array
- Create offers table with approval workflow
- Create notifications table
- Create favorites table
- Add all foreign key constraints and indexes
- Set up database triggers for automated actions

### 5. Row-Level Security Policies

- Implement RLS policies for users table
- Implement RLS policies for canteens table
- Implement RLS policies for items table (public read, owner write)
- Implement RLS policies for orders table (user/canteen specific)
- Implement RLS policies for reviews table
- Implement RLS policies for offers table
- Implement RLS policies for notifications table
- Implement RLS policies for favorites table

## Authentication System

### 6. Google OAuth Integration

- Set up Google OAuth 2.0 in Supabase
- Create authentication pages (sign-in, callback handling)
- Implement Google Sign-In button component
- Set up session management with Supabase Auth
- Create protected route middleware
- Implement role-based access control (RBAC) helpers
- Create user profile creation on first login
- Add email domain validation for college emails

## Core UI Components and Layout

### 7. Base Components (Shadcn/ui Setup)

- Install and configure Shadcn/ui
- Create custom theme configuration
- Set up base components: Button, Card, Input, Select, Dialog, etc.
- Create loading skeletons
- Create toast notification system
- Create error boundary components

### 8. Layout Components

- Create main app layout with navigation
- Create bottom navigation bar for mobile (Home, Orders, Favorites, Profile)
- Create top navigation for desktop
- Create sticky cart bar component
- Create responsive sidebar for admin/canteen owner panels
- Implement mobile-first responsive design

## Student Panel Features

### 9. Home and Explore Page

- Create landing page with canteen cards
- Implement search bar with autocomplete
- Create filter system (canteen, category, price, ratings, offers)
- Build featured promotions carousel
- Create "Recommended Items" horizontal scroll section
- Implement real-time canteen open/closed status
- Add category pills and filter UI

### 10. Canteen Menu Page

- Create canteen detail header (banner, logo, rating, timings)
- Build category tabs (horizontal scroll)
- Create item cards with image, name, price, veg/non-veg icons
- Implement availability status display
- Add quantity selector for items
- Create sticky cart bar at bottom
- Implement real-time menu availability updates

### 11. Item Detail View

- Create item detail modal/page
- Build image gallery (swipeable if multiple images)
- Display full description and nutritional info
- Show customer ratings and reviews section
- Add quantity selector with +/- buttons
- Implement "Add to Cart" functionality

### 12. Shopping Cart

- Create cart page with item list
- Implement quantity editing and item removal
- Build order summary card (subtotal, offers, total)
- Display "On Shop Payment" method (non-editable)
- Add cart validation (availability check)
- Implement "Place Order" functionality

### 13. Order Confirmation and Token

- Create order confirmation page
- Implement unique token code generation (alphanumeric 6-8 chars)
- Generate QR code for token
- Display order summary and canteen details
- Show estimated preparation time
- Create order status progress bar
- Add token sharing functionality (WhatsApp, SMS, copy)

### 14. Order Tracking and History

- Create orders page with Active/Past tabs
- Build order cards with status badges
- Implement real-time status updates (Supabase Realtime)
- Create order detail view with timeline
- Add "Reorder" functionality
- Implement push notifications for status changes

### 15. Feedback and Ratings

- Create feedback submission form
- Implement star rating selector (1-5)
- Add text review input
- Create photo upload (up to 3 images)
- Display canteen owner responses
- Add edit feedback functionality (24-hour window)

### 16. Favorites and Wishlist

- Add heart icon to item and canteen cards
- Create favorites page
- Implement add/remove favorites functionality
- Add quick "Add to Cart" from favorites

### 17. User Profile Management

- Create profile page with Google account info
- Display user name, email, profile picture
- Add notification preferences settings
- Implement logout functionality

## Canteen Owner Panel Features

### 18. Canteen Owner Dashboard

- Create dashboard with KPI cards (orders, revenue, promotions)
- Build recent orders list with quick actions
- Add notification panel
- Implement real-time order count updates

### 19. Menu Management

- Create menu management page
- Build category management (CRUD)
- Create items list table with thumbnails
- Implement add/edit item form with image upload
- Add availability toggle for items
- Create bulk enable/disable functionality
- Implement price validation

### 20. Order Management

- Create order queue display with filters
- Build order detail modal with token/QR code
- Implement status update buttons (Confirm, Preparing, Ready, Complete)
- Create payment entry form (cash received, change calculation)
- Add QR code scanning for token verification
- Implement printable bill generation

### 21. Offers and Promotions

- Create offers list with status badges
- Build add/edit offer form (percentage/flat discount)
- Implement validity period setting
- Add promotion request submission
- Create offer analytics display
- Implement auto-expiration of offers

### 22. Feedback Management

- Create reviews list for canteen
- Add filter by rating and date
- Implement reply functionality for reviews
- Add report inappropriate review button

### 23. Sales Analytics

- Create analytics dashboard
- Build date range selector
- Implement revenue charts (daily, weekly, monthly)
- Create popular items chart
- Add order count trends
- Implement CSV/PDF export functionality

### 24. Canteen Profile and Settings

- Create canteen profile form
- Implement logo and banner upload
- Add operating hours configuration (per day)
- Create holiday/closure dates selector
- Implement auto open/closed status based on hours

## Admin Panel Features

### 25. Admin Dashboard

- Create admin dashboard with platform KPIs
- Build recent activity feed
- Add system alerts and notifications
- Display pending actions (promotions, reports)

### 26. User Management

- Create user list table with search/filter
- Implement role assignment dropdown
- Add account status toggle (Active/Suspended)
- Create user detail modal with activity log

### 27. Canteen Management

- Create canteen list with status badges
- Build pending approvals section
- Implement approve/reject functionality
- Add suspend/activate canteen buttons
- Create canteen detail view with metrics

### 28. Promotion Management

- Create promotion requests list
- Build promotion detail modal
- Implement approve/reject with comments
- Add active promotions management
- Create promotion scheduling and placement controls

### 29. Feedback Moderation

- Create flagged reviews list
- Build review detail view with context
- Implement moderation actions (Remove, Keep, Warn)
- Add search and filter for all reviews
- Create moderation action logs

### 30. Platform Analytics

- Create platform-wide analytics dashboard
- Build revenue breakdown by canteen chart
- Implement user growth trends
- Add peak hours heatmap
- Create popular items platform-wide chart
- Implement report export (CSV, PDF)

### 31. Bulk Notifications

- Create notification composer with rich text
- Build target audience selector
- Implement schedule send functionality
- Add notification history with delivery stats

### 32. Platform Settings

- Create global category management
- Implement token format configuration
- Add order timeout and cancellation policies
- Create notification template editor
- Implement audit logs for configuration changes

## Real-Time Features

### 33. Real-Time Order Updates

- Set up Supabase Realtime subscriptions for orders
- Implement client-side real-time order status updates
- Create WebSocket connection management
- Add reconnection handling for dropped connections

### 34. Real-Time Menu Availability

- Implement real-time item availability updates
- Create inventory change notifications
- Add real-time canteen open/closed status

## Token and QR Code System

### 35. Token Generation Service

- Create token generation algorithm (alphanumeric 6-8 chars)
- Implement uniqueness validation
- Build QR code generation service
- Create QR code image upload to Supabase Storage
- Implement token expiration logic

### 36. QR Code Scanning

- Integrate html5-qrcode library
- Create QR scanner component for canteen owners
- Implement camera access handling
- Add fallback for manual token entry

## Payment System

### 37. On-Shop Payment Flow

- Create payment entry interface
- Implement cash received input
- Build automatic change calculation
- Add payment confirmation workflow
- Create payment status update logic

## Notification System

### 38. Push Notifications

- Set up Web Push API
- Create service worker for PWA
- Implement notification permission request
- Build notification payload structure
- Add notification click handlers

### 39. In-App Notifications

- Create notification center component
- Implement notification list with read/unread status
- Add notification preferences management
- Create notification delivery system

## Image Upload and Storage

### 40. Image Upload System

- Create image upload component with validation
- Implement file type and size validation (JPEG, PNG, WebP, max 5MB)
- Build Supabase Storage upload service
- Add image optimization and CDN delivery
- Implement lazy loading with placeholders

## API Routes and Server Functions

### 41. Next.js API Routes

- Create order placement API route
- Build token generation API route
- Implement payment confirmation API route
- Create analytics data API routes
- Add export functionality API routes

### 42. Supabase Edge Functions (if needed)

- Set up Edge Functions for complex operations
- Create email notification Edge Function
- Implement automated workflow triggers

## Testing and Quality Assurance

### 43. Component Testing Setup

- Set up testing framework (Jest + React Testing Library)
- Create test utilities and helpers
- Write tests for critical components

### 44. Integration Testing

- Test authentication flows
- Test order placement and tracking
- Test payment flow
- Test real-time updates

## Deployment Configuration

### 45. Vercel Deployment Setup

- Configure Vercel project settings
- Set up environment variables
- Configure build settings
- Set up custom domain (if applicable)

### 46. PWA Configuration

- Create manifest.json
- Set up service worker
- Configure offline capabilities
- Add install prompt

## Documentation

### 47. Project Documentation

- Create comprehensive README.md
- Document environment setup
- Add API documentation
- Create deployment guide
- Document database schema

## Error Handling and Edge Cases

### 48. Error Handling Strategy

- Create global error boundary component
- Implement error logging service (Sentry or similar)
- Build user-friendly error messages
- Create error recovery mechanisms
- Add retry logic for failed API calls
- Implement graceful degradation for offline scenarios

### 49. Edge Case Handling

- Handle expired tokens gracefully
- Implement order cancellation timeout logic
- Add handling for deleted items in active cart
- Create fallback for unavailable canteens
- Handle payment calculation edge cases (rounding, discounts)
- Implement duplicate order prevention
- Add handling for concurrent order modifications

### 50. Form Validation and Error States

- Create comprehensive form validation schemas (Zod)
- Implement real-time validation feedback
- Add field-level error messages
- Create submission error handling
- Build validation error recovery flows

## Performance Optimization

### 51. Code Splitting and Lazy Loading

- Implement route-based code splitting
- Add component lazy loading for heavy components
- Create dynamic imports for admin/canteen panels
- Optimize bundle size with tree shaking
- Implement image lazy loading with Intersection Observer

### 52. Caching Strategy

- Set up React Query caching configuration
- Implement stale-while-revalidate pattern
- Create cache invalidation strategies
- Add browser caching headers for static assets
- Implement Supabase query result caching
- Create cache warming for frequently accessed data

### 53. Database Query Optimization

- Add database indexes for frequently queried columns
- Implement query result pagination
- Create database views for complex queries
- Optimize N+1 query problems
- Add query performance monitoring
- Implement database connection pooling

### 54. Image Optimization

- Set up Next.js Image component with optimization
- Implement responsive image sizes
- Add WebP format support with fallbacks
- Create image compression pipeline
- Implement CDN caching for images
- Add placeholder blur effects

## Security Enhancements

### 55. API Security

- Implement rate limiting for API routes
- Add request validation middleware
- Create CSRF protection
- Implement API key rotation (if applicable)
- Add request sanitization
- Create security headers configuration

### 56. Data Security

- Implement input sanitization for all user inputs
- Add SQL injection prevention (parameterized queries)
- Create XSS protection measures
- Implement secure file upload validation
- Add data encryption for sensitive information
- Create secure token storage

### 57. Authentication Security

- Implement session timeout handling
- Add refresh token rotation
- Create secure cookie configuration
- Implement account lockout after failed attempts
- Add two-factor authentication option (future)
- Create security audit logging

### 58. Content Security Policy

- Configure CSP headers
- Implement nonce-based script loading
- Add trusted sources for external resources
- Create CSP violation reporting

## Accessibility (a11y)

### 59. WCAG Compliance

- Implement ARIA labels for all interactive elements
- Add keyboard navigation support
- Create focus management for modals and dialogs
- Implement screen reader announcements
- Add color contrast compliance (WCAG AA)
- Create skip navigation links

### 60. Responsive Design Enhancements

- Implement touch-friendly target sizes (min 44x44px)
- Add responsive typography scaling
- Create mobile-first breakpoint strategy
- Implement landscape/portrait orientation handling
- Add device-specific optimizations

## Search and Filtering

### 61. Advanced Search Implementation

- Implement full-text search with PostgreSQL
- Create search result ranking algorithm
- Add fuzzy search for typos
- Implement search autocomplete with debouncing
- Create search history and suggestions
- Add search filters persistence in URL

### 62. Filter System Enhancement

- Implement multi-select filters
- Create filter state management
- Add filter combination logic (AND/OR)
- Implement filter reset functionality
- Create saved filter presets
- Add filter analytics tracking

## Monitoring and Logging

### 63. Application Monitoring

- Set up error tracking (Sentry/LogRocket)
- Implement performance monitoring
- Create user session recording (optional)
- Add real-time error alerts
- Implement uptime monitoring
- Create performance metrics dashboard

### 64. Analytics Implementation

- Set up Google Analytics or Plausible
- Implement custom event tracking
- Create conversion funnel tracking
- Add user behavior analytics
- Implement A/B testing framework (optional)
- Create analytics dashboard for stakeholders

### 65. Logging Strategy

- Implement structured logging
- Create log levels (error, warn, info, debug)
- Add request/response logging
- Implement log aggregation
- Create log retention policies
- Add log search and filtering

## Backup and Recovery

### 66. Database Backup Strategy

- Set up automated daily database backups
- Implement point-in-time recovery
- Create backup verification process
- Add backup retention policy
- Implement disaster recovery plan
- Create backup restoration procedures

### 67. Data Export and Import

- Create data export functionality for users
- Implement bulk data import tools
- Add data migration scripts
- Create data validation for imports
- Implement rollback procedures

## Rate Limiting and Throttling

### 68. API Rate Limiting

- Implement rate limiting per user/IP
- Add rate limiting for specific endpoints
- Create rate limit headers in responses
- Implement rate limit exceeded error handling
- Add rate limit configuration in admin panel

### 69. Request Throttling

- Implement debouncing for search inputs
- Add throttling for scroll events
- Create request queuing for batch operations
- Implement priority-based request handling

## Mobile App Considerations

### 70. PWA Enhancements

- Implement app shortcuts
- Add share target API for order sharing
- Create background sync for offline orders
- Implement app badge for notifications
- Add splash screen customization
- Create theme color configuration

### 71. Mobile-Specific Features

- Implement pull-to-refresh
- Add swipe gestures for navigation
- Create haptic feedback for actions
- Implement mobile camera integration
- Add location services (if needed)
- Create mobile-optimized forms

## Offline Support

### 72. Offline Functionality

- Implement service worker caching strategy
- Create offline page fallback
- Add offline data storage (IndexedDB)
- Implement sync queue for offline actions
- Create offline indicator UI
- Add conflict resolution for offline sync

## SEO Optimization

### 73. SEO Implementation

- Implement dynamic meta tags per page
- Create Open Graph tags for social sharing
- Add structured data (JSON-LD) for canteens/items
- Implement sitemap generation
- Create robots.txt configuration
- Add canonical URLs

### 74. Performance SEO

- Implement Core Web Vitals optimization
- Add preload/prefetch for critical resources
- Create resource hints (dns-prefetch, preconnect)
- Implement server-side rendering optimization
- Add compression (gzip/brotli)

## Code Quality and Standards

### 75. Code Organization

- Implement feature-based folder structure
- Create shared utilities and helpers
- Add type definitions and interfaces
- Implement consistent naming conventions
- Create code documentation standards
- Add JSDoc comments for complex functions

### 76. Code Quality Tools

- Set up ESLint with custom rules
- Configure Prettier for code formatting
- Add Husky for pre-commit hooks
- Implement lint-staged for staged files
- Create pre-commit validation
- Add TypeScript strict mode

### 77. Code Review Process

- Create pull request templates
- Implement code review checklist
- Add automated code quality checks
- Create merge conflict resolution guide
- Implement branch protection rules

## CI/CD Pipeline

### 78. Continuous Integration

- Set up GitHub Actions or similar CI
- Create automated test runs
- Implement linting in CI pipeline
- Add type checking in CI
- Create build verification
- Implement security scanning

### 79. Continuous Deployment

- Set up automated deployment to staging
- Create production deployment workflow
- Implement deployment rollback procedures
- Add deployment notifications
- Create environment-specific configurations
- Implement feature flags system

## Additional Features

### 80. Social Features

- Implement order sharing on social media
- Add referral program (optional)
- Create user achievements/badges (optional)
- Implement social login sharing

### 81. Localization (Future)

- Set up i18n framework (next-intl)
- Create translation files structure
- Implement language switcher
- Add RTL support (if needed)
- Create date/time localization

### 82. Advanced Analytics

- Implement cohort analysis
- Create customer lifetime value tracking
- Add predictive analytics (optional)
- Implement recommendation engine
- Create churn prediction (optional)

## Key Files to Create

**Project Structure:**

- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.env.local.example` - Environment variables template

**Core Application:**

- `app/layout.tsx` - Root layout
- `app/page.tsx` - Landing page
- `lib/supabase/client.ts` - Supabase client
- `lib/supabase/server.ts` - Supabase server utilities
- `lib/supabase/middleware.ts` - Auth middleware

**Database:**

- `supabase/migrations/` - All database migration files
- `supabase/seed.sql` - Seed data (optional)

**Components:**

- Feature-based component organization
- Shared components in `components/ui/`
- Feature components in `components/[feature]/`

**State Management:**

- `store/` - Zustand stores
- `hooks/` - Custom React hooks

**Utilities:**

- `lib/utils/` - Helper functions
- `lib/validations/` - Zod schemas
- `lib/constants/` - App constants

**Configuration Files:**

- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.husky/` - Git hooks
- `jest.config.js` - Jest configuration
- `cypress.config.ts` - Cypress configuration (if E2E testing)
- `sentry.client.config.ts` - Sentry client config
- `sentry.server.config.ts` - Sentry server config

**Documentation:**

- `README.md` - Project documentation
- `docs/` - Additional documentation
- `CHANGELOG.md` - Version history
- `CONTRIBUTING.md` - Contribution guidelines

## Implementation Priority

### Phase 1: Foundation (Weeks 1-2)
- Project setup and configuration
- Database schema and migrations
- Authentication system
- Base UI components

### Phase 2: Core Features (Weeks 3-5)
- Student panel: Home, Menu, Cart, Orders
- Canteen owner panel: Dashboard, Menu Management, Order Management
- Token and QR code system
- Payment flow

### Phase 3: Advanced Features (Weeks 6-7)
- Real-time updates
- Notifications system
- Feedback and ratings
- Offers and promotions

### Phase 4: Admin & Polish (Weeks 8-9)
- Admin panel features
- Analytics and reporting
- Error handling and edge cases
- Performance optimization

### Phase 5: Testing & Deployment (Week 10)
- Comprehensive testing
- Security audit
- Performance testing
- Deployment and monitoring setup

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- Time to Interactive < 3 seconds
- Lighthouse score > 90
- Zero critical security vulnerabilities
- 99.9% uptime

### Business Metrics
- Order placement success rate > 95%
- Average order processing time
- User retention rate
- Canteen owner satisfaction
- Platform adoption rate

