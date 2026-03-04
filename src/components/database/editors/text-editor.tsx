"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (value?: string) => void;
  onCancel: () => void;
  multiline?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TextEditor({
  value,
  onChange,
  onSave,
  onCancel,
  multiline = false,
  placeholder = 'Type something...',
  autoFocus = true,
}: TextEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      onChange(localValue);
      onSave(localValue); // Pass value directly to avoid race condition
    } else if (e.key === 'Enter' && e.metaKey && multiline) {
      e.preventDefault();
      onChange(localValue);
      onSave(localValue); // Pass value directly to avoid race condition
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onChange(localValue);
      onSave(localValue); // Pass value directly to avoid race condition
      // TODO: Move to next cell
    }
  };

  const handleBlur = () => {
    onChange(localValue);
    onSave(localValue); // Pass value directly to avoid race condition
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  const commonProps = {
    value: localValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    placeholder,
    className: cn(
      "w-full px-2 py-1 text-sm border-2 border-primary rounded",
      "focus:outline-none focus:ring-2 focus:ring-primary/50",
      "bg-white shadow-sm"
    ),
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        {...commonProps}
        rows={3}
        className={cn(commonProps.className, "resize-none")}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      {...commonProps}
    />
  );
}
