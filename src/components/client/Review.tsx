import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa6";
import ReviewCard from "../shared/ReviewCard";
import { reviewsAPI } from "../../utils/api";

export default function Review() {
  const { businessSlug } = useParams();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [businessName, setBusinessName] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    loadReviews();
  }, [businessSlug]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getByBusinessSlug(businessSlug);
      setReviews(response.data.reviews);
      setStats(response.data.stats);
      setBusinessName(response.data.businessName); 
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (!reviewText.trim()) {
      setError('Please write a review');
      return;
    }

    if (reviewRating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      await reviewsAPI.create({
        businessSlug,
        clientName: fullName,
        clientEmail: email,
        rating: reviewRating,
        comment: reviewText
      });

      // Reset form
      setFullName("");
      setEmail("");
      setReviewText("");
      setReviewRating(0);
      setIsModalOpen(false);

      // Reload reviews
      await loadReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const totalStars = 5;
    const rating = Number(stats.averageRating) || 0;

  if (loading) {
    return (
      <div className="bg-white p-6 text-center">
        <p className="text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        {/* Rating Display */}
        <div className="flex flex-col align-centeritems-end gap-2">
          <h2 className="lg:text-5xl text-4xl font-bold">{rating.toFixed(1)}</h2>
          <div className="flex items-center gap-0.5 mb-2">
            {[...Array(totalStars)].map((_, index) => (
              <span key={index} className={index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}>
                {index < Math.floor(rating) 
                  ? FaStar({size: "1rem"}) 
                  : FaRegStar({size: "1rem"})}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500">{stats.totalReviews} reviews</p>
        </div>

        {/* Write Review Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-secondary text-xs"
        >
          Write a Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="mt-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((rev: any) => (
            <ReviewCard 
              key={rev.id}
              fullName={rev.clientName}
              date={formatDate(rev.createdAt)}
              rating={rev.rating}
              reviewText={rev.comment}
              businessReply={rev.businessReply}
              businessName={businessName}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
            {/* Modal Header */}
            <h2 className="lg:text-xl text-base font-semibold mb-6">Write a Review</h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Full Name Input */}
            <div className="mb-4">
              <label className="block md:text-sm text-xs font-medium mb-2">Full name</label>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                className="md:text-sm text-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block md:text-sm text-xs font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="md:text-sm text-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Review Textarea */}
            <div className="mb-6">
              <label className="block md:text-sm text-xs font-medium mb-2">Review</label>
              <textarea
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={submitting}
                rows={4}
                className="md:text-sm text-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setReviewRating(index + 1)}
                  onMouseEnter={() => setHoveredStar(index + 1)}
                  onMouseLeave={() => setHoveredStar(0)}
                  disabled={submitting}
                  className="text-yellow-400 hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {(hoveredStar || reviewRating) > index 
                    ? FaStar({size: "1.5rem"}) 
                    : FaRegStar({size: "1.5rem"})}
                </button>
              ))}
            </div>

            {/* Done Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>

            {/* Close button (X) */}
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}