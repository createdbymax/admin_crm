# Prisma Query Optimization Guide

## Current Issues

With just light testing, you're hitting 2k+ database operations. Here are the main culprits and fixes:

## 🔴 Critical Optimizations

### 1. **N+1 Query Problem in Sync Operations**

**Problem:** `syncArtistById()` performs individual `upsert` for each release in a loop.

**Current Code (src/lib/spotify-sync.ts):**
```typescript
for (const release of releases) {
  await prisma.artistRelease.upsert({
    where: { spotifyReleaseId: release.id },
    create: { ... },
    update: { ... },
  });
}
```

**Fix:** Use batch operations with `createMany` + `updateMany`:
```typescript
// Batch upsert strategy
const releaseIds = releases.map(r => r.id);
const existing = await prisma.artistRelease.findMany({
  where: { spotifyReleaseId: { in: releaseIds } },
  select: { spotifyReleaseId: true }
});

const existingIds = new Set(existing.map(r => r.spotifyReleaseId));
const toCreate = releases.filter(r => !existingIds.has(r.id));
const toUpdate = releases.filter(r => existingIds.has(r.id));

await Promise.all([
  toCreate.length > 0 ? prisma.artistRelease.createMany({
    data: toCreate.map(release => ({
      artistId: artist.id,
      name: release.name,
      releaseDate: release.releaseDate,
      releaseUrl: release.url,
      releaseType: release.type,
      spotifyReleaseId: release.id,
    })),
    skipDuplicates: true
  }) : null,
  ...toUpdate.map(release => 
    prisma.artistRelease.update({
      where: { spotifyReleaseId: release.id },
      data: {
        name: release.name,
        releaseDate: release.releaseDate,
        releaseUrl: release.url,
        releaseType: release.type,
      }
    })
  )
]);
```

**Impact:** Reduces 50 queries per artist sync to ~3-5 queries.

---

### 2. **Redundant Queries on Artist List Page**

**Problem:** Multiple separate count queries on the same page load.

**Current Code (src/app/(app)/artists/page.tsx):**
```typescript
const filteredCount = await prisma.artist.count({ where });
const statusGroups = await prisma.artist.groupBy({ by: ["status"], _count: { status: true } });
const needsSyncCount = await prisma.artist.count({ where: { needsSync: true } });
const totalCount = await prisma.artist.count();
const upcomingNextSteps = await prisma.artist.count({ where: { nextStepAt: { ... } } });
const upcomingReminders = await prisma.artist.count({ where: { reminderAt: { ... } } });
```

**Fix:** Combine into a single aggregation query:
```typescript
const [artists, stats] = await Promise.all([
  prisma.artist.findMany({ where, orderBy, include, skip, take }),
  prisma.artist.aggregate({
    _count: {
      _all: true,
      needsSync: true,
    },
    where: {
      OR: [
        { needsSync: true },
        { nextStepAt: { gte: new Date(), lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) } },
        { reminderAt: { gte: new Date(), lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) } }
      ]
    }
  })
]);

// Use a single groupBy for status counts
const statusGroups = await prisma.artist.groupBy({
  by: ["status"],
  _count: { status: true }
});
```

**Better Fix:** Use raw SQL for complex aggregations:
```typescript
const stats = await prisma.$queryRaw`
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "needsSync" = true) as needs_sync,
    COUNT(*) FILTER (WHERE status = 'LEAD') as leads,
    COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted,
    COUNT(*) FILTER (WHERE "nextStepAt" >= NOW() AND "nextStepAt" <= NOW() + INTERVAL '7 days') as upcoming_next_steps,
    COUNT(*) FILTER (WHERE "reminderAt" >= NOW() AND "reminderAt" <= NOW() + INTERVAL '7 days') as upcoming_reminders
  FROM "Artist"
`;
```

**Impact:** Reduces 6+ queries to 1-2 queries per page load.

---

### 3. **Add Database Indexes**

**Problem:** Missing indexes on frequently queried fields.

