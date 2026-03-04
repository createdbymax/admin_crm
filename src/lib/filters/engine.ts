// Filter engine for client-side filtering

import type { FilterOperator, Filter } from '@/lib/views/types';
import type { Property } from '@/lib/properties/types';

export function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: Filter[],
  properties: Property[],
  filterLogic: 'and' | 'or' = 'and'
): T[] {
  if (filters.length === 0) return data;

  return data.filter(row => {
    const results = filters.map(filter => evaluateFilter(row, filter, properties));
    
    if (filterLogic === 'and') {
      return results.every(Boolean);
    } else {
      return results.some(Boolean);
    }
  });
}

function evaluateFilter<T extends Record<string, unknown>>(
  row: T,
  filter: Filter,
  properties: Property[]
): boolean {
  const property = properties.find(p => p.id === filter.property);
  if (!property) return true;

  const value = row[filter.property];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return value === filterValue;

    case 'notEquals':
      return value !== filterValue;

    case 'contains':
      if (typeof value !== 'string') return false;
      if (typeof filterValue !== 'string') return false;
      return value.toLowerCase().includes(filterValue.toLowerCase());

    case 'notContains':
      if (typeof value !== 'string') return true;
      if (typeof filterValue !== 'string') return true;
      return !value.toLowerCase().includes(filterValue.toLowerCase());

    case 'startsWith':
      if (typeof value !== 'string') return false;
      if (typeof filterValue !== 'string') return false;
      return value.toLowerCase().startsWith(filterValue.toLowerCase());

    case 'endsWith':
      if (typeof value !== 'string') return false;
      if (typeof filterValue !== 'string') return false;
      return value.toLowerCase().endsWith(filterValue.toLowerCase());

    case 'isEmpty':
      return value === null || value === undefined || value === '';

    case 'isNotEmpty':
      return value !== null && value !== undefined && value !== '';

    case 'greaterThan':
      if (typeof value !== 'number') return false;
      if (typeof filterValue !== 'number') return false;
      return value > filterValue;

    case 'lessThan':
      if (typeof value !== 'number') return false;
      if (typeof filterValue !== 'number') return false;
      return value < filterValue;

    case 'greaterThanOrEqual':
      if (typeof value !== 'number') return false;
      if (typeof filterValue !== 'number') return false;
      return value >= filterValue;

    case 'lessThanOrEqual':
      if (typeof value !== 'number') return false;
      if (typeof filterValue !== 'number') return false;
      return value <= filterValue;

    case 'isAnyOf':
      if (!Array.isArray(filterValue)) return false;
      if (Array.isArray(value)) {
        return value.some(v => filterValue.includes(v));
      }
      return filterValue.includes(value);

    case 'isNoneOf':
      if (!Array.isArray(filterValue)) return true;
      if (Array.isArray(value)) {
        return !value.some(v => filterValue.includes(v));
      }
      return !filterValue.includes(value);

    case 'before':
      if (!value || !filterValue) return false;
      return new Date(String(value)) < new Date(String(filterValue));

    case 'after':
      if (!value || !filterValue) return false;
      return new Date(String(value)) > new Date(String(filterValue));

    case 'onOrBefore':
      if (!value || !filterValue) return false;
      return new Date(String(value)) <= new Date(String(filterValue));

    case 'onOrAfter':
      if (!value || !filterValue) return false;
      return new Date(String(value)) >= new Date(String(filterValue));

    case 'isPast':
      if (!value) return false;
      return new Date(String(value)) < new Date();

    case 'isFuture':
      if (!value) return false;
      return new Date(String(value)) > new Date();

    case 'isWithin':
      // TODO: Implement date range logic
      return true;

    default:
      return true;
  }
}

export function getOperatorsForProperty(property: Property): FilterOperator[] {
  switch (property.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return [
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        'isEmpty',
        'isNotEmpty',
      ];

    case 'number':
    case 'rating':
    case 'progress':
      return [
        'equals',
        'notEquals',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
        'isEmpty',
        'isNotEmpty',
      ];

    case 'select':
    case 'status':
      return [
        'equals',
        'notEquals',
        'isAnyOf',
        'isNoneOf',
        'isEmpty',
        'isNotEmpty',
      ];

    case 'multiSelect':
    case 'tags':
      return [
        'contains',
        'notContains',
        'isAnyOf',
        'isNoneOf',
        'isEmpty',
        'isNotEmpty',
      ];

    case 'date':
      return [
        'equals',
        'before',
        'after',
        'onOrBefore',
        'onOrAfter',
        'isPast',
        'isFuture',
        'isEmpty',
        'isNotEmpty',
      ];

    case 'checkbox':
      return ['equals'];

    case 'person':
      return [
        'equals',
        'notEquals',
        'isAnyOf',
        'isNoneOf',
        'isEmpty',
        'isNotEmpty',
      ];

    default:
      return ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'];
  }
}
