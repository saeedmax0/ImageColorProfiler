# ImageColorProfiler

**Advanced color and palette analysis for images — directly in the browser**

ImageColorProfiler is a lightweight, web-based tool built with **HTML**, **JavaScript**, and **Tailwind CSS (CDN)** that performs deep color analysis on images without any server-side processing. It is designed for designers, developers, and branding teams who need precise insight into color usage, contrast, and accessibility.

---

## What It Does

ImageColorProfiler analyzes an uploaded image and extracts detailed color information, including:

- **Dominant colors** using clustering algorithms
- **Color histograms**
  - RGB
  - HSV
- **Contrast ratios** between foreground and background colors
- **Color profile detection**
  - sRGB
  - Display-P3 (where browser support allows)

All processing happens **client-side** using Canvas and modern browser APIs.

---

## Why It’s Valuable

- Helps **UI/UX designers** evaluate color consistency
- Assists **branding teams** in extracting brand palettes
- Enables **accessibility checks** using WCAG contrast standards
- Educational tool for understanding color distribution and profiles
- No uploads, no backend, no privacy concerns

---

## Core Features

### 🎨 Palette Generation
- Automatically generates **5–10 representative colors**
- Sorted by dominance or luminance
- Supports HEX, RGB, and HSL formats

### ♿ WCAG Contrast Checker
- Calculates contrast ratios between selected colors
- WCAG 2.1 compliance levels:
  - AA
  - AAA
- Ideal for text/background validation

### 📋 Copy to Clipboard
- One-click copy for:
  - HEX
  - RGB
  - HSL
- Perfect for design systems and CSS usage

### 🌈 CSS Gradient Generator
- Generate linear or radial gradients from extracted palettes
- Outputs ready-to-use CSS code
- Adjustable direction and color stops

---

## Technology Stack

- **HTML5**
- **Vanilla JavaScript**
- **Canvas API**
- **Tailwind CSS (CDN only)**
- No frameworks
- No build step
- No backend

---

## Supported Image Formats

- JPEG / JPG  
- PNG  
- WebP  
- AVIF (browser-dependent)  
- HEIC / HEIF (where supported)

---

## Use Cases

- Design system color audits
- Accessibility validation for UI components
- Brand color extraction from logos
- Educational color analysis
- CSS and theme generation

---

## Privacy & Security

- All image processing happens **locally in your browser**
- Images are **never uploaded**
- No tracking, no analytics, no storage

---

## Roadmap Ideas

- LAB color space analysis
- Color blindness simulation (protanopia, deuteranopia, tritanopia)
- Export palettes as JSON / ASE
- Compare palettes between multiple images
- Dark/light theme color recommendations

---

## Project Philosophy

**Fast. Private. Accurate. Browser-only.**

ImageColorProfiler is part of a growing collection of practical, client-side image analysis tools focused on transparency, performance, and developer-friendly design.

---

## License

MIT License — free to use, modify, and distribute.

