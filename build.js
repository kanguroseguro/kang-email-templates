#!/usr/bin/env bun

/**
 * Build MJML email templates from the src/ directory structure.
 *
 * Directory convention:
 *   src/{audience}/{provider}/{template}.{lang}.mjml
 *   → dist/{template}.{providerShort}.{lang}.html
 *
 * Provider short names: ci → ci, sendgrid → sg, hubspot → hs
 *
 * Usage:
 *   bun build.js           — compile all templates once
 *   bun build.js --watch   — recompile on file changes
 */

import { readFileSync, mkdirSync, watch as fsWatch } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import { Glob } from 'bun';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const PROVIDER_SHORT = { ci: 'ci', sendgrid: 'sg', hubspot: 'hs' };

/**
 * Find all template MJML files (excluding shared components).
 */
function findTemplates() {
  const glob = new Glob('src/{customer,agent}/**/*.mjml');
  return [...glob.scanSync('.')].sort();
}

/**
 * Parse a template path into its parts.
 * e.g., src/customer/ci/general.en.mjml → { audience: 'customer', provider: 'ci', name: 'general', lang: 'en' }
 */
function parsePath(filePath) {
  const rel = relative(SRC_DIR, filePath);
  const parts = rel.split('/');
  const audience = parts[0];
  const provider = parts[1];
  const filename = parts[2];
  const match = filename.match(/^(.+)\.(en|es)\.mjml$/);
  if (!match) return null;
  return { audience, provider, name: match[1], lang: match[2] };
}

/**
 * Compile a single MJML file to HTML.
 */
function compile(srcPath) {
  const parsed = parsePath(srcPath);
  if (!parsed) {
    console.warn(`  [SKIP] ${srcPath} — does not match {name}.{lang}.mjml pattern`);
    return null;
  }

  const short = PROVIDER_SHORT[parsed.provider];
  if (!short) {
    console.warn(`  [SKIP] ${srcPath} — unknown provider "${parsed.provider}"`);
    return null;
  }

  const outName = `${parsed.name}.${short}.${parsed.lang}.html`;
  const outPath = join(DIST_DIR, outName);

  try {
    execSync(`bunx mjml "${srcPath}" -o "${outPath}"`, { stdio: 'pipe' });
    const size = readFileSync(outPath, 'utf-8').length;
    return { outName, size, parsed };
  } catch (err) {
    console.error(`  [ERROR] ${srcPath}: ${err.stderr?.toString() || err.message}`);
    return null;
  }
}

/**
 * Build all templates.
 */
function buildAll() {
  mkdirSync(DIST_DIR, { recursive: true });

  const files = findTemplates();
  if (files.length === 0) {
    console.log('No templates found.');
    return;
  }

  console.log(`Building ${files.length} templates...\n`);
  let success = 0;

  for (const f of files) {
    const result = compile(f);
    if (result) {
      console.log(`  ${result.outName} (${result.size.toLocaleString()} chars)`);
      success++;
    }
  }

  console.log(`\nDone. ${success}/${files.length} templates compiled to ${DIST_DIR}/`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isWatch = process.argv.includes('--watch');

buildAll();

if (isWatch) {
  console.log('\nWatching for changes...');

  const watchDirs = [`${SRC_DIR}/customer`, `${SRC_DIR}/agent`, `${SRC_DIR}/shared`];

  for (const dir of watchDirs) {
    try {
      fsWatch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename?.endsWith('.mjml')) return;
        console.log(`\n[${new Date().toLocaleTimeString()}] Change detected: ${filename}`);

        if (dir.includes('shared')) {
          buildAll();
        } else {
          const fullPath = join(dir, filename);
          const result = compile(fullPath);
          if (result) {
            console.log(`  → ${result.outName} (${result.size.toLocaleString()} chars)`);
          }
        }
      });
    } catch {
      // Directory might not exist yet
    }
  }
}
