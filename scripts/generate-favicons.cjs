const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(rawData);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeAndData, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderMascot(x, y, w, h) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);
  if (dist > 0.95) return [0, 0, 0, 0];

  // Visor
  if (ny >= -0.15 && ny <= 0.35 && Math.abs(nx) <= 0.6) {
    const leftEye = Math.sqrt(Math.pow(nx - (-0.26), 2) + Math.pow((ny - 0.08) * 1.3, 2));
    const rightEye = Math.sqrt(Math.pow(nx - 0.26, 2) + Math.pow((ny - 0.08) * 1.3, 2));
    if (leftEye < 0.11 || rightEye < 0.11) {
      return [61, 217, 164, 255];
    }
    return [20, 24, 34, 255];
  }

  // Body gradient
  const grad = Math.max(0, Math.min(1, (ny + 1) / 2));
  const r = Math.round(255 - grad * 60);
  const g = Math.round(107 - grad * 35);
  const b = Math.round(74 - grad * 35);
  const alpha = dist > 0.9 ? Math.round((0.95 - dist) / 0.05 * 255) : 255;
  return [r, g, b, alpha];
}

fs.writeFileSync('public/favicon-32x32.png', makePng(32, 32, renderMascot));
fs.writeFileSync('public/favicon-16x16.png', makePng(16, 16, renderMascot));
fs.writeFileSync('public/apple-touch-icon.png', makePng(180, 180, renderMascot));
console.log('PNG Favicons successfully generated in public/');
