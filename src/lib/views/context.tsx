"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ViewConfig, ViewState, ViewActions, Filter, Sort, GroupBy } from './types';

const ViewContext = createContext<(ViewState & ViewActions) | null>(null);

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}

interface ViewProviderProps {
  children: ReactNode;
  initialViews: ViewConfig[];
  defaultViewId?: string;
}

export function ViewProvider({ children, initialViews, defaultViewId }: ViewProviderProps) {
  const [availableViews, setAvailableViews] = useState<ViewConfig[]>(initialViews);
  const [currentViewId, setCurrentViewId] = useState<string>(
    defaultViewId ?? initialViews[0]?.id ?? ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentView = availableViews.find(v => v.id === currentViewId) ?? availableViews[0];

  const setCurrentView = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
  }, []);

  const createView = useCallback(async (view: Omit<ViewConfig, 'id'>): Promise<ViewConfig> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API call to create view
      const newView: ViewConfig = {
        ...view,
        id: `view_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAvailableViews(prev => [...prev, newView]);
      return newView;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create view';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateView = useCallback(async (viewId: string, updates: Partial<ViewConfig>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API call to update view
      setAvailableViews(prev =>
        prev.map(v =>
          v.id === viewId
            ? { ...v, ...updates, updatedAt: new Date().toISOString() }
            : v
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update view';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteView = useCallback(async (viewId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: API call to delete view
      setAvailableViews(prev => prev.filter(v => v.id !== viewId));
      
      if (currentViewId === viewId) {
        setCurrentViewId(availableViews[0]?.id ?? '');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete view';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentViewId, availableViews]);

  const duplicateView = useCallback(async (viewId: string): Promise<ViewConfig> => {
    const viewToDuplicate = availableViews.find(v => v.id === viewId);
    if (!viewToDuplicate) {
      throw new Error('View not found');
    }

    return createView({
      ...viewToDuplicate,
      name: `${viewToDuplicate.name} (Copy)`,
      isDefault: false,
    });
  }, [availableViews, createView]);

  const addFilter = useCallback((filter: Omit<Filter, 'id'>) => {
    const newFilter: Filter = {
      ...filter,
      id: `filter_${Date.now()}`,
    };
    
    updateView(currentViewId, {
      filters: [...currentView.filters, newFilter],
    });
  }, [currentViewId, currentView, updateView]);

  const updateFilter = useCallback((filterId: string, updates: Partial<Filter>) => {
    updateView(currentViewId, {
      filters: currentView.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    });
  }, [currentViewId, currentView, updateView]);

  const removeFilter = useCallback((filterId: string) => {
    updateView(currentViewId, {
      filters: currentView.filters.filter(f => f.id !== filterId),
    });
  }, [currentViewId, currentView, updateView]);

  const addSort = useCallback((sort: Sort) => {
    updateView(currentViewId, {
      sorts: [...currentView.sorts, sort],
    });
  }, [currentViewId, currentView, updateView]);

  const updateSort = useCallback((property: string, direction: 'asc' | 'desc') => {
    const existingSort = currentView.sorts.find(s => s.property === property);
    
    if (existingSort) {
      updateView(currentViewId, {
        sorts: currentView.sorts.map(s =>
          s.property === property ? { ...s, direction } : s
        ),
      });
    } else {
      addSort({ property, direction });
    }
  }, [currentViewId, currentView, updateView, addSort]);

  const removeSort = useCallback((property: string) => {
    updateView(currentViewId, {
      sorts: currentView.sorts.filter(s => s.property !== property),
    });
  }, [currentViewId, currentView, updateView]);

  const setGroupBy = useCallback((groupBy: GroupBy | undefined) => {
    updateView(currentViewId, { groupBy });
  }, [currentViewId, updateView]);

  const togglePropertyVisibility = useCallback((propertyId: string) => {
    const isVisible = currentView.visibleProperties.includes(propertyId);
    
    updateView(currentViewId, {
      visibleProperties: isVisible
        ? currentView.visibleProperties.filter(p => p !== propertyId)
        : [...currentView.visibleProperties, propertyId],
    });
  }, [currentViewId, currentView, updateView]);

  const setPropertyWidth = useCallback((propertyId: string, width: number) => {
    updateView(currentViewId, {
      propertyWidths: {
        ...currentView.propertyWidths,
        [propertyId]: width,
      },
    });
  }, [currentViewId, currentView, updateView]);

  const reorderProperties = useCallback((propertyIds: string[]) => {
    updateView(currentViewId, {
      propertyOrder: propertyIds,
    });
  }, [currentViewId, updateView]);

  const value: ViewState & ViewActions = {
    currentView,
    availableViews,
    isLoading,
    error,
    setCurrentView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    addFilter,
    updateFilter,
    removeFilter,
    addSort,
    updateSort,
    removeSort,
    setGroupBy,
    togglePropertyVisibility,
    setPropertyWidth,
    reorderProperties,
  };

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}
