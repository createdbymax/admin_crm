"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Property } from '@/lib/properties/types';

interface NotionBoardViewProps<T extends Record<string, unknown>> {
  data: T[];
  groupByField: string;
  properties: Property[];
  onCardClick?: (item: T) => void;
  idField?: string;
}

const STATUS_COLUMNS = [
  { id: 'LEAD', label: 'Lead', color: '#6b7280' },
  { id: 'CONTACTED', label: 'Contacted', color: '#3b82f6' },
  { id: 'NEGOTIATING', label: 'Negotiating', color: '#f59e0b' },
  { id: 'WON', label: 'Won', color: '#10b981' },
  { id: 'LOST', label: 'Lost', color: '#ef4444' },
];

export function NotionBoardView<T extends Record<string, unknown>>({
  data,
  groupByField,
  properties,
  onCardClick,
  idField = 'id',
}: NotionBoardViewProps<T>) {
  // Group data by the specified field
  const groupedData = useMemo(() => {
    const groups: Record<string, T[]> = {};
    
    STATUS_COLUMNS.forEach(col => {
      groups[col.id] = [];
    });

    data.forEach(item => {
      const groupValue = String(item[groupByField] ?? 'LEAD');
      if (groups[groupValue]) {
        groups[groupValue].push(item);
      }
    });

    return groups;
  }, [data, groupByField]);

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map(column => {
        const items = groupedData[column.id] ?? [];
        
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-[280px]"
          >
            {/* Column header - Notion style */}
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="text-sm font-medium text-gray-700">{column.label}</h3>
                <span className="text-xs text-gray-400 font-medium">{items.length}</span>
              </div>
              <button className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Column content */}
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  No items
                </div>
              ) : (
                items.map(item => (
                  <div
                    key={String(item[idField])}
                    onClick={() => onCardClick?.(item)}
                    className="group p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="space-y-2">
                      {/* Title */}
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {String(item.name ?? item[idField])}
                      </h4>

                      {/* Properties */}
                      {properties.slice(0, 3).map(prop => {
                        const value = item[prop.id];
                        if (!value) return null;

                        return (
                          <div key={prop.id} className="text-xs text-gray-500">
                            <span className="font-medium">{prop.name}:</span>{' '}
                            <span>{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
