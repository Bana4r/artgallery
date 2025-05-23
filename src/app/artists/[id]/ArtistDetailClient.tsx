'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Artist {
  id: number;
  nombre: string;
  fecha_creacion: string;
}

interface GalleryImage {
  id: number;
  artista_id: number;
  imagen: string; // This is now a file path, not base64
  formato: string;
  fecha_subida: string;
}

export default function ArtistDetailClient({ id }: { id: string }) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Fetch artist and images
  useEffect(() => {
    async function fetchArtistAndImages() {
      try {
        setLoading(true);
        const artistResponse = await fetch(`/api/artists/${id}`);
        if (!artistResponse.ok) {
          throw new Error('Error fetching artist');
        }
        
        const artistData = await artistResponse.json();
        setArtist(artistData);
        
        const imagesResponse = await fetch(`/api/artists/${id}/images`);
        if (!imagesResponse.ok) {
          throw new Error('Error fetching images');
        }
        
        const imagesData = await imagesResponse.json();
        setImages(imagesData);
      } catch (err) {
        setError('Failed to load artist data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtistAndImages();
  }, [id]);

  // Handle clicks outside modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setModalOpen(false);
      }
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setConfirmDeleteModalOpen(false);
      }
    }

    // Add event listener when either modal is open
    if (modalOpen || confirmDeleteModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen, confirmDeleteModalOpen]);

  // Close modal with Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      
      // Append all selected files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file format
        const format = file.name.split('.').pop()?.toLowerCase();
        if (format !== 'jpg' && format !== 'jpeg' && format !== 'png') {
          console.warn(`File "${file.name}" skipped - only JPG and PNG formats are supported`);
          continue;
        }
        
        formData.append('images', file);
      }
      
      const response = await fetch(`/api/artists/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir las imágenes');
      }
      
      const newImages = await response.json();
      
      // Add the new images to the state
      setImages(prev => [...newImages, ...prev]);
      
    } catch (err) {
      console.error('Error uploading images:', err);
      alert('Error al subir las imágenes');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // New functions for delete functionality
  const openDeleteConfirmation = (image: GalleryImage, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent image click from opening modal
    setImageToDelete(image);
    setConfirmDeleteModalOpen(true);
  };

  const deleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      setDeleting(true);
      
      const response = await fetch(`/api/images/${imageToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      // Remove the image from our state
      setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
      
      // Close the modal
      setConfirmDeleteModalOpen(false);
      setImageToDelete(null);
      
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Error al eliminar la imagen');
    } finally {
      setDeleting(false);
    }
  };

  const openImageModal = (image: GalleryImage) => {
    const index = images.findIndex(img => img.id === image.id);
    setSelectedImageIndex(index);
    setSelectedImage(image);
    setModalOpen(true);
  };

  // Add functions to navigate between images
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (selectedImageIndex - 1 + images.length) % images.length;
    setSelectedImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (selectedImageIndex + 1) % images.length;
    setSelectedImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  // Add keyboard navigation for images
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!modalOpen) return;
      
      if (event.key === 'Escape') {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
      } else if (event.key === 'ArrowLeft') {
        const newIndex = (selectedImageIndex - 1 + images.length) % images.length;
        setSelectedImageIndex(newIndex);
        setSelectedImage(images[newIndex]);
      } else if (event.key === 'ArrowRight') {
        const newIndex = (selectedImageIndex + 1) % images.length;
        setSelectedImageIndex(newIndex);
        setSelectedImage(images[newIndex]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, selectedImageIndex, images]);

  // Add download all images function
  const handleDownloadAllImages = async () => {
    try {
      setDownloading(true);
      
      // Use fetch to get the ZIP file
      const response = await fetch(`/api/artists/${id}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download images');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = url;
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${artist?.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'artist'}_gallery.zip`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      
      // Append to the document
      document.body.appendChild(a);
      
      // Trigger the download
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading images:', err);
      alert('Error downloading images: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">Loading artist gallery...</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-red-500">{error || 'Artist not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link href="/">
          <div className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md mr-4">
            &larr; Back to Artists
          </div>
        </Link>
        <h1 className="text-3xl font-bold">{artist.nombre}'s Gallery</h1>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Created: {new Date(artist.fecha_creacion).toLocaleDateString()}
        </p>
        
        <div className="flex space-x-4">
          {/* Download All Images Button */}
          <button 
            onClick={handleDownloadAllImages}
            disabled={downloading || images.length === 0}
            className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center ${images.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {downloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Descargando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Descargar todas las imágenes
              </>
            )}
          </button>
          
          {/* Add Image Button (existing) */}
          <div className="relative">
            <button 
              onClick={handleAddImage}
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Añadir imágenes
                </>
              )}
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".jpg,.jpeg,.png" 
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
          </div>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          No images available for this artist.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
              {/* Delete button - positioned in the top right */}
              <button 
                onClick={(e) => openDeleteConfirmation(image, e)}
                className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-colors"
                title="Delete image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              {/* Image container */}
              <div 
                className="relative h-48 w-full cursor-pointer" 
                onClick={() => openImageModal(image)}
              >
                {image.imagen ? (
                  <Image 
                  src={`/api/images/${image.id}`}
                  alt={`Art by ${artist.nombre}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    console.error('Image load error for ID:', image.id);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100">
                    <p className="text-gray-400">Image data missing</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  Uploaded: {new Date(image.fecha_subida).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Format: {image.formato?.toUpperCase() || 'Unknown'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for displaying full-size images */}
      {modalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef} 
            className="bg-white rounded-lg overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col relative"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">
                {artist.nombre}'s Artwork ({selectedImageIndex + 1}/{images.length})
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative flex-grow overflow-auto flex items-center justify-center p-4">
              {/* Left navigation arrow */}
              {images.length > 1 && (
                <button 
                  onClick={goToPreviousImage}
                  className="absolute left-4 bg-white bg-opacity-50 hover:bg-opacity-80 rounded-full p-2 text-gray-800 hover:text-black shadow-md transition-all"
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              <img 
                src={`/api/images/${selectedImage.id}`}
                alt={`Art by ${artist.nombre}`}
                className="max-w-full max-h-[70vh] object-contain"
              />

              {/* Right navigation arrow */}
              {images.length > 1 && (
                <button 
                  onClick={goToNextImage}
                  className="absolute right-4 bg-white bg-opacity-50 hover:bg-opacity-80 rounded-full p-2 text-gray-800 hover:text-black shadow-md transition-all"
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="p-4 border-t">
              <p>Uploaded: {new Date(selectedImage.fecha_subida).toLocaleDateString()}</p>
              <p>Format: {selectedImage.formato?.toUpperCase() || 'Unknown'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteModalOpen && imageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div 
            ref={deleteModalRef} 
            className="bg-white rounded-lg overflow-hidden w-full max-w-md"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar eliminación
              </h3>
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setConfirmDeleteModalOpen(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteImage}
                  disabled={deleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
                >
                  {deleting ? (
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
                      Eliminar Imagen
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