**Fix:** Add to `prisma/schema.prisma`:
```prisma
model Artist {
  // ... existing fields ...
  
  @@index([status])
  @@index([ownerId])
  @@index([needsSync])
  @@index([spotifyLastSyncedAt])
  @@index([nextStepAt])
  @@index([reminderAt])
  @@index([spotifyLatestReleaseDate])
  @@index([createdAt])
  @@index([name])
}

model ArtistRelease {
  // ... existing fields ...
  
  @@index([artistId])
  @@index([releaseDate])
  @@index([spotifyReleaseId])
}
```

**Impact:** 10-100x faster queries on filtered/sorted data.

---

### 4. **Implement Query Result Caching**

**Problem:** Same data fetched repeatedly (users, tags, stats).

**Fix:** Add simple in-memory cache:
```typescript
// src/lib/cache.ts
const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.data as T);
  }
  
  return fetcher().then(data => {
    cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  });
}

// Usage in pages:
const users = await getCached('users', 60000, () => 
  prisma.user.findMany({ orderBy: { name: 'asc' } })
);
```

**Impact:** Eliminates repeated queries for static/slow-changing data.

---

### 5. **Optimize Calendar Page Queries**

**Problem:** Fetching all genres from all artists just to build a filter list.

**Current Code (src/app/(app)/calendar/page.tsx):**
```typescript
const genreRows = await prisma.artist.findMany({ 
  select: { spotifyGenres: true } 
});
```

**Fix:** Use aggregation or cache:
```typescript
// Option 1: Cache genres
const genreOptions = await getCached('genres', 300000, async () => {
  const rows = await prisma.artist.findMany({ 
    select: { spotifyGenres: true },
    where: { spotifyGenres: { not: null } }
  });
  return Array.from(new Set(rows.flatMap(r => r.spotifyGenres ?? []))).sort();
});

// Option 2: Store in separate Genre table with M:M relation
```

**Impact:** Reduces full table scan on every calendar page load.

---

## 🟡 Medium Priority Optimizations

### 6. **Select Only Required Fields**

Many queries fetch entire records when only a few fields are needed.

**Example Fix:**
```typescript
// Instead of:
const artist = await prisma.artist.findUnique({ where: { id } });

// Use:
const artist = await prisma.artist.findUnique({ 
  where: { id },
  select: { 
    id: true, 
    name: true, 
    spotifyId: true,
    spotifyUrl: true 
  }
});
```

---

### 7. **Batch Import Optimization**

**Current:** Import syncs 12 artists sequentially with 150ms delay.

**Fix:** Use worker queue or parallel batches:
```typescript
// Parallel batches of 3
const chunks = chunk(toSync, 3);
for (const batch of chunks) {
  await Promise.all(batch.map(artist => syncArtistById(artist.id)));
  await sleep(150);
}
```

---

### 8. **Add Connection Pooling**

**Fix:** Update `src/lib/prisma.ts`:
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool settings
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Set pool size in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

---

## 🟢 Quick Wins

### 9. **Enable Prisma Query Logging**

Monitor slow queries in development:
```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.log(`Slow query (${e.duration}ms):`, e.query);
  }
});
```

---

### 10. **Use Transactions for Related Writes**

Group related operations:
```typescript
await prisma.$transaction([
  prisma.artist.update({ where: { id }, data: { ... } }),
  prisma.activity.create({ data: { ... } }),
  prisma.auditLog.create({ data: { ... } }),
]);
```

---

## Implementation Priority

1. **Add indexes** (5 min, huge impact)
2. **Fix sync N+1 queries** (30 min, massive reduction)
3. **Optimize artist list page counts** (20 min, noticeable improvement)
4. **Add basic caching** (30 min, good ROI)
5. **Enable query logging** (5 min, helps identify other issues)
6. **Optimize calendar genres** (15 min)
7. **Select only needed fields** (ongoing refactor)

## Expected Results

- **Before:** 2000+ operations for light testing
- **After:** ~200-300 operations for same usage
- **Improvement:** 85-90% reduction in database queries

## Monitoring

Add this to track query counts:
```typescript
// middleware.ts
let queryCount = 0;
prisma.$use(async (params, next) => {
  queryCount++;
  return next(params);
});

// Log on each request
console.log(`Total queries: ${queryCount}`);
```
