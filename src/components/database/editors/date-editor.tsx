"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DateEditorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  includeTime?: boolean;
  autoFocus?: boolean;
}

export function DateEditor({
  value,
  onChange,
  onSave,
  onCancel,
  includeTime = false,
  autoFocus = true,
}: DateEditorProps) {
  const [localValue, setLocalValue] = useState(() => {
    if (!value) return '';
    const date = new Date(value);
    if (includeTime) {
      return date.toISOString().slice(0, 16);
    }
    return date.toISOString().slice(0, 10);
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    if (localValue) {
      const date = new Date(localValue);
      onChange(date.toISOString());
    } else {
      onChange(null);
    }
    onSave();
  };

  const handleClear = () => {
    setLocalValue('');
    onChange(null);
    onSave();
  };

  const handleToday = () => {
    const today = new Date();
    if (includeTime) {
      setLocalValue(today.toISOString().slice(0, 16));
    } else {
      setLocalValue(today.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type={includeTime ? 'datetime-local' : 'date'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className={cn(
          "flex-1 px-2 py-1 text-sm border-2 border-primary rounded",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "bg-white shadow-sm"
        )}
      />
      <button
        onClick={handleToday}
        className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
        type="button"
      >
        Today
      </button>
      {localValue && (
        <button
          onClick={handleClear}
          className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
          type="button"
        >
          Clear
        </button>
      )}
    </div>
  );
}
