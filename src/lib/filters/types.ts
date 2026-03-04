// Filter system types

import type { FilterOperator, FilterCondition } from '@/lib/views/types';

export interface FilterRule {
  id: string;
  property: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterGroup {
  id: string;
  condition: FilterCondition;
  rules: FilterRule[];
  groups: FilterGroup[];
}

export interface FilterConfig {
  rootCondition: FilterCondition;
  groups: FilterGroup[];
}

// Operator metadata
export interface OperatorMetadata {
  operator: FilterOperator;
  label: string;
  description: string;
  valueType: 'text' | 'number' | 'date' | 'select' | 'multiSelect' | 'none';
  supportsMultiple: boolean;
}

export const OPERATOR_METADATA: Record<FilterOperator, OperatorMetadata> = {
  equals: {
    operator: 'equals',
    label: 'Equals',
    description: 'Exactly matches the value',
    valueType: 'text',
    supportsMultiple: false,
  },
  notEquals: {
    operator: 'notEquals',
    label: 'Does not equal',
    description: 'Does not match the value',
    valueType: 'text',
    supportsMultiple: false,
  },
  contains: {
    operator: 'contains',
    label: 'Contains',
    description: 'Contains the text',
    valueType: 'text',
    supportsMultiple: false,
  },
  notContains: {
    operator: 'notContains',
    label: 'Does not contain',
    description: 'Does not contain the text',
    valueType: 'text',
    supportsMultiple: false,
  },
  startsWith: {
    operator: 'startsWith',
    label: 'Starts with',
    description: 'Starts with the text',
    valueType: 'text',
    supportsMultiple: false,
  },
  endsWith: {
    operator: 'endsWith',
    label: 'Ends with',
    description: 'Ends with the text',
    valueType: 'text',
    supportsMultiple: false,
  },
  isEmpty: {
    operator: 'isEmpty',
    label: 'Is empty',
    description: 'Has no value',
    valueType: 'none',
    supportsMultiple: false,
  },
  isNotEmpty: {
    operator: 'isNotEmpty',
    label: 'Is not empty',
    description: 'Has a value',
    valueType: 'none',
    supportsMultiple: false,
  },
  greaterThan: {
    operator: 'greaterThan',
    label: 'Greater than',
    description: 'Is greater than the value',
    valueType: 'number',
    supportsMultiple: false,
  },
  lessThan: {
    operator: 'lessThan',
    label: 'Less than',
    description: 'Is less than the value',
    valueType: 'number',
    supportsMultiple: false,
  },
  greaterThanOrEqual: {
    operator: 'greaterThanOrEqual',
    label: 'Greater than or equal',
    description: 'Is greater than or equal to the value',
    valueType: 'number',
    supportsMultiple: false,
  },
  lessThanOrEqual: {
    operator: 'lessThanOrEqual',
    label: 'Less than or equal',
    description: 'Is less than or equal to the value',
    valueType: 'number',
    supportsMultiple: false,
  },
  isAnyOf: {
    operator: 'isAnyOf',
    label: 'Is any of',
    description: 'Matches any of the values',
    valueType: 'multiSelect',
    supportsMultiple: true,
  },
  isNoneOf: {
    operator: 'isNoneOf',
    label: 'Is none of',
    description: 'Does not match any of the values',
    valueType: 'multiSelect',
    supportsMultiple: true,
  },
  before: {
    operator: 'before',
    label: 'Before',
    description: 'Is before the date',
    valueType: 'date',
    supportsMultiple: false,
  },
  after: {
    operator: 'after',
    label: 'After',
    description: 'Is after the date',
    valueType: 'date',
    supportsMultiple: false,
  },
  onOrBefore: {
    operator: 'onOrBefore',
    label: 'On or before',
    description: 'Is on or before the date',
    valueType: 'date',
    supportsMultiple: false,
  },
  onOrAfter: {
    operator: 'onOrAfter',
    label: 'On or after',
    description: 'Is on or after the date',
    valueType: 'date',
    supportsMultiple: false,
  },
  isWithin: {
    operator: 'isWithin',
    label: 'Is within',
    description: 'Is within the date range',
    valueType: 'date',
    supportsMultiple: false,
  },
  isPast: {
    operator: 'isPast',
    label: 'Is in the past',
    description: 'Is before today',
    valueType: 'none',
    supportsMultiple: false,
  },
  isFuture: {
    operator: 'isFuture',
    label: 'Is in the future',
    description: 'Is after today',
    valueType: 'none',
    supportsMultiple: false,
  },
};
