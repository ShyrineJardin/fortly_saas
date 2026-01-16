import React, { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa6";
import ReviewCard from "../shared/ReviewCard";

export default function BusinessReview() {
    const [reviews, setReviews] = useState([
        {
            id: 1,
            fullName: "Test",
            reviewText: "Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore.",
            rating: 4,
            date: "2 months ago"
        }
    ]);

    const rating = 4.0;
    const totalStars = 5;

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
                </div>

            </div>

            {/* Dynamic List using the Shared Card */}
            <div className="mt-4">
                {reviews.map((rev) => (
                    <ReviewCard 
                        key={rev.id}
                        fullName={rev.fullName}
                        date={rev.date}
                        rating={rev.rating}
                        reviewText={rev.reviewText}
                    />
                ))}
            </div>

        </div>
    );
}