import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get first 5 artists with their monthlyListeners
    const artists = await prisma.artist.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        monthlyListeners: true,
        spotifyFollowers: true,
        spotifyPopularity: true,
        spotifyLastSyncedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count artists with monthlyListeners
    const withListeners = await prisma.artist.count({
      where: {
        monthlyListeners: {
          not: null,
        },
      },
    });

    const total = await prisma.artist.count();

    return NextResponse.json({
      success: true,
      sample: artists,
      stats: {
        total,
        withMonthlyListeners: withListeners,
        percentage: total > 0 ? ((withListeners / total) * 100).toFixed(1) + '%' : '0%',
      },
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
