/**
 * Fails when component code uses a raw color, length or duration instead of a design token.
 * Scans the library (`src/slotkit`) and the docs site (`src/app`, `src/docs`), excluding
 * tests and the token files themselves.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findViolations } from './hardcoded-rules';

const ROOT = join(import.meta.dirname, '..');
const SCANNED = ['slotkit', 'app', 'docs'].map((dir) => join(ROOT, 'src', dir));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'tokens' ? [] : walk(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const files = SCANNED.flatMap(walk);
let count = 0;
for (const file of files) {
  for (const v of findViolations(readFileSync(file, 'utf8'))) {
    count++;
    console.error(`${relative(ROOT, file)}:${v.line}:${v.column}  ${v.rule}: ${v.match}`);
  }
}

if (count > 0) {
  console.error(`\n${count} hardcoded value(s). Use a design token instead.`);
  process.exit(1);
}
console.log(`check-hardcoded: ${files.length} files clean.`);
