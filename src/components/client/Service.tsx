import React, { useState, useEffect } from "react";
import BookingPolicy from "../shared/BookingPolicy";
import ServiceCard from "../shared/ServiceCard";
import { useParams } from "react-router-dom";
import { businessAPI } from '../../utils/api';
import { getCached, setCached } from '../../utils/apiCache';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
  image?: string;
  serviceType?: string;
}

interface BookingPolicyData {
  title: string;
  description: string;
  policyList: string[];
}

export default function Service() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicyData>({ title: "Booking Policy", description: "", policyList: [] });

  useEffect(() => { loadBusinessData(); }, [businessSlug]);

  const loadBusinessData = async () => {
    const cacheKey = `services-client-${businessSlug}`;

    const cached = getCached<any>(cacheKey);
    if (cached) {
      setServices(cached.services);
      setBookingPolicy(cached.bookingPolicy);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await businessAPI.getBySlug(businessSlug || '');
      const businessData = response.data.business;
      if (!businessData) throw new Error('Business not found');

      const policy = {
        title: businessData.bookingPolicyTitle || "Booking Policy",
        description: businessData.bookingPolicyDescription || "",
        policyList: businessData.bookingPolicyList || []
      };
      const svcs = businessData.services || [];

      setCached(cacheKey, { services: svcs, bookingPolicy: policy });
      setServices(svcs);
      setBookingPolicy(policy);
    } catch (err: any) {
      console.error('Error loading business data:', err);
      setError(err.message || 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8"><p className="text-gray-500">Loading...</p></div>;
  if (error) return <div className="p-4"><div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div></div>;

  return (
    <div>
      <BookingPolicy title={bookingPolicy.title} description={bookingPolicy.description} policyList={bookingPolicy.policyList} />
      <div>
        <h2 className="lg:text-lg text-base font-semibold mb-4">Services</h2>
        {services.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No services available at the moment.</p>
        ) : (
          <div className="mb-6">
            {services.map((service) => (
              <ServiceCard key={service.id} id={service.id} title={service.name} duration={service.duration} price={service.price} description={service.description} image={service.image} serviceType={service.serviceType} showArrow={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}