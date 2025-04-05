import { NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { saveImage } from '../../../../../../lib/fileStorage';

export async function POST(
  request,
  { params }
) {
  try {
    // Validate artist exists
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    
    // Validate artistId is a valid number
    if (isNaN(artistId)) {
      return NextResponse.json({ error: 'Invalid artist ID' }, { status: 400 });
    }

    // Check if artist exists
    const [artistRows] = await pool.query(
      'SELECT id FROM artistas WHERE id = ?',
      [artistId]
    );

    if (artistRows.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Process form data
    const formData = await request.formData();
    const imageFiles = formData.getAll('images');

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: 'No image files provided' }, { status: 400 });
    }

    const uploadResults = [];
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Process each file
    for (const imageFile of imageFiles) {
      // Validate file type
      const fileType = imageFile.type.split('/')[1];
      if (!['jpeg', 'jpg', 'png'].includes(fileType)) {
        continue; // Skip invalid files
      }

      // Convert file to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save image to filesystem and get the path
      const imagePath = await saveImage(buffer, artistId, imageFile.name);
      
      // Save only the image path to the database
      const [result] = await pool.query(
        'INSERT INTO galeria (artista_id, imagen, formato, fecha_subida) VALUES (?, ?, ?, ?)',
        [artistId, imagePath, fileType, currentDate]
      );

      // Get the inserted ID
      const newImageId = result.insertId;
      
      uploadResults.push({
        id: newImageId,
        artista_id: artistId,
        imagen: imagePath,
        formato: fileType,
        fecha_subida: currentDate,
      });
    }

    if (uploadResults.length === 0) {
      return NextResponse.json({ error: 'No valid images were uploaded' }, { status: 400 });
    }
    
    return NextResponse.json(uploadResults, { status: 201 });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}