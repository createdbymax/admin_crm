# Notion-like Database Transformation Plan

## Current State Analysis

The Lost Hills CRM currently has:
- Basic table view with fixed columns
- Simple filters (status, contact, owner, tag, sort)
- Limited inline editing (checkboxes only)
- Separate detail view for editing
- Basic calendar view for releases
- Simple card-based stats

## Target: Notion-like Experience

Transform the CRM to feel like Notion's database with:

### 1. **Advanced Table View**
- Inline cell editing (click to edit any field)
- Resizable columns with drag handles
- Reorderable columns (drag & drop)
- Column type indicators (text, select, date, number, url, etc.)
- Rich cell renderers (avatars, progress bars, tags, dates)
- Sticky header that stays visible on scroll
- Row hover actions (quick edit, duplicate, delete)
- Expandable rows (click to see full details inline)

### 2. **Multiple View Types**
- **Table View** (current, enhanced)
- **Board View** (Kanban by status)
- **Gallery View** (cards with images)
- **Calendar View** (by release date or next step)
- **Timeline View** (Gantt-style for campaigns)
- **List View** (compact, mobile-friendly)

### 3. **Advanced Filtering & Sorting**
- Filter builder with AND/OR logic
- Multiple filters at once
- Filter by any property
- Advanced operators (contains, is empty, is not empty, etc.)
- Sort by multiple columns
- Save filter/sort combinations as views

### 4. **Saved Views**
- Create custom views with filters, sorts, and visible columns
- Share views with team
- Default views per user
- Quick view switcher

### 5. **Property Panel**
- Click column header to configure
- Show/hide columns
- Reorder columns
- Change column type
- Set column width
- Add calculated properties

### 6. **Inline Editing**
- Click any cell to edit
- Tab to move between cells
- Enter to save and move down
- Escape to cancel
- Auto-save on blur
- Optimistic updates

### 7. **Rich Property Types**
- **Text**: Single line, multi-line
- **Number**: With formatting (currency, percentage)
- **Select**: Single select with colors
- **Multi-select**: Tags with colors
- **Date**: With time picker
- **Person**: User assignment with avatar
- **URL**: Auto-link detection
- **Email**: Click to compose
- **Phone**: Click to call
- **Checkbox**: Boolean toggle
- **Rating**: Star rating
- **Progress**: Visual progress bar
- **Relation**: Link to other records
- **Rollup**: Aggregate from relations
- **Formula**: Calculated fields

### 8. **Keyboard Navigation**
- Arrow keys to navigate cells
- Cmd+K for command palette
- Cmd+F for search
- Shortcuts for common actions
- Vim-style navigation (optional)

### 9. **Bulk Operations**
- Select multiple rows
- Bulk edit properties
- Bulk delete
- Bulk export
- Bulk assign

### 10. **UI/UX Enhancements**
- Smooth animations and transitions
- Loading skeletons
- Optimistic updates
- Undo/redo support
- Toast notifications
- Drag & drop everywhere
- Context menus (right-click)
- Command palette (Cmd+K)

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up the architecture for flexible views and properties

1. **Create Property System**
   - Define property types and schemas
   - Build property registry
   - Create property renderers
   - Build property editors

2. **View State Management**
   - Create view configuration schema
   - Build view state context
   - Implement view persistence
   - Add view switcher UI

3. **Enhanced Table Component**
   - Build new table with inline editing
   - Add column resizing
   - Add column reordering
   - Implement sticky headers

**Files to Create**:
- `src/lib/properties/types.ts` - Property type definitions
- `src/lib/properties/registry.ts` - Property registry
- `src/lib/views/types.ts` - View configuration types
- `src/lib/views/context.tsx` - View state management
- `src/components/database/table.tsx` - New table component
- `src/components/database/cell.tsx` - Cell renderer
- `src/components/database/column-header.tsx` - Column header

### Phase 2: Inline Editing (Week 2)
**Goal**: Make every cell editable inline

1. **Cell Editors**
   - Text editor
   - Select editor (dropdown)
   - Date picker
   - Number input
   - User picker
   - Tag editor

2. **Edit Mode**
   - Click to edit
   - Keyboard navigation
   - Auto-save
   - Validation
   - Error handling

3. **Optimistic Updates**
   - Immediate UI updates
   - Background sync
   - Rollback on error
   - Conflict resolution

**Files to Create**:
- `src/components/database/editors/text-editor.tsx`
- `src/components/database/editors/select-editor.tsx`
- `src/components/database/editors/date-editor.tsx`
- `src/components/database/editors/user-editor.tsx`
- `src/components/database/editors/tag-editor.tsx`
- `src/hooks/use-cell-editor.ts`
- `src/hooks/use-optimistic-update.ts`

### Phase 3: Advanced Filtering (Week 3)
**Goal**: Build powerful filter system

1. **Filter Builder**
   - Visual filter builder UI
   - AND/OR logic
   - Multiple conditions
   - Property-specific operators

2. **Filter Engine**
   - Client-side filtering
   - Server-side filtering
   - Filter serialization
   - Filter presets

3. **Sort System**
   - Multi-column sort
   - Custom sort orders
   - Sort persistence

