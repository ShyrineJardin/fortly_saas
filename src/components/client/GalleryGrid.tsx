import React, { useState, useRef } from 'react'
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5'
import GalleryItem from '../shared/GalleryItem'; // Import the new shared component

export default function GalleryGrid() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const staticMedia = [
    { type: 'image', url: 'https://picsum.photos/800/600?random=1' },
    { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { type: 'image', url: 'https://picsum.photos/600/800?random=2' },
    { type: 'image', url: 'https://picsum.photos/800/800?random=3' },
    { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' },
    { type: 'image', url: 'https://picsum.photos/800/600?random=4' },
  ];

  const handleNext = (e) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % staticMedia.length : 0));
  };

  const handlePrev = (e) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + staticMedia.length) % staticMedia.length : staticMedia.length - 1));
  };

  const selectedMedia = selectedIndex !== null ? staticMedia[selectedIndex] : null;

  return (
    <div className="relative p-4">
      {/* 1. Grid View using Shared GalleryItem */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
        {staticMedia.map((item, i) => (
          <GalleryItem 
            key={i} 
            item={item} 
            onClick={() => setSelectedIndex(i)} 
          />
        ))}
      </div>

      {/* 2. Lightbox Modal */}
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