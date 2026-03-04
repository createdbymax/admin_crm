"use client";

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ColumnHeader } from './column-header';
import { Cell } from './cell';
import type { Property } from '@/lib/properties/types';

interface DataTableProps<T extends Record<string, unknown>> {
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
}

interface EditingCell {
  rowId: string;
  propertyId: string;
  value: unknown;
}

export function DataTable<T extends Record<string, unknown>>({
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
}: DataTableProps<T>) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleCellEdit = useCallback((rowId: string, propertyId: string, value: unknown) => {
    setEditingCell({ rowId, propertyId, value });
  }, []);

  const handleCellSave = useCallback(async () => {
    if (!editingCell) return;

    try {
      await onCellUpdate(editingCell.rowId, editingCell.propertyId, editingCell.value);
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to save cell:', error);
      // TODO: Show error toast
    }
  }, [editingCell, onCellUpdate]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCellChange = useCallback((value: unknown) => {
    if (!editingCell) return;
    setEditingCell({ ...editingCell, value });
  }, [editingCell]);

  const toggleRowSelection = useCallback((rowId: string) => {
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

  return (
    <div className="rounded-2xl border border-white/70 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)] overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          {/* Header */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-border">
            {/* Checkbox column */}
            <div className="flex items-center justify-center w-12 px-3 py-2 border-r border-b border-border bg-muted/30">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
            </div>

            {/* Property columns */}
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

          {/* Body */}
          <div className="divide-y divide-border">
            {data.map((row) => {
              const rowId = String(row[idField]);
              const isSelected = selectedRows.has(rowId);
              const isRowSelected = selectedRowId === rowId;

              return (
                <div
                  key={rowId}
                  className={cn(
                    "flex hover:bg-muted/30 transition-colors",
                    isRowSelected && "bg-slate-50",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Checkbox cell */}
                  <div className="flex items-center justify-center w-12 px-3 py-2 border-r border-border">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(rowId)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4"
                    />
                  </div>

                  {/* Data cells */}
                  {properties.map((property) => {
                    const cellValue = row[property.id];
                    const isEditing =
                      editingCell?.rowId === rowId &&
                      editingCell?.propertyId === property.id;

                    return (
                      <div
                        key={property.id}
                        style={{ width: propertyWidths[property.id] ?? property.width ?? 200 }}
                      >
                        <Cell
                          property={property}
                          value={isEditing ? editingCell.value : cellValue}
                          isEditing={isEditing}
                          onEdit={() => handleCellEdit(rowId, property.id, cellValue)}
                          onChange={handleCellChange}
                          onSave={handleCellSave}
                          onCancel={handleCellCancel}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {data.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No data to display</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with selection info */}
      {selectedRows.size > 0 && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-primary hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
