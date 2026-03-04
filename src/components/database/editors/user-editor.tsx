"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface UserEditorProps {
  value: string | null;
  users: User[];
  onChange: (userId: string | null) => void;
  onSave: (userId?: string | null) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function UserEditor({
  value,
  users,
  onChange,
  onSave,
  onCancel,
  autoFocus = true,
}: UserEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

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
      if (filteredUsers[selectedIndex]) {
        const userId = filteredUsers[selectedIndex].id;
        onChange(userId);
        onSave(userId);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const handleSelect = (user: User) => {
    onChange(user.id);
    onSave(user.id);
  };

  const handleUnassign = () => {
    onChange(null);
    onSave(null);
  };

  const getUserDisplay = (user: User) => {
    return user.name || user.email || user.id;
  };

  const getUserInitials = (user: User) => {
    const display = getUserDisplay(user);
    return display.charAt(0).toUpperCase();
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
        placeholder="Search users..."
        className={cn(
          "w-full px-2 py-1 text-sm border-2 border-primary rounded",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "bg-white shadow-sm"
        )}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50">
          <button
            onClick={handleUnassign}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-muted-foreground"
          >
            Unassigned
          </button>
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-3",
                  index === selectedIndex && "bg-muted",
                  user.id === value && "font-semibold"
                )}
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={getUserDisplay(user)}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                    {getUserInitials(user)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate">{getUserDisplay(user)}</div>
                  {user.name && user.email && (
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
