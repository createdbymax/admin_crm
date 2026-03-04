"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedDataTable } from './enhanced-data-table';
import { ViewSwitcher } from './view-switcher';
import { ViewProvider } from '@/lib/views/context';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import type { Property } from '@/lib/properties/types';
import type { ViewConfig } from '@/lib/views/types';
import type { ArtistRow } from '@/components/artist-table';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface EnhancedArtistDatabaseProps {
  artists: ArtistRow[];
  users: User[];
  isAdmin: boolean;
}

// Define artist properties with enhanced types
const ARTIST_PROPERTIES: Property[] = [
  {
    id: 'name',
    name: 'Artist Name',
    type: 'text',
    width: 200,
    isVisible: true,
    isRequired: true,
  },
  {
    id: 'status',
    name: 'Status',
    type: 'status',
    width: 150,
    isVisible: true,
    options: {
      options: [
        { id: 'LEAD', label: 'LEAD', color: '#6b7280' },
        { id: 'CONTACTED', label: 'CONTACTED', color: '#3b82f6' },
        { id: 'NEGOTIATING', label: 'NEGOTIATING', color: '#f59e0b' },
        { id: 'WON', label: 'WON', color: '#10b981' },
        { id: 'LOST', label: 'LOST', color: '#ef4444' },
      ],
    },
  },
  {
    id: 'ownerId',
    name: 'Owner',
    type: 'person',
    width: 150,
    isVisible: true,
  },
  {
    id: 'monthlyListeners',
    name: 'Monthly Listeners',
    type: 'number',
    width: 150,
    isVisible: true,
    options: {
      format: 'number',
    },
  },
  {
    id: 'spotifyFollowers',
    name: 'Followers',
    type: 'number',
    width: 120,
    isVisible: true,
    options: {
      format: 'number',
    },
  },
  {
    id: 'spotifyPopularity',
    name: 'Popularity',
    type: 'number',
    width: 100,
    isVisible: true,
  },
  {
    id: 'email',
    name: 'Email',
    type: 'email',
    width: 200,
    isVisible: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    type: 'url',
    width: 180,
    isVisible: false,
  },
  {
    id: 'website',
    name: 'Website',
    type: 'url',
    width: 180,
    isVisible: false,
  },
  {
    id: 'spotifyUrl',
    name: 'Spotify',
    type: 'url',
    width: 180,
    isVisible: true,
  },
  {
    id: 'spotifyLatestReleaseDate',
    name: 'Latest Release',
    type: 'date',
    width: 150,
    isVisible: true,
    options: {
      dateFormat: 'friendly',
    },
  },
  {
    id: 'tags',
    name: 'Tags',
    type: 'tags',
    width: 200,
    isVisible: true,
  },
  {
    id: 'campaignNotes',
    name: 'Campaign Notes',
    type: 'text',
    width: 250,
    isVisible: false,
  },
  {
    id: 'nextStepAt',
    name: 'Next Step',
    type: 'date',
    width: 150,
    isVisible: false,
  },
  {
    id: 'reminderAt',
    name: 'Reminder',
    type: 'date',
    width: 150,
    isVisible: false,
  },
];

// Default views
const DEFAULT_VIEWS: ViewConfig[] = [
  {
    id: 'all-artists',
    name: 'All Artists',
    type: 'table',
    icon: '📊',
    filters: [],
    sorts: [{ property: 'name', direction: 'asc' }],
    visibleProperties: ['name', 'status', 'ownerId', 'monthlyListeners', 'email', 'spotifyUrl', 'tags'],
    propertyWidths: {},
    propertyOrder: ARTIST_PROPERTIES.map(p => p.id),
    isDefault: true,
  },
  {
    id: 'active-leads',
    name: 'Active Leads',
    type: 'table',
    icon: '🎯',
    filters: [
      {
        id: 'status-filter',
        property: 'status',
        operator: 'isAnyOf',
        value: ['LEAD', 'CONTACTED', 'NEGOTIATING'],
        condition: 'and',
      },
    ],
    sorts: [{ property: 'monthlyListeners', direction: 'desc' }],
    visibleProperties: ['name', 'status', 'ownerId', 'monthlyListeners', 'email', 'nextStepAt'],
    propertyWidths: {},
    propertyOrder: ARTIST_PROPERTIES.map(p => p.id),
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    type: 'table',
    icon: '⭐',
    filters: [
      {
        id: 'listeners-filter',
        property: 'monthlyListeners',
        operator: 'greaterThan',
        value: 100000,
        condition: 'and',
      },
    ],
    sorts: [{ property: 'monthlyListeners', direction: 'desc' }],
    visibleProperties: ['name', 'status', 'monthlyListeners', 'spotifyFollowers', 'spotifyPopularity', 'email'],
    propertyWidths: {},
    propertyOrder: ARTIST_PROPERTIES.map(p => p.id),
  },
  {
    id: 'my-artists',
    name: 'My Artists',
    type: 'table',
    icon: '👤',
    filters: [],
    sorts: [{ property: 'name', direction: 'asc' }],
    visibleProperties: ['name', 'status', 'monthlyListeners', 'email', 'nextStepAt', 'reminderAt'],
    propertyWidths: {},
    propertyOrder: ARTIST_PROPERTIES.map(p => p.id),
  },
];

