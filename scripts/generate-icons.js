import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcImage = path.resolve('src/assets/images/motorola_company_brand_1787076290368.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generate() {
  console.log('Generating PWA icons from:', srcImage);

  // 192x192 any
  await sharp(srcImage)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512 any
  await sharp(srcImage)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // pwa-192x192.png
  await sharp(srcImage)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // pwa-512x512.png
  await sharp(srcImage)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // apple-touch-icon.png (180x180)
  await sharp(srcImage)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Maskable icon with 10% safe zone margin
  await sharp(srcImage)
    .resize(410, 410, { fit: 'cover' })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#0284c7'
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Also create icon.svg
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="100" fill="#0284c7"/>
    <circle cx="256" cy="256" r="180" fill="#ffffff" opacity="0.15"/>
    <path d="M120 370 L190 140 L256 310 L322 140 L392 370 L345 370 L300 220 L256 330 L212 220 L167 370 Z" fill="#ffffff"/>
  </svg>`;
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

  console.log('✅ All PWA and phone background icons successfully generated in /public!');
}

generate().catch(console.error);
