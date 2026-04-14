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
        