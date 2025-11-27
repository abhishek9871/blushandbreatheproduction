#!/usr/bin/env npx ts-node
/**
 * Data Import Script for Substance Education Platform
 * 
 * This script imports research data from JSON files into Cloudflare KV namespaces.
 * It can be run locally with wrangler or via the API endpoint.
 * 
 * Usage:
 *   npx ts-node scripts/import-data.ts [--dry-run] [--target=kv|api]
 * 
 * Options:
 *   --dry-run   Validate data without importing
 *   --target    Import destination: 'kv' (wrangler) or 'api' (Worker API)
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface ImportResult {
  success: boolean;
  imported: {
    banned: number;
    supplements: number;
    products: number;
  };
  errors: string[];
  warnings: string[];
}

interface BannedSubstance {
  id: string;
  slug: string;
  name: string;
  [key: string]: unknown;
}

interface LegalSupplement {
  id: string;
  slug: string;
  name: string;
  [key: string]: unknown;
}

interface AffiliateProduct {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'lib', 'data');
const KV_NAMESPACES = {
  SUBSTANCE_CACHE: 'substance-cache',
  MEDICINE_CACHE: 'medicine-cache',
  AFFILIATE_DATA: 'affiliate-data',
};

// Key prefixes for KV storage
const KEY_PREFIXES = {
  BANNED: 'banned:',
  SUPPLEMENT: 'supplement:',
  PRODUCT: 'product:',
  INDEX: 'index:',
};

/**
 * Load JSON data from file
 */
