/**
 * Optimize Medicine Data for Vercel Deployment
 * 
 * Reduces file size by:
 * - Limiting side effects to top 5
 * - Limiting substitutes to top 3
 * - Removing empty fields
 * - Using shorter keys
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔧 Optimizing medicine data...\n');
  
  const inputPath = path.join(__dirname, '..', 'data', 'indian-medicines.json');
  const outputPath = path.join(__dirname, '..', 'data', 'indian-medicines-optimized.json');
  
  console.log('📖 Loading enriched database...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`   ${data.length} medicines\n`);
  
  console.log('🔄 Optimizing...');
  const optimized = data.map(med => {
    const opt = {
      i: med.id, // id
      n: med.name, // name
      b: med.baseName, // baseName
      p: med.price, // price
      m: med.manufacturer, // manufacturer
      t: med.type, // type
      k: med.packSize, // packSize (k for pack)
      c1: med.composition1, // composition1
    };
    
    // Only include if present
    if (med.composition2) opt.c2 = med.composition2;
    if (med.isDiscontinued) opt.d = true; // discontinued
    
    // Enriched data - limit aggressively to stay under 100MB
    if (med.uses?.length > 0) opt.u = med.uses.slice(0, 2); // top 2 uses
    if (med.sideEffects?.length > 0) opt.se = med.sideEffects.slice(0, 3); // top 3 side effects
    if (med.substitutes?.length > 0) opt.su = med.substitutes.slice(0, 2); // top 2 substitutes
    if (med.therapeuticClass) opt.tc = med.therapeuticClass;
    if (med.habitForming) opt.hf = true;
    
    return opt;
  });
  
  console.log('💾 Saving optimized data...');
  fs.writeFileSync(outputPath, JSON.stringify(optimized));
  
  const originalSize = fs.statSync(inputPath).size / 1024 / 1024;
  const optimizedSize = fs.statSync(outputPath).size / 1024 / 1024;
  const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
  
  console.log(`\n✅ Optimization complete!`);
  console.log(`   Original: ${originalSize.toFixed(2)} MB`);
  console.log(`   Optimized: ${optimizedSize.toFixed(2)} MB`);
  console.log(`   Reduction: ${reduction}%`);
  
  // Replace original with optimized
  console.log('\n🔄 Replacing original file...');
  fs.copyFileSync(outputPath, inputPath);
  fs.unlinkSync(outputPath);
  
  console.log('✅ Done!');
}

main().catch(console.error);
