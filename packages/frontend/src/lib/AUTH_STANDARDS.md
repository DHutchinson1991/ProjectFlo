# Authentication Usage Guidelines for Frontend

## Overview

To ensure consistent authentication handling across the ProjectFlo frontend, always use the `authService` for all authentication-related operations. This document provides guidelines on the standard approach.

## Importing authService

```typescript
// Import the authService directly from the api module
import { authService } from '@/lib/api';

// If you need other services too
import { authService, contributorsService } from '@/lib/api';

// Avoid using api.auth directly
// ❌ Don't do this:
import { api } from '@/lib/api';
api.auth.login(...); // Avoid this pattern
```

## Authentication Operations

### Login

```typescript
// Recommended approach in components
const handleLogin = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    // Handle successful login
  } catch (error) {
    // Handle login error
  }
};
```

### Getting the Current Token

```typescript
// Getting the auth token
const token = authService.getToken();

// ❌ Don't do this:
const token = localStorage.getItem('authToken'); // Avoid direct localStorage access
```

### Setting the Token

```typescript
// Setting the auth token
authService.setToken(newToken);

// ❌ Don't do this:
localStorage.setItem('authToken', newToken); // Avoid direct localStorage access
api.setAuthToken(newToken); // Avoid using base api methods
```

### Logging Out

```typescript
// Logging out
authService.setToken(null);

// If using AuthProvider (recommended)
const { logout } = useAuth();
logout();
```

### Handling 401 Unauthorized

```typescript
// Set up a callback to handle 401 Unauthorized responses
authService.onUnauthorized(() => {
  // Handle unauthorized (e.g., redirect to login)
});
```

## Using the AuthProvider

The AuthProvider component is the recommended way to manage authentication state in the application:

```typescript
// In a component
import { useAuth } from '@/app/providers/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use authentication methods and state
}
```

## Development Utilities

For development and debugging, use the auth utilities:

```typescript
import { debugAuth, setDevAuthToken } from '@/lib/auth-utils';

// Debug current auth state
debugAuth();

// Set a development token (DEV ONLY!)
const clearToken = setDevAuthToken('your-test-token');

// Later, clear the token
clearToken();
```

## Browser Console Debugging

In development mode, authentication utilities are available in the browser console:

```javascript
// Debug current auth state
window.__auth.debug();

// Get the current token
window.__auth.getToken();

// Set a development token
window.__auth.setToken('your-test-token');

// Clear the token
window.__auth.clearToken();
```

## Key Benefits of Using authService

1. **Centralized Logic**: All authentication logic is in one place
2. **Consistent Storage**: Token storage is handled consistently
3. **Automatic Error Handling**: 401 responses are handled automatically
4. **Type Safety**: All methods are fully typed
5. **SSR Compatibility**: Works in both browser and server environments

## Migrating Legacy Code

When updating older components:

1. Replace direct `localStorage` access with `authService` methods
2. Replace `api.auth` with `authService`
3. Update imports to include `authService` directly

## Need Help?

Check the implementation in `AuthProvider.tsx` for a reference implementation of proper authentication handling.
