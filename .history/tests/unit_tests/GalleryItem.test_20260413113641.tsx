/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import GalleryItem from "../../src/components/shared/GalleryItem";
import "@testing-library/jest-dom";

const imageItem = { type: 'image', url: 'https://example.com/image.jpg' };
const videoItem = { type:}