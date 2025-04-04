import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db'; 

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