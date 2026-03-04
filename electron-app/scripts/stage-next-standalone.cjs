const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const nextStandaloneDir = path.join(repoRoot, ".next", "standalone");
const nextStaticDir = path.join(repoRoot, ".next", "static");
const publicDir = path.join(repoRoot, "public");
const targetDir = path.join(__dirname, "..", "next-dist");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);

  if (stat.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(src);
    ensureDir(path.dirname(dest));
    fs.symlinkSync(linkTarget, dest);
    return;
  }

  if (stat.isDirectory()) {
    ensureDir(dest);
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function emptyDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  const tempPath = `${dirPath}.old-${Date.now()}`;
  try {
    fs.renameSync(dirPath, tempPath);
  } catch (error) {
    // Fallback to in-place cleanup if rename fails.
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = fs.lstatSync(entryPath);
      if (stat.isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.rmSync(entryPath, { force: true });
      }
    }
    return;
  }

  ensureDir(dirPath);
  fs.rmSync(tempPath, { recursive: true, force: true });
}

if (!fs.existsSync(nextStandaloneDir)) {
  console.error("Missing .next/standalone. Run `pnpm -C .. build` first.");
  process.exit(1);
}

emptyDir(targetDir);
ensureDir(targetDir);

copyRecursive(nextStandaloneDir, targetDir);
copyRecursive(nextStaticDir, path.join(targetDir, ".next", "static"));

if (fs.existsSync(publicDir)) {
  copyRecursive(publicDir, path.join(targetDir, "public"));
}

console.log("Staged Next standalone output to", targetDir);
