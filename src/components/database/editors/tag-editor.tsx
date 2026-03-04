"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TagEditorProps {
  value: string[];
  availableTags?: string[];
  onChange: (tags: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
  allowCreate?: boolean;
}

export function TagEditor({
  value,
  availableTags = [],
  onChange,
  onSave,
  onCancel,
  autoFocus = true,
  allowCreate = true,
}: TagEditorProps) {
  const [localTags, setLocalTags] = useState<string[]>(value);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = availableTags.filter(
    tag =>
      !localTags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
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
        onChange(localTags);
        onSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [localTags, onChange, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags[selectedIndex]) {
        addTag(filteredTags[selectedIndex]);
      } else if (inputValue.trim() && allowCreate) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && localTags.length > 0) {
      e.preventDefault();
      removeTag(localTags[localTags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredTags.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    }
  };

  const addTag = (tag: string) => {
    if (!localTags.includes(tag)) {
      setLocalTags([...localTags, tag]);
    }
    setInputValue('');
    setSelectedIndex(0);
  };

  const removeTag = (tag: string) => {
    setLocalTags(localTags.filter(t => t !== tag));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(
        "flex flex-wrap gap-1 px-2 py-1 border-2 border-primary rounded bg-white shadow-sm",
        "focus-within:ring-2 focus-within:ring-primary/50"
      )}>
        {localTags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
              type="button"
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={localTags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent"
        />
      </div>

      {isOpen && (filteredTags.length > 0 || (inputValue && allowCreate)) && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50">
          {filteredTags.map((tag, index) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                index === selectedIndex && "bg-muted"
              )}
            >
              {tag}
            </button>
          ))}
          {inputValue && allowCreate && !filteredTags.includes(inputValue) && (
            <button
              onClick={() => addTag(inputValue.trim())}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-primary"
            >
              Create "{inputValue}"
            </button>
          )}
        </div>
      )}

      <div className="mt-1 text-xs text-muted-foreground">
        Press Enter or comma to add, Backspace to remove
      </div>
    </div>
  );
}
