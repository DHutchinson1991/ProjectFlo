# API Data Mapping Pattern

## Problem Solved

Previously, we experienced confusion between the backend API response structure and our frontend domain models. The backend returns contributor data with nested `contact` and `role` objects, but our frontend was expecting flattened properties directly on the contributor.

## Solution

We've implemented a clear separation between:

1. **API Response Types** (`api-responses.ts`) - Exact structure returned by backend
2. **Domain Models** (`users.ts`) - Frontend-friendly models with computed properties
3. **Mappers** (`mappers.ts`) - Functions to transform API responses to domain models
4. **Helper Functions** - Safe utilities for common operations

## Structure

### Backend API Response
```typescript
{
  id: 3,
  contact_id: 3,
  role_id: 3,
  contributor_type: "Internal",
  default_hourly_rate: "45", // String from Decimal
  contact: {
    id: 3,
    first_name: "Andy",
    last_name: "Galloway", 
    email: "andy@example.com",
    phone_number: null
  },
  role: {
    id: 3,
    name: "Manager"
  }
}
```

### Frontend Domain Model
```typescript
{
  // Backend structure preserved
  id: 3,
  contact_id: 3,
  role_id: 3,
  contact: { ... },
  role: { ... },
  
  // Computed convenience properties
  email: "andy@example.com",
  first_name: "Andy", 
  last_name: "Galloway",
  default_hourly_rate: 45 // Converted to number
}
```

## Usage

### In API Service
```typescript
// api.ts
getById: async (id: number): Promise<Contributor> => {
  const apiResponse: ContributorApiResponse = await this.get(`/contributors/${id}`);
  return mapContributorResponse(apiResponse); // Transform to domain model
}
```

### In Components
```typescript
// Use helper functions for consistent data access
import { contributorHelpers } from "@/lib/types/mappers";

// Safe access to user name
const displayName = contributorHelpers.getDisplayName(user);

// Safe access to initials
const initials = contributorHelpers.getInitials(user);

// Safe access to hourly rate (handles string->number conversion)
const rate = contributorHelpers.getDefaultHourlyRate(user);
```

## Benefits

1. **Type Safety** - Clear distinction between API and domain types
2. **Null Safety** - Helper functions handle null/undefined gracefully  
3. **Consistency** - All components use the same access patterns
4. **Maintainability** - Backend changes only require mapper updates
5. **Documentation** - Types serve as API documentation

## Best Practices

1. **Always use mappers** when consuming API responses
2. **Use helper functions** instead of direct property access
3. **Update API response types** when backend changes
4. **Test mappers** to ensure data integrity
5. **Document breaking changes** in API response structure

## Example: Adding New API Endpoint

1. Define the API response type in `api-responses.ts`
2. Create a mapper function in `mappers.ts`
3. Add helper functions for safe data access
4. Use the mapper in the API service
5. Update components to use helper functions

This pattern prevents the confusion we experienced and makes the codebase more robust and maintainable.
