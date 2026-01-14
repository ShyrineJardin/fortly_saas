import React from "react";

export default function Footer() {
  return (
    <footer className="w-full p-10 pb-5 bg-transparent">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* Left Side: Logo and Tagline */}
        <div className="flex flex-col items-start">
          <div className="flex gap-3 items-center">
            <img 
              className="h-[30px] w-[30px] object-contain" 
              src="/Fortly_logo.png" 
              alt="Fortly Logo" 
            />
            <h2 className="font-logo text-3xl text-white">Fortly</h2>
          </div>
          <div className="text-footerTextPrimary text-base mt-2 font-medium">
            Small page. Big impact.
          </div>
        </div>

        {/* Right Side: Description */}
        <div className="flex flex-col items-end max-w-md">
          <p className="text-footerTextPrimary text-base  ">
            Turn your business into a shareable page, let clients book instantly, 
            and chat all in one place — with <span className="text-white font-semibold">Fortly</span>. 
            Start free <span className="font-semibold text-primaryGreen"><a href="/signup">today</a></span>.
          </p>
        </div>
      </div>

      {/* Bottom Section: Divider and Copyright */}
      <div className="mt-10 border-t border-divider pt-5 flex justify-center">
        <div className="text-footerTextSecondary text-sm text-center opacity-60">
          &copy; {new Date().getFullYear()} Fortly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}