import React, { useState, useRef } from 'react'
import { IoClose, IoChevronBack, IoChevronForward, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5'

export default function GalleryGrid() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Control audio state
  const videoRef = useRef<HTMLVideoElement>(null);

  const staticMedia = [
    { type: 'image', url: 'https://picsum.photos/800/600?random=1' },
    { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { type: 'image', url: 'https://picsum.photos/600/800?random=2' },
    { type: 'image', url: 'https://picsum.photos/800/800?random=3' },
    { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' },
    { type: 'image', url: 'https://picsum.photos/800/600?random=4' },
  ];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % staticMedia.length : 0));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + staticMedia.length) % staticMedia.length : staticMedia.length - 1));
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const selectedMedia = selectedIndex !== null ? staticMedia[selectedIndex] : null;

  return (
    <div className="relative p-4">
      {/* 1. Grid View */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
        {staticMedia.map((item, i) => (
          <div 
            key={i} 
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
                alt="" 
                className="w-full h-auto object-cover" 
              />
            )}
          </div>
        ))}
      </div>

      {/* 2. Lightbox Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Navigation Controls */}
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

          {/* Media Content */}
          <div 
            className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {selectedMedia.type === 'video' ? (
              <div className="relative w-full">
                <video 
                  ref={videoRef}
                  key={selectedMedia.url} 
                  src={selectedMedia.url} 
                  controls // Standard play/pause/timeline controls
                  autoPlay 
                  muted={isMuted} // Controlled by state
                  loop
                  playsInline
                  className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
                />
                
                
              </div>
            ) : (
              <img 
                src={selectedMedia.url} 
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