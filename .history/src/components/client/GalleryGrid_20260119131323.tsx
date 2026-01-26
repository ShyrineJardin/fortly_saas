import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { MdVideocam } from 'react-icons/md'

interface GalleryItem {
  id: number;
  type: 'image' | 'video';
  url: string;
}

// Same store reference as BusinessGallery
let galleryMedia: GalleryItem[] = [
  { id: 1, type: 'image', url: 'https://picsum.photos/800/600?random=1', uploadedAt: new Date('2024-01-15') },
  { id: 2, type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', uploadedAt: new Date('2024-01-14') },
  { id: 3, type: 'image', url: 'https://picsum.photos/600/800?random=2', uploadedAt: new Date('2024-01-13') },
  { id: 4, type: 'image', url: 'https://picsum.photos/800/800?random=3', uploadedAt: new Date('2024-01-12') },
  { id: 5, type: 'video', url: 'https://www.w3schools.com/html/movie.mp4', uploadedAt: new Date('2024-01-11') },
  { id: 6, type: 'image', url: 'https://picsum.photos/800/600?random=4', uploadedAt: new Date('2024-01-10') },
];

const listeners = new Set<() => void>();

const galleryStore = {
  getMedia: () => [...galleryMedia].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()),
  
  addMedia: (newMedia: GalleryItem) => {
    galleryMedia = [newMedia, ...galleryMedia];
    listeners.forEach(listener => listener());
  },
  
  deleteMedia: (id: number) => {
    galleryMedia = galleryMedia.filter(item => item.id !== id);
    listeners.forEach(listener => listener());
  },
  
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export default function GalleryGrid() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [media, setMedia] = useState<GalleryItem[]>(galleryStore.getMedia());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsubscribe = galleryStore.subscribe(() => {
      setMedia(galleryStore.getMedia());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % media.length : 0));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + media.length) % media.length : media.length - 1));
  };


  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <div className="relative p-4">
      {/* Grid View */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
        {media.map((item, i) => (
          <div 
            key={item.id}
            onClick={() => setSelectedIndex(i)}
            className="bg-gray-200 rounded-xl overflow-hidden break-inside-avoid cursor-pointer hover:opacity-90 transition-all group relative"
          >
            {item.type === 'video' ? (
              <video 
                src={item.url} 
                className="w-full h-auto object-cover" 
                muted 
                autoPlay 
                loop 
                playsInline
              />
            ) : (
              <img 
                src={item.url} 
                alt="Gallery post" 
                className="w-full h-auto object-cover" 
              />
            )}
            
            {/* Upload date overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs">{formatDate(item.uploadedAt)}</p>
            </div>

            {/* Video indicator */}
            {item.type === 'video' && (
              <div className="absolute top-2 left-2 bg-black/60 text-white p-1 rounded">
                {MdVideocam ({size:20})} 
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
            {IoClose ({})}
          </button>

          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-8 text-white text-3xl bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronBack ({})}
          </button>

          <div 
            className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {selectedMedia.type === 'video' ? (
              <video 
                ref={videoRef}
                key={selectedMedia.url} 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                muted={isMuted} 
                loop
                playsInline
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
                alt="Large view"
              />
            )}
            
            {/* Upload date in lightbox */}
            <div className="mt-4 text-white text-sm">
              Uploaded: {formatDate(selectedMedia.uploadedAt)}
            </div>
          </div>

          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-8 text-white text-3xl bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronForward ({})}
          </button>
        </div>
      )}
    </div>
  )
}