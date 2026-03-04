"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedDataTable } from './enhanced-data-table';
import { BoardView } from './views/board-view';
import { GalleryView } from './views/gallery-view';
import { ListView } from './views/list-view';
import { ViewSwitcher } from './view-switcher';
import { FilterBuilder } from './filter-builder';
import { CommandPalette, useCommandPalette } from './command-palette';
import { ViewProvider, useView } from '@/lib/views/context';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import { applyFilters } from '@/lib/filters/engine';
import type { Property } from '@/lib/properties/types';
import type { ViewConfig } from '@/lib/views/types';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface CompleteDatabaseProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  views: ViewConfig[];
  users?: User[];
  availableTags?: string[];
  onCellUpdate: (id: string, field: string, value: unknown) => Promise<void>;
  onRowClick?: (row: T) => void;
  idField?: string;
  imageProperty?: string;
  titleProperty?: string;
}

const compareValues = (aVal: unknown, bVal: unknown) => {
  if (aVal === bVal) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return aVal < bVal ? -1 : 1;
  }
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal);
  }
  if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
    return aVal === bVal ? 0 : aVal ? 1 : -1;
  }
  if (aVal instanceof Date && bVal instanceof Date) {
    return aVal < bVal ? -1 : 1;
  }

  return String(aVal).localeCompare(String(bVal));
};

