import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';

export async function GET(request, context) {
  try {
    // Await the params object to ensure it's resolved
    const params = await context.params;
    const artistId = params.id;

    // Validate artistId is a number
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

    if (Array.isArray(rows) && rows.length === 0) {
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