# Integration Guide - Phase 2

## Quick Start (5 minutes)

### Step 1: Update Artists Page

Replace your current artists page with the enhanced version:

```tsx
// src/app/(app)/artists/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EnhancedArtistDatabase } from '@/components/database/enhanced-artist-database';

export default async function ArtistsPage() {
  const session = await getServerSession(authOptions);
  
  // Your existing query
  const artists = await prisma.artist.findMany({
    include: {
      owner: true,
      tags: true,
    },
    orderBy: { name: 'asc' },
  });

  // Get users for assignment
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: { name: 'asc' },
  });

  // Transform to ArtistRow format
  const artistRows = artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    status: artist.status,
    ownerName: artist.owner?.name ?? artist.owner?.email ?? null,
    ownerId: artist.ownerId,
    spotifyUrl: artist.spotifyUrl,
    spotifyId: artist.spotifyId,
    instagram: artist.instagram,
    monthlyListeners: artist.monthlyListeners,
    email: artist.email,
    website: artist.website,
    spotifyFollowers: artist.spotifyFollowers,
    spotifyPopularity: artist.spotifyPopularity,
    spotifyGenres: artist.spotifyGenres ?? [],
    tags: artist.tags,
    spotifyImage: artist.spotifyImage,
    spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
    spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate?.toISOString() ?? null,
    spotifyLatestReleaseUrl: artist.spotifyLatestReleaseUrl,
    spotifyLatestReleaseType: artist.spotifyLatestReleaseType,
    spotifyLastSyncedAt: artist.spotifyLastSyncedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Artists
        </p>
        <h2 className="text-2xl font-semibold sm:text-3xl">Campaign targets</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Click any cell to edit. Use arrow keys to navigate, Enter to edit, Tab to move.
        </p>
      </div>

      <EnhancedArtistDatabase
        artists={artistRows}
        users={users}
        isAdmin={session?.user?.isAdmin ?? false}
      />
    </div>
  );
}
```

### Step 2: Test It Out

1. Run `pnpm dev`
2. Navigate to `/artists`
3. Click any cell to edit
4. Try keyboard navigation:
   - Arrow keys to move
   - Enter to edit
   - Tab to move right
   - Escape to cancel

### Step 3: Verify API Endpoint

The API endpoint should already work. Test it:

```bash
curl -X PATCH http://localhost:3000/api/artists/[id]/field \
  -H "Content-Type: application/json" \
  -d '{"field":"email","value":"test@example.com"}'
```

## Gradual Migration (Recommended)

### Option 1: Feature Flag

Add a toggle to switch between old and new:

```tsx
'use client';

import { useState } from 'react';
import { ArtistsPanel } from '@/components/artists-panel';
import { EnhancedArtistDatabase } from '@/components/database/enhanced-artist-database';

export function ArtistsView({ artists, users, isAdmin, ...props }) {
  const [useEnhanced, setUseEnhanced] = useState(
    // Check localStorage or user preference
    typeof window !== 'undefined' 
      ? localStorage.getItem('useEnhancedTable') === 'true'
      : false
  );

  const handleToggle = (enabled: boolean) => {
    setUseEnhanced(enabled);
    localStorage.setItem('useEnhancedTable', String(enabled));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useEnhanced}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span>Use enhanced editing (Beta)</span>
        </label>
      </div>

      {useEnhanced ? (
        <EnhancedArtistDatabase
          artists={artists}
          users={users}
          isAdmin={isAdmin}
        />
      ) : (
        <ArtistsPanel {...props} />
      )}
    </div>
  );
}
```

### Option 2: Admin-Only Rollout

Enable for admins first:

```tsx
export default async function ArtistsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.isAdmin ?? false;

  // ... fetch data ...

  if (isAdmin) {
    return <EnhancedArtistDatabase {...props} />;
  }

  return <ArtistsPanel {...props} />;
}
```

### Option 3: Separate Route

Create a new route for testing:

```tsx
// src/app/(app)/artists-beta/page.tsx
export default async function ArtistsBetaPage() {
  // ... same as artists page but with EnhancedArtistDatabase
}
```

## Customization

### Add Custom Properties

```tsx
// In enhanced-artist-database.tsx
const CUSTOM_PROPERTIES: Property[] = [
  ...ARTIST_PROPERTIES,
  {
    id: 'customField',
    name: 'Custom Field',
    type: 'text',
    width: 200,
    isVisible: true,
  },
];
```

### Add Custom Views

