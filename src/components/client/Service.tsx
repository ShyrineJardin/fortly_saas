import React, { useState } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { CiCircleChevRight } from "react-icons/ci";
import BookingPolicy from "../shared/BookingPolicy";
import ServiceCard from "../shared/ServiceCard";

export default function Service() {
  const [isOpen, setIsOpen] = useState(false);

  const services = [
    {
      id: 1,
      title: "Full Body Massage",
      duration: "60 mins",
      price: "PHP 1,500.00",
      description: "A relaxing full body massage using organic essential oils to relieve stress and muscle tension."
    },
    {
      id: 2,
      title: "Facial Treatment",
      duration: "45 mins",
      price: "PHP 1,200.00",
      description: "Deep cleansing facial treatment suitable for all skin types. Includes mask and extraction."
    }
  ];

  return (
    <div>
      {/* Booking Policy Section */}
      <BookingPolicy 
         title="Booking Policy"
         description="Our booking policy ensures that all appointments are scheduled fairly."
         policyList={[
           "All bookings must be made 24h in advance.",
           "Cancellations must be made 12h prior."
         ]}
      />

      {/* Services Section */}
      <div>
        <h2 className="lg:text-lg text-base font-semibold mb-4">Services</h2>
        
        {/* Dynamic Service Cards */}
        <div className="mb-6">
          {services.map((service) => (
            <ServiceCard 
              key={service.id}      
              id={service.id}       
              title={service.title}
              duration={service.duration}
              price={service.price}
              description={service.description}
              showArrow={true}
            />
          ))}
        </div> 

      </div>
    </div>
  );
}