# Needs Assessment Page - Loading Fix

## Problem Summary
The needs-assessment page at `http://localhost:3001/needs-assessment/preview` was stuck in infinite loading with no error messages.

## Root Cause
The preview route lacked an authentication wrapper. This prevented:
- AuthProvider from completing authentication
- BrandProvider from resolving user brands
- The page component's `useBrand()` hook from getting a brand
- The data-fetch useEffect from executing (guarded by `if (!currentBrand?.id) return;`)

Result: Infinite loading state with no visible errors or logs.

## Solution Applied

### File 1: Created `packages/frontend/src/app/(portal)/needs-assessment/preview/layout.tsx`
```typescript
"use client";
import React from "react";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute/ProtectedRoute";

export default function PreviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}
```
**Purpose:** Wraps the preview page with authentication requirement, ensuring AuthProvider and BrandProvider complete before rendering.

### File 2: Updated `packages/frontend/src/app/(portal)/needs-assessment/preview/page.tsx`
```typescript
"use client";

export { default } from "@/app/(studio)/sales/needs-assessment/page";
```
**Purpose:** Added "use client" directive to ensure client-side execution of the re-exported component.

### File 3: Updated `packages/frontend/src/app/(studio)/sales/needs-assessment/page.tsx`
- Added `if (!currentBrand)` state showing "Loading brand context..."
- Added `if (error)` state with error message and refresh button
- Enhanced catch block with `console.error("❌ Needs Assessment Load Error:", errorMessage, err)`

**Purpose:** Provide visibility into what's happening at each stage.

### File 4: Updated `packages/backend/src/needs-assessments/needs-assessments.controller.ts`
- Added `Logger` import
- Added `private readonly logger = new Logger(NeedsAssessmentsController.name);`
- Added logging to `getActiveTemplate`: `this.logger.log(...)`

**Purpose:** Track API requests for debugging.

## How to Test

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Navigate to** `http://localhost:3001/needs-assessment/preview`
3. **Expected behavior:**
   - If NOT logged in: Login modal appears
   - If logged in: Brief shimmer loading → questionnaire displays
   - If error: Error message with refresh button

4. **Check console** (F12) for any messages starting with "❌ Needs Assessment Load Error:"
5. **Check backend logs** for message: "Fetching active template for brandId: [number]"

## Files Modified
✅ `packages/frontend/src/app/(portal)/needs-assessment/preview/layout.tsx` (NEW)
✅ `packages/frontend/src/app/(portal)/needs-assessment/preview/page.tsx` (UPDATED)
✅ `packages/frontend/src/app/(studio)/sales/needs-assessment/page.tsx` (UPDATED)
✅ `packages/backend/src/needs-assessments/needs-assessments.controller.ts` (UPDATED)

## Verification
- All TypeScript files compile without errors
- No import path issues
- All required components properly imported
