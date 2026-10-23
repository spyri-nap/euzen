import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
// Small code-native E monogram. PNGs use a mask-safe central drawing.
function crc(b) {
  let c = 0xffffffff;
  for (const x of b) {
    c ^= x;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    n = Buffer.alloc(4),
    c = Buffer.alloc(4);
  n.writeUInt32BE(data.length);
  c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([n, t, data, c]);
}
await mkdir("dist/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const a = x / size,
        b = y / size;
      const ink =
        (a > 0.32 && a < 0.4 && b > 0.28 && b < 0.72) ||
        (a > 0.32 &&
          a < 0.68 &&
          ((b > 0.28 && b < 0.35) ||
            (b > 0.465 && b < 0.535) ||
            (b > 0.65 && b < 0.72)));
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      raw.set(ink ? [244, 242, 229] : [61, 73, 52], offset);
    }
  const h = Buffer.alloc(13);
  h.writeUInt32BE(size);
  h.writeUInt32BE(size, 4);
  h[8] = 8;
  h[9] = 2;
  await writeFile(
    `dist/icons/icon-${size}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", h),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`,
      ),
    )
  ).flat();
}
const assets = (await files("dist"))
  .filter((p) => !p.endsWith("/sw.js"))
  .map((p) => "/" + p.slice(5))
  .sort();
const hash = createHash("sha256");
for (const file of assets) hash.update(await readFile("dist" + file));
const build = hash.digest("hex").slice(0, 12);
const template = await readFile("scripts/sw.js", "utf8");
await writeFile(
  "dist/sw.js",
  template
    .replace("__BUILD__", build)
    .replace("__ASSETS__", JSON.stringify(assets)),
);
console.log(`PWA build ${build}: ${assets.length} precached files`);
