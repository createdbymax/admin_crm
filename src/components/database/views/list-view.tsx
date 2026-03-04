"use client";

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/properties/types';

interface ListViewProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  titleProperty?: string;
  subtitleProperty?: string;
  onItemClick?: (item: T) => void;
  idField?: string;
  selectedId?: string;
}

export function ListView<T extends Record<string, unknown>>({
  data,
  properties,
  titleProperty = 'name',
  subtitleProperty,
  onItemClick,
  idField = 'id',
  selectedId,
}: ListViewProps<T>) {
  const getPropertyValue = (item: T, propertyId: string) => {
    return item[propertyId];
  };

  const renderPropertyValue = (item: T, property: Property) => {
    const value = getPropertyValue(item, property.id);

    if (!value) return null;

    switch (property.type) {
      case 'select':
      case 'status':
        return (
          <Badge variant="secondary" className="text-xs">
            {String(value)}
          </Badge>
        );

      case 'tags':
      case 'multiSelect':
        if (!Array.isArray(value)) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {String(tag)}
              </Badge>
            ))}
            {value.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{value.length - 2}
              </Badge>
            )}
          </div>
        );

      case 'number':
        const num = Number(value);
        return <span className="text-sm">{num.toLocaleString()}</span>;

      case 'date':
        const date = new Date(String(value));
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        );

      default:
        return <span className="text-sm text-muted-foreground truncate">{String(value)}</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-white/70 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] overflow-hidden">
      <div className="divide-y divide-border">
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No items to display</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          data.map((item) => {
            const itemId = String(item[idField]);
            const title = getPropertyValue(item, titleProperty) as string | null | undefined;
            const subtitle = subtitleProperty
              ? (getPropertyValue(item, subtitleProperty) as string | null | undefined)
              : null;
            const isSelected = selectedId === itemId;

            return (
              <div
                key={itemId}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  "px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                  isSelected && "bg-slate-50"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {String(title)}
                      </h3>
                    </div>
                    {!!subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {String(subtitle)}
                      </div>
                    )}
                  </div>

                  {/* Properties */}
                  <div className="flex items-center gap-3">
                    {properties
                      .filter(p => 
                        p.id !== titleProperty && 
                        p.id !== subtitleProperty && 
                        p.id !== idField &&
                        p.isVisible
                      )
                      .slice(0, 3)
                      .map(property => {
                        const value = getPropertyValue(item, property.id);
                        if (!value) return null;

                        return (
                          <div key={property.id} className="flex items-center gap-1">
                            {renderPropertyValue(item, property)}
                          </div>
                        );
                      })}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
