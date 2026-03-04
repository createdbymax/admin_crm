# Database System - Notion-like Interface

A powerful, flexible database interface for the Lost Hills CRM inspired by Notion's database views.

## 🎯 Overview

This system transforms the traditional CRM table into a modern, interactive database with:
- **Inline editing** - Click any cell to edit
- **Multiple views** - Table, Board, Gallery, Calendar
- **Advanced filtering** - Complex filter logic with AND/OR
- **Custom properties** - 17 property types with rich rendering
- **Resizable columns** - Drag to resize any column
- **Saved views** - Create and save custom views
- **Keyboard navigation** - Full keyboard support

## 🚀 Quick Start

### 1. Basic Table View

```tsx
import { ArtistDatabase } from '@/components/database/artist-database';

export default async function ArtistsPage() {
  const artists = await getArtists();
  
  const handleCellUpdate = async (artistId: string, field: string, value: unknown) => {
    'use server';
    await updateArtist(artistId, field, value);
  };

  return (
    <ArtistDatabase 
      artists={artists}
      onCellUpdate={handleCellUpdate}
    />
  );
}
```

### 2. Custom Database

```tsx
import { DataTable } from '@/components/database/data-table';
import { ViewProvider } from '@/lib/views/context';
import type { Property } from '@/lib/properties/types';

const properties: Property[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'text',
    width: 200,
    isVisible: true,
  },
  {
    id: 'status',
    name: 'Status',
    type: 'select',
    width: 150,
    options: {
      options: [
        { id: '1', label: 'Active', color: 'green' },
        { id: '2', label: 'Inactive', color: 'gray' },
      ],
    },
  },
];

export function MyDatabase({ data }) {
  return (
    <ViewProvider initialViews={views}>
      <DataTable
        data={data}
        properties={properties}
        propertyWidths={{}}
        onPropertyResize={() => {}}
        onCellUpdate={async (id, field, value) => {
          await updateRecord(id, field, value);
        }}
      />
    </ViewProvider>
  );
}
```

## 📊 Property Types

### Text Properties
```tsx
{
  id: 'description',
  name: 'Description',
  type: 'text',
  width: 300,
}
```

### Number Properties
```tsx
{
  id: 'revenue',
  name: 'Revenue',
  type: 'number',
  options: {
    format: 'currency', // 'number' | 'currency' | 'percentage'
    precision: 2,
  },
}
```

### Select Properties
```tsx
{
  id: 'priority',
  name: 'Priority',
  type: 'select',
  options: {
    options: [
      { id: 'high', label: 'High', color: 'red' },
      { id: 'medium', label: 'Medium', color: 'yellow' },
      { id: 'low', label: 'Low', color: 'green' },
    ],
  },
}
```

### Date Properties
```tsx
{
  id: 'dueDate',
  name: 'Due Date',
  type: 'date',
  options: {
    dateFormat: 'friendly', // 'relative' | 'absolute' | 'friendly'
    includeTime: false,
  },
}
```

### Person Properties
```tsx
{
  id: 'assignee',
  name: 'Assigned To',
  type: 'person',
  width: 150,
}
```

### URL Properties
```tsx
{
  id: 'website',
  name: 'Website',
  type: 'url',
  width: 200,
}
```

### Rating Properties
```tsx
{
  id: 'rating',
  name: 'Rating',
  type: 'rating',
  options: {
    maxRating: 5,
    icon: 'star', // 'star' | 'heart' | 'thumbs'
  },
}
```

### Progress Properties
```tsx
{
  id: 'completion',
  name: 'Completion',
  type: 'progress',
  width: 150,
}
```

### Tags Properties
```tsx
{
  id: 'tags',
  name: 'Tags',
  type: 'tags',
  width: 200,
}
```

## 🎨 Views

### Table View (Default)
```tsx
const tableView: ViewConfig = {
  id: 'table-view',
  name: 'All Records',
  type: 'table',
  filters: [],
  sorts: [{ property: 'name', direction: 'asc' }],
  visibleProperties: ['name', 'status', 'owner'],
  propertyWidths: {},
  propertyOrder: [],
};
```

### Board View (Kanban)
```tsx
import { BoardView } from '@/components/database/views/board-view';

const columns = [
  { id: 'LEAD', label: 'Lead', color: '#gray' },
  { id: 'CONTACTED', label: 'Contacted', color: '#blue' },
  { id: 'WON', label: 'Won', color: '#green' },
];

<BoardView
  data={data}
  groupByField="status"
  columns={columns}
  onCardClick={(item) => console.log(item)}
  renderCard={(item) => (
    <div>
      <h4>{item.name}</h4>
      <p>{item.description}</p>
    </div>
  )}
/>
```

### Custom View with Filters
```tsx
const filteredView: ViewConfig = {
  id: 'high-priority',
  name: 'High Priority',
  type: 'table',
  filters: [
    {
      id: 'priority-filter',
      property: 'priority',
      operator: 'equals',
      value: 'high',
      condition: 'and',
    },
    {
      id: 'status-filter',
      property: 'status',
      operator: 'isAnyOf',
      value: ['active', 'pending'],
      condition: 'and',
    },
  ],
  sorts: [{ property: 'dueDate', direction: 'asc' }],
  visibleProperties: ['name', 'priority', 'dueDate'],
  propertyWidths: {},
  propertyOrder: [],
};
```

## 🔍 Filtering

### Filter Operators