function loadJsonFile<T>(filename: string): T | null {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

/**
 * Validate data integrity
 */
function validateData(
  banned: BannedSubstance[],
  supplements: LegalSupplement[],
  products: AffiliateProduct[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required fields in banned substances
  banned.forEach((item, index) => {
    if (!item.id) errors.push(`Banned substance at index ${index} missing id`);
    if (!item.slug) errors.push(`Banned substance at index ${index} missing slug`);
    if (!item.name) errors.push(`Banned substance at index ${index} missing name`);
  });

  // Check for required fields in supplements
  supplements.forEach((item, index) => {
    if (!item.id) errors.push(`Supplement at index ${index} missing id`);
    if (!item.slug) errors.push(`Supplement at index ${index} missing slug`);
    if (!item.name) errors.push(`Supplement at index ${index} missing name`);
  });

  // Check for required fields in products
  products.forEach((item, index) => {
    if (!item.id) errors.push(`Product at index ${index} missing id`);
    if (!item.name) errors.push(`Product at index ${index} missing name`);
  });

  // Check for duplicate slugs
  const bannedSlugs = new Set<string>();
  banned.forEach(item => {
    if (bannedSlugs.has(item.slug)) {
      errors.push(`Duplicate banned substance slug: ${item.slug}`);
    }
    bannedSlugs.add(item.slug);
  });

  const supplementSlugs = new Set<string>();
  supplements.forEach(item => {
    if (supplementSlugs.has(item.slug)) {
      errors.push(`Duplicate supplement slug: ${item.slug}`);
    }
    supplementSlugs.add(item.slug);
  });

  const productIds = new Set<string>();
  products.forEach(item => {
    if (productIds.has(item.id)) {
      errors.push(`Duplicate product id: ${item.id}`);
    }
    productIds.add(item.id);
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Generate KV entries for wrangler bulk upload
 */
function generateKvEntries(
  banned: BannedSubstance[],
  supplements: LegalSupplement[],
  products: AffiliateProduct[]
): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];

  // Add banned substances
  banned.forEach(item => {
    entries.push({
      key: `${KEY_PREFIXES.BANNED}${item.slug}`,
      value: JSON.stringify(item),
    });
  });

  // Add supplements
  supplements.forEach(item => {
    entries.push({
      key: `${KEY_PREFIXES.SUPPLEMENT}${item.slug}`,
      value: JSON.stringify(item),
    });
  });

  // Add products
  products.forEach(item => {
    entries.push({
      key: `${KEY_PREFIXES.PRODUCT}${item.id}`,
      value: JSON.stringify(item),
    });
  });

  // Add index entries for listing
  entries.push({
    key: `${KEY_PREFIXES.INDEX}banned-slugs`,
    value: JSON.stringify(banned.map(s => s.slug)),
  });

  entries.push({
    key: `${KEY_PREFIXES.INDEX}supplement-slugs`,
    value: JSON.stringify(supplements.map(s => s.slug)),
  });

  entries.push({
    key: `${KEY_PREFIXES.INDEX}product-ids`,
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

  return entries;
}

/**
 * Import data via Cloudflare Worker API
 */
async function importViaApi(
  banned: BannedSubstance[],
  supplements: LegalSupplement[],
  products: AffiliateProduct[]
): Promise<ImportResult> {
  const apiUrl = process.env.WORKER_API_URL || 'https://api.blushandbreathe.com';
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return {
      success: false,
      imported: { banned: 0, supplements: 0, products: 0 },
      errors: ['ADMIN_TOKEN environment variable not set'],
      warnings: [],
    };
  }

  try {
    const response = await fetch(`${apiUrl}/admin/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        banned,
        supplements,
        products,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        imported: { banned: 0, supplements: 0, products: 0 },
        errors: [`API error: ${response.status} - ${errorText}`],
        warnings: [],
      };
    }

    const result = await response.json();
    return {
      success: true,
      imported: {
        banned: banned.length,
        supplements: supplements.length,
        products: products.length,
      },
      errors: [],
      warnings: result.warnings || [],
    };
  } catch (error) {
    return {
      success: false,
      imported: { banned: 0, supplements: 0, products: 0 },
      errors: [`Network error: ${error}`],
      warnings: [],
    };
  }
}

/**
 * Generate wrangler bulk upload file
 */
function generateWranglerBulkFile(entries: Array<{ key: string; value: string }>): void {
  const outputPath = path.join(__dirname, 'kv-bulk-upload.json');
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
  console.log(`Generated bulk upload file: ${outputPath}`);
  console.log(`Run: npx wrangler kv:bulk put --namespace-id=YOUR_NAMESPACE_ID ${outputPath}`);
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const targetArg = args.find(a => a.startsWith('--target='));
  const target = targetArg ? targetArg.split('=')[1] : 'kv';

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Substance Education Platform - Data Import');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'IMPORT'}`);
  console.log(`Target: ${target}`);
  console.log('');

  // Load data files
  console.log('Loading data files...');
  
  const bannedData = loadJsonFile<{ substances: BannedSubstance[] }>('banned-substances.json');
  const supplementData = loadJsonFile<{ supplements: LegalSupplement[] }>('legal-supplements.json');
  const productData = loadJsonFile<{ products: AffiliateProduct[] }>('affiliate-products.json');

  if (!bannedData || !supplementData || !productData) {
    console.error('Failed to load one or more data files');
    process.exit(1);
  }

  const banned = bannedData.substances;
  const supplements = supplementData.supplements;
  const products = productData.products;

  console.log(`  Banned substances: ${banned.length}`);
  console.log(`  Legal supplements: ${supplements.length}`);
  console.log(`  Affiliate products: ${products.length}`);
  console.log('');

  // Validate data
  console.log('Validating data...');
  const validation = validateData(banned, supplements, products);
  
  if (!validation.valid) {
    console.error('Validation failed:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  
  console.log('  ✓ All data validated successfully');
  console.log('');

  if (isDryRun) {
    console.log('DRY RUN complete. No data imported.');
    return;
  }

  // Import based on target
  if (target === 'api') {
    console.log('Importing via Worker API...');
    const result = await importViaApi(banned, supplements, products);
    
    if (result.success) {
      console.log('  ✓ Import successful');
      console.log(`    Banned: ${result.imported.banned}`);
      console.log(`    Supplements: ${result.imported.supplements}`);
      console.log(`    Products: ${result.imported.products}`);
    } else {
      console.error('Import failed:');
      result.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
  } else {
    console.log('Generating wrangler bulk upload file...');
    const entries = generateKvEntries(banned, supplements, products);
    generateWranglerBulkFile(entries);
    console.log('');
    console.log(`Generated ${entries.length} KV entries`);
    console.log('');
    console.log('To import to Cloudflare KV:');
    console.log('  1. Get your KV namespace ID from wrangler.toml or Cloudflare dashboard');
    console.log('  2. Run: npx wrangler kv:bulk put --namespace-id=<NAMESPACE_ID> scripts/kv-bulk-upload.json');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Import complete!');
  console.log('═══════════════════════════════════════════════════════════════');
}

// Run main function
main().catch(console.error);
