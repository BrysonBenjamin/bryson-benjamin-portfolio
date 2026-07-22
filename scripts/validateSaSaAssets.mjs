import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const assetDirectory = new URL("../apps/web/src/assets/sa-sa/", import.meta.url);
const requiredAssets = [
  "sa-sa-emotion-idle.png",
  "sa-sa-emotion-thinking.png",
  "sa-sa-emotion-success.png",
  "sa-sa-emotion-error.png",
  "sa-sa-loaf-base.png",
  "sa-sa-loaf-breathe-overlay.png",
  "sa-sa-loaf-tail-mid.png",
  "sa-sa-loaf-tail-up.png",
  "sa-sa-loaf-tail-down.png"
];
const expectedName = /^sa-sa-[a-z0-9-]+\.png$/;
const pngSignature = "89504e470d0a1a0a";
const maxAssetBytes = 30 * 1024;
const maxPackBytes = 60 * 1024;

const assetPath = assetDirectory.pathname;
const files = (await readdir(assetPath)).filter((file) => file.endsWith(".png"));
const errors = [];
const hashes = new Map();
let totalBytes = 0;

for (const requiredAsset of requiredAssets) {
  if (!files.includes(requiredAsset)) {
    errors.push(`Missing required Sa-Sa asset: ${requiredAsset}`);
  }
}

for (const file of files) {
  if (!expectedName.test(file)) {
    errors.push(`Invalid Sa-Sa asset name: ${file}`);
    continue;
  }

  const buffer = await readFile(join(assetPath, file));
  totalBytes += buffer.byteLength;

  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    errors.push(`${file} is not a PNG.`);
    continue;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  if (width !== 100 || height !== 100) {
    errors.push(`${file} must be 100×100; received ${width}×${height}.`);
  }

  if (buffer.byteLength > maxAssetBytes) {
    errors.push(`${file} exceeds the ${maxAssetBytes} byte per-asset budget.`);
  }

  const hash = createHash("sha256").update(buffer).digest("hex");
  const duplicate = hashes.get(hash);

  if (duplicate) {
    errors.push(`${file} duplicates ${duplicate}; duplicate frames need an explicit manifest alias instead.`);
  } else {
    hashes.set(hash, file);
  }
}

if (totalBytes > maxPackBytes) {
  errors.push(`Sa-Sa pack exceeds the ${maxPackBytes} byte MVP budget (${totalBytes} bytes).`);
}

if (errors.length > 0) {
  console.error("Sa-Sa asset validation failed:\n- " + errors.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Sa-Sa asset validation passed: ${files.length} assets, ${totalBytes} bytes total.`);
}
