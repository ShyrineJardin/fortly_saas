/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewCard from '../../src/components/shared/ReviewCard';

const defaultProps = {
    fullName: 'John Doe',
    date: 'April 12, 2026',
    rating: 4,
    reviewText: 'Great service!',
};

describe('ReviewCard — basic rendering', () => {
    test('renders reviewer full name', () => {
        render(<ReviewCard {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('renders review date', () => {
        render(<ReviewCard {...defaultProps} />);
        expect(screen.getByText('• April 12, 2026')).toBeInTheDocument();
    });

    test('renders review text', () => {
        render(<ReviewCard {...defaultProps} />);
        expect(screen.getByText('Great service!')).toBeInTheDocument();
    });
});

describe('ReviewCard — star rating', () => {
    test('renders 5 star elements', () => {
        const { container } = render(<ReviewCard {...defaultProps} />);
        const stars = container.querySelectorAll('span.text-yellow-400, span.text-gray-300');
        expect(stars).toHaveLength(5);
    });

    test('renders correct number of filled stars', () => {
        const { container } = render(<ReviewCard {...defaultProps} rating={4} />);
        const filledStars = container.querySelectorAll('span.text-yellow-400');
        expect(filledStars).toHaveLength(4);
    });

    test('renders correct number of empty stars', () => {
        const { container } = render(<ReviewCard {...defaultProps} rating={4} />);
        const emptyStars = container.querySelectorAll('span.text-gray-300');
        expect(emptyStars).toHaveLength(1);
    });

    test('renders all filled stars for rating 5', () => {
        const { container } = render(<ReviewCard {...defaultProps} rating={5} />);
        const filledStars = container.querySelectorAll('span.text-yellow-400');
        expect(filledStars).toHaveLength(5);
    });

    test('renders all empty stars for rating 0', () => {
        const { container } = render(<ReviewCard {...defaultProps} rating={0} />);
        const emptyStars = container.querySelectorAll('span.text-gray-300');
        expect(emptyStars).toHaveLength(5);
    });
});

describe('ReviewCard — business reply', () => {
    test('renders business reply when provided', () => {
        render(<ReviewCard {...defaultProps} businessReply="Thank you for your feedback!" />);
        expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });

    test('does not render business reply when not provided', () => {
        render(<ReviewCard {...defaultProps} />);
        expect(screen.queryByText('Thank you for your feedback!')).not.toBeInTheDocument();
    });

    test('renders business name in reply', () => {
        render(<ReviewCard {...defaultProps} businessReply="Thanks!" businessName="Sweetora" />);
        expect(screen.getByText('Sweetora replied')).toBeInTheDocument();
    });

    test('renders default business name when businessName not provided', () => {
        render(<ReviewCard {...defaultProps} businessReply="Thanks!" />);
        expect(screen.getByText('Business replied')).toBeInTheDocument();
    });
});