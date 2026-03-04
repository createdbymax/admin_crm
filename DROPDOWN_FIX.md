# Dropdown Menu Fix

## Problem
The column header dropdown menus were rendering but showing no content. The HTML showed an empty `<div>` with the correct classes but no menu items inside.

## Root Cause
The dropdown menu items were wrapped in conditional rendering:
```tsx
{onSort && (
  <DropdownMenuItem>Sort ascending</DropdownMenuItem>
)}
{onHide && (
  <DropdownMenuItem>Hide property</DropdownMenuItem>
)}
```

Since `onSort` and `onHide` were not being passed down through the component tree, both conditions evaluated to `undefined`, causing no items to render.

## Solution

### 1. Always Render Menu Items
Changed from conditional rendering to always showing items, with conditional functionality:

**Before:**
```tsx
{onSort && (
  <DropdownMenuItem onClick={() => onSort('asc')}>
    Sort ascending
  </DropdownMenuItem>
)}
```

**After:**
```tsx
<DropdownMenuItem onClick={() => {
  if (onSort) onSort('asc');
}}>
  Sort ascending
</DropdownMenuItem>
```

### 2. Implemented Sort Handler
Added proper sort handling in `NotionDatabasePage`:

```tsx
const handleSort = useCallback((propertyId: string, direction: 'asc' | 'desc') => {
  setViews(prev => prev.map(v => 
    v.id === currentViewId 
      ? { ...v, sorts: [{ property: propertyId, direction }] }
      : v
  ));
}, [currentViewId]);
```

### 3. Passed Sort Handler Down Component Tree

**NotionDatabasePage → NotionTableView:**
```tsx
<NotionTableView
  onSort={handleSort}
  // ... other props
/>
```

**NotionTableView → EnhancedDataTable:**
```tsx
<EnhancedDataTable
  onSort={onSort}
  // ... other props
/>
```

**EnhancedDataTable → ColumnHeader:**
```tsx
<ColumnHeader
  onSort={onSort ? (direction) => onSort(property.id, direction) : undefined}
  // ... other props
/>
```

## Files Modified

1. **src/components/database/column-header.tsx**
   - Removed conditional rendering of menu items
   - Added conditional execution inside onClick handlers
   - Menu items now always visible

2. **src/components/notion-database-page.tsx**
   - Added `handleSort` callback
   - Passes sort handler to NotionTableView
   - Updates view sorts when column header clicked

3. **src/components/notion-table-view.tsx**
   - Added `onSort` prop to interface
   - Passes sort handler to EnhancedDataTable

## How It Works Now

1. User clicks 3-dot menu on column header
2. Dropdown opens showing "Sort ascending", "Sort descending", "Hide property"
3. User clicks "Sort ascending"
4. `handleSort` is called with property ID and direction
5. View's sorts array is updated: `[{ property: 'name', direction: 'asc' }]`
6. `sortedData` useMemo recalculates with new sort
7. Table re-renders with sorted data

## Current Functionality

✅ **Working:**
- Dropdown menu opens and shows items
- Sort ascending/descending options visible
- Hide property option visible
- Clicking sort updates the view's sort configuration
- Data is sorted based on selected column and direction

⚠️ **Not Yet Implemented:**
- Hide property functionality (onHide handler not wired up)
- Multi-column sorting (currently only single column)
- Sort indicator in column header (arrow showing current sort)

## Testing

1. Click any column header's 3-dot menu
2. Verify menu shows 3 items
3. Click "Sort ascending" - data should sort
4. Click "Sort descending" - data should reverse sort
5. Menu should close after selection

## Next Steps

To fully complete the column header functionality:

1. **Add Hide Property Handler:**
   ```tsx
   const handleHideProperty = useCallback((propertyId: string) => {
     setViews(prev => prev.map(v => 
       v.id === currentViewId 
         ? { 
             ...v, 
             visibleProperties: v.visibleProperties.filter(p => p !== propertyId) 
           }
         : v
     ));
   }, [currentViewId]);
   ```

2. **Show Sort Indicator:**
   Update ColumnHeader to show arrow when sorted:
   ```tsx
   {currentView.sorts.find(s => s.property === property.id) && (
     <span className="text-xs">
       {sort.direction === 'asc' ? '↑' : '↓'}
     </span>
   )}
   ```

3. **Multi-Column Sorting:**
   Allow adding multiple sorts with Shift+Click
