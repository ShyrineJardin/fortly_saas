/**
 * @jest-environment jsdom
 */
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
    });

    test('renders custom policy list items', () => {
        const policyList = ['Policy A', 'Policy B', 'Policy C'];
        render(<BookingPolicy policyList={policyList} />);
        expect(screen.getByText('Policy A')).toBeInTheDocument();
        expect(screen.getByText('Policy B')).toBeInTheDocument();
        expect(screen.getByText('Policy C')).toBeInTheDocument();
    });

    test('renders correct number of policy list items', () => {
        const policyList = ['Policy A', 'Policy B', 'Policy C'];
        render(<BookingPolicy policyList={policyList} />);
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(3);
    });

});

describe('BookingPolicy — empty policy list', () => {
    test('renders no list items when empty array is passed', () => {
        render(<BookingPolicy policyList={[]} />);
        const items = screen.queryAllByRole('listitem');
        expect(items).toHaveLength(0);
    });
});

describe('BookingPolicy — structure', () => {
    test('renders title as h2', () => {
        render(<BookingPolicy title="Test Policy" />);
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Test Policy');
    });

    test('renders policy list as ordered list', () => {
        const policyList = ['Policy A'];
        render(<BookingPolicy policyList={policyList} />);
        expect(screen.getByRole('list')).toBeInTheDocument();
    });
});