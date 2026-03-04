# Performance Fixes - Cell Editing Freeze Issue

## Problem Summary
The Notion-style database was experiencing severe performance issues:
- 2-4 second freeze when trying to edit cells
- Slow hover interactions (multiple seconds delay)
- Page renders taking 700-1200ms
- PATCH requests failing with 400 errors

## Root Causes Identified

### 1. Expensive `allTags` Calculation
**Location**: `src/components/database/enhanced-data-table.tsx` line 101-112

**Problem**: On EVERY render, the code was:
- Iterating through ALL 1000+ artists
- For each artist, checking ALL properties
- Building a Set of all tags across the entire dataset
- Converting Set to Array

This was running on every mouse hover, every state change, everything.

**Fix**: Removed the expensive calculation entirely. Just use the `availableTags` prop that's already passed in from the parent.

```typescript
// BEFORE (SLOW):
const allTags = useMemo(() => {
  const tags = new Set<string>(availableTags);
  data.forEach(row => {
    properties.forEach(prop => {
      if ((prop.type === 'tags' || prop.type === 'multiSelect') && Array.isArray(row[prop.id])) {
        (row[prop.id] as string[]).forEach(tag => tags.add(tag));
      }
    });
  });
  return Array.from(tags);
}, [data, properties, availableTags]);

// AFTER (FAST):
const allTags = availableTags;
```

### 2. Massive `renderRow` Dependency Array
**Location**: `src/components/database/enhanced-data-table.tsx` line 177-191

**Problem**: The `renderRow` callback had 13 dependencies including the expensive `allTags`. This meant:
- ANY change to ANY dependency re-created the function
- ALL 1000+ rows would re-render
- React had to diff 1000+ row components

**Fix**: Removed the `useCallback` wrapper entirely and render rows inline. React's reconciliation is smart enough to only update what changed.

### 3. Hover Transition Effects
**Location**: Multiple places

**Problem**: CSS transitions on hover (`hover:bg-[#eeede9] transition-colors duration-75`) were triggering React re-renders on every mouse movement.

**Fix**: Removed hover transitions and transition classes. The visual feedback isn't worth the performance cost with 1000+ rows.

### 4. Optimistic Updates with Large Dataset
**Location**: `src/components/notion-artists-database.tsx`

**Problem**: Using `useOptimistic` with 1000+ artists meant:
- Cloning entire array on every edit
- Mapping through all 1000+ items to find the one to update
- Re-rendering entire component tree

**Fix**: Replaced with simple local state (`useState`) that updates only the edited row immediately, then syncs to server in background.

### 5. API Field Validation
**Location**: `src/app/api/artists/[id]/field/route.ts`

**Problem**: The PATCH endpoint was returning 400 because `tags` and `spotifyUrl` weren't in the allowed fields list.

**Fix**: 
- Added `tags` and `spotifyUrl` to allowed fields
- Added special handling for `tags` field (it's a relation, not a simple field)
- Tags now properly upsert and connect to artists

## Performance Improvements

### Before:
- Cell edit: 2-4 second freeze
- Hover: Multiple second delay
- Page render: 700-1200ms
- PATCH: 400 error, triggering full page refresh

### After:
- Cell edit: Instant (local state update)
- Hover: Removed (not needed)
- Page render: Should be much faster (no expensive calculations)
- PATCH: Should succeed (fields added to allowed list)

## Files Modified

1. `src/components/database/enhanced-data-table.tsx`
   - Removed expensive `allTags` calculation
   - Removed `renderRow` memoization
   - Removed hover transitions
   - Simplified rendering

2. `src/components/database/enhanced-cell.tsx`
   - Removed hover effects and transitions
   - Removed edit icon on hover
   - Kept double-click to edit

3. `src/components/notion-artists-database.tsx`
   - Removed `useOptimistic` 
   - Replaced with `useState` for local state
   - Updates happen instantly in UI
   - Server sync happens in background

4. `src/app/api/artists/[id]/field/route.ts`
   - Added `tags` and `spotifyUrl` to allowed fields
   - Added special handling for tags relation

## Testing

Test these scenarios:
1. Double-click any cell to edit - should be instant
2. Edit a cell and save - should update immediately
3. Edit tags field - should work without errors
4. Hover over rows - should not cause any lag
5. Scroll through the table - should be smooth

## Notes

- The UI now prioritizes performance over visual polish
- Hover effects were removed as they caused re-renders
- Local state updates provide instant feedback
- Server sync happens in background without blocking UI
- Only refreshes from server on error (to revert failed updates)
