"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/lib/properties/types';

interface SelectEditorProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
  allowEmpty?: boolean;
}

export function SelectEditor({
  value,
  options,
  onChange,
  onSave,
  onCancel,
  autoFocus = true,
  allowEmpty = true,
}: SelectEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setIsOpen(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[selectedIndex]) {
        onChange(filteredOptions[selectedIndex].label);
        onSave();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const handleSelect = (option: SelectOption) => {
    onChange(option.label);
    onSave();
  };

  const handleClear = () => {
    onChange('');
    onSave();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder="Search or select..."
        className={cn(
          "w-full px-2 py-1 text-sm border-2 border-primary rounded",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "bg-white shadow-sm"
        )}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50">
          {allowEmpty && (
            <button
              onClick={handleClear}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-muted-foreground"
            >
              Clear selection
            </button>
          )}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2",
                  index === selectedIndex && "bg-muted",
                  option.label === value && "font-semibold"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <span>{option.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
