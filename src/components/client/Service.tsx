import React, { useState } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { CiCircleChevRight } from "react-icons/ci";

export default function Service() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Booking Policy Section */}
      <div className="bg-policyBackground p-6 rounded-2xl border border-policyBorder gap-4 flex flex-col mb-6">
        <h2 className="lg:text-base text-sm font-semibold">Booking Policy</h2>
        <div className="text-policyBodyText lg:text-sm text-xs">
          <p>Our booking policy ensures that all appointments are scheduled fairly and efficiently.</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>All bookings must be made at least 24 hours in advance.</li>
            <li>Cancellations must be made at least 12 hours prior.</li>
          </ol>
        </div>
      </div>

      {/* Services Section */}
      <div>
        <h2 className="lg:text-lg text-base font-semibold mb-4">Services</h2>
        
        {/* Service Card */}
        <div className="bg-white border border-border rounded-2xl lg:p-4 p-2 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              {/* Image Placeholder */}
              <div className="lg:w-16 lg:h-16 w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              
              {/* Text Content */}
              <div>
                <h3 className="lg:text-base text-sm font-semibold">Service Card</h3>
                <p className="lg:text-sm text-xs">25 mins . PHP 1,500.00</p>
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="lg:text-sm text-xs flex items-center gap-1 lg:mt-1 hover:underline"
                >
                  More Details 
                  {isOpen ? FaAngleUp({size: 14}) : FaAngleDown({size: 14})}
                </button>
              </div>
            </div>

            {/* Right Action Icon */}
            <button className="text-primaryGreen hover:text-white hover:bg-primaryGreen transition-colors rounded-full p-0"> <a href="/booking">{CiCircleChevRight({size: 40})}</a></button>
          </div> 

          {/* Expandable Details Area */}
          {isOpen && (
            <div className="mt-4 border-t border-gray-50 lg:text-sm text-xs text-gray-600 animate-in fade-in slide-in-from-top-1">
              Lorem ipsum dolor sit amet. Qui ullam rerum est voluptas consequatur eum asperiores aliquam est maxime doloremque. Hic blanditiis debitis et dolores voluptate ut repudiandae necessitatibus et sint voluptatibus.
            </div>
          )}
        </div>       

      </div>
    </div>
  );
}