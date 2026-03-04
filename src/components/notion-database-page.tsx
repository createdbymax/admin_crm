"use client";

import { useState, useMemo, useCallback } from 'react';
import { NotionDatabaseToolbar } from './notion-database-toolbar';
import { NotionTableView } from './notion-table-view';
import { NotionBoardView } from './notion-board-view';
import { NotionGalleryView } from './notion-gallery-view';
import { applyFilters } from '@/lib/filters/engine';
import type { Property } from '@/lib/properties/types';
import type { ViewConfig, Filter } from '@/lib/views/types';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface NotionDatabasePageProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  properties: Property[];
  views: ViewConfig[];
  users?: User[];
  availableTags?: string[];
  onCellUpdate: (id: string, field: string, value: unknown) => Promise<void>;
  onNewRecord?: () => void;
  onRowClick?: (row: T) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  idField?: string;
  imageProperty?: string;
  titleProperty?: string;
}

export function NotionDatabasePage<T extends Record<string, unknown>>({
  title,
  data,
  properties,
  views: initialViews,
  users = [],
  availableTags = [],
  onCellUpdate,
  onNewRecord,
  onRowClick,
  onSync,
  isSyncing = false,
  idField = 'id',
  imageProperty = 'image',
  titleProperty = 'name',
}: NotionDatabasePageProps<T>) {
  const [views, setViews] = useState<ViewConfig[]>(initialViews);
  const [currentViewId, setCurrentViewId] = useState<string>(initialViews[0]?.id ?? '');
  
  const currentView = views.find(v => v.id === currentViewId) ?? views[0];

  const [propertyWidths, setPropertyWidths] = useState<Record<string, number>>(
    properties.reduce((acc, p) => {
      acc[p.id] = currentView?.propertyWidths[p.id] ?? p.width ?? 200;
      return acc;
    }, {} as Record<string, number>)
  );

  // Filter visible properties
  const visibleProperties = useMemo(() => {
    if (!currentView) return properties;
    return properties.filter(p => currentView.visibleProperties.includes(p.id));
  }, [properties, currentView]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (!currentView) return data;
    return applyFilters(data, currentView.filters, properties, currentView.filterLogic);
  }, [data, currentView, properties]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!currentView || currentView.sorts.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const sort of currentView.sorts) {
        const aVal = a[sort.property] as string | number | null;
        const bVal = b[sort.property] as string | number | null;

        if (aVal === bVal) continue;
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }, [filteredData, currentView]);

  const handleCellUpdate = useCallback(async (id: string, field: string, value: unknown) => {
    await onCellUpdate(id, field, value);
  }, [onCellUpdate]);

  const handlePropertyResize = useCallback((propertyId: string, width: number) => {
    setPropertyWidths(prev => ({ ...prev, [propertyId]: width }));
  }, []);

  const handleSort = useCallback((propertyId: string, direction: 'asc' | 'desc') => {
    setViews(prev => prev.map(v => 
      v.id === currentViewId 
        ? { ...v, sorts: [{ property: propertyId, direction }] }
        : v
    ));
  }, [currentViewId]);

  const handleFiltersChange = useCallback((filters: Filter[]) => {
    setViews(prev => prev.map(v => 
      v.id === currentViewId ? { ...v, filters } : v
    ));
  }, [currentViewId]);

  const handleFilterLogicChange = useCallback((logic: 'and' | 'or') => {
    setViews(prev => prev.map(v => 
      v.id === currentViewId ? { ...v, filterLogic: logic } : v
    ));
  }, [currentViewId]);

  const handleCreateView = useCallback(() => {
    const newView: ViewConfig = {
      id: `view_${Date.now()}`,
      name: 'New View',
      type: 'table',
      filters: [],
      sorts: [],
      visibleProperties: properties.map(p => p.id),
      propertyWidths: {},
      propertyOrder: [],
    };
    setViews(prev => [...prev, newView]);
    setCurrentViewId(newView.id);
  }, [properties]);

  // Render view based on type
  const renderView = () => {
    if (!currentView) return null;

    switch (currentView.type) {
      case 'table':
        return (
          <NotionTableView
            data={sortedData}
            properties={visibleProperties}
            propertyWidths={propertyWidths}
            onPropertyResize={handlePropertyResize}
            onCellUpdate={handleCellUpdate}
            onRowClick={onRowClick}
            onSort={handleSort}
            users={users}
            availableTags={availableTags}
            idField={idField}
          />
        );

      case 'board':
        return (
          <NotionBoardView
            data={sortedData}
            groupByField={currentView.boardGroupBy ?? 'status'}
            properties={visibleProperties}
            onCardClick={onRowClick}
            idField={idField}
          />
        );

      case 'gallery':
        return (
          <NotionGalleryView
            data={sortedData}
            properties={visibleProperties}
            imageProperty={currentView.galleryImageProperty ?? imageProperty}
            titleProperty={titleProperty}
            onCardClick={onRowClick}
            idField={idField}
          />
        );

      default:
        return <div>View type not supported</div>;
    }
  };

  if (!currentView) return null;

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Page header */}
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="pt-8 sm:pt-12 pb-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Toolbar */}
        <NotionDatabaseToolbar
          views={views}
          currentView={currentView}
          properties={properties}
          onViewChange={setCurrentViewId}
          onCreateView={handleCreateView}
          onFiltersChange={handleFiltersChange}
          onFilterLogicChange={handleFilterLogicChange}
          onNewRecord={onNewRecord}
          onSync={onSync}
          isSyncing={isSyncing}
          resultCount={sortedData.length}
          totalCount={data.length}
        />
      </div>

      {/* View Container */}
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 xl:px-10 pb-12">
        {renderView()}
      </div>
    </div>
  );
}
