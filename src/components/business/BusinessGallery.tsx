import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronBack, IoChevronForward, IoTrash, IoAdd } from 'react-icons/io5'
import { MdVideocam } from 'react-icons/md'
import { galleryAPI } from '../../utils/api'

interface GalleryItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  order: number;
}

export default function BusinessGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await galleryAPI.getMyGallery();
      setMedia(response.data.gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('order', '0');

        await galleryAPI.upload(formData);
      }

      // Refresh gallery after upload
      await fetchGallery();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload some files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await galleryAPI.delete(id);
        await fetchGallery();
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        }
      } catch (error) {
        console.error('Error deleting gallery item:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % media.length : 0));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + media.length) % media.length : media.length - 1));
  };

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Upload Button */}
      <div className="mb-4 flex justify-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {IoAdd({size: 20})}
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
        </button>
      </div>

      {/* Empty State */}
      {media.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No media uploaded yet</p>
        </div>
      )}

      {/* Grid View */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
        {media.map((item, i) => (
          <div 
            key={item.id}
            onClick={() => setSelectedIndex(i)}
            className="bg-gray-200 rounded-xl overflow-hidden break-inside-avoid cursor-pointer hover:opacity-90 transition-all group relative"
          >
            {item.mediaType === 'video' ? (
              <video 
                src={`http://localhost:5000${item.mediaUrl}`}
                className="w-full h-auto object-cover" 
                muted 
                autoPlay 
                loop 
                playsInline
              />
            ) : (
              <img 
                src={`http://localhost:5000${item.mediaUrl}`}
                alt={item.caption || "Gallery post"} 
                className="w-full h-auto object-cover" 
              />
            )}

            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {IoTrash({size: 16})}
            </button>

            {/* Video indicator */}
            {item.mediaType === 'video' && (
              <div className="absolute top-2 left-2 bg-black/60 text-white p-1 rounded">
                {MdVideocam({size: 20})} 
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl z-50 hover:scale-110 transition-transform"
            onClick={() => setSelectedIndex(null)}
          >
            {IoClose({})}
          </button>

          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-8 text-white text-3xl bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronBack({})}
          </button>

          <div 
            className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {selectedMedia.mediaType === 'video' ? (
              <video 
                ref={videoRef}
                key={selectedMedia.mediaUrl} 
                src={`http://localhost:5000${selectedMedia.mediaUrl}`}
                controls 
                autoPlay 
                loop
                playsInline
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
              />
            ) : (
              <img 
                src={`http://localhost:5000${selectedMedia.mediaUrl}`}
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
                alt="Large view"
              />
            )}

            {/* Delete button in lightbox */}
            <button
              onClick={(e) => handleDelete(selectedMedia.id, e)}
              className="mt-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {IoTrash({size: 16})}
              <span>Delete</span>
            </button>
          </div>

          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-8 text-white text-3xl bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronForward({})}
          </button>
        </div>
      )}
    </div>
  )
}