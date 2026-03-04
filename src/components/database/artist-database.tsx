"use client";

import { useState, useMemo } from 'react';
import { DataTable } from './data-table';
import { ViewSwitcher } from './view-switcher';
import { ViewProvider } from '@/lib/views/context';
import type { Property } from '@/lib/properties/types';
import type { ViewConfig } from '@/lib/views/types';
import type { ArtistRow } from '@/components/artist-table';

interface ArtistDatabaseProps {
  artists: ArtistRow[];
  onCellUpdate: (artistId: string, field: string, value: unknown) => Promise<void>;
}

// Define artist properties
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
        { id: 'LEAD', label: 'LEAD', color: 'gray' },
        { id: 'CONTACTED', label: 'CONTACTED', color: 'blue' },
        { id: 'NEGOTIATING', label: 'NEGOTIATING', color: 'yellow' },
        { id: 'WON', label: 'WON', color: 'green' },
        { id: 'LOST', label: 'LOST', color: 'red' },
      ],
    },
  },
  {
    id: 'ownerName',
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
    type: 'rating',
    width: 120,
    isVisible: true,
    options: {
      maxRating: 100,
    },
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
  },
  {
    id: 'tags',
    name: 'Tags',
    type: 'tags',
    width: 200,
    isVisible: true,
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
    visibleProperties: ARTIST_PROPERTIES.filter(p => p.isVisible).map(p => p.id),
    propertyWidths: ARTIST_PROPERTIES.reduce((acc, p) => {
      acc[p.id] = p.width ?? 200;
      return acc;
    }, {} as Record<string, number>),
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
    visibleProperties: ['name', 'status', 'ownerName', 'monthlyListeners', 'email'],
    propertyWidths: ARTIST_PROPERTIES.reduce((acc, p) => {
      acc[p.id] = p.width ?? 200;
      return acc;
    }, {} as Record<string, number>),
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
    visibleProperties: ['name', 'status', 'monthlyListeners', 'spotifyFollowers', 'spotifyPopularity'],
    propertyWidths: ARTIST_PROPERTIES.reduce((acc, p) => {
      acc[p.id] = p.width ?? 200;
      return acc;
    }, {} as Record<string, number>),
    propertyOrder: ARTIST_PROPERTIES.map(p => p.id),
  },
];

export function ArtistDatabase({ artists, onCellUpdate }: ArtistDatabaseProps) {
  const [propertyWidths, setPropertyWidths] = useState<Record<string, number>>(
    ARTIST_PROPERTIES.reduce((acc, p) => {
      acc[p.id] = p.width ?? 200;
      return acc;
    }, {} as Record<string, number>)
  );

  const [currentViewId, setCurrentViewId] = useState(DEFAULT_VIEWS[0].id);
  const currentView = DEFAULT_VIEWS.find(v => v.id === currentViewId) ?? DEFAULT_VIEWS[0];

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
      ownerName: artist.ownerName,
      monthlyListeners: artist.monthlyListeners,
      spotifyFollowers: artist.spotifyFollowers,
      spotifyPopularity: artist.spotifyPopularity,
      email: artist.email,
      instagram: artist.instagram,
      website: artist.website,
      spotifyUrl: artist.spotifyUrl,
      spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate,
      tags: artist.tags.map(t => t.name),
    }));
  }, [artists]);

  const handlePropertyResize = (propertyId: string, width: number) => {
    setPropertyWidths(prev => ({
      ...prev,
      [propertyId]: width,
    }));
  };

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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tableData.length} artists</span>
          </div>
        </div>

        {/* Data table */}
        <DataTable
          data={tableData}
          properties={visibleProperties}
          propertyWidths={propertyWidths}
          onPropertyResize={handlePropertyResize}
          onCellUpdate={onCellUpdate}
        />
      </div>
    </ViewProvider>
  );
}
