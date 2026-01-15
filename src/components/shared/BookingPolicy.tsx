import React from "react";

export default function BookingPolicy({ title, description, policyList }) {
  // Default content if no props are passed
  const displayTitle = title || "Booking Policy";
  const displayDescription = description || "Our booking policy ensures that all appointments are scheduled fairly and efficiently.";
  const displayList = policyList || [
    "All bookings must be made at least 24 hours in advance.",
    "Cancellations must be made at least 12 hours prior."
  ];

  return (
    <div className="bg-policyBackground p-6 rounded-2xl border border-policyBorder gap-4 flex flex-col mb-6">
      <h2 className="lg:text-base text-sm font-semibold">{displayTitle}</h2>
      <div className="text-policyBodyText lg:text-sm text-xs">
        <p>{displayDescription}</p>
        
        {displayList.length > 0 && (
          <ol className="list-decimal list-inside space-y-1 mt-2">
            {displayList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}