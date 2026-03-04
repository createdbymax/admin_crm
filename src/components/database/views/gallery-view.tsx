"use client";

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/properties/types';

interface GalleryViewProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  imageProperty?: string;
  titleProperty?: string;
  onCardClick?: (item: T) => void;
  idField?: string;
}

export function GalleryView<T extends Record<string, unknown>>({
  data,
  properties,
  imageProperty = 'image',
  titleProperty = 'name',
  onCardClick,
  idField = 'id',
}: GalleryViewProps<T>) {
  const getPropertyValue = (item: T, propertyId: string) => {
    return item[propertyId];
  };

  const renderPropertyValue = (item: T, property: Property) => {
    const value = getPropertyValue(item, property.id);

    if (!value) return null;

    switch (property.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="text-sm text-muted-foreground truncate">
            {String(value)}
          </div>
        );

      case 'number':
        const num = Number(value);
        const format = property.options?.format ?? 'number';
        if (format === 'currency') {
          return <div className="text-sm">${num.toLocaleString()}</div>;
        } else if (format === 'percentage') {
          return <div className="text-sm">{num}%</div>;
        }
        return <div className="text-sm">{num.toLocaleString()}</div>;

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
            {value.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {String(tag)}
              </Badge>
            ))}
            {value.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{value.length - 3}
              </Badge>
            )}
          </div>
        );

      case 'date':
        const date = new Date(String(value));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.length === 0 ? (
        <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No items to display</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        data.map((item) => {
          const itemId = String(item[idField]);
          const imageUrl = getPropertyValue(item, imageProperty) as string | null | undefined;
          const title = getPropertyValue(item, titleProperty) as string | null | undefined;

          return (
            <div
              key={itemId}
              onClick={() => onCardClick?.(item)}
              className={cn(
                "group rounded-xl border border-white/70 bg-white shadow-sm overflow-hidden",
                "hover:shadow-md hover:border-white transition-all cursor-pointer"
              )}
            >
              {/* Image */}
              {!!imageUrl && (
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={String(imageUrl)}
                    alt={String(title)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-base truncate">
                  {String(title)}
                </h3>

                {/* Properties */}
                <div className="space-y-2">
                  {properties
                    .filter(p => p.id !== imageProperty && p.id !== titleProperty && p.id !== idField)
                    .slice(0, 4)
                    .map(property => {
                      const value = getPropertyValue(item, property.id);
                      if (!value) return null;

                      return (
                        <div key={property.id} className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">
                            {property.name}
                          </div>
                          {renderPropertyValue(item, property)}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
