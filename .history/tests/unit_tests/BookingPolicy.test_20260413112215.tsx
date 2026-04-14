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

describe("BookingPolicy - custom props", () => {
    test('render cutom title', () => {
        render(<BookingPolicy title="Custom Booking Policy" />);
        expect(screen.getByText("Custom Booking Policy")).toBeInTheDocument();
    });

    test('render custom description', () => {
        render(<BookingPolicy description="Custom description for booking policy." />);
        expect(screen.getByText("Custom description for booking policy.")).toBeInTheDocument();
    }

       test('renders custom policy list items', () => {
        const policyList = ['Policy A', 'Policy B', 'Policy C'];
        render(<BookingPolicy policyList={policyList} />);
        expect(screen.getByText('Policy A')).toBeInTheDocument();
        expect(screen.getByText('Policy B')).toBeInTheDocument();
        expect(screen.getByText('Policy C')).toBeInTheDocument();
    });
});