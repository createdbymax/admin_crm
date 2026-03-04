"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BoardColumn {
  id: string;
  label: string;
  color: string;
}

interface BoardViewProps<T extends Record<string, unknown>> {
  data: T[];
  groupByField: string;
  columns: BoardColumn[];
  onCardClick?: (item: T) => void;
  renderCard?: (item: T) => React.ReactNode;
  idField?: string;
}

export function BoardView<T extends Record<string, unknown>>({
  data,
  groupByField,
  columns,
  onCardClick,
  renderCard,
  idField = 'id',
}: BoardViewProps<T>) {
  // Group data by the specified field
  const groupedData = useMemo(() => {
    const groups: Record<string, T[]> = {};
    
    columns.forEach(col => {
      groups[col.id] = [];
    });

    data.forEach(item => {
      const groupValue = String(item[groupByField] ?? 'unassigned');
      if (groups[groupValue]) {
        groups[groupValue].push(item);
      }
    });

    return groups;
  }, [data, groupByField, columns]);

  const defaultRenderCard = (item: T) => (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm truncate">
        {String(item.name ?? item[idField])}
      </h4>
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        {Object.entries(item)
          .filter(([key]) => key !== idField && key !== 'name' && key !== groupByField)
          .slice(0, 3)
          .map(([key, value]) => (
            <span key={key} className="truncate">
              {String(value)}
            </span>
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const items = groupedData[column.id] ?? [];
        
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 rounded-xl border border-white/70 bg-white/50 shadow-sm"
          >
            {/* Column header */}
            <div className="sticky top-0 z-10 px-4 py-3 border-b border-white/60 bg-white/80 backdrop-blur-sm rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-sm">{column.label}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {items.length}
                </Badge>
              </div>
            </div>

            {/* Column content */}
            <div className="p-3 space-y-3 min-h-[200px]">
              {items.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No items
                </div>
              ) : (
                items.map(item => (
                  <div
                    key={String(item[idField])}
                    onClick={() => onCardClick?.(item)}
                    className={cn(
                      "p-3 rounded-lg border border-white/70 bg-white shadow-sm",
                      "hover:shadow-md hover:border-white transition-all cursor-pointer"
                    )}
                  >
                    {renderCard ? renderCard(item) : defaultRenderCard(item)}
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
