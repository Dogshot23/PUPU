#!/usr/bin/env node
// ---------------------------------------------------------------------------
// PUPU dev utility: master -> PWA image sync
//
// Master art library (source of truth): images/pupu/
// PWA-served copies (what the browser actually loads):  pwa-mvp/images/pupu/
//
// app.js only ever references relative paths like "images/pupu/eyes/x.png",
// resolved against pwa-mvp/index.html's own URL -- there is no build step,
// no bundler, and no runtime dependency on an absolute filesystem path. That
// architecture is untouched by this script. All this does is copy files
// from the master folder into the PWA folder on request, with a diff report
// and an explicit confirmation prompt before anything is written.
//
// Usage:
//   node scripts/sync-images.js                 audit only (default) -- prints
//                                                the diff, copies nothing
//   node scripts/sync-images.js --audit          same as above, explicit
//   node scripts/sync-images.js --apply          prints the diff, then asks
//                                                for a typed confirmation
//                                                before copying
//   node scripts/sync-images.js --apply --include-protected
//                                                also allows PROTECTED_FILES
//                                                (see below) to be copied,
//                                                still subject to the same
//                                                diff + confirmation
//   node scripts/sync-images.js --apply --only=eyes/eyes_circles.png
//                                                restricts the copy
//                                                candidates to exactly the
//                                                given relative path(s)
//                                                (comma-separated for more
//                                                than one); still goes
//                                                through the full diff
//                                                report + confirmation
//
// Safety rules (all enforced below, not just documented):
//   - Only files that exist in the master library are ever copied. A file
//     missing from master is never a reason to delete or touch its PWA
//     copy -- master-only-missing files are reported, never acted on.
//   - Nothing is ever deleted, renamed, or overwritten without an explicit
//     typed confirmation in --apply mode.
//   - PROTECTED_FILES (currently just eyes_pupu.png, whose master copy has
//     been repeatedly found corrupted/missing during manual editing) are
//     excluded from the copy candidate list unless --include-protected is
//     passed AND the file passes the normal diff/confirmation flow.
//
// No npm dependencies: everything here is Node's own fs/path/crypto/zlib/
// readline. The alpha-bounds measurement for eyes/ assets is a small
// hand-written PNG decoder (chunk parsing + zlib inflate + PNG filter
// reconstruction) so this stays a plain `node scripts/sync-images.js` with
// nothing to install.
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const readline = require("readline");

const REPO_ROOT = path.join(__dirname, "..");
const SOURCE_DIR = path.join(REPO_ROOT, "images", "pupu");
const DEST_DIR = path.join(REPO_ROOT, "pwa-mvp", "images", "pupu");

// Files that must never be copied without an extra explicit opt-in, because
// their master copy has a history of being corrupted or accidentally
// deleted during manual art edits this session.
const PROTECTED_FILES = ["eyes/eyes_pupu.png"];

const ALPHA_THRESHOLD = 10; // matches the threshold used throughout this session's manual audits
const ALIGNMENT_BASELINE_CENTER_Y = { min: 0.345, max: 0.351 }; // observed range for correctly-aligned eye assets

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function listPngsRelative(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => path.relative(dir, path.join(entry.parentPath ?? entry.path, entry.name)).split(path.sep).join("/"))
    .sort();
}

function hashFile(filePath) {
  return crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

// ---------------------------------------------------------------------------
// Minimal dependency-free PNG decoder, just enough to measure alpha bounds.
// Supports 8-bit, non-interlaced PNGs with color type 2 (RGB), 4 (grey+alpha)
// or 6 (RGBA) -- covers every asset in this project. Anything else reports
// "unsupported" rather than guessing.
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { error: "not a PNG (bad signature)" };
  }

  let offset = 8;
  let width, height, bitDepth, colorType, interlace;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      interlace = data.readUInt8(12);
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset += 8 + length + 4; // length + type + data + CRC
  }

  if (!width || !height) return { error: "no IHDR found" };
  if (bitDepth !== 8) return { error: `unsupported bit depth ${bitDepth} (only 8-bit supported)` };
  if (interlace !== 0) return { error: "interlaced PNG not supported" };
  if (![2, 4, 6].includes(colorType)) return { error: `unsupported color type ${colorType}` };

  const channels = { 2: 3, 4: 2, 6: 4 }[colorType];
  const hasAlpha = colorType === 4 || colorType === 6;
  const bpp = channels; // bytes per pixel at 8-bit depth
  const stride = width * bpp;

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(height * stride);

  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[rawOffset];
    rawOffset += 1;
    const rowStart = y * stride;
    const priorRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const filt = raw[rawOffset + x];
      const left = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const up = y > 0 ? pixels[priorRowStart + x] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[priorRowStart + x - bpp] : 0;

      let value;
      switch (filterType) {
        case 0:
          value = filt;
          break;
        case 1:
          value = filt + left;
          break;
        case 2:
          value = filt + up;
          break;
        case 3:
          value = filt + Math.floor((left + up) / 2);
          break;
        case 4:
          value = filt + paethPredictor(left, up, upLeft);
          break;
        default:
          return { error: `unknown filter type ${filterType} on row ${y}` };
      }
      pixels[rowStart + x] = value & 0xff;
    }
    rawOffset += stride;
  }

  return { width, height, channels, hasAlpha, bpp, pixels };
}