```tsx
const CUSTOM_VIEWS: ViewConfig[] = [
  ...DEFAULT_VIEWS,
  {
    id: 'my-custom-view',
    name: 'My Custom View',
    type: 'table',
    icon: '🎨',
    filters: [
      {
        id: 'custom-filter',
        property: 'status',
        operator: 'equals',
        value: 'LEAD',
        condition: 'and',
      },
    ],
    sorts: [{ property: 'name', direction: 'asc' }],
    visibleProperties: ['name', 'email', 'status'],
    propertyWidths: {},
    propertyOrder: [],
  },
];
```

### Customize Editors

Override the default editor for a property:

```tsx
// In enhanced-cell.tsx
const renderEditor = () => {
  if (property.id === 'myCustomField') {
    return <MyCustomEditor {...props} />;
  }
  
  // ... rest of switch statement
};
```

## Troubleshooting

### Issue: Cells not saving

**Check:**
1. API endpoint is accessible
2. User is authenticated
3. Field is in allowed fields list
4. Network tab shows successful request

**Fix:**
```tsx
// Add error logging
const handleCellUpdate = async (id, field, value) => {
  try {
    await updateArtist(id, { [field]: value });
  } catch (error) {
    console.error('Update failed:', error);
    alert('Failed to save: ' + error.message);
  }
};
```

### Issue: Keyboard navigation not working

**Check:**
1. Not in edit mode
2. Focus is on table
3. No input/textarea has focus

**Fix:**
```tsx
// Click table to focus
<div onClick={() => tableRef.current?.focus()}>
  <EnhancedDataTable ... />
</div>
```

### Issue: Editors not showing

**Check:**
1. Property type is correct
2. Editor is imported
3. No console errors

**Fix:**
```tsx
// Add fallback
const renderEditor = () => {
  try {
    // ... editor logic
  } catch (error) {
    console.error('Editor error:', error);
    return <TextEditor {...props} />;
  }
};
```

### Issue: Optimistic updates not reverting

**Check:**
1. Error is being thrown
2. onError callback is set
3. Router.refresh() is called

**Fix:**
```tsx
const { update } = useOptimisticUpdate({
  onUpdate: async (id, data) => {
    const response = await fetch(...);
    if (!response.ok) {
      throw new Error('Update failed'); // Must throw!
    }
  },
  onError: (error) => {
    console.error('Error:', error);
    router.refresh(); // Force refresh
  },
});
```

## Performance Tips

### 1. Virtualization for Large Datasets

If you have 1000+ artists:

```bash
pnpm add @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// In your table component
const virtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
});
```

### 2. Debounce Updates

For fields that change frequently:

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (id, field, value) => handleCellUpdate(id, field, value),
  500
);
```

### 3. Memoize Expensive Computations

```tsx
const filteredData = useMemo(() => {
  return applyFilters(data, filters);
}, [data, filters]);
```

## Testing

### Manual Testing Checklist

- [ ] Click cell to edit
- [ ] Type and save with Enter
- [ ] Cancel with Escape
- [ ] Navigate with arrow keys
- [ ] Tab to next cell
- [ ] Select dropdown works
- [ ] Date picker opens
- [ ] User search works
- [ ] Tags can be added/removed
- [ ] Optimistic update shows immediately
- [ ] Failed update reverts
- [ ] Audit log records change

### Automated Testing (Future)

```tsx
// Example test
import { render, screen, fireEvent } from '@testing-library/react';

test('edits cell on click', async () => {
  render(<EnhancedDataTable {...props} />);
  
  const cell = screen.getByText('Test Artist');
  fireEvent.click(cell);
  
  const input = screen.getByRole('textbox');
  expect(input).toHaveFocus();
  
  fireEvent.change(input, { target: { value: 'New Name' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  
  await waitFor(() => {
    expect(screen.getByText('New Name')).toBeInTheDocument();
  });
});
```

## Next Steps

1. **Test thoroughly** - Try all editors and keyboard shortcuts
2. **Gather feedback** - Show to team and collect input
3. **Monitor errors** - Check logs for failed updates
4. **Measure performance** - Track edit times and user satisfaction
5. **Plan Phase 3** - Advanced filtering coming next!

## Support

- **Documentation**: See `PHASE_2_COMPLETE.md`
- **API Reference**: See `DATABASE_SYSTEM_README.md`
- **Examples**: See `enhanced-artist-database.tsx`
- **Issues**: Check console for errors

## Success Criteria

✅ All cells are editable inline
✅ Keyboard navigation works smoothly
✅ Editors are intuitive and fast
✅ Updates save reliably
✅ UI updates optimistically
✅ Errors are handled gracefully
✅ Team is happy with the experience

---

**Ready to go!** Start with the Quick Start guide above and you'll be up and running in 5 minutes.
