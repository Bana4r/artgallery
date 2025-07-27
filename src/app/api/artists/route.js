import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db'; 

export async function GET() {
  try {
    const db = await getDatabase();
    const rows = await db.all(
      'SELECT id, nombre, fecha_creacion FROM artistas'
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre } = body;
    
    // Validate input
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }
    
    // Get current timestamp for creation date
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const db = await getDatabase();
    
    // Insert new artist
    const result = await db.run(
      'INSERT INTO artistas (nombre, fecha_creacion) VALUES (?, ?)',
      [nombre, currentDate]
    );
    
    // Return the created artist
    const newArtistId = result.lastID;
    
    const newArtist = await db.get(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [newArtistId]
    );
    
    return NextResponse.json(newArtist, { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    );
  }
}