/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GalleryItem from "../../src/components/shared/GalleryItem";
import "@testing-library/jest-dom";
import { url } from "node:inspector";

const imageItem = { type: 'image', url: 'https://example.com/image.jpg' };
const videoItem = { type: 'video', url: 'https://example.com/video.mp4' };

describe('GalleryItem - Image', () => {
    test('renders image element for image type', () => {
        render(<GalleryItem item={imageItem} onClick={() => {}} />);
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
    });

    test('renders correct image src', () => {
        render(<GalleryItem item={imageItem} onClick={() => {}} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    test('does not render video when type is image', () => {
        render(<GalleryItem item={imageItem} onClick={() => {}} />);
        const video = screen.queryByRole('video');
        expect(video).not.toBeInTheDocument();
    });
});

describe('GalleryItem — video', () => {
    test('renders a video when type is video', () => {
        const { container } = render(<GalleryItem item={videoItem} onClick={() => {}} />);
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
    });

    test('renders correct video src', () => {
        const { container } = render(<GalleryItem item={videoItem} onClick={() => {}} />);
        const video = container.querySelector('video');
        expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    test('video has muted attribute', () => {
        const { container } = render(<GalleryItem item={videoItem} onClick={() => {}} />);
        const video = container.querySelector('video');
        expect(video?.muted).toBe(true);
    });

    test('does not render image when type is video', () => {
        render(<GalleryItem item={videoItem} onClick={() => {}} />);
        const img = screen.queryByRole('img');
        expect(img).not.toBeInTheDocument();
    });
});

describe('GalleryItem — onClick', () => {
    test('calls onClick when clicked', () => {
        const onClick = jest.fn();
        render(<GalleryItem item={imageItem} onClick={onClick} />);
        fireEvent.click(screen.getByRole('img').closest('div')!);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('calls onClick when video item is clicked', () => {
        const onClick = jest.fn();
        const { container } = render(<GalleryItem item={videoItem} onClick={onClick} />);
        fireEvent.click(container.querySelector('div')!);
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});