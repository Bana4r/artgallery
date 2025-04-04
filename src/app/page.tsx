'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Artist {
  id: number;
  nombre: string;
  fecha_creacion: string;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const response = await fetch('/api/artists');
        if (!response.ok) {
          throw new Error('Error fetching artists');
        }
        const data = await response.json();
        setArtists(data);
      } catch (err) {
        setError('Failed to load artists');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">Loading artists...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Artists Gallery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <h2 className="text-xl font-semibold">{artist.nombre}</h2>
            <p className="text-gray-600 mt-2">
              Created: {new Date(artist.fecha_creacion).toLocaleDateString()}
            </p>
            <Link href={`/artists/${artist.id}`}>
              <div className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
                Ver imagenes
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}