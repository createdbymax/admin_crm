"use client";

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotionDatabasePage } from './notion-database-page';
import { Toast } from './ui/toast';
import type { Property } from '@/lib/properties/types';
import type { ViewConfig } from '@/lib/views/types';

interface Artist {
  id: string;
  name: string;
  status: string;
  ownerId: string | null;
  owner: { name: string | null; email: string | null; image?: string | null } | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  spotifyUrl: string | null;
  spotifyId: string | null;
  spotifyImage: string | null;
  monthlyListeners: number | null;
  spotifyFollowers: number | null;
  spotifyPopularity: number | null;
  spotifyGenres: string[] | null;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: Date | null;
  spotifyLatestReleaseUrl: string | null;
  spotifyLatestReleaseType: string | null;
  spotifyLastSyncedAt: Date | null;
  tags: Array<{ id: string; name: string }>;
  createdAt: Date;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface Tag {
  id: string;
  name: string;
}

interface NotionArtistsDatabaseProps {
  artists: Artist[];
  users: User[];
  tags: Tag[];
  isAdmin: boolean;
}

// Define properties for the artist database
const ARTIST_PROPERTIES: Property[] = [
  {
    id: 'name',
    name: 'Name',
    type: 'text',
    width: 250,
    isVisible: true,
  },
  {
    id: 'status',
    name: 'Status',
    type: 'select',
    width: 150,
    isVisible: true,
    options: {
      options: [
        { id: 'lead', label: 'LEAD', color: '#6b7280' },
        { id: 'contacted', label: 'CONTACTED', color: '#3b82f6' },
        { id: 'negotiating', label: 'NEGOTIATING', color: '#f59e0b' },
        { id: 'won', label: 'WON', color: '#10b981' },
        { id: 'lost', label: 'LOST', color: '#ef4444' },
      ],
    },
  },
  {
    id: 'ownerId',
    name: 'Owner',
    type: 'person',
    width: 180,
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
      readOnly: true, // Spotify field - read only
    },
  },
  {
    id: 'spotifyFollowers',
    name: 'Followers',
    type: 'number',
    width: 130,
    isVisible: true,
    options: {
      format: 'number',
      readOnly: true, // Spotify field - read only
    },
  },
  {
    id: 'spotifyPopularity',
    name: 'Popularity',
    type: 'number',
    width: 120,
    isVisible: true,
    options: {
      readOnly: true, // Spotify field - read only
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
    width: 200,
    isVisible: false,
  },
  {
    id: 'spotifyUrl',
    name: 'Spotify',
    type: 'url',
    width: 180,
    isVisible: false,
  },
  {
    id: 'tags',
    name: 'Tags',
    type: 'tags',
    width: 200,
    isVisible: true,
  },
  {
    id: 'spotifyLatestReleaseName',
    name: 'Latest Release',
    type: 'text',
    width: 200,
    isVisible: false,
    options: {
      readOnly: true, // Spotify field - read only
    },
  },
  {
    id: 'spotifyLatestReleaseDate',
    name: 'Release Date',
    type: 'date',
    width: 150,
    isVisible: false,
    options: {
      readOnly: true, // Spotify field - read only
    },
  },
  {
    id: 'spotifyGenres',
    name: 'Genres',
    type: 'tags',
    width: 200,
    isVisible: false,
    options: {
      readOnly: true, // Spotify field - read only
    },
  },
  {
    id: 'createdAt',
    name: 'Created',
    type: 'date',
    width: 150,
    isVisible: false,
    options: {
      readOnly: true, // System field - read only
    },
  },
];

// Define default views
const DEFAULT_VIEWS: ViewConfig[] = [
  {
    id: 'all',
    name: 'All Artists',
    type: 'table',
    isDefault: true,
    filters: [],
    sorts: [{ property: 'createdAt', direction: 'desc' }],
    visibleProperties: ['name', 'status', 'ownerId', 'monthlyListeners', 'spotifyFollowers', 'email', 'tags'],
    propertyWidths: {},
    propertyOrder: [],
  },
  {
    id: 'leads',
    name: 'Leads',
    type: 'table',
    filters: [
      {
        id: 'status-lead',
        property: 'status',
        operator: 'equals',
        value: 'LEAD',
        condition: 'and',
      },
    ],
    sorts: [{ property: 'monthlyListeners', direction: 'desc' }],
    visibleProperties: ['name', 'monthlyListeners', 'spotifyFollowers', 'spotifyPopularity', 'email', 'tags'],
    propertyWidths: {},
    propertyOrder: [],
  },
  {
    id: 'pipeline',
    name: 'Pipeline',
    type: 'board',
    boardGroupBy: 'status',
    filters: [],
    sorts: [{ property: 'monthlyListeners', direction: 'desc' }],
    visibleProperties: ['name', 'monthlyListeners', 'email'],
    propertyWidths: {},
    propertyOrder: [],
  },
  {
    id: 'gallery',
    name: 'Gallery',
    type: 'gallery',
    galleryImageProperty: 'spotifyImage',
    filters: [],
    sorts: [{ property: 'monthlyListeners', direction: 'desc' }],
    visibleProperties: ['name', 'status', 'monthlyListeners', 'tags'],
    propertyWidths: {},
    propertyOrder: [],
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    type: 'table',
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
    visibleProperties: ['name', 'status', 'monthlyListeners', 'spotifyFollowers', 'ownerId', 'email'],
    propertyWidths: {},
    propertyOrder: [],
  },
];

export function NotionArtistsDatabase({
  artists,
  users,
  tags,
  isAdmin,
}: NotionArtistsDatabaseProps) {
  const router = useRouter();
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    show: boolean;
    message: string;
    type: 'loading' | 'success' | 'error';
    progress?: number;
  } | null>(null);

