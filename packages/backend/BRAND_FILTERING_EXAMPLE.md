# Multi-Tenant Brand Filtering Implementation Guide

## 1. Update Controllers to Accept Brand Context

### Current Issue
```typescript
// ❌ Current: Returns ALL contacts regardless of brand
@Get()
findAll() {
    return this.contactsService.findAll();
}
```

### Solution: Add Brand Query Parameter
```typescript
// ✅ Fixed: Filter by brand
@Get()
findAll(@Query('brandId', ParseIntPipe) brandId?: number) {
    return this.contactsService.findAll(brandId);
}
```

## 2. Update Services to Filter by Brand

### Current Issue
```typescript
// ❌ Current: No brand filtering
async findAll(): Promise<contacts[]> {
    return this.prisma.contacts.findMany();
}
```

### Solution: Add Brand Filtering
```typescript
// ✅ Fixed: Filter by brand
async findAll(brandId?: number): Promise<contacts[]> {
    return this.prisma.contacts.findMany({
        where: brandId ? { business_id: brandId } : {},
    });
}
```

## 3. Frontend Brand Context Implementation

### Brand Context Provider
```typescript
interface BrandContextType {
    currentBrand: Brand | null;
    availableBrands: Brand[];
    switchBrand: (brandId: number) => Promise<void>;
    isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | null>(null);

export const BrandProvider = ({ children }) => {
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const switchBrand = async (brandId: number) => {
        setIsLoading(true);
        try {
            const response = await api.brands.switchContext(brandId, user.id);
            setCurrentBrand(response.brand);
            // Refresh all data with new brand context
            window.location.reload(); // Or better: refresh data contexts
        } finally {
            setIsLoading(false);
        }
    };

    // Load user's brands on mount
    useEffect(() => {
        if (user) {
            api.brands.getUserBrands(user.id).then(setAvailableBrands);
        }
    }, [user]);

    return (
        <BrandContext.Provider value={{ currentBrand, availableBrands, switchBrand, isLoading }}>
            {children}
        </BrandContext.Provider>
    );
};
```

### Brand Selector Component
```typescript
const BrandSelector = () => {
    const { currentBrand, availableBrands, switchBrand, isLoading } = useBrandContext();

    return (
        <Select
            value={currentBrand?.id || ''}
            onChange={(value) => switchBrand(Number(value))}
            disabled={isLoading}
        >
            {availableBrands.map(brand => (
                <Option key={brand.id} value={brand.id}>
                    {brand.display_name || brand.name}
                </Option>
            ))}
        </Select>
    );
};
```

### Update API Services
```typescript
// Update all API calls to include brand context
export const contactsService = {
    getAll: (brandId?: number) => 
        api.get(`/contacts${brandId ? `?brandId=${brandId}` : ''}`),
    
    getById: (id: number, brandId?: number) => 
        api.get(`/contacts/${id}${brandId ? `?brandId=${brandId}` : ''}`),
};

export const filmsService = {
    getAll: (brandId?: number) => 
        api.get(`/films${brandId ? `?brandId=${brandId}` : ''}`),
};
```

## 4. Critical Controllers That Need Brand Filtering

All these controllers need to be updated:

### Priority 1 (Core Data)
- ✅ `/contacts` - Already has business_id
- ✅ `/films` (filmLibrary) - Already has business_id  
- ✅ `/scenes` (ScenesLibrary) - Already has business_id
- ✅ `/projects` - Already has business_id

### Priority 2 (Related Data)  
- ✅ `/tasks` - Connected via projects
- ✅ `/contributors` - Connected via user_brands
- ✅ `/roles` - Already has business_id

## 5. Authentication Integration

### JWT Payload Enhancement
```typescript
// Add brand context to JWT payload
interface JwtPayload {
    sub: number;
    email: string;
    roles: string[];
    currentBrandId?: number; // Add this
    brands: Array<{
        id: number;
        name: string;
        role: string;
    }>; // Add this
}
```

### Brand Guard
```typescript
@Injectable()
export class BrandGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const brandId = request.query.brandId || request.params.brandId;
        
        if (!brandId) return true; // Allow non-brand-specific requests
        
        // Check if user has access to this brand
        return user.brands.some(brand => brand.id === Number(brandId));
    }
}
```

## 6. Implementation Priority

### Phase 1: Backend API Updates
1. Update contacts.service.ts
2. Update films controller/service  
3. Update scenes controller/service
4. Update projects controller/service

### Phase 2: Frontend Brand Context
1. Create BrandProvider
2. Create BrandSelector component
3. Update API services to use brand context
4. Add brand context to main layout

### Phase 3: Authentication Enhancement
1. Add brand context to JWT
2. Create brand access guard
3. Update login flow to select default brand

## 7. Database Verification

The schema is already correct! All major tables have brand associations:

```sql
-- ✅ Already implemented in schema
contacts.business_id → brands.id
film_library.business_id → brands.id  
scenes_library.business_id → brands.id
projects.business_id → brands.id
roles.business_id → brands.id
user_brands (junction table)
```

The issue is NOT the database - it's the API filtering logic.
