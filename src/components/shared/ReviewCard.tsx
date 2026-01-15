import React from "react";
import { FaStar, FaRegStar } from "react-icons/fa6";

export default function ReviewCard({ fullName, date, rating, reviewText }) {
    const totalStars = 5;

    return (
        <div className="border-b border-gray-100 pb-6 mb-6 last:border-0 last:mb-0">
            {/* Reviewer Info */}
            <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-base">{fullName}</h3>
                <span className="text-gray-400 text-xs">• {date}</span>
            </div>

            {/* Reviewer Stars */}
            <div className="flex items-center gap-0.5 mb-3">
                {[...Array(totalStars)].map((_, index) => (
                    <span key={index} className={index < rating ? "text-yellow-400" : "text-gray-300"}>
                        {index < rating 
                            ? FaStar({size: 14}) 
                            : FaRegStar({size: 14})}
                    </span>
                ))}
            </div>

            {/* Review Text */}
            <p className="md:text-sm text-xs text-gray-700 leading-relaxed">
                {reviewText}
            </p>
        </div>
    );
}