  // Polling function
  const startPolling = useCallback((jobId: string) => {
    let lastProcessed = 0;
    let stuckCount = 0;
    
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/spotify/sync-all?jobId=${jobId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.job) {
          const { status, synced, total: jobTotal, failed, lastError } = statusData.job;
          const progress = jobTotal ? Math.round((synced / jobTotal) * 100) : 0;
          const processed = synced + failed;
          
          // Check if job is stuck (no progress for 3 polls)
          if (processed === lastProcessed && status === 'RUNNING') {
            stuckCount++;
            if (stuckCount >= 3) {
              console.log('[Sync] Job appears stuck, triggering worker...');
              fetch('/api/spotify/sync-worker', { method: 'GET' }).catch(console.error);
              stuckCount = 0; // Reset to avoid spamming
            }
          } else {
            stuckCount = 0;
            lastProcessed = processed;
          }
          
          if (status === 'COMPLETED') {
            clearInterval(pollInterval);
            setSyncProgress({
              show: true,
              message: `Sync complete! Updated ${synced} artists${failed ? ` (${failed} failed)` : ''}`,
              type: 'success',
              progress: 100,
            });
            
            setTimeout(() => {
              setSyncProgress(null);
              router.refresh();
            }, 3000);
            
            setIsSyncing(false);
          } else if (status === 'FAILED') {
            clearInterval(pollInterval);
            
            // Check if it's a rate limit error
            const isRateLimit = lastError?.includes('rate limit') || lastError?.includes('wait');
            const message = isRateLimit 
              ? `Spotify rate limit hit. ${lastError}. Try again later.`
              : 'Sync failed. Please try again.';
            
            setSyncProgress({
              show: true,
              message,
              type: 'error',
            });
            setTimeout(() => setSyncProgress(null), 10000); // Show for 10 seconds
            setIsSyncing(false);
          } else {
            // Check if we're getting a lot of failures (rate limited)
            const failureRate = jobTotal ? (failed / processed) : 0;
            const isLikelyRateLimited = failed > 10 && failureRate > 0.8;
            
            let message = `Syncing artists: ${synced}/${jobTotal}`;
            if (failed > 0) {
              message += ` (${failed} failed)`;
            }
            if (isLikelyRateLimited && lastError?.includes('rate limit')) {
              message = `Rate limited by Spotify. Processed ${processed}/${jobTotal}. Will retry later.`;
            }
            
            setSyncProgress({
              show: true,
              message,
              type: isLikelyRateLimited ? 'error' : 'loading',
              progress,
            });
          }
        }
      } catch (error) {
        console.error('Failed to check sync status:', error);
      }
    }, 3000);
    
    return pollInterval;
  }, [router]);

  // Check for active sync job on mount
  useEffect(() => {
    const checkActiveSync = async () => {
      try {
        const response = await fetch('/api/spotify/sync-all?active=1');
        const data = await response.json();
        
        if (data.job && (data.job.status === 'RUNNING' || data.job.status === 'QUEUED')) {
          setIsSyncing(true);
          const { id, total, synced, failed } = data.job;
          const progress = total ? Math.round((synced / total) * 100) : 0;
          
          setSyncProgress({
            show: true,
            message: `Syncing artists: ${synced}/${total}${failed ? ` (${failed} failed)` : ''}`,
            type: 'loading',
            progress,
          });
          
          // Trigger worker in case it's stuck
          if (data.job.status === 'QUEUED' || synced === 0) {
            console.log('[Sync] Triggering worker for active job...');
            fetch('/api/spotify/sync-worker', { method: 'GET' }).catch(console.error);
          }
          
          // Start polling
          startPolling(id);
        }
      } catch (error) {
        console.error('Failed to check active sync:', error);
      }
    };
    
    checkActiveSync();
  }, [startPolling]);

  // Transform artists to match the expected format and keep in local state
  const [artistRows, setArtistRows] = useState(() => 
    artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      status: artist.status,
      ownerId: artist.ownerId,
      email: artist.email,
      instagram: artist.instagram,
      website: artist.website,
      spotifyUrl: artist.spotifyUrl,
      spotifyId: artist.spotifyId,
      spotifyImage: artist.spotifyImage,
      monthlyListeners: artist.monthlyListeners,
      spotifyFollowers: artist.spotifyFollowers,
      spotifyPopularity: artist.spotifyPopularity,
      spotifyGenres: artist.spotifyGenres ?? [],
      spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
      spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate?.toISOString() ?? null,
      spotifyLatestReleaseUrl: artist.spotifyLatestReleaseUrl,
      spotifyLatestReleaseType: artist.spotifyLatestReleaseType,
      spotifyLastSyncedAt: artist.spotifyLastSyncedAt?.toISOString() ?? null,
      tags: artist.tags.map(t => t.name),
      createdAt: artist.createdAt.toISOString(),
    }))
  );

  // Update local state when artists prop changes (e.g., after sync)
  useEffect(() => {
    setArtistRows(artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      status: artist.status,
      ownerId: artist.ownerId,
      email: artist.email,
      instagram: artist.instagram,
      website: artist.website,
      spotifyUrl: artist.spotifyUrl,
      spotifyId: artist.spotifyId,
      spotifyImage: artist.spotifyImage,
      monthlyListeners: artist.monthlyListeners,
      spotifyFollowers: artist.spotifyFollowers,
      spotifyPopularity: artist.spotifyPopularity,
      spotifyGenres: artist.spotifyGenres ?? [],
      spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
      spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate?.toISOString() ?? null,
      spotifyLatestReleaseUrl: artist.spotifyLatestReleaseUrl,
      spotifyLatestReleaseType: artist.spotifyLatestReleaseType,
      spotifyLastSyncedAt: artist.spotifyLastSyncedAt?.toISOString() ?? null,
      tags: artist.tags.map(t => t.name),
      createdAt: artist.createdAt.toISOString(),
    })));
  }, [artists]);

  // Get all available tags
  const availableTags = useMemo(() => {
    return tags.map(t => t.name);
  }, [tags]);

  // Handle cell updates - update local state immediately, sync to server in background
  const handleCellUpdate = useCallback(async (id: string, field: string, value: unknown) => {
    // Update local state immediately for instant UI feedback
    setArtistRows(prev => 
      prev.map(artist => 
        artist.id === id ? { ...artist, [field]: value } : artist
      )
    );

    // Send update to server in background
    try {
      const response = await fetch(`/api/artists/${id}/field`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      });

      if (!response.ok) {
        // If update fails, revert by refreshing from server
        console.error('Update failed, reverting...');
        router.refresh();
      }
    } catch (error) {
      console.error('Update failed:', error);
      // Revert on error
      router.refresh();
    }
  }, [router]);

  // Handle row click to navigate to artist detail
  const handleRowClick = useCallback((row: typeof artistRows[0]) => {
    router.push(`/artists/${row.id}`);
  }, [router]);

  // Handle new artist
  const handleNewArtist = useCallback(() => {
    setShowAddArtist(true);
  }, []);

  // Handle sync
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress({
      show: true,
      message: 'Starting Spotify sync...',
      type: 'loading',
      progress: 0,
    });

    try {
      // Create the sync job
      const response = await fetch('/api/spotify/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.job) {
          const jobId = data.job.id;
          const total = data.job.total || 0;
          
          setSyncProgress({
            show: true,
            message: `Syncing ${total} artists...`,
            type: 'loading',
            progress: 0,
          });
          
          // Trigger the worker immediately from the client
          fetch('/api/spotify/sync-worker', {
            method: 'GET',
          }).catch((error) => {
            console.error('Failed to trigger worker:', error);
          });
          
          // Start polling
          startPolling(jobId);
        }
      } else {
        throw new Error('Failed to start sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncProgress({
        show: true,
        message: 'Failed to start sync. Please try again.',
        type: 'error',
      });
      setTimeout(() => setSyncProgress(null), 5000);
      setIsSyncing(false);
    }
  }, [startPolling]);

  return (
    <>
      <NotionDatabasePage
        title="Artists"
        data={artistRows}
        properties={ARTIST_PROPERTIES}
        views={DEFAULT_VIEWS}
        users={users}
        availableTags={availableTags}
        onCellUpdate={handleCellUpdate}
        onRowClick={handleRowClick}
        onNewRecord={handleNewArtist}
        onSync={handleSync}
        isSyncing={isSyncing}
        idField="id"
        imageProperty="spotifyImage"
        titleProperty="name"
      />
      
      {/* Add Artist Modal */}
      {showAddArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add New Artist</h2>
                <button
                  onClick={() => setShowAddArtist(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Add a new artist to your CRM. You can import from Spotify or create manually.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddArtist(false);
                    router.push('/artists?import=spotify');
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Import from Spotify
                </button>
                <button
                  onClick={() => {
                    setShowAddArtist(false);
                    router.push('/artists?create=manual');
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sync Progress Toast */}
      {syncProgress?.show && (
        <Toast
          message={syncProgress.message}
          type={syncProgress.type}
          progress={syncProgress.progress}
          onClose={() => setSyncProgress(null)}
        />
      )}
    </>
  );
}
