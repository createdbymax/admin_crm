import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

// PATCH /api/artists/[id]/field - Update a single field
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { field, value } = body;

    console.log('[PATCH /api/artists/[id]/field]', { id, field, value, type: typeof value });

    if (!field) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    // Validate field is allowed to be updated
    const allowedFields = [
      'name',
      'status',
      'ownerId',
      'email',
      'instagram',
      'website',
      'facebook',
      'x',
      'twitter',
      'tiktok',
      'youtube',
      'soundcloud',
      'campaignNotes',
      'nextStepNote',
      'nextStepAt',
      'reminderAt',
      'contactName',
      'contactRole',
      'contactNotes',
      'wonReason',
      'lostReason',
      'spotifyUrl',
      'tags', // Allow tags updates
    ];

    if (!allowedFields.includes(field)) {
      console.log('[PATCH] Field not allowed:', field, 'Allowed:', allowedFields);
      return NextResponse.json(
        { error: `Field '${field}' cannot be updated via this endpoint` },
        { status: 400 }
      );
    }

    // Check if artist exists
    const existingArtist = await prisma.artist.findUnique({
      where: { id },
      select: { 
        id: true, 
        [field]: true,
        ...(field === 'tags' ? { tags: { select: { name: true } } } : {}),
      },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Handle tags specially (it's a relation)
    let updatedArtist;
    if (field === 'tags') {
      const tagNames = Array.isArray(value) ? value : [];
      
      // Get or create tags
      const tagRecords = await Promise.all(
        tagNames.map(async (name: string) => {
          return prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true, name: true },
          });
        })
      );

      // Update artist with new tags
      updatedArtist = await prisma.artist.update({
        where: { id },
        data: {
          tags: {
            set: tagRecords.map(tag => ({ id: tag.id })),
          },
        },
        select: {
          id: true,
          name: true,
          tags: { select: { id: true, name: true } },
        },
      });
    } else {
      // Update the field normally
      updatedArtist = await prisma.artist.update({
        where: { id },
        data: { [field]: value },
        select: {
          id: true,
          name: true,
          [field]: true,
        },
      });
    }

    // Log the update
    await logAuditEvent({
      action: 'artist.field.update',
      userId: session.user.id,
      userEmail: session.user.email,
      entityType: 'Artist',
      entityId: id,
      metadata: {
        field,
        oldValue: existingArtist[field as keyof typeof existingArtist],
        newValue: value,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      artist: updatedArtist,
    });
  } catch (error) {
    console.error('Error updating artist field:', error);
    return NextResponse.json(
      { error: 'Failed to update artist field' },
      { status: 500 }
    );
  }
}
