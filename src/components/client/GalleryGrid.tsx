import React, { useState } from 'react'
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5'

export default function GalleryGrid() {
  // Track the index of the selected item instead of the object
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const staticMedia = [
    { type: 'image', url: 'https://picsum.photos/800/800?random=1' },
    { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { type: 'image', url: 'https://picsum.photos/800/800?random=2' },
    { type: 'image', url: 'https://picsum.photos/800/800?random=3' },
    { type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  const handleNext = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % staticMedia.length : 0));
  };

  const handlePrev = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); 
    setSelectedIndex((prev) => (prev !== null ? (prev - 1 + staticMedia.length) % staticMedia.length : staticMedia.length - 1));
  };

  const selectedMedia = selectedIndex !== null ? staticMedia[selectedIndex] : null;

  return (
    <div className="relative">
      {/* 1. Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {staticMedia.map((item, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedIndex(i)}
            className="bg-gray-200 rounded-xl overflow-hidden aspect-square w-full cursor-pointer hover:opacity-90 transition-all"
          >
            {item.type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* 2. Lightbox Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Close Button */}
          <button className="absolute top-5 right-5 text-white text-3xl z-50">
            {IoClose({})}
          </button>

          {/* Previous Button */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-10 text-white text-4xl bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronBack({})}
          </button>

          {/* Media Content */}
          <div 
            className="max-w-4xl w-full max-h-[85vh] flex justify-center items-center"
            onClick={(e) => e.stopPropagation()} 
          >
            {selectedMedia.type === 'video' ? (
              <video 
                key={selectedMedia.url} 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
                alt="Large view"
              />
            )}
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-10 text-white text-4xl bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all z-50"
          >
            {IoChevronForward({})}
          </button>
        </div>
      )}
    </div>
  )
}