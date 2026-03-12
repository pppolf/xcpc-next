import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, "../node_modules/monaco-editor/min/vs");
const dest = path.join(__dirname, "../public/monaco/min/vs");

// Recursive copy function
function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log(`Copying Monaco Editor assets from ${src} to ${dest}...`);
  if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log("Monaco Editor assets copied successfully.");
  } else {
    console.error(`Error: Source directory ${src} does not exist.`);
    console.error(
      'Please ensure "monaco-editor" is installed in node_modules.',
    );
    process.exit(1);
  }
} catch (err) {
  console.error("Error copying Monaco Editor assets:", err);
  process.exit(1);
}
