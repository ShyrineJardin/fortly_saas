import React, { useState, useRef, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { MdImage } from "react-icons/md";
import { LuPencil } from "react-icons/lu";
import { authAPI, businessAPI, servicesAPI } from "../../utils/api";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description: string;
  image?: string;
}

interface BookingPolicyData {
  title: string;
  description: string;
  policyList: string[];
}

export default function BusinessService() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicyData>({
    title: "Booking Policy",
    description: "",
    policyList: []
  });

  const [services, setServices] = useState<Service[]>([]);

  const [policyForm, setPolicyForm] = useState(bookingPolicy);
  const [serviceForm, setServiceForm] = useState<Service>({
    id: '',
    name: "",
    duration: "",
    price: "",
    description: "",
    image: ""
  });
  

  const [currency, setCurrency] = useState("PHP");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load business data (for booking policy)
      const businessResponse = await authAPI.getMe();
      const business = businessResponse.data.business;
      
      setBookingPolicy({
        title: business.bookingPolicyTitle || "Booking Policy",
        description: business.bookingPolicyDescription || "",
        policyList: business.bookingPolicyList || []
      });

      // Load services
      const servicesResponse = await servicesAPI.getMyServices();
      setServices(servicesResponse.data.services);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Policy Handlers
  const handlePolicyEdit = () => {
    setPolicyForm(bookingPolicy);
    setShowPolicyModal(true);
  };

  const handlePolicySave = async () => {
    try {
      await businessAPI.updateBookingPolicy({
        title: policyForm.title,
        description: policyForm.description,
        policyList: policyForm.policyList
      });

      setBookingPolicy(policyForm);
      setShowPolicyModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save booking policy');
    }
  };

      const [bufferTime, setBufferTime] = useState("15 minutes");

    const [weeklySchedule, setWeeklySchedule] = useState([
    { day: "Monday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Tuesday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Wednesday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Thursday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Friday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Saturday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Sunday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" }
  ]);

  const addPolicyItem = () => {
    setPolicyForm({
      ...policyForm,
      policyList: [...policyForm.policyList, ""]
    });
  };

  const updatePolicyItem = (index: number, value: string) => {
    const newList = [...policyForm.policyList];
    newList[index] = value;
    setPolicyForm({ ...policyForm, policyList: newList });
  };

  const removePolicyItem = (index: number) => {
    setPolicyForm({
      ...policyForm,
      policyList: policyForm.policyList.filter((_, i) => i !== index)
    });
  };

  // Service Handlers
  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      id: '',
      name: "",
      duration: "",
      price: "",
      description: "",
      image: ""
    });
    setShowServiceModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await servicesAPI.delete(id);
        await loadData(); // Reload services
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete service');
      }
    }
  };

  const handleServiceSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', serviceForm.name);
      formData.append('description', serviceForm.description);
      formData.append('price', serviceForm.price);
      formData.append('duration', serviceForm.duration);
      
      if (serviceForm.image && typeof serviceForm.image !== 'string') {
        formData.append('image', serviceForm.image);
      }

      if (editingService) {
        await servicesAPI.update(editingService.id, formData);
      } else {
        await servicesAPI.create(formData);
      }

      setShowServiceModal(false);
      await loadData(); // Reload services
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setServiceForm({ ...serviceForm, image: file as any });
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }



  const toggleScheduleDay = (index: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setWeeklySchedule(newSchedule);
  };

  const updateScheduleTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index][field] = value;
    setWeeklySchedule(newSchedule);
  };


  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Booking Policy Section */}
      <div className="bg-policyBackground p-6 rounded-2xl border border-policyBorder gap-4 flex flex-col mb-6 relative">
        <button
          onClick={handlePolicyEdit}
          className="absolute top-4 right-4 flex items-center gap-1 text-sm text-emerald-600 border border-emerald-600 rounded-full px-3 py-1"
        >
          {LuPencil({size:14})}<span>Edit</span>
        </button>
        
        <h2 className="lg:text-base text-sm font-semibold">{bookingPolicy.title}</h2>
        <div className="text-gray-700 text-sm">
          <p className="text-policyBodyText lg:text-sm text-xs">{bookingPolicy.description}</p>
          {bookingPolicy.policyList.length > 0 && (
            <ol className="list-decimal list-inside space-y-1 mt-2">
              {bookingPolicy.policyList.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="lg:text-lg text-base font-semibold mb-4">Services</h2>
          <button
            onClick={handleAddService}
            className="flex items-center btn-secondary"
          >
            {FaPlus({ size: 14 })}
            Add Service
          </button>
        </div>

        {services.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No services yet. Add your first service!</p>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-border rounded-2xl lg:p-4 p-2 shadow-sm mb-4 relative group">
                <div className="flex gap-4">
                  {service.image ? (
                    <img 
                      src={`http://localhost:5000${service.image}`}
                      alt={service.name}
                      className="lg:w-16 lg:h-16 w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0 object-cover" 
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="lg:text-base text-sm font-semibold">{service.name}</h3>
                    <p className="lg:text-sm text-xs text-gray-500">{service.duration} · {service.price}</p>
                    <p className="lg:text-sm text-xs flex items-center gap-1 lg:mt-1 hover:underline text-gray-600">{service.description}</p>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditService(service)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  >
                    {FaEdit({ size: 14 })}
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    {FaTrash({ size: 14 })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Weekly Schedule Section */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="lg:text-base text-sm font-semibold">Set your weekly schedule</h2>
        <p className="lg:text-sm text-xs text-gray-600 mb-6">Manage your timeslots to accept bookings only during the marked hours</p>
        
        <div className="space-y-3">
          {weeklySchedule.map((day, index) => (
            <div key={day.day} className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={() => toggleScheduleDay(index)}
                className="w-5 h-5"
              />
              <span className="w-28 text-sm font-medium">{day.day}</span>
              {day.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateScheduleTime(index, 'startTime', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-500">-</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateScheduleTime(index, 'endTime', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ) : (
                <button
                  onClick={() => toggleScheduleDay(index)}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  + Add hours
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Buffer Time */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Buffer Time</h3>
          <p className="lg:text-sm text-xs text-gray-600 mb-3">How long before the slot speeds to give a cushion</p>
          <select
            value={bufferTime}
            onChange={(e) => setBufferTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full max-w-xs"
          >
            <option>15 minutes</option>
            <option>30 minutes</option>
            <option>45 minutes</option>
            <option>60 minutes</option>
          </select>
        </div>

        <button className="mt-6 btn-primary w-1/4">
          Save
        </button>
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Booking Policy *</h3>
              <button onClick={() => setShowPolicyModal(false)}>
                {IoClose({ size: 24 })}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={policyForm.title}
                  onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Policy List</label>
                {policyForm.policyList.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updatePolicyItem(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder={`Policy ${index + 1}`}
                    />
                    <button
                      onClick={() => removePolicyItem(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      {FaTrash({ size: 14 })}
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPolicyItem}
                  className="text-sm text-emerald-600 hover:underline mt-2"
                >
                  + Add policy item
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="flex-1 px-4 py-2 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePolicySave}
                className="flex-1 px-4 py-2 btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h3>
              <button onClick={() => setShowServiceModal(false)}>
                {IoClose({ size: 24 })}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors overflow-hidden"
                  style={{ minHeight: serviceForm.image ? 'auto' : '160px' }}
                >
                  {serviceForm.image ? (
                    <div className="relative w-full p-4">
                      <img 
                        src={typeof serviceForm.image === 'string' && serviceForm.image.startsWith('http') 
                          ? serviceForm.image 
                          : typeof serviceForm.image === 'string' && serviceForm.image.startsWith('/uploads')
                          ? `http://localhost:5000${serviceForm.image}`
                          : URL.createObjectURL(serviceForm.image as any)
                        }
                        alt="Service preview" 
                        className="w-full h-auto max-h-80 object-contain rounded-lg mx-auto"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                        <p className="text-sm text-gray-600 opacity-0 hover:opacity-100 bg-white px-3 py-1 rounded">Click to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {MdImage({ size: 48, className: "text-gray-400 mx-auto mb-2" })}
                      <p className="text-sm text-gray-500">Click to upload image</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Title</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <input
                    type="text"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    placeholder="e.g., 60 mins"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-24"
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                    </select>
                    <input
                      type="text"
                      value={serviceForm.price.replace(/^[A-Z]{3}\s/, '')}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: `${currency} ${e.target.value.replace(/[^0-9.,]/g, '')}` })}
                      placeholder="1,500"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 px-4 py-2 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleServiceSave}
                className="flex-1 px-4 py-2 btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}