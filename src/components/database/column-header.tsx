"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getPropertyMetadata } from '@/lib/properties/registry';
import type { Property } from '@/lib/properties/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnHeaderProps {
  property: Property;
  width: number;
  onResize: (width: number) => void;
  onSort?: (direction: 'asc' | 'desc') => void;
  sortDirection?: 'asc' | 'desc' | null;
  onHide?: () => void;
  onReorder?: (targetPropertyId: string) => void;
}

export function ColumnHeader({
  property,
  width,
  onResize,
  onSort,
  sortDirection,
  onHide,
  onReorder,
}: ColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const metadata = getPropertyMetadata(property.type);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(100, startWidthRef.current + delta);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  const handleSort = () => {
    if (!onSort) return;
    
    if (!sortDirection) {
      onSort('asc');
    } else if (sortDirection === 'asc') {
      onSort('desc');
    } else {
      onSort('asc');
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-500 bg-[#f7f6f3] hover:bg-[#eeede9] transition-colors flex-shrink-0",
        isResizing && "bg-[#eeede9]"
      )}
      style={{ width }}
    >
      <button
        className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        onClick={handleSort}
      >
        <span className="text-sm opacity-60">{metadata.icon}</span>
        <span className="truncate font-medium text-[13px]">{property.name}</span>
        {sortDirection && (
          <span className="text-xs text-gray-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button 
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 bg-white">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              if (onSort) onSort('asc');
            }} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>Sort ascending</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              if (onSort) onSort('desc');
            }} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Sort descending</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              if (onHide) onHide();
            }} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            <span>Hide property</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 hover:opacity-100 transition-opacity",
          "hover:bg-blue-500",
          isResizing && "opacity-100 bg-blue-500"
        )}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
