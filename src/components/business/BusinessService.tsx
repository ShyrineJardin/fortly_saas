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
  durationValue?: string;
  durationUnit?: string;
  serviceType?: string;
  price: string;
  description: string;
  image?: string;
}

interface BookingPolicyData {
  title: string;
  description: string;
  policyList: string[];
}

interface BusinessHour {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  restStartTime?: string;
  restEndTime?: string;
  hasRest?: boolean;
}

const SERVICE_TYPES = [
  {
    value: 'appointment',
    label: 'Appointment',
    icon: '📅',
    desc: 'Time-slot based (haircut, consultation, etc.). Client picks a specific time.'
  },
  {
    value: 'preparation',
    label: 'Preparation / Order',
    icon: '🎂',
    desc: 'Business prepares over N days. Client picks a delivery/pickup date. No time blocking.'
  },
  {
    value: 'occupancy',
    label: 'Occupancy / Rental',
    icon: '🏗️',
    desc: 'Blocks N days from start date (event setup, equipment rental, etc.).'
  }
];

export default function BusinessService() {
  const [loading, setLoading] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [error, setError] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [bulkRestStartTime, setBulkRestStartTime] = useState('12:00');
  const [bulkRestEndTime, setBulkRestEndTime] = useState('13:00');
  const [applyBulkRest, setApplyBulkRest] = useState(false);

  const dayGroups = {
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    weekend: ['Saturday', 'Sunday'],
    all: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  };

  const toggleDaySelection = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const selectDayGroup = (group: 'weekdays' | 'weekend' | 'all') => {
    setSelectedDays(dayGroups[group]);
  };

  const applyBulkHours = () => {
    if (selectedDays.length === 0) return alert('Please select at least one day');
    if (!bulkStartTime || !bulkEndTime) return alert('Please set both start and end times');

    const newSchedule = [...weeklySchedule];
    selectedDays.forEach(selectedDay => {
      const index = newSchedule.findIndex(item => item.day === selectedDay);
      if (index !== -1) {
        newSchedule[index] = {
          ...newSchedule[index],
          startTime: bulkStartTime,
          endTime: bulkEndTime,
          enabled: true,
          hasRest: applyBulkRest,
          restStartTime: applyBulkRest ? bulkRestStartTime : '',
          restEndTime: applyBulkRest ? bulkRestEndTime : ''
        };
      }
    });
    setWeeklySchedule(newSchedule);
    setSelectedDays([]);
  };

  const clearAllHours = () => {
    if (window.confirm('Are you sure you want to clear all business hours?')) {
      setWeeklySchedule(weeklySchedule.map(day => ({
        ...day, startTime: '', endTime: '', enabled: false,
        hasRest: false, restStartTime: '', restEndTime: ''
      })));
    }
  };

  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicyData>({
    title: "Booking Policy", description: "", policyList: []
  });
  const [services, setServices] = useState<Service[]>([]);
  const [policyForm, setPolicyForm] = useState(bookingPolicy);
  const [serviceForm, setServiceForm] = useState<Service>({
    id: '', name: '', duration: '', durationValue: '', durationUnit: 'minutes',
    serviceType: 'appointment', price: '', description: '', image: ''
  });

  const [currency, setCurrency] = useState("PHP");
  const [bufferTimeValue, setBufferTimeValue] = useState("");
  const [bufferTimeUnit, setBufferTimeUnit] = useState("minutes");
  const [enableBufferTime, setEnableBufferTime] = useState(false);
  const [maxConcurrentBookings, setMaxConcurrentBookings] = useState(1);
  const [enableConcurrent, setEnableConcurrent] = useState(false);

  const [weeklySchedule, setWeeklySchedule] = useState<BusinessHour[]>([
    { day: "Monday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Tuesday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Wednesday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Thursday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Friday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Saturday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' },
    { day: "Sunday", startTime: '', endTime: '', enabled: false, hasRest: false, restStartTime: '', restEndTime: '' }
  ]);

  const bufferTimeUnits = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" }
  ];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const businessResponse = await authAPI.getMe();
      const business = businessResponse.data.business;

      setBookingPolicy({
        title: business.bookingPolicyTitle || "Booking Policy",
        description: business.bookingPolicyDescription || "",
        policyList: business.bookingPolicyList || []
      });

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const syncedSchedule = daysOfWeek.map(day => {
        const schedule = business.schedules?.find((s: any) => s.dayOfWeek === day);
        return {
          day,
          startTime: schedule?.startTime || '',
          endTime: schedule?.endTime || '',
          enabled: schedule?.enabled || false,
          hasRest: schedule?.hasRest || false,
          restStartTime: schedule?.restStartTime || '',
          restEndTime: schedule?.restEndTime || ''
        };
      });
      setWeeklySchedule(syncedSchedule);

      if (business.bufferTime) {
        setEnableBufferTime(true);
        const match = business.bufferTime.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
        if (match) { setBufferTimeValue(match[1]); setBufferTimeUnit(match[2]); }
      } else {
        setEnableBufferTime(false);
        setBufferTimeValue('');
      }

      const maxConcurrent = business.maxConcurrentBookings || 1;
      setMaxConcurrentBookings(maxConcurrent);
      setEnableConcurrent(maxConcurrent > 1);

      const servicesResponse = await servicesAPI.getMyServices();
      setServices(servicesResponse.data.services);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Policy ──
  const handlePolicyEdit = () => { setPolicyForm(bookingPolicy); setShowPolicyModal(true); };
  const handlePolicySave = async () => {
    try {
      setSavingPolicy(true);
      await businessAPI.updateBookingPolicy({
        title: policyForm.title, description: policyForm.description, policyList: policyForm.policyList
      });
      setBookingPolicy(policyForm);
      setShowPolicyModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save booking policy');
    } finally { setSavingPolicy(false); }
  };
  const addPolicyItem = () => setPolicyForm({ ...policyForm, policyList: [...policyForm.policyList, ""] });
  const updatePolicyItem = (index: number, value: string) => {
    const newList = [...policyForm.policyList]; newList[index] = value;
    setPolicyForm({ ...policyForm, policyList: newList });
  };
  const removePolicyItem = (index: number) =>
    setPolicyForm({ ...policyForm, policyList: policyForm.policyList.filter((_, i) => i !== index) });

  // ── Service ──
  const handleAddService = () => {
    setEditingService(null);
    setServiceForm({
      id: '', name: '', duration: '', durationValue: '', durationUnit: 'minutes',
      serviceType: 'appointment', price: '', description: '', image: ''
    });
    setShowServiceModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    let durationValue = '', durationUnit = 'minutes';
    if (service.duration) {
      const match = service.duration.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
      if (match) { durationValue = match[1]; durationUnit = match[2]; }
    }
    // ✅ Correctly read serviceType from the service — no fallback that masks the real value
    setServiceForm({
      ...service,
      durationValue,
      durationUnit,
      serviceType: service.serviceType || 'appointment'
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await servicesAPI.delete(id);
        await loadData();
      } catch (err: any) { setError(err.response?.data?.message || 'Failed to delete service'); }
    }
  };

  const handleServiceSave = async () => {
    try {
      setSavingService(true);
      if (!serviceForm.durationValue || parseFloat(serviceForm.durationValue) <= 0) {
        setError('Please enter a valid duration'); return;
      }
      if (!serviceForm.name) { setError('Please enter a service name'); return; }

      const formData = new FormData();
      formData.append('name', serviceForm.name);
      formData.append('description', serviceForm.description);
      formData.append('price', serviceForm.price);
      formData.append('duration', `${serviceForm.durationValue} ${serviceForm.durationUnit}`);
      // ✅ THIS WAS MISSING — serviceType was never sent to the backend
      formData.append('serviceType', serviceForm.serviceType || 'appointment');

      if (serviceForm.image && typeof serviceForm.image !== 'string') {
        formData.append('image', serviceForm.image);
      }

      if (editingService) {
        await servicesAPI.update(editingService.id, formData);
      } else {
        await servicesAPI.create(formData);
      }

      setShowServiceModal(false);
      setError('');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally { setSavingService(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setServiceForm({ ...serviceForm, image: file as any });
  };

  // ── Schedule ──
  const toggleScheduleDay = (index: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    if (!newSchedule[index].enabled) {
      newSchedule[index].hasRest = false;
      newSchedule[index].restStartTime = '';
      newSchedule[index].restEndTime = '';
    }
    setWeeklySchedule(newSchedule);
  };

  const toggleRestTime = (index: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index].hasRest = !newSchedule[index].hasRest;
    if (!newSchedule[index].hasRest) {
      newSchedule[index].restStartTime = '';
      newSchedule[index].restEndTime = '';
    }
    setWeeklySchedule(newSchedule);
  };

  const updateScheduleTime = (index: number, field: 'startTime' | 'endTime' | 'restStartTime' | 'restEndTime', value: string) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index][field] = value;
    setWeeklySchedule(newSchedule);
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      if (enableBufferTime && (!bufferTimeValue || parseFloat(bufferTimeValue) <= 0)) {
        setError('Please enter a valid buffer time value or disable buffer time');
        setLoading(false); return;
      }

      const data = new FormData();
      data.append('businessHours', JSON.stringify(weeklySchedule));
      data.append('bufferTime', enableBufferTime ? `${bufferTimeValue} ${bufferTimeUnit}` : '');
      data.append('maxConcurrentBookings', String(enableConcurrent ? Math.max(1, maxConcurrentBookings) : 1));

      await businessAPI.updateProfile(data);
      await loadData();
      alert('Schedule and settings saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally { setLoading(false); }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const SERVICE_TYPE_COLORS: Record<string, string> = {
    appointment: 'bg-blue-50 text-blue-700 border-blue-100',
    preparation: 'bg-orange-50 text-orange-700 border-orange-100',
    occupancy:   'bg-purple-50 text-purple-700 border-purple-100',
  };

  const getServiceTypeBadge = (type: string) => {
    const t = SERVICE_TYPES.find(s => s.value === type);
    if (!t) return null;
    const color = SERVICE_TYPE_COLORS[type] || 'bg-gray-50 text-gray-700 border-gray-100';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
        {t.icon} {t.label}
      </span>
    );
  };

  if (loading) return <div className="text-center p-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Booking Policy */}
      <div className="bg-policyBackground p-6 rounded-2xl border border-policyBorder gap-4 flex flex-col mb-6 relative">
        <button onClick={handlePolicyEdit} className="absolute top-4 right-4 flex items-center gap-1 text-sm text-emerald-600 border border-emerald-600 rounded-full px-3 py-1">
          {LuPencil({ size: 14 })}<span>Edit</span>
        </button>
        <h2 className="lg:text-base text-sm font-semibold">{bookingPolicy.title}</h2>
        <div className="text-policyBodyText lg:text-sm text-xs">
          <p>{bookingPolicy.description}</p>
          {bookingPolicy.policyList.length > 0 && (
            <ol className="list-decimal list-inside space-y-1 mt-2">
              {bookingPolicy.policyList.map((item, index) => <li key={index}>{item}</li>)}
            </ol>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="lg:text-lg text-base font-semibold">Services</h2>
          <button onClick={handleAddService} className="flex items-center btn-secondary">
            {FaPlus({ size: 14 })} Add Service
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
                    <img src={service.image} alt={service.name} className="lg:w-20 lg:h-20 w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 object-cover" />
                  ) : (
                    <div className="lg:w-20 lg:h-20 w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-col items-start gap-1 flex-wrap mb-1">
                      {/* ✅ Pass the raw serviceType — no fallback */}
                      {getServiceTypeBadge(service.serviceType || 'appointment')}
                      <h3 className="lg:text-base text-sm font-semibold">{service.name}</h3>
                    </div>
                    <p className="lg:text-sm text-xs text-gray-500">{service.duration} · {service.price}</p>
                    <p className="lg:text-sm text-xs flex items-center gap-1 mt-3 text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditService(service)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                    {FaEdit({ size: 14 })}
                  </button>
                  <button onClick={() => handleDeleteService(service.id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                    {FaTrash({ size: 14 })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm mb-4">
        <div className="mb-6">
          <h2 className="lg:text-lg text-base font-semibold mb-2">Weekly Schedule</h2>
          <p className="lg:text-sm text-xs text-textSecondaryColor">Set your availability for accepting bookings</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-primaryGreen rounded-full animate-pulse"></div>
            <p className="lg:text-xs text-xs text-primaryGreen font-medium">Synced with your business profile</p>
          </div>
        </div>

        {/* Bulk Edit */}
        <div className="bg-softGreen border border-policyOutline p-5 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primaryGreen rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-textPrimaryColor">Quick Bulk Setup</h3>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-policyBodyText mb-2 uppercase tracking-wide">Step 1: Select Days</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['weekdays', 'weekend', 'all'] as const).map(group => (
                <button key={group} onClick={() => selectDayGroup(group)}
                  className="px-3 py-1.5 text-xs font-medium border-2 border-primaryGreen text-primaryGreen bg-white rounded-lg hover:bg-softGreen transition-colors">
                  {group === 'weekdays' ? '📅 Weekdays (M-F)' : group === 'weekend' ? '🌴 Weekend (S-S)' : '🌍 All Days'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weeklySchedule.map((day) => (
                <label key={day.day} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${selectedDays.includes(day.day) ? 'bg-primaryGreen border-hoverGreen text-white shadow-md scale-105' : 'bg-white border-border text-textSecondaryColor hover:border-primaryGreen hover:shadow-sm'}`}>
                  <input type="checkbox" checked={selectedDays.includes(day.day)} onChange={() => toggleDaySelection(day.day)} className="hidden" />
                  <span className="text-xs font-bold">{day.day.slice(0, 3)}</span>
                  {selectedDays.includes(day.day) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </label>
              ))}
            </div>
            {selectedDays.length > 0 && <p className="text-xs text-primaryGreen font-medium mt-2">✓ {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected</p>}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-policyBodyText mb-2 uppercase tracking-wide">Step 2: Set Working Hours</label>
            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-border">
              <div>
                <label className="block text-xs font-medium text-textSecondaryColor mb-1">🌅 Start Time</label>
                <input type="time" value={bulkStartTime} onChange={(e) => setBulkStartTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                <p className="text-xs text-textSecondaryColor mt-1">{formatTime(bulkStartTime)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-textSecondaryColor mb-1">🌆 End Time</label>
                <input type="time" value={bulkEndTime} onChange={(e) => setBulkEndTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                <p className="text-xs text-textSecondaryColor mt-1">{formatTime(bulkEndTime)}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 cursor-pointer group">
              <input type="checkbox" checked={applyBulkRest} onChange={(e) => setApplyBulkRest(e.target.checked)} className="w-4 h-4 text-primaryGreen rounded focus:ring-2 focus:ring-primaryGreen" />
              <span className="text-xs font-semibold text-policyBodyText uppercase tracking-wide group-hover:text-primaryGreen transition-colors">Step 3: Add Rest Time (Optional)</span>
            </label>
            {applyBulkRest && (
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-border ml-6">
                <div>
                  <label className="block text-xs font-medium text-textSecondaryColor mb-1">☕ Rest Start</label>
                  <input type="time" value={bulkRestStartTime} onChange={(e) => setBulkRestStartTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondaryColor mb-1">⏰ Rest End</label>
                  <input type="time" value={bulkRestEndTime} onChange={(e) => setBulkRestEndTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-policyOutline">
            <button onClick={applyBulkHours} className="btn-primary flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Apply Changes
            </button>
            <button onClick={clearAllHours} className="px-4 py-2.5 bg-white text-red-600 border-2 border-red-200 rounded-full font-poppins font-semibold lg:text-sm text-xs hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear All
            </button>
          </div>
        </div>

        {/* Individual Days */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-textPrimaryColor mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-primaryGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Individual Day Settings
          </h3>
          <div className="space-y-3">
            {weeklySchedule.map((day, index) => (
              <div key={day.day} className={`border-2 rounded-xl p-4 transition-all ${day.enabled ? 'border-policyOutline bg-softGreen shadow-sm' : 'border-border bg-backgroundColor hover:border-policyOutline'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={day.enabled} onChange={() => toggleScheduleDay(index)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-softGreen rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primaryGreen"></div>
                  </label>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${day.enabled ? 'text-primaryGreen' : 'text-textSecondaryColor'}`}>{day.day}</span>
                      {day.enabled && <span className="px-2 py-0.5 bg-softGreen text-primaryGreen text-xs font-medium rounded-full border border-policyOutline">Active</span>}
                    </div>
                    {!day.enabled && <p className="text-xs text-textSecondaryColor mt-0.5">Closed on this day</p>}
                  </div>
                </div>

                {day.enabled && (
                  <div className="ml-3 md:ml-14 space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-border">
                      <label className="block text-xs font-semibold text-textSecondaryColor mb-2">Working Hours</label>
                      <div className="flex items-center gap-2">
                        <input type="time" value={day.startTime} onChange={(e) => updateScheduleTime(index, 'startTime', e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                        <input type="time" value={day.endTime} onChange={(e) => updateScheduleTime(index, 'endTime', e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                      </div>
                      <p className="text-xs text-textSecondaryColor mt-2">{formatTime(day.startTime)} – {formatTime(day.endTime)}</p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={day.hasRest || false} onChange={() => toggleRestTime(index)} className="w-4 h-4 text-primaryGreen rounded focus:ring-2 focus:ring-primaryGreen" />
                      <span className="text-xs font-semibold text-textSecondaryColor group-hover:text-primaryGreen transition-colors">☕ Add Rest/Break Time</span>
                    </label>

                    {day.hasRest && (
                      <div className="bg-policyBackground p-3 rounded-lg border border-policyOutline">
                        <label className="block text-xs font-semibold text-policyBodyText mb-2">Rest Time</label>
                        <div className="flex items-center gap-2">
                          <input type="time" value={day.restStartTime || ''} onChange={(e) => updateScheduleTime(index, 'restStartTime', e.target.value)} className="flex-1 px-3 py-2 border border-policyOutline rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent bg-white" />
                          <input type="time" value={day.restEndTime || ''} onChange={(e) => updateScheduleTime(index, 'restEndTime', e.target.value)} className="flex-1 px-3 py-2 border border-policyOutline rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent bg-white" />
                        </div>
                        <p className="text-xs text-policyBodyText mt-2">Break: {formatTime(day.restStartTime || '')} – {formatTime(day.restEndTime || '')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Buffer Time + Concurrent Bookings */}
        <div className="border-t-2 border-border pt-6 space-y-4">
          <div className="bg-softGreen border-2 border-policyOutline rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={enableBufferTime} onChange={(e) => setEnableBufferTime(e.target.checked)} className="w-5 h-5 text-primaryGreen rounded focus:ring-2 focus:ring-primaryGreen mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-primaryGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="text-sm font-semibold text-textPrimaryColor group-hover:text-primaryGreen transition-colors">Buffer Time (Optional)</h3>
                </div>
                <p className="text-xs text-textSecondaryColor">Add cooldown/cleanup time after each appointment before the next one starts</p>
              </div>
            </label>
            {enableBufferTime && (
              <div className="mt-4 ml-8">
                <div className="bg-white p-3 rounded-lg border border-policyOutline">
                  <label className="block text-xs font-semibold text-textSecondaryColor mb-2">Buffer Duration</label>
                  <div className="flex gap-2">
                    <input type="number" min="1" step="0.5" value={bufferTimeValue} onChange={(e) => setBufferTimeValue(e.target.value)} placeholder="15" className="w-20 px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent" />
                    <select value={bufferTimeUnit} onChange={(e) => setBufferTimeUnit(e.target.value)} className="w-1/2 md:w-32 px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primaryGreen focus:border-transparent">
                      {bufferTimeUnits.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-primaryGreen font-medium mt-2">Current: {bufferTimeValue} {bufferTimeUnit}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={enableConcurrent} onChange={(e) => { setEnableConcurrent(e.target.checked); if (!e.target.checked) setMaxConcurrentBookings(1); }} className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Concurrent Bookings (Optional)</h3>
                </div>
                <p className="text-xs text-gray-500">
                  By default, bookings are sequential (one at a time). Enable this if you have multiple staff or stations that can serve clients simultaneously.
                </p>
              </div>
            </label>

            {enableConcurrent && (
              <div className="mt-4 ml-8">
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Max simultaneous bookings</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setMaxConcurrentBookings(Math.max(2, maxConcurrentBookings - 1))} className="w-8 h-8 rounded-full border-2 border-blue-200 text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center text-lg">−</button>
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">{maxConcurrentBookings}</span>
                    <button onClick={() => setMaxConcurrentBookings(Math.min(20, maxConcurrentBookings + 1))} className="w-8 h-8 rounded-full border-2 border-blue-200 text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center text-lg">+</button>
                    <span className="text-xs text-gray-400 ml-1">staff / stations</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    Up to {maxConcurrentBookings} client{maxConcurrentBookings > 1 ? 's' : ''} can be booked at the same time slot
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleSaveSchedule} disabled={loading} className="mt-6 btn-primary w-full flex items-center justify-center gap-3 py-3">
          {loading ? (
            <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving Changes...</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Schedule & Settings</>
          )}
        </button>
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Booking Policy</h3>
              <button onClick={() => setShowPolicyModal(false)}>{IoClose({ size: 24 })}</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={policyForm.title} onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={policyForm.description} onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Policy List</label>
                {policyForm.policyList.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="text" value={item} onChange={(e) => updatePolicyItem(index, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={`Policy ${index + 1}`} />
                    <button onClick={() => removePolicyItem(index)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{FaTrash({ size: 14 })}</button>
                  </div>
                ))}
                <button onClick={addPolicyItem} className="text-sm text-emerald-600 hover:underline mt-2">+ Add policy item</button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPolicyModal(false)} className="flex-1 px-4 py-2 btn-secondary">Cancel</button>
              <button onClick={handlePolicySave} disabled={savingPolicy} className="flex-1 px-4 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {savingPolicy ? 'Saving...' : 'Save'}
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
              <h3 className="text-xl font-semibold">{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setShowServiceModal(false)}>{IoClose({ size: 24 })}</button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors overflow-hidden" style={{ minHeight: serviceForm.image ? 'auto' : '160px' }}>
                  {serviceForm.image ? (
                    <div className="relative w-full p-4">
                      <img src={typeof serviceForm.image === 'string' ? serviceForm.image : URL.createObjectURL(serviceForm.image as any)} alt="Service preview" className="w-full h-auto max-h-80 object-contain rounded-lg mx-auto" />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {MdImage({ size: 48, className: "text-gray-400 mx-auto mb-2" })}
                      <p className="text-sm text-gray-500">Click to upload image (jpg, png)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <div className="space-y-2">
                  {SERVICE_TYPES.map(type => (
                    <label key={type.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${serviceForm.serviceType === type.value ? 'border-primaryGreen bg-softGreen' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="serviceType"
                        value={type.value}
                        checked={serviceForm.serviceType === type.value}
                        onChange={() => setServiceForm(prev => ({ ...prev, serviceType: type.value }))}
                        className="mt-0.5 text-primaryGreen focus:ring-primaryGreen"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{type.icon} {type.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Title</label>
                <input type="text" value={serviceForm.name} onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {serviceForm.serviceType === 'preparation' ? 'Preparation Time' : serviceForm.serviceType === 'occupancy' ? 'Occupancy Duration' : 'Duration'}
                  </label>
                  <div className="flex gap-2 overflow-x-auto">
                    <input
                      type="number" min="1" step="0.5"
                      value={serviceForm.durationValue || ''}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, durationValue: e.target.value, duration: `${e.target.value} ${prev.durationUnit || 'minutes'}` }))}
                      placeholder="60"
                      className="min-w-[72px] w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm flex-shrink-0"
                    />
                    <select
                      value={serviceForm.durationUnit || 'minutes'}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, durationUnit: e.target.value, duration: `${prev.durationValue || ''} ${e.target.value}` }))}
                      className="min-w-[100px] flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  {serviceForm.serviceType === 'preparation' && (
                    <p className="text-xs text-blue-600 mt-1">📌 Client books a pickup date. Business prepares over this period.</p>
                  )}
                  {serviceForm.serviceType === 'occupancy' && (
                    <p className="text-xs text-orange-600 mt-1">📌 All days in this span will be blocked on the calendar.</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <div className="flex gap-2 overflow-x-auto">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="min-w-[72px] w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm flex-shrink-0">
                      {['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text"
                      value={serviceForm.price.replace(/^[A-Z]{3}\s/, '')}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, price: `${currency} ${e.target.value.replace(/[^0-9.,\s-]/g, '')}` }))}
                      placeholder="1,500"
                      className="min-w-[100px] flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Service Description</label>
                <textarea value={serviceForm.description} onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowServiceModal(false)} className="flex-1 px-4 py-2 btn-secondary">Cancel</button>
              <button onClick={handleServiceSave} disabled={savingService} className="flex-1 px-4 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {savingService ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}