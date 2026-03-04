"use client";

import { cn } from '@/lib/utils';
import type { Property } from '@/lib/properties/types';

interface NotionGalleryViewProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  imageProperty?: string;
  titleProperty?: string;
  onCardClick?: (item: T) => void;
  idField?: string;
}

export function NotionGalleryView<T extends Record<string, unknown>>({
  data,
  properties,
  imageProperty = 'image',
  titleProperty = 'name',
  onCardClick,
  idField = 'id',
}: NotionGalleryViewProps<T>) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">No items to display</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        data.map((item) => {
          const itemId = String(item[idField]);
          const imageUrl = item[imageProperty] as string | null | undefined;
          const title = item[titleProperty] as string | null | undefined;

          return (
            <div
              key={itemId}
              onClick={() => onCardClick?.(item)}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
            >
              {/* Image */}
              {!!imageUrl && (
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={String(imageUrl)}
                    alt={String(title)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-3 space-y-2">
                {/* Title */}
                <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                  {String(title)}
                </h3>

                {/* Properties */}
                {properties
                  .filter(p => p.id !== imageProperty && p.id !== titleProperty && p.id !== idField)
                  .slice(0, 3)
                  .map(property => {
                    const value = item[property.id];
                    if (!value) return null;

                    return (
                      <div key={property.id} className="text-xs text-gray-500">
                        <span className="font-medium">{property.name}:</span>{' '}
                        <span className="line-clamp-1">{String(value)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
