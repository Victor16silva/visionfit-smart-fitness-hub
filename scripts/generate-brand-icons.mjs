import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "nvdesing2", "logonv.png");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");

mkdirSync(iconsDir, { recursive: true });
copyFileSync(source, join(root, "src", "assets", "logo.png"));
copyFileSync(source, join(publicDir, "logo.png"));

async function squarePng(size, dest, { padding = 0 } = {}) {
  const inner = Math.max(1, Math.round(size * (1 - padding * 2)));
  const resized = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: { r: 11, g: 11, b: 18, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 11, g: 11, b: 18, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(dest);
}

function pngToIco(pngBuffer, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

await squarePng(32, join(publicDir, "favicon-32.png"));
await squarePng(180, join(iconsDir, "apple-touch-icon.png"));
await squarePng(192, join(iconsDir, "icon-192.png"));
await squarePng(512, join(iconsDir, "icon-512.png"));
await squarePng(512, join(iconsDir, "maskable-512.png"), { padding: 0.18 });

const faviconPng = readFileSync(join(publicDir, "favicon-32.png"));
writeFileSync(join(publicDir, "favicon.ico"), pngToIco(faviconPng, 32, 32));

console.log("Brand icons generated from nvdesing2/logonv.png");