function DatabaseContent<T extends Record<string, unknown>>({
  data,
  properties,
  users = [],
  availableTags = [],
  onCellUpdate,
  onRowClick,
  idField = 'id',
  imageProperty = 'image',
  titleProperty = 'name',
}: Omit<CompleteDatabaseProps<T>, 'views'>) {
  const router = useRouter();
  const {
    currentView,
    availableViews,
    setCurrentView,
    addFilter,
    updateFilter,
    removeFilter,
    createView,
    duplicateView,
    deleteView,
  } = useView();

  const [propertyWidths, setPropertyWidths] = useState<Record<string, number>>(
    properties.reduce((acc, p) => {
      acc[p.id] = currentView.propertyWidths[p.id] ?? p.width ?? 200;
      return acc;
    }, {} as Record<string, number>)
  );

  const commandPalette = useCommandPalette();

  // Filter visible properties
  const visibleProperties = useMemo(() => {
    return properties.filter(p => currentView.visibleProperties.includes(p.id));
  }, [properties, currentView]);

  // Apply filters
  const filteredData = useMemo(() => {
    return applyFilters(data, currentView.filters, properties, currentView.filterLogic);
  }, [data, currentView.filters, properties, currentView.filterLogic]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (currentView.sorts.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const sort of currentView.sorts) {
        const aVal = a[sort.property];
        const bVal = b[sort.property];

        const comparison = compareValues(aVal, bVal);
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [filteredData, currentView.sorts]);

  // Optimistic updates
  const { update } = useOptimisticUpdate<{ id: string }>({
    onUpdate: async (id, updates) => {
      const field = Object.keys(updates)[0];
      const value = updates[field as keyof typeof updates];
      await onCellUpdate(id, field, value);
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const handleCellUpdate = async (id: string, field: string, value: unknown) => {
    await update(id, { [field]: value });
  };

  const handlePropertyResize = (propertyId: string, width: number) => {
    setPropertyWidths(prev => ({ ...prev, [propertyId]: width }));
  };

  // Command palette commands
  const commands = useMemo(() => [
    {
      id: 'create-view',
      label: 'Create new view',
      description: 'Create a custom view with filters and sorts',
      icon: '➕',
      category: 'Views',
      action: () => {
        createView({
          name: 'New View',
          type: 'table',
          filters: [],
          sorts: [],
          visibleProperties: properties.map(p => p.id),
          propertyWidths: {},
          propertyOrder: properties.map(p => p.id),
        });
      },
    },
    {
      id: 'duplicate-view',
      label: 'Duplicate current view',
      description: 'Create a copy of the current view',
      icon: '📋',
      category: 'Views',
      action: () => {
        duplicateView(currentView.id);
      },
    },
    ...availableViews.map(view => ({
      id: `switch-${view.id}`,
      label: `Switch to ${view.name}`,
      description: `View type: ${view.type}`,
      icon: view.icon || '📊',
      category: 'Switch View',
      action: () => setCurrentView(view.id),
    })),
    {
      id: 'add-filter',
      label: 'Add filter',
      description: 'Add a new filter condition',
      icon: '🔍',
      shortcut: 'F',
      category: 'Filters',
      action: () => {
        addFilter({
          property: properties[0]?.id ?? '',
          operator: 'equals',
          value: '',
          condition: 'and',
        });
      },
    },
    {
      id: 'refresh',
      label: 'Refresh data',
      description: 'Reload the current view',
      icon: '🔄',
      shortcut: 'R',
      category: 'Actions',
      action: () => router.refresh(),
    },
  ], [availableViews, currentView, properties, createView, duplicateView, setCurrentView, addFilter, router]);

  // Render view based on type
  const renderView = () => {
    switch (currentView.type) {
      case 'table':
        return (
          <EnhancedDataTable
            data={sortedData}
            properties={visibleProperties}
            propertyWidths={propertyWidths}
            onPropertyResize={handlePropertyResize}
            onCellUpdate={handleCellUpdate}
            onRowClick={onRowClick}
            users={users}
            availableTags={availableTags}
            idField={idField}
          />
        );

      case 'board':
        const boardColumns = [
          { id: 'LEAD', label: 'Lead', color: '#6b7280' },
          { id: 'CONTACTED', label: 'Contacted', color: '#3b82f6' },
          { id: 'NEGOTIATING', label: 'Negotiating', color: '#f59e0b' },
          { id: 'WON', label: 'Won', color: '#10b981' },
          { id: 'LOST', label: 'Lost', color: '#ef4444' },
        ];
        return (
          <BoardView
            data={sortedData}
            groupByField={currentView.boardGroupBy ?? 'status'}
            columns={boardColumns}
            onCardClick={onRowClick}
            idField={idField}
          />
        );

      case 'gallery':
        return (
          <GalleryView
            data={sortedData}
            properties={visibleProperties}
            imageProperty={currentView.galleryImageProperty ?? imageProperty}
            titleProperty={titleProperty}
            onCardClick={onRowClick}
            idField={idField}
          />
        );

      case 'list':
        return (
          <ListView
            data={sortedData}
            properties={visibleProperties}
            titleProperty={titleProperty}
            onItemClick={onRowClick}
            idField={idField}
          />
        );

      default:
        return <div>View type not supported</div>;
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Notion-style Toolbar */}
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <ViewSwitcher
              views={availableViews}
              currentViewId={currentView.id}
              onViewChange={setCurrentView}
              onCreateView={() => createView({
                name: 'New View',
                type: 'table',
                filters: [],
                sorts: [],
                visibleProperties: properties.map(p => p.id),
                propertyWidths: {},
                propertyOrder: properties.map(p => p.id),
              })}
            />

            <FilterBuilder
              filters={currentView.filters}
              properties={properties}
              filterLogic={currentView.filterLogic ?? 'and'}
              onFiltersChange={(filters) => {
                // Update current view filters
                currentView.filters = filters;
              }}
              onFilterLogicChange={(logic) => {
                currentView.filterLogic = logic;
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={commandPalette.open}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded">⌘K</kbd>
            </button>
            <span className="text-xs text-gray-500 font-medium">
              {sortedData.length} {sortedData.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>

        {/* View Container - Notion style */}
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
          {renderView()}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        commands={commands}
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </>
  );
}

export function CompleteDatabase<T extends Record<string, unknown>>(
  props: CompleteDatabaseProps<T>
) {
  return (
    <ViewProvider initialViews={props.views} defaultViewId={props.views[0]?.id}>
      <DatabaseContent {...props} />
    </ViewProvider>
  );
}
