import React, { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa6";

export default function Review() {
    const rating = 4.0;
    const totalStars = 5;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [fullName, setFullName] = useState("");
    const [reviewText, setReviewText] = useState("");

    const handleSubmit = () => {
        // Handle review submission here
        console.log({ fullName, reviewText, reviewRating });
        // Reset and close modal
        setFullName("");
        setReviewText("");
        setReviewRating(0);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
                {/* Rating Display */}
                <div className="flex fleitems-end gap-2">
                    <h2 className="text-5xl font-bold">{rating.toFixed(1)}</h2>
                    <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(totalStars)].map((_, index) => (
                            <span key={index} className={index < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}>
                                {index < Math.floor(rating) 
                                    ? FaStar({size: 18}) 
                                    : FaRegStar({size: 18})}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Write Review Button */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-secondary text-xs"
                >
                    Write a Review
                </button>
            </div>

            {/* Review Card */}
            <div className="border border-gray-200 p-4 rounded-lg">
                {/* Reviewer Info */}
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base">Test</h3>
                    <span className="text-gray-400 text-xs">• 2 months ago</span>
                </div>

                {/* Reviewer Stars */}
                <div className="flex items-center gap-0.5 mb-3">
                    {[...Array(totalStars)].map((_, index) => (
                        <span key={index} className={index < 4 ? "text-yellow-400" : "text-gray-300"}>
                            {index < 4 
                                ? FaStar({size: 14}) 
                                : FaRegStar({size: 14})}
                        </span>
                    ))}
                </div>

                {/* Review Text */}
                <p className="text-sm text-gray-700 leading-relaxed">
                    Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore voluptates aut ipsam voluptatem in dignissimos et deserunt. Ut quiderat cumque non tenetur cupiditate qui out
                </p>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
                        {/* Modal Header */}
                        <h2 className="text-xl font-semibold mb-6">Write a Review</h2>

                        {/* Full Name Input */}
                        <div className="mb-4">
                            <label className="block text-sx font-medium mb-2">Full name</label>
                            <input
                                type="text"
                                placeholder="Full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
                            />
                        </div>

                        {/* Review Textarea */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Review</label>
                            <textarea
                                placeholder="Message"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen resize-none"
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
                                    className="text-yellow-400 hover:scale-110 transition-transform"
                                >
                                    {(hoveredStar || reviewRating) > index 
                                        ? FaStar({size: 28}) 
                                        : FaRegStar({size: 28})}
                                </button>
                            ))}
                        </div>

                        {/* Done Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full btn-primary"
                        >
                            Done
                        </button>

                        {/* Close button (X) */}
                        <button
                            onClick={() => setIsModalOpen(false)}
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