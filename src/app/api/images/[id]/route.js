import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import fs from 'fs';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const imageId = resolvedParams.id;  // Cambiado de artistId a imageId
    
    // Validate imageId is a valid number
    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // First, get the image path from the database
    const [imageRows] = await pool.query(
      'SELECT imagen FROM galeria WHERE id = ?',
      [imageId]
    );

    if (imageRows.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imagePath = imageRows[0].imagen;
    const fullImagePath = path.join(process.cwd(), 'public', imagePath);

    // Delete from database
    await pool.query('DELETE FROM galeria WHERE id = ?', [imageId]);

    // Delete the file from the filesystem
    try {
      // Check if file exists before attempting to delete
      if (fs.existsSync(fullImagePath)) {
        await fs.promises.unlink(fullImagePath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // We continue even if file deletion fails, as the DB record is already gone
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}