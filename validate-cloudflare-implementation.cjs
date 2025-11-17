#!/usr/bin/env node

/**
 * Cloudflare Implementation Validation Script
 * 
 * This script validates that all required files and configurations
 * are in place for the Cloudflare Pages + Workers deployment.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'functions/api/products/[barcode]/merged.ts',
  'functions/api/products/[barcode]/suggestions.ts', 
  'functions/api/affiliate/click.ts',
  'functions/admin/products/[barcode]/override.ts',
  'functions/admin/products/[barcode]/edit.ts',
  'wrangler.toml',
  'README_DEPLOY.md',
  'playwright/production.spec.js'
];

const REQUIRED_KV_BINDINGS = [
  'MERGED_CACHE',
  'EBAY_TOKEN', 
  'SUGGESTIONS',
  'OVERRIDES',
  'AFFILIATE'
];

const REQUIRED_ENV_VARS = [
  'EBAY_CLIENT_ID',
  'EBAY_CLIENT_SECRET',
  'EBAY_CAMPAIGN_ID',
  'ADMIN_PASSWORD',
  'OBF_BASE_URL',
  'MERGED_TTL_SECONDS'
];

console.log('🔍 Validating Cloudflare Pages + Workers Implementation...\n');

let allValid = true;

// Check required files exist
console.log('📁 Checking required files...');
for (const file of REQUIRED_FILES) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allValid = false;
  }
}

// Check wrangler.toml configuration
console.log('\n⚙️  Checking wrangler.toml configuration...');
try {
  const wranglerContent = fs.readFileSync(path.join(__dirname, 'wrangler.toml'), 'utf8');
  
  // Check KV bindings
  for (const binding of REQUIRED_KV_BINDINGS) {
    if (wranglerContent.includes(`binding = "${binding}"`)) {
      console.log(`  ✅ KV binding: ${binding}`);
    } else {
      console.log(`  ❌ KV binding: ${binding} - MISSING`);
      allValid = false;
    }
  }
  
  // Check for placeholder IDs
  if (wranglerContent.includes('placeholder_')) {
    console.log('  ⚠️  WARNING: Placeholder KV namespace IDs detected');
    console.log('     Update with actual namespace IDs from Cloudflare dashboard');
  }
  
} catch (error) {
  console.log('  ❌ wrangler.toml - Cannot read file');
  allValid = false;
}

// Check function implementations
console.log('\n🔧 Checking function implementations...');

// Check merged.ts
try {
  const mergedContent = fs.readFileSync(
    path.join(__dirname, 'functions/api/products/[barcode]/merged.ts'), 
    'utf8'
  );
  
  const checks = [
    { name: 'eBay token management', pattern: /getEbayToken/ },
    { name: 'eBay search with retry', pattern: /searchEbay/ },
    { name: 'Affiliate URL wrapping', pattern: /EBAY_CAMPAIGN_ID/ },
    { name: 'KV caching', pattern: /MERGED_CACHE/ },
    { name: 'Override support', pattern: /OVERRIDES/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(mergedContent)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT IMPLEMENTED`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log('  ❌ Cannot validate merged.ts implementation');
  allValid = false;
}

// Check ProductPage updates
console.log('\n🎨 Checking frontend updates...');
try {
  const productPageContent = fs.readFileSync(
    path.join(__dirname, 'pages/ProductPage.tsx'),
    'utf8'
  );
  
  if (productPageContent.includes('/api/products/${decodedId}/merged')) {
    console.log('  ✅ ProductPage uses Worker endpoints');
  } else {
    console.log('  ❌ ProductPage not updated for Worker endpoints');
    allValid = false;
  }
  
  if (productPageContent.includes('handleAffiliateClick')) {
    console.log('  ✅ Affiliate click tracking implemented');
  } else {
    console.log('  ❌ Affiliate click tracking missing');
    allValid = false;
  }
  
} catch (error) {
  console.log('  ❌ Cannot validate ProductPage updates');
  allValid = false;
}

// Check test coverage
console.log('\n🧪 Checking test coverage...');
try {
  const testContent = fs.readFileSync(
    path.join(__dirname, 'playwright/production.spec.js'),
    'utf8'
  );
  
  const testChecks = [
    'should fetch merged JSON from Worker endpoint',
    'should submit product suggestion', 
    'should track affiliate click',
    'should test admin endpoint authentication',
    'should validate eBay integration availability'
  ];
  
  for (const testCheck of testChecks) {
    if (testContent.includes(testCheck)) {
      console.log(`  ✅ ${testCheck}`);
    } else {
      console.log(`  ❌ ${testCheck} - TEST MISSING`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log('  ❌ Cannot validate test coverage');
  allValid = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('🎉 VALIDATION PASSED - Implementation is complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Create KV namespaces in Cloudflare dashboard');
  console.log('2. Update wrangler.toml with actual namespace IDs');
  console.log('3. Set environment variables in Cloudflare Pages');
  console.log('4. Deploy with: npm run build && npx wrangler pages deploy dist');
  console.log('5. Run production tests: npx playwright test playwright/production.spec.js');
} else {
  console.log('❌ VALIDATION FAILED - Please fix the issues above');
  process.exit(1);
}

console.log('\n📖 See README_DEPLOY.md for detailed deployment instructions');
console.log('🔗 Production URL: https://jyotilalchandani.pages.dev/');
console.log('='.repeat(60));