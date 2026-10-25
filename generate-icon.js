import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6c5ce7" />
      <stop offset="100%" stop-color="#4834d4" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad)" />
  <path d="M140 160 H372 V210 H286 V380 H226 V210 H140 Z" fill="#ffffff" />
</svg>`;

fs.writeFileSync(path.join(__dirname, 'public', 'icon.svg'), svgIcon, 'utf8');
console.log('SVG icon generated successfully!');
