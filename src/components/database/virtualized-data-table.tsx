"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { ColumnHeader } from './column-header';
import { EnhancedCell } from './enhanced-cell';
import type { Property } from '@/lib/properties/types';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface VirtualizedDataTableProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  propertyWidths: Record<string, number>;
  onPropertyResize: (propertyId: string, width: number) => void;
  onSort?: (propertyId: string, direction: 'asc' | 'desc') => void;
  sortState?: Record<string, 'asc' | 'desc'>;
  onCellUpdate: (rowId: string, propertyId: string, value: unknown) => Promise<void>;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  idField?: string;
  users?: User[];
  availableTags?: string[];
}

interface EditingCell {
  rowId: string;
  propertyId: string;
  value: unknown;
}

export function VirtualizedDataTable<T extends Record<string, unknown>>({
  data,
  properties,
  propertyWidths,
  onPropertyResize,
  onSort,
  sortState,
  onCellUpdate,
  onRowClick,
  selectedRowId,
  idField = 'id',
  users = [],
  availableTags = [],
}: VirtualizedDataTableProps<T>) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualize rows
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const handleCellEdit = useCallback((rowId: string, propertyId: string, value: unknown) => {
    setEditingCell({ rowId, propertyId, value });
  }, []);

  const handleCellSave = useCallback(async (finalValue?: unknown) => {
    if (!editingCell) return;

    // Use the passed value if provided, otherwise use the state value
    const valueToSave = finalValue !== undefined ? finalValue : editingCell.value;

    try {
      await onCellUpdate(editingCell.rowId, editingCell.propertyId, valueToSave);
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to save cell:', error);
    }
  }, [editingCell, onCellUpdate]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCellChange = useCallback((value: unknown) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, value });
  }, [editingCell]);

  const toggleRowSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    e.stopPropagation();
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((row) => String(row[idField]))));
    }
  }, [data, selectedRows.size, idField]);

  const allTags = availableTags;
  const tableViewportHeight = 'clamp(480px, calc(100vh - 320px), 1100px)';
  const tableWidth = useMemo(() => {
    const dataColumnsWidth = properties.reduce((total, property) => {
      return total + (propertyWidths[property.id] ?? property.width ?? 200);
    }, 0);
    // Include the leading checkbox column width.
    return dataColumnsWidth + 48;
  }, [properties, propertyWidths]);

  return (
    <div className="w-full bg-[#f7f6f3]">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          {/* Header - Sticky */}
          <div
            className="sticky top-0 z-20 flex border-b border-[#e9e9e7] bg-[#f7f6f3]"
            style={{ minWidth: `${tableWidth}px` }}
          >
            <div className="flex items-center justify-center w-12 flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1"
              />
            </div>

            {properties.map((property) => (
              <ColumnHeader
                key={property.id}
                property={property}
                width={propertyWidths[property.id] ?? property.width ?? 200}
                onResize={(width) => onPropertyResize(property.id, width)}
                onSort={onSort ? (direction) => onSort(property.id, direction) : undefined}
                sortDirection={sortState?.[property.id] ?? null}
              />
            ))}
          </div>

          {/* Virtualized Body */}
          <div
            ref={parentRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ height: tableViewportHeight }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: `${tableWidth}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = data[virtualRow.index];
                const rowId = String(row[idField]);
                const isSelected = selectedRows.has(rowId);
                const isRowSelected = selectedRowId === rowId;

                return (
                  <div
                    key={rowId}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${tableWidth}px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      "group flex border-b border-[#e9e9e7]",
                      isRowSelected && "bg-blue-50/30",
                      isSelected && "bg-blue-50/50",
                      editingCell?.rowId === rowId && "z-10" // Bring editing row to front
                    )}
                  >
                    {/* Checkbox cell */}
                    <div className="flex items-center justify-center w-12 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRowSelection(e, rowId);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>

                    {/* Data cells */}
                    {properties.map((property) => {
                      const cellValue = row[property.id];
                      const isCellEditing =
                        editingCell?.rowId === rowId &&
                        editingCell?.propertyId === property.id;

                      return (
                        <div
                          key={property.id}
                          style={{ width: propertyWidths[property.id] ?? property.width ?? 200 }}
                          className="flex-shrink-0"
                        >
                          <EnhancedCell
                            property={property}
                            value={isCellEditing ? editingCell.value : cellValue}
                            isEditing={isCellEditing}
                            onEdit={() => handleCellEdit(rowId, property.id, cellValue)}
                            onChange={handleCellChange}
                            onSave={handleCellSave}
                            onCancel={handleCellCancel}
                            users={users}
                            availableTags={allTags}
                            row={row as Record<string, unknown>}
                            onRowClick={onRowClick as ((row: Record<string, unknown>) => void) | undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty state */}
          {data.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500 font-medium">No results</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className="border-t border-[#e9e9e7] px-4 py-2 bg-[#f7f6f3]">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {selectedRows.size > 0 ? (
                <>
                  <span className="font-medium">
                    {selectedRows.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedRows(new Set())}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span>
                  {data.length} {data.length === 1 ? 'row' : 'rows'}
                </span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <span>Double-click to edit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
