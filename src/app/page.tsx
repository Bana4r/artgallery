'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  // Edit artist states
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Delete artist states
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Create artist states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [artistName, setArtistName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Refs for modals
  const editModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const createModalRef = useRef<HTMLDivElement>(null);

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
  
  // Handle clicks outside modals to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setEditModalOpen(false);
      }
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setDeleteModalOpen(false);
      }
      if (createModalRef.current && !createModalRef.current.contains(event.target as Node)) {
        setCreateModalOpen(false);
      }
    }

    // Add event listener when any modal is open
    if (editModalOpen || deleteModalOpen || createModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editModalOpen, deleteModalOpen, createModalOpen]);

  // Close modals with Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEditModalOpen(false);
        setDeleteModalOpen(false);
        setCreateModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Open create modal
  const handleCreateClick = () => {
    setArtistName('');
    setCreateModalOpen(true);
  };
  
  // Create new artist
  const handleCreateArtist = async () => {
    if (!artistName.trim()) return;
    
    try {
      setIsCreating(true);
      
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: artistName })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create artist');
      }
      
      const newArtist = await response.json();
      
      // Add new artist to state
      setArtists(prev => [newArtist, ...prev]);
      
      // Close modal
      setCreateModalOpen(false);
      setArtistName('');
      
    } catch (err) {
      console.error('Error creating artist:', err);
      alert('Error al crear el artista');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Open edit modal for an artist
  const handleEditClick = (artist: Artist, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to artist page
    setEditingArtist(artist);
    setNewName(artist.nombre);
    setEditModalOpen(true);
  };
  
  // Update artist name
  const handleUpdateArtist = async () => {
    if (!editingArtist || !newName.trim()) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/artists/${editingArtist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: newName })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update artist');
      }
      
      const updatedArtist = await response.json();
      
      // Update state with the new name
      setArtists(prev => prev.map(artist => 
        artist.id === editingArtist.id ? updatedArtist : artist
      ));
      
      // Close modal
      setEditModalOpen(false);
      setEditingArtist(null);
      
    } catch (err) {
      console.error('Error updating artist:', err);
      alert('Error al actualizar el artista');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Open delete confirmation modal
  const handleDeleteClick = (artist: Artist, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to artist page
    setArtistToDelete(artist);
    setDeleteModalOpen(true);
  };
  
  // Delete artist
  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/artists/${artistToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete artist');
      }
      
      // Remove artist from state
      setArtists(prev => prev.filter(artist => artist.id !== artistToDelete.id));
      
      // Close modal
      setDeleteModalOpen(false);
      setArtistToDelete(null);
      
    } catch (err) {
      console.error('Error deleting artist:', err);
      alert('Error al eliminar el artista');
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Artists Gallery</h1>
        <button
          onClick={handleCreateClick}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Añadir Artista
        </button>
      </div>

      {artists.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-md text-center">
          <p className="text-lg mb-4">No hay artistas disponibles.</p>
          <p>Haz clic en "Añadir Artista" para crear tu primer artista.</p>
        </div>
      ) : (
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
              <div className="mt-4 flex flex-col space-y-2">
                <Link href={`/artists/${artist.id}`}>
                  <div className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-center">
                    Ver imagenes
                  </div>
                </Link>
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => handleEditClick(artist, e)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded text-center flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Editar
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(artist, e)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded text-center flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Artist Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            ref={createModalRef} 
            className="bg-white rounded-lg overflow-hidden w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Crear Nuevo Artista
              </h3>
              <div className="mb-4">
                <label htmlFor="newArtistName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Artista
                </label>
                <input
                  type="text"
                  id="newArtistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese nombre del artista"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateArtist}
                  disabled={isCreating || !artistName.trim()}
                  className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center ${!artistName.trim() && 'opacity-50 cursor-not-allowed'}`}
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Crear Artista
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Artist Modal */}
      {editModalOpen && editingArtist && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            ref={editModalRef} 
            className="bg-white rounded-lg overflow-hidden w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Artista
              </h3>
              <div className="mb-4">
                <label htmlFor="artistName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Artista
                </label>
                <input
                  type="text"
                  id="artistName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateArtist}
                  disabled={isUpdating || !newName.trim()}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center ${!newName.trim() && 'opacity-50 cursor-not-allowed'}`}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Artist Confirmation Modal */}
      {deleteModalOpen && artistToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            ref={deleteModalRef} 
            className="bg-white rounded-lg overflow-hidden w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar eliminación
              </h3>
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas eliminar al artista <span className="font-semibold">{artistToDelete.nombre}</span>?
              </p>
              <p className="text-red-600 text-sm mb-6">
                ¡Esta acción también eliminará todas las imágenes asociadas al artista y no se puede deshacer!
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteArtist}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar Artista
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}