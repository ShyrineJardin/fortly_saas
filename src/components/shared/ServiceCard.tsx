import React, { useState } from "react";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { CiCircleChevRight } from "react-icons/ci";
import { useNavigate, useParams } from "react-router-dom";

interface ServiceProps {
  id: string | number;
  title: string;
  duration: string;
  price: string;
  description: string;
  image?: string;
  showArrow?: boolean;
  serviceType?: string; // 'appointment' | 'preparation' | 'occupancy'
}

const SERVICE_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  appointment: {
    icon: '📅',
    label: 'Appointment',
    color: 'bg-blue-50 text-blue-700 border-blue-100'
  },
  preparation: {
    icon: '🎂',
    label: 'Preparation / Order',
    color: 'bg-orange-50 text-orange-700 border-orange-100'
  },
  occupancy: {
    icon: '🏗️',
    label: 'Occupancy / Rental',
    color: 'bg-purple-50 text-purple-700 border-purple-100'
  }
};

export default function ServiceCard({
  id,
  title,
  duration,
  price,
  description,
  image,
  showArrow = false,
  serviceType
}: ServiceProps) {

  // Don't assume appointment - only show badge if serviceType is explicitly set
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();

  const typeConfig = serviceType ? (SERVICE_TYPE_CONFIG[serviceType] || null) : null;

  const handleBooking = () => {
    const serviceData = { id, title, duration, price, description, image, serviceType };
    navigate(`/${businessSlug}/booking`, { state: { selectedService: serviceData } });
  };

  return (
    <div className="bg-white border border-border rounded-2xl lg:p-4 p-2 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          {image ? (
            <img
              src={image}
              alt={title}
              className="lg:w-20 lg:h-20 w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 object-cover"
            />
          ) : (
            <div className="lg:w-16 lg:h-16 w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
          )}

          <div className="flex-1">
            {/* Service Type Badge */}
            {typeConfig && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mb-1 ${typeConfig.color}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
            )}

            <h3 className="lg:text-base text-sm font-semibold">{title}</h3>
            <p className="lg:text-sm text-xs text-gray-500">{duration} · {price}</p>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:text-sm text-xs flex items-center gap-1 lg:mt-1 hover:underline text-gray-600"
            >
              More Details
              {isOpen ? FaAngleUp({ size: 14 }) : FaAngleDown({ size: 14 })}
            </button>
          </div>
        </div>

        {showArrow && (
          <button
            onClick={handleBooking}
            className="text-primaryGreen hover:scale-110 transition-transform"
          >
            {CiCircleChevRight({ size: 40 })}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-2 border-t border-gray-50 pt-3 lg:text-sm text-xs text-gray-600 animate-in fade-in slide-in-from-top-1">
          {description}
        </div>
      )}
    </div>
  );
}