- **Text**: `equals`, `notEquals`, `contains`, `notContains`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`
- **Number**: `equals`, `notEquals`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `isEmpty`, `isNotEmpty`
- **Select**: `equals`, `notEquals`, `isAnyOf`, `isNoneOf`, `isEmpty`, `isNotEmpty`
- **Date**: `equals`, `before`, `after`, `onOrBefore`, `onOrAfter`, `isWithin`, `isPast`, `isFuture`, `isEmpty`, `isNotEmpty`

### Example Filters

```tsx
// Single filter
{
  id: 'filter-1',
  property: 'status',
  operator: 'equals',
  value: 'active',
  condition: 'and',
}

// Multiple filters with AND logic
{
  filters: [
    {
      id: 'filter-1',
      property: 'status',
      operator: 'equals',
      value: 'active',
      condition: 'and',
    },
    {
      id: 'filter-2',
      property: 'priority',
      operator: 'isAnyOf',
      value: ['high', 'medium'],
      condition: 'and',
    },
  ],
  filterLogic: 'and',
}
```

## ⌨️ Keyboard Shortcuts

- **Enter** - Save cell and move down
- **Escape** - Cancel editing
- **Tab** - Move to next cell (planned)
- **Shift+Tab** - Move to previous cell (planned)
- **Arrow keys** - Navigate cells (planned)
- **Cmd+K** - Open command palette (planned)
- **Cmd+F** - Search (planned)

## 🎯 Inline Editing

### How It Works

1. Click any cell to enter edit mode
2. Type to edit the value
3. Press Enter or click outside to save
4. Press Escape to cancel

### Optimistic Updates

The system uses optimistic updates for instant feedback:

```tsx
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';

const { update, getPendingUpdate, getError } = useOptimisticUpdate({
  onUpdate: async (id, data) => {
    await fetch(`/api/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  onError: (error) => {
    console.error('Update failed:', error);
  },
});

// Update a field
await update('record-123', { name: 'New Name' });

// Check for pending updates
const pending = getPendingUpdate('record-123');

// Check for errors
const error = getError('record-123');
```

## 🔧 API Integration

### Update Endpoint

Create a PATCH endpoint for inline updates:

```tsx
// app/api/artists/[id]/route.ts
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  await prisma.artist.update({
    where: { id: params.id },
    data: body,
  });
  
  return Response.json({ success: true });
}
```

### Bulk Update Endpoint

```tsx
// app/api/artists/bulk/route.ts
export async function POST(request: Request) {
  const { artistIds, updates } = await request.json();
  
  await prisma.artist.updateMany({
    where: { id: { in: artistIds } },
    data: updates,
  });
  
  return Response.json({ success: true });
}
```

## 🎨 Customization

### Custom Cell Renderer

```tsx
import { Cell } from '@/components/database/cell';

// Extend the Cell component
function CustomCell({ property, value, ...props }) {
  if (property.type === 'custom') {
    return (
      <div className="custom-cell">
        {/* Your custom rendering */}
      </div>
    );
  }
  
  return <Cell property={property} value={value} {...props} />;
}
```

### Custom Column Header

```tsx
import { ColumnHeader } from '@/components/database/column-header';

function CustomColumnHeader({ property, ...props }) {
  return (
    <ColumnHeader property={property} {...props}>
      {/* Additional header content */}
    </ColumnHeader>
  );
}
```

## 📱 Mobile Support

The database system is responsive and works on mobile devices:
- Horizontal scrolling for wide tables
- Touch-friendly cell editing
- Responsive column widths
- Mobile-optimized views (list view recommended)

## 🚀 Performance

### Optimization Tips

1. **Virtualization** - For large datasets (1000+ rows):
```bash
pnpm add @tanstack/react-virtual
```

2. **Pagination** - Limit rows per page:
```tsx
<DataTable
  data={data.slice(page * pageSize, (page + 1) * pageSize)}
  // ...
/>
```

3. **Debouncing** - Debounce cell updates:
```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (id, field, value) => onCellUpdate(id, field, value),
  500
);
```

4. **Memoization** - Memoize expensive computations:
```tsx
const filteredData = useMemo(() => {
  return applyFilters(data, filters);
}, [data, filters]);
```

## 🧪 Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '@/components/database/data-table';

test('renders table with data', () => {
  render(
    <DataTable
      data={mockData}
      properties={mockProperties}
      propertyWidths={{}}
      onPropertyResize={() => {}}
      onCellUpdate={async () => {}}
    />
  );
  
  expect(screen.getByText('Artist Name')).toBeInTheDocument();
});

test('edits cell on click', async () => {
  const onCellUpdate = jest.fn();
  
  render(
    <DataTable
      data={mockData}
      properties={mockProperties}
      propertyWidths={{}}
      onPropertyResize={() => {}}
      onCellUpdate={onCellUpdate}
    />
  );
  
  const cell = screen.getByText('Test Artist');
  fireEvent.click(cell);
  
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'New Name' } });
  fireEvent.blur(input);
  
  expect(onCellUpdate).toHaveBeenCalledWith('1', 'name', 'New Name');
});
```

## 📚 Examples

See `src/components/database/artist-database.tsx` for a complete implementation example.

## 🐛 Troubleshooting

### Cell not saving
- Check that `onCellUpdate` is properly implemented
- Verify API endpoint is working
- Check browser console for errors

### Column resizing not working
- Ensure `onPropertyResize` callback is provided
- Check that property widths are being stored

### View not switching
- Verify view IDs are unique
- Check ViewProvider is wrapping the component
- Ensure views array is not empty

## 🔮 Roadmap

- [ ] Drag & drop column reordering
- [ ] Advanced filter builder UI
- [ ] Gallery view with image support
- [ ] Timeline view for date ranges
- [ ] Command palette (Cmd+K)
- [ ] Undo/redo support
- [ ] Export to CSV/Excel
- [ ] Import from CSV
- [ ] Collaborative editing
- [ ] Real-time updates

## 📄 License

Part of the Lost Hills CRM project.
