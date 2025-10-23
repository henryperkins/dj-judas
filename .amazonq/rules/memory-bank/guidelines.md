# Development Guidelines

## Code Quality Standards

### Formatting & Structure
- **TypeScript Strict Mode**: All TypeScript files use strict type checking with explicit type annotations
- **Interface-First Design**: Prefer interfaces over types for object shapes (5/5 files)
- **Explicit Return Types**: Functions declare return types explicitly, especially for async operations
- **No Implicit Any**: All variables and parameters have explicit types
- **Consistent Naming**: 
  - PascalCase for interfaces, types, React components, and classes
  - camelCase for variables, functions, and methods
  - UPPER_SNAKE_CASE for constants and environment variables
  - kebab-case for file names and CSS classes

### Documentation Standards
- **JSDoc Comments**: Complex functions include JSDoc with parameter descriptions and return types
- **Inline Comments**: Used sparingly for non-obvious logic, business rules, or workarounds
- **README Files**: Each major module/directory has a README explaining purpose and usage
- **Type Documentation**: Complex types include comments explaining their purpose and constraints

### Code Organization
- **Single Responsibility**: Each file/function has one clear purpose
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Modular Structure**: Related functionality grouped in dedicated modules/directories
- **Barrel Exports**: Index files re-export public APIs from modules

## Semantic Patterns

### Error Handling
```typescript
// Pattern: Try-catch with graceful degradation
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return fallbackValue; // Always provide fallback
}

// Pattern: Validation with early returns
if (!requiredValue) {
  return c.json({ error: 'missing_value' }, 400);
}
```

### Async Operations
```typescript
// Pattern: Promise.all for parallel operations
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2()
]);

// Pattern: Async/await with proper error boundaries
async function fetchWithFallback() {
  try {
    return await primarySource();
  } catch {
    return await fallbackSource();
  }
}
```

### React Component Patterns
```typescript
// Pattern: Functional components with hooks
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Side effects with cleanup
    return () => cleanup();
  }, [dependencies]);
  
  return <div>{content}</div>;
};

// Pattern: Custom hooks for reusable logic
export function useCustomHook(param: Type) {
  const [state, setState] = useState<Type>();
  // Hook logic
  return { state, handlers };
}
```

### API Route Patterns (Hono)
```typescript
// Pattern: Route with validation and error handling
app.post('/api/resource', async (c) => {
  // 1. Authentication check
  const token = getTokenFromCookie(c.req.header('Cookie'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  
  // 2. Input validation
  const body = await c.req.json<ExpectedType>();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', issues: parsed.error.issues }, 400);
  }
  
  // 3. Business logic with error handling
  try {
    const result = await performOperation(parsed.data);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Operation failed:', error);
    return c.json({ error: 'operation_failed' }, 500);
  }
});
```

### Caching Strategy
```typescript
// Pattern: Multi-tier caching (L1 memory + L2 KV)
const cacheKey = 'resource:id:v1';
const cached = await cache.get<Type>(cacheKey).catch(() => null);
if (cached) {
  return c.json(cached, 200, { 'X-Cache': 'HIT' });
}

const fresh = await fetchFreshData();
await cache.set(cacheKey, fresh, ttlSeconds);
return c.json(fresh, 200, { 'X-Cache': 'MISS' });
```

### State Management
```typescript
// Pattern: Controlled form inputs with validation
const [formData, setFormData] = useState<FormData>(initialState);
const [errors, setErrors] = useState<FormErrors>({});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Clear error on change
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }
};
```

## Architectural Patterns

### Dependency Injection
- Environment variables and bindings passed through context (Hono `c.env`)
- Services resolved from container in Medusa backend
- No global state or singletons

### Repository Pattern
```typescript
// Pattern: Data access abstraction
async function loadFromD1(c: { env: Env }): Promise<Item[] | null> {
  const db = c.env.DB;
  if (!db) return null;
  
  const { results } = await db.prepare(sql).all();
  return results?.map(mapToModel) || [];
}
```

### Workflow Pattern (Medusa)
```typescript
// Pattern: Composable workflows for complex operations
const { result } = await createProductsWorkflow(container).run({
  input: { products: productData }
});
```

### Middleware Pattern (Hono)
```typescript
// Pattern: Reusable middleware for cross-cutting concerns
app.use('*', async (c, next) => {
  // Pre-processing (auth, logging, etc.)
  await next();
  // Post-processing (headers, analytics, etc.)
});
```

## Internal API Usage

### Cloudflare Workers Bindings
```typescript
// KV Namespace
await c.env.SESSIONS.get(key);
await c.env.SESSIONS.put(key, value, { expirationTtl: seconds });
await c.env.SESSIONS.delete(key);

// D1 Database
const stmt = c.env.DB.prepare(sql).bind(...params);
const { results } = await stmt.all<Type>();
await stmt.run();

// R2 Bucket
const object = await c.env.MEDIA_BUCKET.get(key);
await c.env.MEDIA_BUCKET.put(key, body, { httpMetadata });

// Durable Objects
const id = c.env.RATE_LIMITER.idFromName(name);
const stub = c.env.RATE_LIMITER.get(id);
const response = await stub.fetch(request);

// Analytics Engine
c.env.ANALYTICS.writeDataPoint({
  indexes: [string1, string2],
  doubles: [number1, number2],
  blobs: [string3, string4]
});
```

