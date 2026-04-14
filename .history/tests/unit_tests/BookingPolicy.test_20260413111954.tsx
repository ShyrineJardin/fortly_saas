import React from "react";
import { render, screen } from "@testing-library/react";
import BookingPolicy from "../../src/components/shared/BookingPolicy";
import "@testing-library/jest-dom";

describe("BookingPolicy - default content", () => {
    test("renders default title, description, and list items", () => {
        render(<BookingPolicy />);
        expect(screen.getByText("Booking Policy")).toBeInTheDocument();
    });

    test("renders default description", () => {
        render(<BookingPolicy />);
        expect(screen.getByText("Our booking policy ensures that all appointments are scheduled fairly and efficiently.")).toBeInTheDocument();
    });

    test('renders default policy list items', () => {
        render(<BookingPolicy />);
        expect(screen.getByText('All bookings must be made at least 24 hours in advance.')).toBeInTheDocument();
        expect(screen.getByText('Cancellations must be made at least 12 hours prior.')).toBeInTheDocument();
    });
});

de