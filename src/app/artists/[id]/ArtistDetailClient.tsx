'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';

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
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [imageRefreshKey, setImageRefreshKey] = useState<number>(Date.now());
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const [visibleImages, setVisibleImages] = useState<GalleryImage[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [imagesPerPage] = useState<number>(20);
  
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
        
        // Initialize visible images for pagination
        setVisibleImages(imagesData.slice(0, imagesPerPage));
      } catch (err) {
        setError('Failed to load artist data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtistAndImages();
  }, [id, imagesPerPage]);

  // Effect to handle pagination when images change
  useEffect(() => {
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    setVisibleImages(images.slice(startIndex, endIndex));
  }, [images, currentPage, imagesPerPage]);

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
      setUploadProgress({current: 0, total: files.length});
      
      const formData = new FormData();
      let validFileCount = 0;
      
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
        validFileCount++;
      }
      
      if (validFileCount === 0) {
        throw new Error('No se encontraron archivos de imagen válidos');
      }
      
      setUploadProgress({current: 0, total: validFileCount});
      
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
      
      // Force refresh of image cache
      setImageRefreshKey(Date.now());
      
    } catch (err) {
      console.error('Error uploading images:', err);
      alert('Error al subir las imágenes: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setUploading(false);
      setUploadProgress({current: 0, total: 0});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Effect to handle image array changes and maintain modal consistency
  useEffect(() => {
    if (modalOpen && selectedImage && images.length > 0) {
      // Verify that the selected image still exists in the current images array
      const currentIndex = images.findIndex(img => img.id === selectedImage.id);
      if (currentIndex === -1) {
        // Selected image no longer exists, close modal
        setModalOpen(false);
        setSelectedImage(null);
        setSelectedImageIndex(0);
      } else if (currentIndex !== selectedImageIndex) {
        // Update index if it has changed due to array modifications
        setSelectedImageIndex(currentIndex);
      }
    }
  }, [images, modalOpen, selectedImage, selectedImageIndex]);

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
      const newImages = images.filter(img => img.id !== imageToDelete.id);
      setImages(newImages);
      
      // Force refresh of image cache
      setImageRefreshKey(Date.now());
      
      // If we're in modal view and deleted image was the selected one, handle navigation
      if (modalOpen && selectedImage?.id === imageToDelete.id) {
        if (newImages.length === 0) {
          // No images left, close modal
          setModalOpen(false);
          setSelectedImage(null);
          setSelectedImageIndex(0);
        } else {
          // Find new image to show
          let newIndex = selectedImageIndex;
          if (newIndex >= newImages.length) {
            newIndex = newImages.length - 1;
          }
          setSelectedImageIndex(newIndex);
          setSelectedImage(newImages[newIndex]);
        }
      } else if (modalOpen && selectedImage) {
        // Update selected image index if it shifted due to deletion
        const newSelectedIndex = newImages.findIndex(img => img.id === selectedImage.id);
        if (newSelectedIndex !== -1) {
          setSelectedImageIndex(newSelectedIndex);
        }
      }
      
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
    if (index === -1) {
      console.error('Image not found in current images array');
      return;
    }
    setSelectedImageIndex(index);
    setSelectedImage(image);
    setModalOpen(true);
    
    // Preload adjacent images for smooth navigation
    preloadAdjacentImages(index);
  };

  const preloadAdjacentImages = (currentIndex: number) => {
    const imagesToPreload = [];
    
    // Preload previous image
    if (currentIndex > 0) {
      imagesToPreload.push(images[currentIndex - 1].id);
    }
    
    // Preload next image
    if (currentIndex < images.length - 1) {
      imagesToPreload.push(images[currentIndex + 1].id);
    }
    
    imagesToPreload.forEach(imageId => {
      if (!preloadedImages.has(imageId)) {
        const img = new window.Image();
        img.src = `/api/images/${imageId}?v=${imageRefreshKey}`;
        img.onload = () => {
          setPreloadedImages(prev => new Set(prev).add(imageId));
        };
      }
    });
  };

  // Pagination functions
  const totalPages = Math.ceil(images.length / imagesPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of gallery
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadMoreImages = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * imagesPerPage;
      const endIndex = startIndex + imagesPerPage;
      const newImages = images.slice(startIndex, endIndex);
      
      setVisibleImages(prev => [...prev, ...newImages]);
      setCurrentPage(nextPage);
    }
  };

  // Add functions to navigate between images
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (selectedImageIndex - 1 + images.length) % images.length;
    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
      preloadAdjacentImages(newIndex);
    }
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    
    const newIndex = (selectedImageIndex + 1) % images.length;
    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
      preloadAdjacentImages(newIndex);
    }
  };

  // Add keyboard navigation for images
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!modalOpen || images.length === 0) return;
      
      if (event.key === 'Escape') {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
      } else if (event.key === 'ArrowLeft') {
        const newIndex = (selectedImageIndex - 1 + images.length) % images.length;
        if (newIndex >= 0 && newIndex < images.length) {
          setSelectedImageIndex(newIndex);
          setSelectedImage(images[newIndex]);
          preloadAdjacentImages(newIndex);
        }
      } else if (event.key === 'ArrowRight') {
        const newIndex = (selectedImageIndex + 1) % images.length;
        if (newIndex >= 0 && newIndex < images.length) {
          setSelectedImageIndex(newIndex);
          setSelectedImage(images[newIndex]);
          preloadAdjacentImages(newIndex);
        }
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
              className={`${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
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
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          No images available for this artist.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleImages.map((image) => (
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
                    <OptimizedImage
                      imageId={image.id}
                      alt={`Art by ${artist.nombre}`}
                      className="w-full h-full"
                      onClick={() => openImageModal(image)}
                      refreshKey={imageRefreshKey}
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

          {/* Pagination Controls */}
          {images.length > imagesPerPage && (
            <div className="mt-8 flex flex-col items-center space-y-4">
              {/* Load More Button (Infinite Scroll Style) */}
              {visibleImages.length < images.length && (
                <button
                  onClick={loadMoreImages}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors duration-200"
                >
                  Cargar más imágenes ({images.length - visibleImages.length} restantes)
                </button>
              )}

              {/* Page Numbers */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Mostrando {visibleImages.length} de {images.length} imágenes
              </p>
            </div>
          )}
        </>
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
                src={`/api/images/${selectedImage.id}?v=${imageRefreshKey}`}
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

      {/* Upload Loading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <svg className="animate-spin mx-auto h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Subiendo imágenes...
              </h3>
              <p className="text-gray-600 mb-4">
                Por favor espera mientras procesamos tus imágenes
              </p>
              {uploadProgress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${(uploadProgress.current / uploadProgress.total) * 100}%`}}
                  ></div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {uploadProgress.total > 0 
                  ? `Procesando ${uploadProgress.total} imagen${uploadProgress.total > 1 ? 's' : ''}...`
                  : 'Iniciando subida...'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}