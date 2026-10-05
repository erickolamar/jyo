import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'node_modules/pdfjs-dist');
const {version} = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8'));
const target = resolve(root, 'public/pdfjs', version);
mkdirSync(target, {recursive:true});
cpSync(resolve(source, 'build/pdf.worker.min.mjs'), resolve(target, 'pdf.worker.min.mjs'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm']) cpSync(resolve(source, dir), resolve(target, dir), {recursive:true});
