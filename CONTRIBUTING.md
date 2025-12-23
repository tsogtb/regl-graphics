# 🛸 Contributing to DeepField.js

First off, thank you for considering a contribution! Whether you're fixing a typo in the math or adding an entirely new dimension (literally), you're helping expand our little corner of the digital universe.

Inspired by the Hubble Ultra-Deep Field, this project aims to turn "empty space" into structured beauty.

## 🌌 How can you help?
1. Discover New "Galaxies" (New Shapes)

The universe is bigger than just boxes and spheres. We’d love to see:

    2D Shapes: Regular polygons, stars, or complex splines.

    3D Volumes: Toruses, capsules, or even custom meshes.

    Composite Logic: Better ways to subtract, intersect, or blend geometries.

2. Fine-Tune the "Telescope" (Optimization)

Monte Carlo sampling can be heavy. if you have a way to make the contains() checks faster or the sample() logic more efficient without losing uniformity, we want to hear about it!

3. Documentation & Visuals

Did you make a cool demo using DeepField? Open a PR to add it to the examples/ folder! Clearer docs and prettier point clouds are always welcome.

## 🛰 Guidelines for Explorers

To keep the project lightweight and "zero-dependency," please follow these ground rules:

1. Keep it Pure: All core geometry logic in src/ must be vanilla JavaScript. No external libraries, no frameworks—just pure math and logic.

2. Uniformity is Key: If you add a shape, ensure it samples uniformly. (No "clumping" at the poles or edges!)

3. Document as you go: Add JSDoc comments so others can see how to use your new shapes in their IDE.

4. The "Wait, that's cool" Factor: If it looks like a star field, you're doing it right.

## 🛠 The Workflow

1. Fork the repository.

2. Create a branch for your feature (git checkout -b feature/neon-star-shape).

3. Commit your changes with a friendly message.

4. Push to your fork and Open a Pull Request.

## 👩‍🚀 Community & Conduct

Be kind! This is a project born out of curiosity and a love for science. We’re all here to learn and build something cool together.

Questions? Open an issue! I’d love to chat about math, astronomy, or WebGL anytime.