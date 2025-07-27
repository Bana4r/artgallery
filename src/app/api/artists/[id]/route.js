import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db'; 
import { unlink } from 'fs/promises';
import path from 'path';

// Get a single artist
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;

    if (!/^\d+$/.test(artistId)) {
      return NextResponse.json(
        { error: 'Invalid artist ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const artist = await db.get(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [artistId]
    );

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist' },
      { status: 500 }
    );
  }
}

// Update an artist
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;

    if (!/^\d+$/.test(artistId)) {
      return NextResponse.json(
        { error: 'Invalid artist ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if artist exists
    const checkArtist = await db.get(
      'SELECT id FROM artistas WHERE id = ?',
      [artistId]
    );

    if (!checkArtist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Update artist name
    await db.run(
      'UPDATE artistas SET nombre = ? WHERE id = ?',
      [nombre, artistId]
    );

    // Return updated artist
    const updatedArtist = await db.get(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [artistId]
    );

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    );
  }
}

// Delete an artist
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const artistId = resolvedParams.id;

    if (!/^\d+$/.test(artistId)) {
      return NextResponse.json(
        { error: 'Invalid artist ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if artist exists
    const checkArtist = await db.get(
      'SELECT id FROM artistas WHERE id = ?',
      [artistId]
    );

    if (!checkArtist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // First, get all images associated with the artist
    const images = await db.all(
      'SELECT imagen FROM galeria WHERE artista_id = ?',
      [artistId]
    );

    // Delete physical image files
    const deletePromises = images.map(async (image) => {
      try {
        // Usar image.imagen en lugar de image.ruta_imagen
        const imagePath = path.join(process.cwd(), 'public', image.imagen);
        await unlink(imagePath);
        console.log(`Deleted file: ${imagePath}`);
      } catch (err) {
        console.error(`Error deleting file: ${image.imagen}`, err);
        // Continue with deletion even if some files fail to delete
      }
    });

    // Wait for all file deletions to complete
    await Promise.all(deletePromises);

    // Delete database records for images
    await db.run(
      'DELETE FROM galeria WHERE artista_id = ?',
      [artistId]
    );

    // Then delete the artist
    await db.run(
      'DELETE FROM artistas WHERE id = ?',
      [artistId]
    );

    return NextResponse.json({ message: 'Artist and associated images deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    );
  }
}