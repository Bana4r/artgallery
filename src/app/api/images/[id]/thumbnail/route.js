import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db'; 
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function GET(request, { params }) {
  try {
    // Fix: Await params before accessing its properties
    const resolvedParams = await params;
    const imageId = resolvedParams.id;
    
    const db = await getDatabase();
    
    // Get image path from database
    const imageRow = await db.get(
      'SELECT imagen FROM galeria WHERE id = ?',
      [imageId]
    );
    
    if (!imageRow) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const imagePath = imageRow.imagen;
    // Remove leading slash if present
    const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullImagePath = path.join(process.cwd(), 'public', normalizedPath);
    
    // Check if file exists
    if (!fs.existsSync(fullImagePath)) {
      return NextResponse.json({ error: 'Image file not found', path: fullImagePath }, { status: 404 });
    }

    // Create thumbnail cache directory
    const thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Generate thumbnail filename
    const fileExtension = path.extname(imagePath);
    const thumbnailPath = path.join(thumbnailDir, `thumb_${imageId}_300x300${fileExtension}`);
    
    // Check if thumbnail already exists
    if (!fs.existsSync(thumbnailPath)) {
      try {
        // Generate thumbnail using Sharp
        await sharp(fullImagePath)
          .resize(300, 300, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (sharpError) {
        console.error('Error generating thumbnail:', sharpError);
        // Fallback to original image if thumbnail generation fails
        const imageBuffer = await fs.promises.readFile(fullImagePath);
        const contentType = getContentType(fileExtension);
        
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, must-revalidate',
          },
        });
      }
    }
    
    // Serve the thumbnail
    const thumbnailBuffer = await fs.promises.readFile(thumbnailPath);
    
    return new NextResponse(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, must-revalidate',
        'ETag': `"thumb-${imageId}-${Date.now()}"`,
      },
    });
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return NextResponse.json({ error: 'Failed to serve thumbnail' }, { status: 500 });
  }
}

function getContentType(fileExtension) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  
  return mimeTypes[fileExtension.toLowerCase()] || 'application/octet-stream';
}
