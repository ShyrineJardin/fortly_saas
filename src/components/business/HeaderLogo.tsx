import React from "react";

export default function HeaderLogo() {
  return (
    <header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <img 
                className="lg:h-[30px] lg:w-[30px] w-[24px] h-[24px] object-contain" 
                src="/Fortly_logo.png" 
                alt="Fortly Logo" 
              />
            <h1 className="text-2xl font-logo text-black">Fortly</h1>
          </div>
        </div>
      </div>
    </header>
  );
}