"use client";

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FilterCondition } from './filter-condition';
import type { Filter, FilterCondition as FilterConditionType } from '@/lib/views/types';
import type { Property } from '@/lib/properties/types';

interface FilterBuilderProps {
  filters: Filter[];
  properties: Property[];
  filterLogic: FilterConditionType;
  onFiltersChange: (filters: Filter[]) => void;
  onFilterLogicChange: (logic: FilterConditionType) => void;
  onClose?: () => void;
}

export function FilterBuilder({
  filters,
  properties,
  filterLogic,
  onFiltersChange,
  onFilterLogicChange,
  onClose,
}: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter_${Date.now()}`,
      property: properties[0]?.id ?? '',
      operator: 'equals',
      value: '',
      condition: 'and',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<Filter>) => {
    onFiltersChange(
      filters.map(f => (f.id === filterId ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsOpen(!isOpen);
  };

  // Memoize dropdown style calculation
  const dropdownStyle = useMemo(() => {
    if (!buttonRect) return {};
    
    const dropdownWidth = 600;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = buttonRect.right > viewportWidth - dropdownWidth;
    const estimatedHeight = 400;
    const wouldOverflowBottom = buttonRect.bottom + estimatedHeight > viewportHeight;
    
    return {
      top: wouldOverflowBottom ? `${buttonRect.top - estimatedHeight}px` : `${buttonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - buttonRect.right}px` : `${buttonRect.left}px`,
      maxHeight: wouldOverflowBottom ? `${buttonRect.top - 20}px` : `${viewportHeight - buttonRect.bottom - 20}px`,
    };
  }, [buttonRect]);

  return (
    <div className="relative">
      {/* Filter button - Notion style */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors",
          filters.length > 0 
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100" 
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>Filter</span>
        {filters.length > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold bg-blue-600 text-white rounded-full">
            {filters.length}
          </span>
        )}
      </button>

      {/* Filter panel - Fixed positioning with viewport bounds checking */}
      {isOpen && buttonRect && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-[600px] max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto"
            style={dropdownStyle}
          >
            <div className="p-3 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter logic toggle */}
              {filters.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Show rows where</span>
                  <select
                    value={filterLogic}
                    onChange={(e) => onFilterLogicChange(e.target.value as FilterConditionType)}
                    className="px-2 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="and">All conditions match</option>
                    <option value="or">Any condition matches</option>
                  </select>
                </div>
              )}

              {/* Filter conditions */}
              {filters.length === 0 ? (
                <div className="py-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">No filters applied</p>
                  <p className="text-xs text-gray-400 mt-1">Add a filter to narrow down results</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter, index) => (
                    <div key={filter.id} className="flex items-start gap-2">
                      {index > 0 && (
                        <div className="flex items-center justify-center w-10 h-8 text-[11px] font-semibold text-gray-400 uppercase">
                          {filterLogic}
                        </div>
                      )}
                      <div className="flex-1">
                        <FilterCondition
                          filter={filter}
                          properties={properties}
                          onChange={(updates) => updateFilter(filter.id, updates)}
                          onRemove={() => removeFilter(filter.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={addFilter}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                >
                  + Add filter
                </button>
                {filters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