export function EnhancedArtistDatabase({ artists, users, isAdmin }: EnhancedArtistDatabaseProps) {
  const router = useRouter();
  const [propertyWidths, setPropertyWidths] = useState<Record<string, number>>(
    ARTIST_PROPERTIES.reduce((acc, p) => {
      acc[p.id] = p.width ?? 200;
      return acc;
    }, {} as Record<string, number>)
  );

  const [currentViewId, setCurrentViewId] = useState(DEFAULT_VIEWS[0].id);
  const currentView = DEFAULT_VIEWS.find(v => v.id === currentViewId) ?? DEFAULT_VIEWS[0];

  // Optimistic updates
  const { update: updateArtist } = useOptimisticUpdate<{ id: string }>({
    onUpdate: async (id, data) => {
      const field = Object.keys(data)[0];
      const value = data[field as keyof typeof data];

      const response = await fetch(`/api/artists/${id}/field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update artist');
      }
    },
    onError: (error) => {
      console.error('Update failed:', error);
      // TODO: Show toast notification
    },
  });

  // Filter visible properties based on current view
  const visibleProperties = useMemo(() => {
    return ARTIST_PROPERTIES.filter(p => 
      currentView.visibleProperties.includes(p.id)
    );
  }, [currentView]);

  // Transform artist data to match property structure
  const tableData = useMemo(() => {
    return artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      status: artist.status,
      ownerId: artist.ownerId,
      monthlyListeners: artist.monthlyListeners,
      spotifyFollowers: artist.spotifyFollowers,
      spotifyPopularity: artist.spotifyPopularity,
      email: artist.email,
      instagram: artist.instagram,
      website: artist.website,
      spotifyUrl: artist.spotifyUrl,
      spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate,
      tags: artist.tags.map(t => t.name),
      campaignNotes: null, // Would need to be added to ArtistRow type
      nextStepAt: null,
      reminderAt: null,
    }));
  }, [artists]);

  const handlePropertyResize = (propertyId: string, width: number) => {
    setPropertyWidths(prev => ({
      ...prev,
      [propertyId]: width,
    }));
  };

  const handleCellUpdate = async (artistId: string, field: string, value: unknown) => {
    // Handle special cases
    if (field === 'tags' && Array.isArray(value)) {
      // Tags need special handling - convert to comma-separated string
      const response = await fetch(`/api/artists/${artistId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: value.join(', ') }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tags');
      }

      router.refresh();
      return;
    }

    // Use optimistic update for other fields
    await updateArtist(artistId, { [field]: value });
  };

  // Get all available tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    artists.forEach(artist => {
      artist.tags.forEach(tag => tags.add(tag.name));
    });
    return Array.from(tags);
  }, [artists]);

  return (
    <ViewProvider initialViews={DEFAULT_VIEWS} defaultViewId={currentViewId}>
      <div className="space-y-4">
        {/* View controls */}
        <div className="flex items-center justify-between">
          <ViewSwitcher
            views={DEFAULT_VIEWS}
            currentViewId={currentViewId}
            onViewChange={setCurrentViewId}
          />
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{tableData.length} artists</span>
            {isAdmin && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Enhanced data table */}
        <EnhancedDataTable
          data={tableData}
          properties={visibleProperties}
          propertyWidths={propertyWidths}
          onPropertyResize={handlePropertyResize}
          onCellUpdate={handleCellUpdate}
          users={users}
          availableTags={availableTags}
        />
      </div>
    </ViewProvider>
  );
}
