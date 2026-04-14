/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import GalleryItem from "../../src/components/shared/GalleryItem";
import "@testing-library/jest-dom";
import { url } from "node:inspector";

const imageItem = { type: 'image', url: 'https://example.com/image.jpg' };
const videoItem = { type: 'video', url: 'https://example.com/video.mp4' };

describe('GalleryItem - Image', () => {
    test('renders image element for image type', () => {
        render(<GalleryItem item={imageItem} onClick={() => {}} />);
        const img = screen.getByRole('img');