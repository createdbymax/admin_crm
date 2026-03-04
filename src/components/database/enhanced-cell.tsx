"use client";

import { cn } from '@/lib/utils';
import type { Property } from '@/lib/properties/types';
import { TextEditor } from './editors/text-editor';
import { SelectEditor } from './editors/select-editor';
import { DateEditor } from './editors/date-editor';
import { UserEditor } from './editors/user-editor';
import { TagEditor } from './editors/tag-editor';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface EnhancedCellProps {
  property: Property;
  value: unknown;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (value: unknown) => void;
  onSave: (finalValue?: unknown) => void;
  onCancel: () => void;
  users?: User[];
  availableTags?: string[];
  row?: Record<string, unknown>;
  onRowClick?: (row: Record<string, unknown>) => void;
}

export function EnhancedCell({
  property,
  value,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  users = [],
  availableTags = [],
  row,
  onRowClick,
}: EnhancedCellProps) {
  const renderValue = () => {
    switch (property.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <span className="truncate text-[14px] text-gray-800">
            {value ? String(value) : <span className="text-gray-400">Empty</span>}
          </span>
        );

      case 'number':
        if (value === null || value === undefined) {
          return <span className="text-gray-400 text-[14px]">Empty</span>;
        }
        const num = Number(value);
        const format = property.options?.format ?? 'number';
        if (format === 'currency') {
          return <span className="text-[14px] text-gray-800">${num.toLocaleString()}</span>;
        } else if (format === 'percentage') {
          return <span className="text-[14px] text-gray-800">{num}%</span>;
        }
        return <span className="text-[14px] text-gray-800">{num.toLocaleString()}</span>;

      case 'url':
        return value ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-[14px] truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {String(value)}
          </a>
        ) : (
          <span className="text-gray-400 text-[14px]">Empty</span>
        );

      case 'date':
        if (!value) {
          return <span className="text-gray-400 text-[14px]">Empty</span>;
        }
        const date = new Date(String(value));
        const dateFormat = property.options?.dateFormat ?? 'friendly';
        
        if (dateFormat === 'relative') {
          const now = new Date();
          const diffMs = date.getTime() - now.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) return <span className="text-[14px] text-gray-800">Today</span>;
          if (diffDays === 1) return <span className="text-[14px] text-gray-800">Tomorrow</span>;
          if (diffDays === -1) return <span className="text-[14px] text-gray-800">Yesterday</span>;
          if (diffDays > 0) return <span className="text-[14px] text-gray-800">In {diffDays} days</span>;
          return <span className="text-[14px] text-gray-800">{Math.abs(diffDays)} days ago</span>;
        }
        
        return (
          <span className="text-[14px] text-gray-800">
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
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 focus:ring-1"
          />
        );

      case 'select':
      case 'status':
        if (!value) {
          return <span className="text-gray-400 text-[14px]">Empty</span>;
        }
        const option = property.options?.options?.find(opt => opt.label === value);
        return (
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium"
            style={option?.color ? { 
              backgroundColor: option.color + '15', 
              color: option.color 
            } : {
              backgroundColor: '#e5e7eb',
              color: '#374151'
            }}
          >
            {String(value)}
          </span>
        );

      case 'multiSelect':
      case 'tags':
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span className="text-gray-400 text-[14px]">Empty</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium bg-gray-100 text-gray-700"
              >
                {String(tag)}
              </span>
            ))}
            {value.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium bg-gray-100 text-gray-500">
                +{value.length - 3}
              </span>
            )}
          </div>
        );

      case 'person':
        if (!value) {
          return <span className="text-gray-400 text-[14px]">Unassigned</span>;
        }
        const user = users.find(u => u.id === value);
        const displayName = user?.name || user?.email || String(value);
        return (
          <div className="flex items-center gap-2">
            {user?.image ? (
              <img src={user.image} alt={displayName} className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-semibold text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[14px] text-gray-800 truncate">{displayName}</span>
          </div>
        );

      case 'rating':
        const rating = Number(value) || 0;
        const maxRating = property.options?.maxRating ?? 5;
        return (
          <div className="flex gap-0.5">
            {Array.from({ length: maxRating }).map((_, i) => (
              <span key={i} className={cn("text-base", i < rating ? "text-yellow-500" : "text-gray-300")}>
                ★
              </span>
            ))}
          </div>
        );

      case 'progress':
        const progress = Math.min(100, Math.max(0, Number(value) || 0));
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[13px] text-gray-500 font-medium">{progress}%</span>
          </div>
        );

      default:
        return (
          <span className="text-[14px] text-gray-400">
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
          <TextEditor
            value={String(value ?? '')}
            onChange={onChange}
            onSave={onSave}
            onCancel={onCancel}
            multiline={false}
          />
        );

      case 'number':
        return (
          <TextEditor
            value={String(value ?? '')}
            onChange={(val) => onChange(val ? Number(val) : null)}
            onSave={onSave}
            onCancel={onCancel}
          />
        );

      case 'date':
        return (
          <DateEditor
            value={value ? String(value) : null}
            onChange={onChange}
            onSave={onSave}
            onCancel={onCancel}
            includeTime={property.options?.includeTime ?? false}
          />
        );

      case 'select':
      case 'status':
        return (
          <SelectEditor
            value={String(value ?? '')}
            options={property.options?.options ?? []}
            onChange={onChange}
            onSave={onSave}
            onCancel={onCancel}
          />
        );

      case 'person':
        return (
          <UserEditor
            value={value ? String(value) : null}
            users={users}
            onChange={onChange}
            onSave={onSave}
            onCancel={onCancel}
          />
        );

      case 'tags':
      case 'multiSelect':
        return (
          <TagEditor
            value={Array.isArray(value) ? value.map(String) : []}
            availableTags={availableTags}
            onChange={onChange}
            onSave={onSave}
            onCancel={onCancel}
          />
        );

      default:
        return renderValue();
    }
  };

  // Special handling for the name/title column - make it a link
  const isNameColumn = property.id === 'name';
  const isReadOnly = property.options?.readOnly === true;
  
  if (isNameColumn && !isEditing && onRowClick && row) {
    return (
      <div
        className="px-2 py-1.5 min-h-[36px] flex items-center hover:bg-white/50 transition-colors duration-75 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onRowClick(row);
        }}
        title="Click to open"
      >
        <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
          {renderValue()}
        </span>
      </div>
    );
  }

  // Read-only cells can't be edited
  if (isReadOnly) {
    return (
      <div
        className="px-2 py-1.5 min-h-[36px] flex items-center"
        title="Read-only field"
      >
        <span className="text-gray-600">
          {renderValue()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-2 py-1.5 min-h-[36px] flex items-center group/cell relative",
        isEditing && "bg-white shadow-sm ring-1 ring-blue-500/20 z-20"
      )}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          onEdit();
        }
      }}
      title={!isEditing ? "Double-click to edit" : undefined}
    >
      {/* Edit icon on hover - removed to improve performance */}
      
      {isEditing ? renderEditor() : renderValue()}
    </div>
  );
}
