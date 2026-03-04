"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Filter, FilterOperator } from '@/lib/views/types';
import type { Property } from '@/lib/properties/types';
import { getOperatorsForProperty } from '@/lib/filters/engine';
import { OPERATOR_METADATA } from '@/lib/filters/types';

interface FilterConditionProps {
  filter: Filter;
  properties: Property[];
  onChange: (updates: Partial<Filter>) => void;
  onRemove: () => void;
}

export function FilterCondition({
  filter,
  properties,
  onChange,
  onRemove,
}: FilterConditionProps) {
  const selectedProperty = properties.find(p => p.id === filter.property);
  const availableOperators = useMemo(() => {
    if (!selectedProperty) return [];
    return getOperatorsForProperty(selectedProperty);
  }, [selectedProperty]);

  const operatorMetadata = OPERATOR_METADATA[filter.operator];
  const needsValue = operatorMetadata.valueType !== 'none';

  const renderValueInput = () => {
    if (!needsValue) return null;

    switch (operatorMetadata.valueType) {
      case 'text':
        return (
          <input
            type="text"
            value={String(filter.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Enter value..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(filter.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value ? Number(e.target.value) : null })}
            placeholder="Enter number..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={filter.value ? new Date(String(filter.value)).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ value: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
          />
        );

      case 'select':
        if (!selectedProperty?.options?.options) return null;
        return (
          <select
            value={String(filter.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value })}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
          >
            <option value="">Select value...</option>
            {selectedProperty.options.options.map(opt => (
              <option key={opt.id} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiSelect':
        if (!selectedProperty?.options?.options) return null;
        const selectedValues = Array.isArray(filter.value) ? filter.value : [];
        return (
          <div className="flex-1 flex flex-wrap gap-1 p-2 border border-gray-200 rounded bg-white">
            {selectedProperty.options.options.map(opt => (
              <label
                key={opt.id}
                className={cn(
                  "px-2 py-1 text-xs rounded cursor-pointer transition-colors",
                  selectedValues.includes(opt.label)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.label)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, opt.label]
                      : selectedValues.filter(v => v !== opt.label);
                    onChange({ value: newValues });
                  }}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
      {/* Property selector */}
      <select
        value={filter.property}
        onChange={(e) => {
          const newProperty = properties.find(p => p.id === e.target.value);
          if (newProperty) {
            const newOperators = getOperatorsForProperty(newProperty);
            onChange({
              property: e.target.value,
              operator: newOperators[0] ?? 'equals',
              value: '',
            });
          }
        }}
        className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
      >
        {properties.map(prop => (
          <option key={prop.id} value={prop.id}>
            {prop.name}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={filter.operator}
        onChange={(e) => onChange({ operator: e.target.value as FilterOperator, value: '' })}
        className="px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-700"
      >
        {availableOperators.map(op => (
          <option key={op} value={op}>
            {OPERATOR_METADATA[op].label}
          </option>
        ))}
      </select>

      {/* Value input */}
      {renderValueInput()}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        title="Remove filter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
