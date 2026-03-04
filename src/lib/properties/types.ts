// Property type definitions for the database system

export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'person'
  | 'url'
  | 'email'
  | 'phone'
  | 'checkbox'
  | 'rating'
  | 'progress'
  | 'status'
  | 'tags'
  | 'relation'
  | 'rollup'
  | 'formula';

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

export interface PropertyOptions {
  // Select/MultiSelect options
  options?: SelectOption[];
  
  // Number formatting
  format?: 'number' | 'currency' | 'percentage';
  precision?: number;
  
  // Date formatting
  dateFormat?: 'relative' | 'absolute' | 'friendly';
  includeTime?: boolean;
  
  // Rating
  maxRating?: number;
  icon?: 'star' | 'heart' | 'thumbs';
  
  // Relation
  relationTo?: string;
  relationField?: string;
  
  // Rollup
  rollupProperty?: string;
  rollupFunction?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  
  // Formula
  formula?: string;

  // Read-only fields (e.g. synced from external services)
  readOnly?: boolean;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOptions;
  width?: number;
  isVisible?: boolean;
  isRequired?: boolean;
  description?: string;
}

export interface PropertyValue {
  propertyId: string;
  value: unknown;
}

// Property metadata for rendering
export interface PropertyMetadata {
  type: PropertyType;
  icon: string;
  label: string;
  description: string;
  defaultWidth: number;
  supportsFiltering: boolean;
  supportsSorting: boolean;
  supportsGrouping: boolean;
}
