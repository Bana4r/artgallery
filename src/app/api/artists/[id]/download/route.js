import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';

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

    // Get artist info to name the zip file
    const [artistRows] = await pool.query(
      'SELECT nombre FROM artistas WHERE id = ?',
      [artistId]
    );

    if (!artistRows || artistRows.length === 0) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    const artistName = artistRows[0].nombre;

    // Get all images for this artist
    const [rows] = await pool.query(
      'SELECT id, imagen, formato, fecha_subida FROM galeria WHERE artista_id = ?',
      [artistId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this artist' },
        { status: 404 }
      );
    }

    // Create a new zip file
    const zip = new JSZip();
    
    // Add each image to the zip
    const publicDir = path.join(process.cwd(), 'public');
    
    for (const image of rows) {
      try {
        // Fix the path: Don't add 'uploads' twice
        // The image.imagen already contains 'uploads/' in the path
        const imagePath = path.join(publicDir, image.imagen);
        
        // Log the path to debug
        console.log(`Trying to read file: ${imagePath}`);
        
        const imageData = await fs.readFile(imagePath);
        const fileName = `${image.id}_${new Date(image.fecha_subida).toISOString().split('T')[0]}.${image.formato}`;
        zip.file(fileName, imageData);
      } catch (err) {
        console.error(`Error adding image ${image.id} to zip:`, err);
        // Continue with the next image
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    // Return the zip file
    const sanitizedArtistName = artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedArtistName}_gallery.zip`;

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download Error:', error);
    return NextResponse.json(
      { error: 'Failed to create download' },
      { status: 500 }
    );
  }
}