"use client";

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ViewConfig, ViewType } from '@/lib/views/types';

interface ViewSwitcherProps {
  views: ViewConfig[];
  currentViewId: string;
  onViewChange: (viewId: string) => void;
  onCreateView?: () => void;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  table: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  board: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  gallery: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  timeline: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  list: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

export function ViewSwitcher({
  views,
  currentViewId,
  onViewChange,
  onCreateView,
}: ViewSwitcherProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const currentView = views.find((v) => v.id === currentViewId);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setShowDropdown(!showDropdown);
  };

  // Memoize dropdown style calculation
  const dropdownStyle = useMemo(() => {
    if (!buttonRect) return {};
    
    const dropdownWidth = 224;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const wouldOverflowRight = buttonRect.left + dropdownWidth > viewportWidth;
    const estimatedHeight = 300;
    const wouldOverflowBottom = buttonRect.bottom + estimatedHeight > viewportHeight;
    
    return {
      top: wouldOverflowBottom ? `${buttonRect.top - estimatedHeight}px` : `${buttonRect.bottom + 4}px`,
      [wouldOverflowRight ? 'right' : 'left']: wouldOverflowRight ? `${viewportWidth - buttonRect.right}px` : `${buttonRect.left}px`,
      maxHeight: wouldOverflowBottom ? `${buttonRect.top - 20}px` : `${viewportHeight - buttonRect.bottom - 20}px`,
    };
  }, [buttonRect]);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        {currentView && VIEW_ICONS[currentView.type]}
        <span>{currentView?.name ?? 'Select view'}</span>
        <svg
          className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showDropdown && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && buttonRect && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div 
            className="fixed w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 overflow-y-auto"
            style={dropdownStyle}
          >
            <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Views
            </div>
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => {
                  onViewChange(view.id);
                  setShowDropdown(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md mx-1",
                  view.id === currentViewId && "bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
              >
                {VIEW_ICONS[view.type]}
                <span className="flex-1 text-left font-medium">{view.name}</span>
                {view.isDefault && (
                  <span className="text-[11px] text-gray-400 font-medium">Default</span>
                )}
              </button>
            ))}
            {onCreateView && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    onCreateView();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-blue-600 hover:bg-gray-100 transition-colors rounded-md mx-1 font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New view</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
