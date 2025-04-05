import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import fs from 'fs';
import path from 'path';

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const imageId = resolvedParams.id;
    
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
    // Normalize path to ensure correct location
    const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullImagePath = path.join(process.cwd(), 'public', normalizedPath);

    console.log('Deleting image from file system:', fullImagePath);

    // Delete from database
    await pool.query('DELETE FROM galeria WHERE id = ?', [imageId]);

    // Delete the file from the filesystem
    try {
      // Check if file exists before attempting to delete
      if (fs.existsSync(fullImagePath)) {
        await fs.promises.unlink(fullImagePath);
        console.log('Successfully deleted file:', fullImagePath);
      } else {
        console.warn('File not found for deletion:', fullImagePath);
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

export async function GET(request, { params }) {
  try {
    // Fix: Await params before accessing its properties
    const resolvedParams = await params;
    const imageId = resolvedParams.id;
    
    // Get image path from database
    const [imageRows] = await pool.query(
      'SELECT imagen FROM galeria WHERE id = ?',
      [imageId]
    );
    
    if (imageRows.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const imagePath = imageRows[0].imagen;
    // Remove leading slash if present
    const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullImagePath = path.join(process.cwd(), 'public', normalizedPath);
    
    // Check if file exists
    if (!fs.existsSync(fullImagePath)) {
      return NextResponse.json({ error: 'Image file not found', path: fullImagePath }, { status: 404 });
    }
    
    // Read the image and send it with appropriate headers
    const imageBuffer = await fs.promises.readFile(fullImagePath);
    const fileExtension = path.extname(imagePath).substring(1).toLowerCase(); // Get extension without dot
    
    // Map file extension to MIME type
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    const contentType = mimeTypes[fileExtension] || 'application/octet-stream';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}