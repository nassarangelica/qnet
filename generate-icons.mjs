import { createCanvas } from "canvas";
import { mkdirSync, writeFileSync } from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync("./public/icons", { recursive: true });

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#7c3aed");
  gradient.addColorStop(1, "#4f46e5");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("v", size / 2, size / 2 + size * 0.04);

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(`./public/icons/icon-${size}x${size}.png`, buffer);
  console.log(`✅ icon-${size}x${size}.png`);
}

console.log("\n🎉 All icons generated!");