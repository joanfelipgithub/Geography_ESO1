#!/usr/bin/env node
/**
 * generate-manifest.js
 * Creates a manifest.json file listing all quiz files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUESTIONS_DIR = path.join(__dirname, 'questions');
const MANIFEST_PATH = path.join(QUESTIONS_DIR, 'manifest.json');

console.log('📋 Generating quiz manifest...');

if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error('❌ Questions directory not found!');
    process.exit(1);
}

const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(file => file.endsWith('.txt'))
    .sort();

const manifest = {
    files: files,
    generated: new Date().toISOString(),
    count: files.length
};

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✅ Manifest created with ${files.length} quiz files`);
console.log(`📄 Location: ${MANIFEST_PATH}`);
console.log('\nFiles included:');
files.forEach(file => console.log(`   • ${file}`));
