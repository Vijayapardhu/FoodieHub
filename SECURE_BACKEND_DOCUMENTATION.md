# Secure Backend API Documentation

## Overview

This document describes the secure backend architecture and API routes implemented for the FoodieHub canteen management system. All routes are protected with authentication, authorization, input validation, and rate limiting.

## Security Features

### 1. Authentication & Authorization
- ✅ JWT-based authentication via Supabase Auth
- ✅ Role-based access control (Student, Canteen Owner, Admin)
- ✅ Resource ownership verification
- ✅ Canteen access control

### 2. Input Validation
- ✅ Zod schema validation for all inputs
- ✅ UUID validation
- ✅ Input sanitization (XSS protection)
- ✅ Type checking and format validation

### 3. Rate Limiting
- ✅ In-memory rate limiting (100 requests per minute per user per endpoint)
- ✅ Configurable limits per endpoint
- ✅ Automatic reset after time window

### 4. Error Handling
- ✅ Consistent error response format
- ✅ Detailed error messages in development
- ✅ Sanitized error messages in production
- ✅ Proper HTTP status codes

### 5. Database Security
- ✅ Row-Level Security (RLS) policies
- ✅ Parameterized queries (via Supabase)
- ✅ SQL injection prevention
- ✅ Transaction integrity

## API Routes

### Order Templates API

#### GET `/api/templates?canteen_id={uuid}`
Get all templates for a canteen.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Query Parameters**:
- `canteen_id` (required): UUID of the canteen

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "canteen_id": "uuid",
      "name": "My Usual Order",
      "description": "Regular lunch order",
      "items": [...],
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### POST `/api/templates`
Create a new order template.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Request Body**:
```json
{
  "canteen_id": "uuid",
  "name": "Template Name",
  "description": "Optional description",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 2
    }
  ]
}
```

**Validations**:
- Name: 1-50 characters
- Description: Max 200 characters
- Items: 1-20 items required
- All items must belong to the specified canteen
- Template name must be unique per user per canteen

#### GET `/api/templates/[id]`
Get a single template by ID.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Authorization**: User must own the template

#### PUT `/api/templates/[id]`
Update a template.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Authorization**: User must own the template

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "items": [...]
}
```

#### DELETE `/api/templates/[id]`
Delete a template.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Authorization**: User must own the template

### Loyalty Points API

#### GET `/api/loyalty/points?canteen_id={uuid}`
Get loyalty points for a user.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Query Parameters**:
- `canteen_id` (optional): UUID of canteen (if not provided, returns platform-wide points)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "canteen_id": "uuid",
      "points": 150,
      "total_earned": 500,
      "total_redeemed": 350,
      "tier": "silver",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### GET `/api/loyalty/transactions?canteen_id={uuid}&limit={number}&offset={number}`
Get loyalty point transactions.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Query Parameters**:
- `canteen_id` (optional): Filter by canteen
- `limit` (optional, default: 50, max: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Dietary Preferences API

#### GET `/api/dietary-preferences`
Get user's dietary preferences.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Response**:
```json
{
  "success": true,
  "data": {
    "allergies": ["Peanuts", "Dairy"],
    "dietary_restrictions": ["Vegetarian", "Gluten-Free"],
    "preferred_cuisines": ["Indian", "Italian"]
  }
}
```

#### POST/PUT `/api/dietary-preferences`
Update user's dietary preferences.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Request Body**:
```json
{
  "allergies": ["Peanuts", "Dairy"],
  "dietary_restrictions": ["Vegetarian"],
  "preferred_cuisines": ["Indian"]
}
```

**Validations**:
- Each array max 20 items
- Each item max 50 characters
- All inputs sanitized

### Scheduled Orders API

#### POST `/api/orders/scheduled/validate`
Validate a scheduled order time.

**Authentication**: Required (Student, Canteen Owner, Admin)

**Request Body**:
```json
{
  "canteen_id": "uuid",
  "scheduled_pickup_time": "2024-01-15T12:30:00Z"
}
```

**Validations**:
- Scheduled time must be in the future
- Cannot be more than 30 days in the future
- Must be within canteen operating hours (if configured)

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Scheduled time is valid"
  }
}
```

## Middleware Functions

### `createSecureHandler(options)`
Main middleware function for creating secure API handlers.

**Options**:
- `allowedRoles`: Array of roles allowed to access
- `schema`: Zod schema for request body validation
- `handler`: Handler function

**Example**:
```typescript
export const GET = createSecureHandler({
  allowedRoles: ["student", "canteen_owner"],
  handler: async (request, { user, supabase, body }) => {
    // Handler logic
    return successResponse(data)
  }
})
```

### `authenticateRequest(request)`
Authenticates the request and returns user info.

### `checkResourceOwnership(supabase, userId, table, resourceId)`
Checks if user owns a resource.

### `checkCanteenAccess(supabase, userId, canteenId, userRole)`
Checks if user has access to a canteen.

### `sanitizeInput(input)`
Sanitizes input to prevent XSS attacks.

### `isValidUUID(uuid)`
Validates UUID format.

### `successResponse(data, message?)`
Creates a success response.

### `errorResponse(error, statusCode?, details?)`
Creates an error response.

## Security Best Practices

### 1. Always Validate Input
- Use Zod schemas for all inputs
- Validate UUIDs before using them
- Sanitize string inputs

### 2. Check Authorization
- Verify user owns resources before operations
- Check roles for sensitive operations
- Validate canteen access

### 3. Use Parameterized Queries
- Always use Supabase client methods (not raw SQL)
- Let Supabase handle parameterization

### 4. Handle Errors Properly
- Don't expose internal errors in production
- Log errors for debugging
- Return appropriate HTTP status codes

### 5. Rate Limiting
- All API routes are rate limited
- 100 requests per minute per user per endpoint
- Configurable per endpoint

## Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": {...} // Only in development
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message"
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Database Security (RLS)

All tables have Row-Level Security enabled:

1. **order_templates**: Users can only access their own templates
2. **loyalty_points**: Users can only view their own points (managed by triggers)
3. **loyalty_transactions**: Users can only view their own transactions
4. **user_dietary_preferences**: Users can only manage their own preferences

## Rate Limiting

- **Default**: 100 requests per minute per user per endpoint
- **In-memory**: Currently using in-memory storage (for production, use Redis)
- **Automatic reset**: Rate limit resets after time window

## Testing

When testing API routes:

1. Include authentication token in request headers
2. Test with different roles to verify authorization
3. Test input validation with invalid data
4. Test rate limiting with multiple rapid requests
5. Test error scenarios

## Production Considerations

1. **Rate Limiting**: Move from in-memory to Redis for distributed systems
2. **Logging**: Implement comprehensive logging for security events
3. **Monitoring**: Set up monitoring for unusual activity
4. **CORS**: Configure CORS properly for production domain
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never expose sensitive keys in code

## Future Enhancements

1. API versioning
2. Request signing for sensitive operations
3. Webhook support for external integrations
4. GraphQL API option
5. API documentation (OpenAPI/Swagger)
6. Request/response logging middleware
7. IP-based rate limiting