**Files to Create**:
- `src/components/database/filter-builder.tsx`
- `src/components/database/filter-condition.tsx`
- `src/lib/filters/types.ts`
- `src/lib/filters/engine.ts`
- `src/lib/filters/operators.ts`

### Phase 4: Multiple Views (Week 4)
**Goal**: Add Board, Gallery, and Calendar views

1. **Board View (Kanban)**
   - Drag & drop between columns
   - Grouping by status
   - Card customization
   - Swimlanes

2. **Gallery View**
   - Card grid layout
   - Image thumbnails
   - Customizable card content
   - Responsive grid

3. **Enhanced Calendar**
   - Multiple date properties
   - Color coding
   - Drag to reschedule
   - Multi-day events

**Files to Create**:
- `src/components/database/views/board-view.tsx`
- `src/components/database/views/gallery-view.tsx`
- `src/components/database/views/calendar-view.tsx`
- `src/components/database/views/list-view.tsx`
- `src/components/database/card.tsx`

### Phase 5: Saved Views & Polish (Week 5)
**Goal**: Complete the experience with saved views and polish

1. **Saved Views**
   - Create/edit/delete views
   - View sharing
   - Default views
   - View templates

2. **Command Palette**
   - Cmd+K to open
   - Search everything
   - Quick actions
   - Keyboard shortcuts

3. **Polish**
   - Animations
   - Loading states
   - Error boundaries
   - Performance optimization
   - Mobile responsive

**Files to Create**:
- `src/components/database/view-manager.tsx`
- `src/components/database/command-palette.tsx`
- `src/components/database/view-settings.tsx`
- `src/hooks/use-command-palette.ts`

## Technical Architecture

### State Management
```typescript
// View configuration
interface ViewConfig {
  id: string;
  name: string;
  type: 'table' | 'board' | 'gallery' | 'calendar' | 'timeline' | 'list';
  filters: Filter[];
  sorts: Sort[];
  groupBy?: string;
  visibleProperties: string[];
  propertyWidths: Record<string, number>;
  propertyOrder: string[];
}

// Property definition
interface Property {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOptions;
  formula?: string;
  relation?: RelationConfig;
}

// Filter definition
interface Filter {
  id: string;
  property: string;
  operator: FilterOperator;
  value: unknown;
  condition: 'and' | 'or';
}
```

### API Updates
- Add PATCH endpoints for inline updates
- Implement optimistic locking
- Add bulk update endpoints
- Add view CRUD endpoints
- Add property configuration endpoints

### Database Schema Updates
```prisma
model View {
  id          String   @id @default(cuid())
  name        String
  type        String
  userId      String?
  config      Json
  isDefault   Boolean  @default(false)
  isShared    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation(fields: [userId], references: [id])
}

model PropertyConfig {
  id          String   @id @default(cuid())
  entity      String   // 'artist', 'release', etc.
  name        String
  type        String
  options     Json?
  order       Int
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Design System Updates

### New Components Needed
- `<DataTable>` - Enhanced table with all features
- `<Cell>` - Smart cell renderer
- `<CellEditor>` - Inline editor
- `<ColumnHeader>` - Draggable, resizable header
- `<FilterBuilder>` - Visual filter UI
- `<ViewSwitcher>` - View type selector
- `<PropertyPanel>` - Column configuration
- `<CommandPalette>` - Cmd+K interface
- `<BoardColumn>` - Kanban column
- `<GalleryCard>` - Gallery view card
- `<ViewSettings>` - View configuration modal

### Styling Approach
- Use Tailwind for base styles
- Add custom CSS for complex interactions
- Implement smooth transitions
- Add hover states everywhere
- Use shadows and depth for hierarchy
- Maintain current color scheme

## Performance Considerations

1. **Virtualization**
   - Use `@tanstack/react-virtual` for large tables
   - Lazy load rows outside viewport
   - Optimize re-renders

2. **Caching**
   - Cache view configurations
   - Cache filter results
   - Implement stale-while-revalidate

3. **Optimistic Updates**
   - Update UI immediately
   - Sync in background
   - Handle conflicts gracefully

4. **Code Splitting**
   - Lazy load view components
   - Split by route
   - Dynamic imports for heavy features

## Migration Strategy

1. **Parallel Development**
   - Build new components alongside old
   - Feature flag new UI
   - Gradual rollout

2. **Data Migration**
   - Create default views from current filters
   - Migrate user preferences
   - Preserve existing data

3. **User Training**
   - In-app tutorials
   - Keyboard shortcut guide
   - Video walkthroughs

## Success Metrics

- Reduced clicks to complete common tasks
- Faster data entry (inline editing)
- More views created per user
- Higher user satisfaction scores
- Reduced time to find information
- Increased daily active usage

## Timeline

- **Week 1**: Foundation & Property System
- **Week 2**: Inline Editing
- **Week 3**: Advanced Filtering
- **Week 4**: Multiple Views
- **Week 5**: Saved Views & Polish
- **Week 6**: Testing & Refinement
- **Week 7**: Beta Release
- **Week 8**: Full Release

## Next Steps

1. Review and approve plan
2. Set up feature branch
3. Begin Phase 1 implementation
4. Daily standups to track progress
5. Weekly demos to stakeholders
