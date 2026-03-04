import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminAPIs from '../../utils/adminAPI';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showExtendTrialModal, setShowExtendTrialModal] = useState(false);
  
  const [pauseReason, setPauseReason] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [extendDays, setExtendDays] = useState('7');
  // ✅ Snapshot isPaused when modal opens so confirm button always acts on the right state
  const [pauseTarget, setPauseTarget] = useState(false);

  // ✅ useCallback so fetchBusiness is stable and can be safely used in useEffect
  const fetchBusiness = useCallback(async () => {
    try {
      const response = await adminAPIs.getBusiness(id!);
      setBusiness(response.data.business);
      setNewPlan(response.data.business.subscriptionPlan);
      setNewStatus(response.data.business.subscriptionStatus);
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ✅ fetchBusiness in deps — no stale closure
  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const openPauseModal = () => {
    setPauseTarget(!business.isPaused); // snapshot the intended toggle
    setPauseReason('');
    setShowPauseModal(true);
  };

  const handlePause = async () => {
    try {
      await adminAPIs.pauseBusiness(id!, pauseTarget, pauseReason);
      await fetchBusiness();
      setShowPauseModal(false);
      setPauseReason('');
    } catch (error) {
      console.error('Error pausing business:', error);
      alert('Failed to update business pause status');
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      await adminAPIs.updateSubscription(id!, {
        subscriptionPlan: newPlan,
        subscriptionStatus: newStatus
      });
      await fetchBusiness();
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleExtendTrial = async () => {
    try {
      await adminAPIs.extendTrial(id!, parseInt(extendDays));
      await fetchBusiness();
      setShowExtendTrialModal(false);
      setExtendDays('7');
    } catch (error) {
      console.error('Error extending trial:', error);
      alert('Failed to extend trial');
    }
  };

  const handleDelete = async () => {
    try {
      await adminAPIs.deleteBusiness(id!);
      navigate('/admin/businesses');
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!business) {
    return <div className="p-6">Business not found</div>;
  }

  const trialDaysLeft = business.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(business.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/businesses')}
          className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Businesses
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {business.logo ? (
              <img src={business.logo} alt={business.businessName} className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl text-emerald-600 font-bold">
                  {business.businessName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.businessName}</h1>
              <p className="text-gray-500">{business.email}</p>
            </div>
          </div>
          {business.isPaused && (
            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-semibold">
              ⏸️ Paused
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update Subscription
          </button>
          
          {business.subscriptionStatus === 'trial' && (
            <button
              onClick={() => setShowExtendTrialModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Extend Trial
            </button>
          )}
          
          {/* ✅ Uses openPauseModal to snapshot isPaused before opening */}
          <button
            onClick={openPauseModal}
            className={`px-4 py-2 ${business.isPaused ? 'bg-green-600' : 'bg-orange-600'} text-white rounded-lg hover:opacity-90`}
          >
            {business.isPaused ? 'Unpause Account' : 'Pause Account'}
          </button>
          
          <button
            onClick={() => window.open(`https://fortly.xyz/${business.slug}`, '_blank')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            View Website
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Subscription Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-semibold capitalize">{business.subscriptionPlan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold capitalize">{business.subscriptionStatus}</p>
            </div>

            {/* ── Next billing date for monthly/yearly paid plans ── */}
            {(business.subscriptionPlan === 'monthly' || business.subscriptionPlan === 'yearly') &&
              business.subscriptionStatus === 'active' &&
              business.subscriptionEndDate && (
              <div>
                <p className="text-sm text-gray-500">Next Billing</p>
                <p className="font-semibold text-emerald-700">
                  {new Date(business.subscriptionEndDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.max(0, Math.ceil((new Date(business.subscriptionEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days from now
                </p>
              </div>
            )}

            {/* ── Trial countdown ── */}
            {business.subscriptionStatus === 'trial' && (
              <div>
                <p className="text-sm text-gray-500">Trial Ends</p>
                <p className={`font-semibold ${trialDaysLeft <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                  {trialDaysLeft} days left
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(business.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Account Info</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-semibold">{business.ownerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-semibold">{business.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-semibold">{business.location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold">{new Date(business.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Stats</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Services</p>
              <p className="text-2xl font-bold">{business.services?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bookings</p>
              <p className="text-2xl font-bold">{business.bookings?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gallery Items</p>
              <p className="text-2xl font-bold">{business.gallery?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reviews</p>
              <p className="text-2xl font-bold">{business.reviews?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      {business.services && business.services.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Services ({business.services.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {business.services.map((service: any) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {service.image && (
                    <img src={service.image} alt={service.name} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="mt-2 flex gap-3 text-sm">
                      <span className="text-emerald-600 font-semibold">{service.price}</span>
                      <span className="text-gray-500">{service.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {business.bookings && business.bookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings ({business.bookings.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Service</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {business.bookings.slice(0, 10).map((booking: any) => (
                  <tr key={booking.id} className="border-b border-gray-100">
                    <td className="py-3">{booking.clientName}</td>
                    <td className="py-3">{booking.Service?.name}</td>
                    <td className="py-3">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Subscription Modal ── */}
      {showSubscriptionModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowSubscriptionModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
            <h2 className="text-xl font-bold mb-4">Update Subscription</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="free">Free</option>
                  <option value="monthly">Monthly ($9.99)</option>
                  <option value="yearly">Yearly ($99.99)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSubscriptionModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdateSubscription} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Update</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Extend Trial Modal ── */}
      {showExtendTrialModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowExtendTrialModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
            <h2 className="text-xl font-bold mb-4">Extend Trial</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days to extend</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="1"
                  max="90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current trial ends: {new Date(business.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowExtendTrialModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleExtendTrial} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Extend</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Pause Modal ── */}
      {showPauseModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowPauseModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
            <h2 className="text-xl font-bold mb-4">
              {pauseTarget ? 'Pause Account' : 'Unpause Account'}
            </h2>
            {pauseTarget && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Payment issue, policy violation, etc."
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowPauseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handlePause}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${pauseTarget ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {pauseTarget ? 'Pause' : 'Unpause'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Account?</h2>
              <p className="text-gray-600 mb-6">
                This will permanently delete <strong>{business.businessName}</strong> and all associated data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}