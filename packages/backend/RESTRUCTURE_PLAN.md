# Backend Restructure Plan: Domain-Based Organization

## Current State Analysis
- **20 modules** in flat `src/` structure
- **88 TypeScript files** total
- Growing complexity with duplicate/related functionality

## Proposed Domain Structure

### **Domain 1: Core Business (`/src/core/`)**
```
src/core/
├── auth/              # Authentication & authorization
├── users/             
│   ├── contributors/   # Team members
│   ├── contacts/       # All contacts (unified)
│   └── roles/         # User roles & permissions
└── analytics/         # Business analytics
```

**Rationale:** These are foundational systems that everything else depends on.

### **Domain 2: Content Management (`/src/content/`)**
```
src/content/
├── components/        # Video components library
├── coverage-scenes/   # Wedding scenes
├── editing-styles/    # Video editing styles  
├── music/            # Music library
└── categories/       # Content categorization
```

**Rationale:** All related to the creative/content side of wedding video production.

### **Domain 3: Project Management (`/src/projects/`)**
```
src/projects/
├── workflows/         # Project workflows
├── tasks/            # Task management
├── task-templates/   # Task templates
├── timeline/         # Project timelines
└── entity-default-tasks/ # Default task assignments
```

**Rationale:** Everything related to managing wedding video projects.

### **Domain 4: Business Operations (`/src/business/`)**
```
src/business/
├── pricing/          # Pricing logic
└── audit/           # Business auditing
```

**Rationale:** Business logic and administrative functions.

### **Simplified Root (`/src/`)**
```
src/
├── core/             # Domain 1
├── content/          # Domain 2  
├── projects/         # Domain 3
├── business/         # Domain 4
├── app.module.ts     # Main app module
├── main.ts          # Application entry
└── prisma.service.ts # Database service
```

## Analysis of Potential Duplicates/Consolidations

### **1. Content vs Content-Service**
- `content/` - Contains controllers (UI interface)
- `content-service/` - Contains services (business logic)
- **Recommendation:** Merge into single `content/` domain

### **2. Tasks vs Task-Templates vs Entity-Default-Tasks**
- All task-related functionality
- **Recommendation:** Group under `projects/` domain

### **3. Contributors vs Contacts vs Roles**
- All user/people management
- **Recommendation:** Group under `core/users/` subdomain

## Migration Strategy

### **Phase 1: Safe Grouping (No Breaking Changes)**
1. Create domain folders
2. Move modules into domains
3. Update import paths in `app.module.ts`
4. Test that everything still works

### **Phase 2: Consolidation (Optional)**
1. Merge `content/` and `content-service/`
2. Review task-related modules for overlap
3. Consolidate user management modules

### **Phase 3: Clean Architecture (Future)**
1. Implement shared interfaces
2. Add domain-specific barrel exports
3. Consider feature-based modules

## Benefits of Domain Structure

### **Immediate Benefits:**
- ✅ **Easier Navigation** - Find related code faster
- ✅ **Logical Grouping** - Business domains are clear
- ✅ **Better Imports** - Shorter, more intuitive paths
- ✅ **Team Collaboration** - Developers can own domains

### **Long-term Benefits:**
- ✅ **Scalability** - Each domain can grow independently
- ✅ **Microservices Ready** - Domains could become separate services
- ✅ **Maintainability** - Easier to understand and modify
- ✅ **Testing** - Domain-specific test strategies

## Implementation Steps

### **Step 1: Create Domain Structure**
```bash
mkdir -p src/core/users
mkdir -p src/content
mkdir -p src/projects  
mkdir -p src/business
```

### **Step 2: Move Modules (Example)**
```bash
# Core domain
mv src/auth src/core/
mv src/contributors src/core/users/
mv src/contacts src/core/users/
mv src/roles src/core/users/
mv src/analytics src/core/

# Content domain  
mv src/components src/content/
mv src/coverage-scenes src/content/
mv src/editing-styles src/content/
mv src/music src/content/
mv src/categories src/content/
# Merge content-service into content

# Projects domain
mv src/workflows src/projects/
mv src/tasks src/projects/
mv src/task-templates src/projects/
mv src/timeline src/projects/
mv src/entity-default-tasks src/projects/

# Business domain
mv src/pricing src/business/
mv src/audit src/business/
```

### **Step 3: Update Import Paths**
Update `app.module.ts` to import from new locations:
```typescript
// Before
import { AuthModule } from './auth/auth.module';
import { ContributorsModule } from './contributors/contributors.module';

// After  
import { AuthModule } from './core/auth/auth.module';
import { ContributorsModule } from './core/users/contributors/contributors.module';
```

## Alternative: Keep Current Structure

If the domain approach seems too complex, you could:

### **Option A: Module Consolidation Only**
- Merge `content` + `content-service` 
- Merge task-related modules
- Keep flat structure but with fewer, larger modules

### **Option B: Alphabetical + Prefixes**
```
src/
├── core-auth/
├── core-users/  
├── content-components/
├── content-scenes/
├── project-tasks/
├── project-workflows/
└── business-pricing/
```

## Recommendation

**I recommend the Domain-Based Structure** because:

1. **Your business has clear domains** (core, content, projects, business)
2. **20 modules is too many** for a flat structure  
3. **Future scalability** - Each domain can grow independently
4. **Standard enterprise pattern** - Used by large NestJS applications
5. **Non-breaking change** - Can be done safely

The move would be straightforward and you'd immediately benefit from better organization without changing any functionality.

## Next Steps

1. **Decision:** Choose domain structure vs. keep current
2. **Planning:** If restructuring, plan the migration order
3. **Implementation:** Start with one domain to test the approach
4. **Testing:** Ensure all imports and tests still work
5. **Documentation:** Update any README files with new structure

Would you like to proceed with the domain-based restructure?
