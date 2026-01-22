### Link to the code that reproduces this issue

https://github.com/YOUR_USERNAME/YOUR_REPO (or provide a minimal reproduction)

### To Reproduce

1. Create a Next.js 16.1.4 app with App Router
2. Create an API route at `src/app/api/test/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.log('API route hit:', body);
  return NextResponse.json({ success: true });
}
```

3. Create a client component with a button that calls the API:

```typescript
"use client";

export function TestComponent() {
  const handleClick = async () => {
    console.log('Fetching...');
    const response = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
    });
    console.log('Response:', response.status);
  };

  return <button onClick={handleClick}>Test API</button>;
}
```

4. Run `next dev` (Turbopack enabled by default in Next.js 16)
5. Click the button
6. Observe: Browser logs "Fetching..." but server terminal never logs the request

### Current vs. Expected behavior

**Expected:** POST request reaches the API route handler and server logs show:
```
POST /api/test 200 in XXms
```

**Actual:** 
- Browser console shows fetch is called with correct URL and payload
- Request appears in browser Network tab as "pending" indefinitely  
- Server terminal shows NO log of the incoming request
- Request never completes or times out

**Browser Console:**
```
Fetching...
# Request hangs here forever
```

**Server Terminal:**
```
▲ Next.js 16.1.4 (Turbopack)
- Local:         http://localhost:3000

✓ Ready in 548ms
GET /some-page 200 in 3.0s
# POST /api/test never appears
```

### Provide environment information

```bash
Operating System:
  Platform: darwin
  Arch: arm64
  Version: macOS
Node: 24.8.0
pnpm: (run pnpm -v)
Relevant Packages:
  next: 16.1.4
  react: 19.2.3
  react-dom: 19.2.3
  typescript: 5.x
```

### Which area(s) are affected? (Select all that apply)

App Router, Turbopack, Developer Experience

### Which stage(s) are affected? (Select all that apply)

next dev (local)

### Additional context

- GET requests to API routes work fine
- POST requests to the same route work intermittently when the server first starts, before Turbopack fully initializes
- Middleware is configured to exclude `/api` routes:

```typescript
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
```

**Workarounds attempted:**

❌ `TURBOPACK=0 next dev` - Still uses Turbopack in Next.js 16
❌ Using absolute URL `${window.location.origin}/api/test` - Still doesn't reach server  
❌ `rm -rf .next` - No effect
✅ Downgrading to Next.js 15.1.3 - Resolves the issue

This appears to be a critical routing bug in Turbopack that prevents POST requests from client components from reaching API route handlers.
