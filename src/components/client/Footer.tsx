import React from "react";

export default function Footer() {
  return (
    <footer className="w-full lg:p-10 p-5 pb-5 bg-transparent">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start lg:gap-8 gap-4">
        
        {/* Left Side: Logo and Tagline */}
        <div className="flex flex-col items-start">
          <div className="flex gap-3 items-center">
            <img 
              className="lg:h-[30px] lg:w-[30px] w-[24px] h-[24px] object-contain" 
              src="/Fortly_logo.png" 
              alt="Fortly Logo" 
            />
            <h2 className="font-logo lg:text-3xl text-2xl text-white">Fortly</h2>
          </div>
          <div className="text-footerTextPrimary lg:text-base text-sm mt-2 font-medium">
            Small page. Big impact.
          </div>
        </div>

        {/* Right Side: Description */}
        <div className="flex flex-col items-end max-w-md">
          <p className="text-footerTextPrimary lg:text-base  md:text-sm text-xs md:text-right">
            Turn your business into a shareable page, let clients book instantly, 
            and chat all in one place — with <span className="text-white font-semibold">Fortly</span>. 
            Start free today, just click <span className="font-semibold text-primaryGreen"><a href="/signup">here</a></span>!.
          </p>
        </div>
      </div>

      {/* Bottom Section: Divider and Copyright */}
      <div className="lg:mt-10 mt-5 border-t border-divider lg:pt-5 pt-3 flex justify-center">
        <div className="text-footerTextSecondary lg:text-sm text-xs text-center opacity-60">
          &copy; {new Date().getFullYear()} Fortly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}