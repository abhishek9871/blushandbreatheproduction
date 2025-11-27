#!/usr/bin/env node
/**
 * Generate KV Bulk Upload File
 * This creates a JSON file that can be uploaded to Cloudflare KV
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'lib', 'data');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Substance Education Platform - KV Bulk File Generator');
console.log('═══════════════════════════════════════════════════════════════');

// Load data files
console.log('Loading data files...');

const bannedData = JSON.parse(readFileSync(join(DATA_DIR, 'banned-substances.json'), 'utf-8'));
const supplementData = JSON.parse(readFileSync(join(DATA_DIR, 'legal-supplements.json'), 'utf-8'));
const productData = JSON.parse(readFileSync(join(DATA_DIR, 'affiliate-products.json'), 'utf-8'));

const banned = bannedData.substances || [];
const supplements = supplementData.supplements || [];

// Flatten products from grouped structure
let products = [];
if (productData.products) {
  products = productData.products;
} else if (productData.productGroups) {
  // Handle grouped structure
  for (const group of productData.productGroups) {
    if (group.products) {
      products.push(...group.products);
    }
  }
}

console.log(`  Banned substances: ${banned.length}`);
console.log(`  Legal supplements: ${supplements.length}`);
console.log(`  Affiliate products: ${products.length}`);
console.log('');

// Generate KV entries with CORRECT prefixes matching substanceDataService.ts
// KV_PREFIXES = { BANNED: 'substance:banned:', SUPPLEMENT: 'substance:supplement:', ... }
const entries = [];

// Add banned substances with correct prefix
banned.forEach(item => {
  entries.push({
    key: `substance:banned:${item.slug}`,
    value: JSON.stringify(item),
  });
});

// Add supplements with correct prefix
supplements.forEach(item => {
  entries.push({
    key: `substance:supplement:${item.slug}`,
    value: JSON.stringify(item),
  });
});

// Add products with correct prefix
products.forEach(item => {
  entries.push({
    key: `substance:affiliate:product:${item.id}`,
    value: JSON.stringify(item),
  });
});

// Group products by supplement slug for efficient lookup
const productsBySupp = {};
products.forEach(product => {
  if (product.relatedSupplements) {
    product.relatedSupplements.forEach(slug => {
      if (!productsBySupp[slug]) productsBySupp[slug] = [];
      productsBySupp[slug].push(product);
    });
  }
});

// Store products grouped by supplement
for (const [suppSlug, prods] of Object.entries(productsBySupp)) {
  entries.push({
    key: `substance:affiliate:${suppSlug}`,
    value: JSON.stringify(prods),
  });
}

// Add index entries with correct keys
entries.push({
  key: 'substance:index:banned',
  value: JSON.stringify(banned.map(s => s.slug)),
});

entries.push({
  key: 'substance:index:supplements',
  value: JSON.stringify(supplements.map(s => s.slug)),
});

entries.push({
  key: 'substance:index:affiliates',
  value: JSON.stringify(products.map(p => p.id)),
});

// Add metadata
entries.push({
  key: 'metadata:last-import',
  value: JSON.stringify({
    timestamp: new Date().toISOString(),
    counts: {
      banned: banned.length,
      supplements: supplements.length,
      products: products.length,
    },
  }),
});

// Write output file
const outputPath = join(__dirname, 'kv-bulk-upload.json');
writeFileSync(outputPath, JSON.stringify(entries, null, 2));

console.log(`✓ Generated ${entries.length} KV entries`);
console.log(`✓ Output file: ${outputPath}`);
console.log('');
console.log('Next steps:');
console.log('  npx wrangler kv bulk put --namespace-id=ae605f986088485a8e8d3d6632064f94 scripts/kv-bulk-upload.json');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