### Hono Framework
```typescript
// Context methods
c.req.json<Type>()           // Parse JSON body
c.req.query('param')         // Get query parameter
c.req.param('id')            // Get route parameter
c.req.header('Name')         // Get header
c.json(data, status)         // JSON response
c.text(string, status)       // Text response
c.redirect(url, status)      // Redirect
c.header('Name', 'value')    // Set response header

// Routing
app.get('/path', handler)
app.post('/path', handler)
app.use('/prefix/*', middleware)
app.route('/prefix', subApp)
```

### React Hooks
```typescript
// State management
const [state, setState] = useState<Type>(initial);
setState(newValue);
setState(prev => ({ ...prev, updated }));

// Side effects
useEffect(() => {
  // Effect logic
  return () => cleanup();
}, [dependencies]);

// Refs
const ref = useRef<Type>(initial);
ref.current = value;

// Callbacks
const memoizedFn = useCallback(() => {
  // Function logic
}, [dependencies]);
```

### Medusa SDK
```typescript
// Product workflows
await createProductsWorkflow(container).run({ input: { products } });
await createProductCategoriesWorkflow(container).run({ input: { product_categories } });

// Region & fulfillment
await createRegionsWorkflow(container).run({ input: { regions } });
await createShippingOptionsWorkflow(container).run({ input: shippingOptions });

// Inventory
await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels } });
```

## Code Idioms

### Null Coalescing & Optional Chaining
```typescript
// Prefer optional chaining over nested conditionals
const value = obj?.nested?.property ?? defaultValue;

// Safe array access
const first = array?.[0] ?? fallback;
```

### Destructuring
```typescript
// Object destructuring with defaults
const { prop1, prop2 = defaultValue } = object;

// Array destructuring
const [first, second, ...rest] = array;

// Function parameters
function handler({ required, optional = default }: Props) { }
```

### Template Literals
```typescript
// Multi-line strings
const message = `
  Line 1
  Line 2: ${variable}
`;

// Dynamic keys
const obj = { [`key_${id}`]: value };
```

### Array Methods
```typescript
// Prefer functional methods over loops
const filtered = items.filter(item => condition);
const mapped = items.map(item => transform(item));
const found = items.find(item => item.id === id);
const exists = items.some(item => condition);
const allMatch = items.every(item => condition);
```

### Async Patterns
```typescript
// Promise.all for parallel operations
const results = await Promise.all(promises);

// Promise.allSettled for error tolerance
const outcomes = await Promise.allSettled(promises);

// Early return for async validation
if (!valid) return c.json({ error: 'invalid' }, 400);
```

## Popular Annotations

### TypeScript Utility Types
```typescript
Partial<Type>              // All properties optional
Required<Type>             // All properties required
Pick<Type, Keys>           // Subset of properties
Omit<Type, Keys>           // Exclude properties
Record<Keys, Type>         // Object with specific keys
Readonly<Type>             // Immutable properties
```

### React Types
```typescript
React.FC<Props>            // Functional component
React.ReactNode            // Any renderable content
React.ChangeEvent<T>       // Input change event
React.FormEvent            // Form submission event
React.MouseEvent<T>        // Mouse event
React.TouchEvent<T>        // Touch event
```

### Zod Validation
```typescript
import { z } from 'zod';

const Schema = z.object({
  field: z.string().min(1).max(100),
  email: z.string().email(),
  optional: z.string().optional(),
  number: z.number().positive(),
  date: z.string().datetime()
});

type Inferred = z.infer<typeof Schema>;
const parsed = Schema.safeParse(input);
```

### JSDoc Annotations
```typescript
/**
 * Function description
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * @throws {ErrorType} When error condition occurs
 * @example
 * const result = myFunction('value', 123);
 */
```

## Best Practices

### Security
- Never expose secrets or API keys to client
- Use PKCE flow for OAuth (no client secret)
- Validate all inputs on both client and server
- Implement rate limiting for public endpoints
- Use HMAC signatures for admin operations
- Set appropriate CORS headers

### Performance
- Cache expensive operations (KV, memory)
- Use edge caching for static assets
- Implement request coalescing for duplicate requests
- Lazy load components and routes
- Optimize images and assets
- Use streaming for large responses

### Accessibility
- Semantic HTML elements
- ARIA labels and roles where needed
- Keyboard navigation support
- Focus management for dynamic content
- Error messages linked to form fields
- Screen reader announcements for state changes

### Testing
- E2E tests with Playwright for critical flows
- Accessibility testing with Pa11y
- Type checking with TypeScript compiler
- Linting with ESLint
- Manual testing on mobile devices

### Error Handling
- Always provide fallback values
- Log errors for debugging
- Return user-friendly error messages
- Use appropriate HTTP status codes
- Implement graceful degradation
- Never expose internal errors to users
