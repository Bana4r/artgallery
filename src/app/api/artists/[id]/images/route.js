import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const artistId = resolvedParams.id;

    if (!/^\d+$/.test(artistId)) {
      return NextResponse.json(
        { error: 'Invalid artist ID' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      'SELECT id, artista_id, imagen, formato, fecha_subida FROM galeria WHERE artista_id = ? ORDER BY fecha_subida DESC',
      [artistId]
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}