function measureAlphaBounds(filePath) {
  const decoded = decodePng(filePath);
  if (decoded.error) return { error: decoded.error };

  const { width, height, channels, hasAlpha, pixels } = decoded;
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = hasAlpha ? pixels[idx + channels - 1] : 255;
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return { width, height, empty: true };

  return {
    width,
    height,
    top: +(minY / height).toFixed(3),
    bottom: +(maxY / height).toFixed(3),
    left: +(minX / width).toFixed(3),
    right: +(maxX / width).toFixed(3),
    centerY: +(((minY + maxY) / 2) / height).toFixed(3),
    centerX: +(((minX + maxX) / 2) / width).toFixed(3),
  };
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

function buildDiff() {
  const sourceFiles = new Set(listPngsRelative(SOURCE_DIR));
  const destFiles = new Set(listPngsRelative(DEST_DIR));
  const allFiles = [...new Set([...sourceFiles, ...destFiles])].sort();

  const identical = [];
  const different = [];
  const missingFromMaster = []; // exists in PWA, not in master -- never touched
  const missingFromPwa = []; // exists in master, not in PWA -- copy candidate

  for (const rel of allFiles) {
    const srcPath = path.join(SOURCE_DIR, rel);
    const dstPath = path.join(DEST_DIR, rel);
    const inSource = sourceFiles.has(rel);
    const inDest = destFiles.has(rel);

    if (inSource && !inDest) {
      missingFromPwa.push({ rel, size: fs.statSync(srcPath).size });
      continue;
    }
    if (!inSource && inDest) {
      missingFromMaster.push({ rel, size: fs.statSync(dstPath).size });
      continue;
    }

    const srcSize = fs.statSync(srcPath).size;
    const dstSize = fs.statSync(dstPath).size;
    const srcHash = hashFile(srcPath);
    const dstHash = hashFile(dstPath);

    if (srcHash === dstHash) {
      identical.push({ rel, size: srcSize });
      continue;
    }

    const entry = { rel, srcSize, dstSize, srcHash, dstHash };
    if (rel.startsWith("eyes/")) {
      entry.srcAlpha = measureAlphaBounds(srcPath);
      entry.dstAlpha = measureAlphaBounds(dstPath);
    }
    different.push(entry);
  }

  return { identical, different, missingFromMaster, missingFromPwa };
}

function classify(entry) {
  if (entry.srcAlpha && entry.dstAlpha && !entry.srcAlpha.error && !entry.dstAlpha.error) {
    if (entry.srcAlpha.empty || entry.dstAlpha.empty) return "unknown (one image has no visible content)";
    const dy = Math.abs(entry.srcAlpha.centerY - entry.dstAlpha.centerY);
    const dx = Math.abs(entry.srcAlpha.centerX - entry.dstAlpha.centerX);
    const dTop = Math.abs(entry.srcAlpha.top - entry.dstAlpha.top);
    const dBottom = Math.abs(entry.srcAlpha.bottom - entry.dstAlpha.bottom);
    if (dy < 0.01 && dx < 0.01 && dTop < 0.01 && dBottom < 0.01) {
      return "recompression/re-export (content position essentially unchanged)";
    }
    return `artwork moved within canvas (centerY shifted by ${dy.toFixed(3)})`;
  }
  const sizeRatio = entry.dstSize > 0 ? entry.srcSize / entry.dstSize : Infinity;
  if (sizeRatio > 3 || sizeRatio < 0.33) return "possible content/canvas difference (size ratio suggests more than recompression)";
  return "recompression/re-export or unknown -- inspect visually if unsure";
}

function checkEyeAlignment(rel, alpha, label) {
  if (!rel.startsWith("eyes/") || !alpha || alpha.error || alpha.empty) return null;
  const { min, max } = ALIGNMENT_BASELINE_CENTER_Y;
  if (alpha.centerY < min || alpha.centerY > max) {
    return `${label} centerY=${alpha.centerY} is OUTSIDE the aligned-eyes range [${min}, ${max}] -- flag for review`;
  }
  return `${label} centerY=${alpha.centerY} is within the aligned-eyes range [${min}, ${max}]`;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(diff) {
  console.log("=".repeat(78));
  console.log("PUPU image sync -- master -> PWA diff report");
  console.log(`  source: ${SOURCE_DIR}`);
  console.log(`  dest:   ${DEST_DIR}`);
  console.log("=".repeat(78));

  console.log(`\nIdentical files: ${diff.identical.length}`);

  console.log(`\nDifferent files: ${diff.different.length}`);
  for (const entry of diff.different) {
    const protectedTag = PROTECTED_FILES.includes(entry.rel) ? "  [PROTECTED]" : "";
    console.log(`\n  ${entry.rel}${protectedTag}`);
    console.log(`    master: ${entry.srcSize} bytes, ${entry.srcHash}`);
    console.log(`    pwa:    ${entry.dstSize} bytes, ${entry.dstHash}`);
    console.log(`    verdict: ${classify(entry)}`);
    if (entry.srcAlpha) {
      console.log(`    master alpha bounds: ${entry.srcAlpha.error ? entry.srcAlpha.error : JSON.stringify(entry.srcAlpha)}`);
      console.log(`    pwa alpha bounds:    ${entry.dstAlpha.error ? entry.dstAlpha.error : JSON.stringify(entry.dstAlpha)}`);
      const masterAlign = checkEyeAlignment(entry.rel, entry.srcAlpha, "master");
      const pwaAlign = checkEyeAlignment(entry.rel, entry.dstAlpha, "pwa");
      if (masterAlign) console.log(`    ${masterAlign}`);
      if (pwaAlign) console.log(`    ${pwaAlign}`);
    }
  }

  console.log(`\nMissing from master (present only in PWA -- NEVER deleted, listed for visibility only): ${diff.missingFromMaster.length}`);
  for (const entry of diff.missingFromMaster) {
    const protectedTag = PROTECTED_FILES.includes(entry.rel) ? "  [PROTECTED]" : "";
    console.log(`  ${entry.rel} (${entry.size} bytes)${protectedTag}`);
  }

  console.log(`\nMissing from PWA (present only in master -- copy candidates): ${diff.missingFromPwa.length}`);
  for (const entry of diff.missingFromPwa) {
    console.log(`  ${entry.rel} (${entry.size} bytes)`);
  }

  console.log("\n" + "=".repeat(78));
  console.log(
    `TOTAL: ${diff.identical.length + diff.different.length + diff.missingFromMaster.length} files tracked ` +
      `(${diff.identical.length} identical, ${diff.different.length} different, ` +
      `${diff.missingFromMaster.length} master-only-missing, ${diff.missingFromPwa.length} pwa-only-missing)`
  );
  console.log("=".repeat(78));
}

// ---------------------------------------------------------------------------
// Copy (apply mode only, after confirmation)
// ---------------------------------------------------------------------------

function buildCopyCandidates(diff, includeProtected, onlyFilter) {
  let candidates = [...diff.different.map((e) => e.rel), ...diff.missingFromPwa.map((e) => e.rel)];
  const notFound = [];

  if (onlyFilter && onlyFilter.length > 0) {
    const candidateSet = new Set(candidates);
    for (const rel of onlyFilter) {
      if (!candidateSet.has(rel)) notFound.push(rel);
    }
    candidates = candidates.filter((rel) => onlyFilter.includes(rel));
  }

  const skippedProtected = [];
  const allowed = [];
  for (const rel of candidates) {
    if (PROTECTED_FILES.includes(rel) && !includeProtected) {
      skippedProtected.push(rel);
    } else {
      allowed.push(rel);
    }
  }
  return { allowed, skippedProtected, notFound };
}

function promptConfirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const includeProtected = args.includes("--include-protected");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const onlyFilter = onlyArg ? onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean) : null;

  const diff = buildDiff();
  printReport(diff);

  if (!apply) {
    console.log("\nAudit mode (default) -- nothing was copied. Re-run with --apply to copy after a confirmation prompt.");
    return;
  }

  const { allowed, skippedProtected, notFound } = buildCopyCandidates(diff, includeProtected, onlyFilter);

  if (notFound.length > 0) {
    console.log(`\n--only requested file(s) not found among diff candidates (typo, or already identical?): ${notFound.join(", ")}`);
  }
  if (skippedProtected.length > 0) {
    console.log(`\nSkipping PROTECTED file(s) (pass --include-protected to allow): ${skippedProtected.join(", ")}`);
  }

  if (allowed.length === 0) {
    console.log("\nNothing to copy.");
    return;
  }

  console.log(`\nAbout to copy ${allowed.length} file(s) from master into pwa-mvp:`);
  allowed.forEach((rel) => console.log(`  ${rel}`));

  const answer = await promptConfirm('\nType "SYNC" (all caps) to proceed, anything else to abort: ');
  if (answer !== "SYNC") {
    console.log("Aborted -- nothing was copied.");
    return;
  }

  for (const rel of allowed) {
    const srcPath = path.join(SOURCE_DIR, rel);
    const dstPath = path.join(DEST_DIR, rel);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.copyFileSync(srcPath, dstPath);
    console.log(`  copied: ${rel}`);
  }
  console.log(`\nDone. ${allowed.length} file(s) copied.`);
}

main().catch((err) => {
  console.error("sync-images.js failed:", err);
  process.exitCode = 1;
});
