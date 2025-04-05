import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
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

    const [rows] = await pool.query(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [artistId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
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

    // Check if artist exists
    const [checkRows] = await pool.query(
      'SELECT id FROM artistas WHERE id = ?',
      [artistId]
    );

    if (checkRows.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Update artist name
    await pool.query(
      'UPDATE artistas SET nombre = ? WHERE id = ?',
      [nombre, artistId]
    );

    // Return updated artist
    const [updatedRows] = await pool.query(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [artistId]
    );

    return NextResponse.json(updatedRows[0]);
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

    // Check if artist exists
    const [checkRows] = await pool.query(
      'SELECT id FROM artistas WHERE id = ?',
      [artistId]
    );

    if (checkRows.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // First, get all images associated with the artist
    const [images] = await pool.query(
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
    await pool.query(
      'DELETE FROM galeria WHERE artista_id = ?',
      [artistId]
    );

    // Then delete the artist
    await pool.query(
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