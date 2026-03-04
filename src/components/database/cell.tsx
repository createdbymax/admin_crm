"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Property } from '@/lib/properties/types';
import { Badge } from '@/components/ui/badge';

interface CellProps {
  property: Property;
  value: unknown;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function Cell({
  property,
  value,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: CellProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const renderValue = () => {
    switch (property.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <span className="truncate text-sm">
            {value ? String(value) : <span className="text-muted-foreground">Empty</span>}
          </span>
        );

      case 'number':
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground text-sm">Empty</span>;
        }
        const num = Number(value);
        const format = property.options?.format ?? 'number';
        if (format === 'currency') {
          return <span className="text-sm">${num.toLocaleString()}</span>;
        } else if (format === 'percentage') {
          return <span className="text-sm">{num}%</span>;
        }
        return <span className="text-sm">{num.toLocaleString()}</span>;

      case 'url':
        return value ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {String(value)}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">Empty</span>
        );

      case 'date':
        if (!value) {
          return <span className="text-muted-foreground text-sm">Empty</span>;
        }
        const date = new Date(String(value));
        return (
          <span className="text-sm">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => {
              onChange(e.target.checked);
              onSave();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
        );

      case 'select':
      case 'status':
        if (!value) {
          return <span className="text-muted-foreground text-sm">Empty</span>;
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {String(value)}
          </Badge>
        );

      case 'multiSelect':
      case 'tags':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span className="text-muted-foreground text-sm">Empty</span>;
        }
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

      case 'person':
        return value ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
              {String(value).charAt(0).toUpperCase()}
            </div>
            <span className="text-sm truncate">{String(value)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        );

      case 'rating':
        const rating = Number(value) || 0;
        const maxRating = property.options?.maxRating ?? 5;
        return (
          <div className="flex gap-0.5">
            {Array.from({ length: maxRating }).map((_, i) => (
              <span key={i} className={cn("text-sm", i < rating ? "text-yellow-500" : "text-gray-300")}>
                ★
              </span>
            ))}
          </div>
        );

      case 'progress':
        const progress = Math.min(100, Math.max(0, Number(value) || 0));
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        );

      default:
        return (
          <span className="text-sm text-muted-foreground">
            {value ? String(value) : 'Empty'}
          </span>
        );
    }
  };

  const renderEditor = () => {
    switch (property.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onSave}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            onKeyDown={handleKeyDown}
            onBlur={onSave}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value ? new Date(String(value)).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            onKeyDown={handleKeyDown}
            onBlur={onSave}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        );

      case 'select':
      case 'status':
        return (
          <select
            value={String(value ?? '')}
            onChange={(e) => {
              onChange(e.target.value);
              onSave();
            }}
            onBlur={onSave}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select...</option>
            {property.options?.options?.map((opt) => (
              <option key={opt.id} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return renderValue();
    }
  };

  return (
    <div
      className={cn(
        "px-3 py-2 border-r border-b border-border hover:bg-muted/30 transition-colors cursor-pointer",
        isEditing && "bg-muted/50"
      )}
      onClick={() => !isEditing && onEdit()}
    >
      {isEditing ? renderEditor() : renderValue()}
    </div>
  );
}
