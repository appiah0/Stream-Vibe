#!/usr/bin/env node
// Run: node generate-icons.js
// Generates SVG-based icons for PWA. For production, replace with proper PNG files.

const fs = require('fs');

const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0a0a0f"/>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a0a"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
  </defs>
  <!-- Play button -->
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="#e50914" opacity="0.15"/>
  <polygon points="${size*0.38},${size*0.32} ${size*0.72},${size*0.5} ${size*0.38},${size*0.68}" fill="#e50914"/>
  <!-- ON text -->
  <text x="${size*0.5}" y="${size*0.88}" font-family="Arial Black, sans-serif" font-size="${size*0.12}" font-weight="900" fill="white" text-anchor="middle" letter-spacing="${size*0.008}">ONSTREAM</text>
</svg>`;

const sizes = [192, 512, 180, 167, 152];
sizes.forEach(s => {
  fs.writeFileSync(`public/icon-${s}.png`, svgIcon(s)); // In reality these would be PNGs
  console.log(`Created icon-${s}.png (SVG placeholder)`);
});
