"use client";

import { VirtualizedDataTable } from './database/virtualized-data-table';
import type { Property } from '@/lib/properties/types';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface NotionTableViewProps<T extends Record<string, unknown>> {
  data: T[];
  properties: Property[];
  propertyWidths: Record<string, number>;
  onPropertyResize: (propertyId: string, width: number) => void;
  onCellUpdate: (rowId: string, propertyId: string, value: unknown) => Promise<void>;
  onRowClick?: (row: T) => void;
  onSort?: (propertyId: string, direction: 'asc' | 'desc') => void;
  users?: User[];
  availableTags?: string[];
  idField?: string;
}

export function NotionTableView<T extends Record<string, unknown>>({
  data,
  properties,
  propertyWidths,
  onPropertyResize,
  onCellUpdate,
  onRowClick,
  onSort,
  users = [],
  availableTags = [],
  idField = 'id',
}: NotionTableViewProps<T>) {
  return (
    <div className="mt-4">
      <VirtualizedDataTable
        data={data}
        properties={properties}
        propertyWidths={propertyWidths}
        onPropertyResize={onPropertyResize}
        onCellUpdate={onCellUpdate}
        onRowClick={onRowClick}
        onSort={onSort}
        users={users}
        availableTags={availableTags}
        idField={idField}
      />
    </div>
  );
}
