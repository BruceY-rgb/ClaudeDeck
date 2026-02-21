const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToIco() {
  const svgPath = path.join(__dirname, 'resources', 'logo.svg');
  const icoPath = path.join(__dirname, 'resources', 'icon.ico');
  const tempDir = path.join(__dirname, 'temp-icons');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Read SVG and convert to PNG at various sizes
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngPaths = [];

  for (const size of sizes) {
    const pngPath = path.join(tempDir, `icon-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    pngPaths.push(pngPath);
    console.log(`Created ${size}x${size} PNG`);
  }

  // Use electron-builder's icon generation instead
  // Just create a 256x256 PNG for electron-builder to use
  const mainPngPath = path.join(__dirname, 'resources', 'icon.png');
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(mainPngPath);
  console.log('Main PNG icon created:', mainPngPath);

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true });
  console.log('Done! Use icon.png for electron-builder');
}

convertSvgToIco().catch(console.error);
