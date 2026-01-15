import React from 'react';

export default function GalleryItem({ item, onClick }) {
  return (
    <div 
      onClick={onClick}
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
    </div>
  );
}