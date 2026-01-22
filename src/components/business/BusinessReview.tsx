import React, { useState, useEffect } from "react";
import { FaStar, FaRegStar } from "react-icons/fa6";
import { reviewsAPI } from "../../utils/api";

export default function BusinessReview() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, repliedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getMyReviews();
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      setError('Please enter a reply');
      return;
    }

    setSubmittingReply(true);
    setError('');

    try {
      await reviewsAPI.reply(reviewId, replyText);
      
      // Reset
      setReplyText('');
      setReplyingTo(null);
      
      // Reload reviews
      await loadReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reply');
    } finally {
      setSubmittingReply(false);
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
          <div className="text-xs text-gray-500 space-y-1">
            <p>{stats.totalReviews} reviews</p>
            <p>{stats.repliedCount} replied</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No reviews yet</p>
        ) : (
          reviews.map((rev: any) => (
            <div key={rev.id} className="border-b border-gray-100 pb-6 mb-6 last:border-0 last:mb-0">
              {/* Reviewer Info */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base">{rev.clientName}</h3>
                <span className="text-gray-400 text-xs">• {formatDate(rev.createdAt)}</span>
              </div>

              {/* Reviewer Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(totalStars)].map((_, index) => (
                  <span key={index} className={index < rev.rating ? "text-yellow-400" : "text-gray-300"}>
                    {index < rev.rating 
                      ? FaStar({size: 14}) 
                      : FaRegStar({size: 14})}
                  </span>
                ))}
              </div>

              {/* Review Text */}
              <p className="md:text-sm text-xs text-gray-700 leading-relaxed mb-3">
                {rev.comment}
              </p>

              {/* Existing Reply */}
              {rev.businessReply && (
                <div className="mt-4 ml-4 pl-4 border-l-2 border-emerald-500 bg-emerald-50 rounded-r-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700">Your reply</span>
                    <button
                      onClick={() => {
                        setReplyingTo(rev.id);
                        setReplyText(rev.businessReply);
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-800"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="md:text-sm text-xs text-gray-700 leading-relaxed">
                    {rev.businessReply}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === rev.id ? (
                <div className="mt-4 ml-4 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    disabled={submittingReply}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(rev.id)}
                      disabled={submittingReply}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submittingReply ? 'Saving...' : 'Save Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                        setError('');
                      }}
                      disabled={submittingReply}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !rev.businessReply && (
                <button
                  onClick={() => setReplyingTo(rev.id)}
                  className="mt-3 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Reply to this review
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}