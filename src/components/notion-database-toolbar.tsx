"use client";

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ViewSwitcher } from './database/view-switcher';
import { FilterBuilder } from './database/filter-builder';
import type { ViewConfig, Filter } from '@/lib/views/types';
import type { Property } from '@/lib/properties/types';

interface NotionDatabaseToolbarProps {
  views: ViewConfig[];
  currentView: ViewConfig;
  properties: Property[];
  onViewChange: (viewId: string) => void;
  onCreateView: () => void;
  onFiltersChange: (filters: Filter[]) => void;
  onFilterLogicChange: (logic: 'and' | 'or') => void;
  onNewRecord?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  resultCount: number;
  totalCount: number;
}

export function NotionDatabaseToolbar({
  views,
  currentView,
  properties,
  onViewChange,
  onCreateView,
  onFiltersChange,
  onFilterLogicChange,
  onNewRecord,
  onSync,
  isSyncing = false,
  resultCount,
  totalCount,
}: NotionDatabaseToolbarProps) {
  const [showProperties, setShowProperties] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sortButtonRect, setSortButtonRect] = useState<DOMRect | null>(null);
  const [propertiesButtonRect, setPropertiesButtonRect] = useState<DOMRect | null>(null);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);
  const [searchButtonRect, setSearchButtonRect] = useState<DOMRect | null>(null);

  const handleSortToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSortButtonRect(rect);
    setShowSort(!showSort);
  };

  const handlePropertiesToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPropertiesButtonRect(rect);
    setShowProperties(!showProperties);
  };

  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuButtonRect(rect);
    setShowMenu(!showMenu);
  };

  const handleSearchToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSearchButtonRect(rect);
    setShowSearch(!showSearch);
  };

  // Memoize dropdown styles
  const sortDropdownStyle = useMemo(() => {
    if (!sortButtonRect) return {};
    const dropdownWidth = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = sortButtonRect.left + dropdownWidth > viewportWidth;
    const estimatedHeight = 300;
    const wouldOverflowBottom = sortButtonRect.bottom + estimatedHeight > viewportHeight;
    return {
      top: wouldOverflowBottom ? `${sortButtonRect.top - estimatedHeight}px` : `${sortButtonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - sortButtonRect.right}px` : `${sortButtonRect.left}px`,
      maxHeight: wouldOverflowBottom ? `${sortButtonRect.top - 20}px` : `${viewportHeight - sortButtonRect.bottom - 20}px`,
    };
  }, [sortButtonRect]);

  const propertiesDropdownStyle = useMemo(() => {
    if (!propertiesButtonRect) return {};
    const dropdownWidth = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = propertiesButtonRect.left + dropdownWidth > viewportWidth;
    const estimatedHeight = 400;
    const wouldOverflowBottom = propertiesButtonRect.bottom + estimatedHeight > viewportHeight;
    return {
      top: wouldOverflowBottom ? `${propertiesButtonRect.top - estimatedHeight}px` : `${propertiesButtonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - propertiesButtonRect.right}px` : `${propertiesButtonRect.left}px`,
      maxHeight: wouldOverflowBottom ? `${propertiesButtonRect.top - 20}px` : `${viewportHeight - propertiesButtonRect.bottom - 20}px`,
    };
  }, [propertiesButtonRect]);

  const menuDropdownStyle = useMemo(() => {
    if (!menuButtonRect) return {};
    const dropdownWidth = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = menuButtonRect.right > viewportWidth - dropdownWidth;
    const estimatedHeight = 200;
    const wouldOverflowBottom = menuButtonRect.bottom + estimatedHeight > viewportHeight;
    return {
      top: wouldOverflowBottom ? `${menuButtonRect.top - estimatedHeight}px` : `${menuButtonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - menuButtonRect.right}px` : `${menuButtonRect.left}px`,
      maxHeight: wouldOverflowBottom ? `${menuButtonRect.top - 20}px` : `${viewportHeight - menuButtonRect.bottom - 20}px`,
    };
  }, [menuButtonRect]);

  const searchDropdownStyle = useMemo(() => {
    if (!searchButtonRect) return {};
    const dropdownWidth = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = searchButtonRect.left + dropdownWidth > viewportWidth;
    const estimatedHeight = 100;
    const wouldOverflowBottom = searchButtonRect.bottom + estimatedHeight > viewportHeight;
    return {
      top: wouldOverflowBottom ? `${searchButtonRect.top - estimatedHeight}px` : `${searchButtonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - searchButtonRect.right}px` : `${searchButtonRect.left}px`,
    };
  }, [searchButtonRect]);

  return (
    <div className="border-b border-gray-200 pb-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left side - View controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <ViewSwitcher
            views={views}
            currentViewId={currentView.id}
            onViewChange={onViewChange}
            onCreateView={onCreateView}
          />

          <div className="h-5 w-px bg-gray-200" />

          <FilterBuilder
            filters={currentView.filters}
            properties={properties}
            filterLogic={currentView.filterLogic ?? 'and'}
            onFiltersChange={onFiltersChange}
            onFilterLogicChange={onFilterLogicChange}
          />

          <button
            onClick={handleSortToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>Sort</span>
            {currentView.sorts.length > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold bg-gray-200 text-gray-700 rounded-full">
                {currentView.sorts.length}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          {showSort && sortButtonRect && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
              <div 
                className="fixed w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto"
                style={sortDropdownStyle}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Sort</h3>
                    <button
                      onClick={() => setShowSort(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {currentView.sorts.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-gray-500">No sorts applied</p>
                      <p className="text-xs text-gray-400 mt-1">Use column headers to sort</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentView.sorts.map((sort) => {
                        const prop = properties.find(p => p.id === sort.property);
                        return (
                          <div key={sort.property} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{prop?.name}</span>
                            <span className="text-xs text-gray-500">{sort.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            onClick={handlePropertiesToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Properties</span>
          </button>

          {/* Properties dropdown */}
          {showProperties && propertiesButtonRect && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProperties(false)} />
              <div 
                className="fixed w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-y-auto"
                style={propertiesDropdownStyle}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
                    <button
                      onClick={() => setShowProperties(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-1">
                    {properties.map((property) => {
                      const isVisible = currentView.visibleProperties.includes(property.id);
                      return (
                        <label
                          key={property.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => {
                              // TODO: Implement toggle property visibility
                              console.log('Toggle property:', property.id);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{property.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="h-5 w-px bg-gray-200" />

          <button 
            onClick={handleSearchToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </button>

          {/* Search dropdown */}
          {showSearch && searchButtonRect && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
              <div 
                className="fixed w-[400px] bg-white border border-gray-200 rounded-lg shadow-xl z-50"
                style={searchDropdownStyle}
              >
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Search in all properties..."
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Press Enter to search
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">
            {resultCount === totalCount 
              ? `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`
              : `${resultCount} of ${totalCount}`
            }
          </span>

          {onNewRecord && (
            <>
              <div className="h-5 w-px bg-gray-200" />
              <button
                onClick={onNewRecord}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New</span>
              </button>
            </>
          )}

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isSyncing
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
              )}
            >
              <svg 
                className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isSyncing ? 'Syncing...' : 'Sync Spotify'}</span>
            </button>
          )}

          <button 
            onClick={handleMenuToggle}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* More menu dropdown */}
          {showMenu && menuButtonRect && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div 
                className="fixed w-[200px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1"
                style={menuDropdownStyle}
              >
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
