import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { MdVideocam } from 'react-icons/md'
import { galleryAPI } from '../../utils/api'
import { useParams } from 'react-router-dom'

interface GalleryItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  order: number;
}

export default function GalleryGrid() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchGallery();
  }, [businessSlug]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await galleryAPI.getByBusinessSlug(businessSlug || '');
      setMedia(response.data.gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
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

  if (media.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No photos or videos yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
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
                src={item.mediaUrl}
                className="w-full h-auto object-cover" 
                muted 
                autoPlay 
                loop 
                playsInline
              />
            ) : (
              <img 
                src={item.mediaUrl}
                alt={item.caption || "Gallery post"} 
                className="w-full h-auto object-cover" 
              />
            )}

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
                src={selectedMedia.mediaUrl}
                controls 
                autoPlay 
                loop
                playsInline
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
              />
            ) : (
              <img 
                src={selectedMedia.mediaUrl}
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
                alt="Large view"
              />
            )}
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