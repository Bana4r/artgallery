import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 
export async function GET() {
  try {
    const [rows] = await pool.query(
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
    
    // Insert new artist
    const [result] = await pool.query(
      'INSERT INTO artistas (nombre, fecha_creacion) VALUES (?, ?)',
      [nombre, currentDate]
    );
    
    // Return the created artist
    const newArtistId = result.insertId;
    
    const [newArtist] = await pool.query(
      'SELECT id, nombre, fecha_creacion FROM artistas WHERE id = ?',
      [newArtistId]
    );
    
    return NextResponse.json(newArtist[0], { status: 201 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to create artist' },
      { status: 500 }
    );
  }
}