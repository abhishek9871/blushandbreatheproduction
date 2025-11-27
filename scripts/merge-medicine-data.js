/**
 * Merge Medicine Datasets
 * 
 * Merges the A-Z medicines dataset with the Usage/Side Effects/Substitutes dataset
 * to create a comprehensive Indian medicines database.
 */

const fs = require('fs');
const path = require('path');

// CSV parsing function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = [];
  
  // Parse header row
  let headerLine = lines[0];
  let current = '';
  let inQuotes = false;
  
  for (const char of headerLine) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim());
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const row = [];
    current = '';
    inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || '';
    });
    data.push(obj);
  }
  
  return data;
}

// Normalize medicine name for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Extract base name (without dosage/form)
function extractBaseName(fullName) {
  return fullName
    .replace(/\d+\s*(mg|ml|gm|mcg|iu)/gi, '')
    .replace(/\b(tablet|syrup|injection|capsule|cream|gel|ointment|drops|suspension|powder|solution|lotion|spray|inhaler)\b/gi, '')
    .replace(/\b(strip|bottle|vial|tube|pack|box)\b.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('🔄 Starting medicine data merge...\n');
  
  const existingPath = path.join(__dirname, '..', 'data', 'indian-medicines.json');
  const usagePath = path.join(__dirname, '..', 'data', 'medicine_dataset.csv');
  const outputPath = path.join(__dirname, '..', 'data', 'indian-medicines-enriched.json');
  
  // Load existing medicines
  console.log('📖 Loading existing medicines database...');
  const existingData = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
  console.log(`   Found ${existingData.length} medicines\n`);
  
  // Load usage/side effects data
  console.log('📖 Loading usage/side effects dataset...');
  const usageCSV = fs.readFileSync(usagePath, 'utf-8');
  const usageData = parseCSV(usageCSV);
  console.log(`   Found ${usageData.length} entries\n`);
  
  // Create lookup map from usage data by normalized name
  console.log('🔧 Building lookup index...');
  const usageLookup = new Map();
  
  usageData.forEach(row => {
    if (row.name) {
      const normalized = normalizeName(row.name);
      const baseName = normalizeName(extractBaseName(row.name));
      
      // Store by both full name and base name
      usageLookup.set(normalized, row);
      if (baseName !== normalized) {
        usageLookup.set(baseName, row);
      }
    }
  });
  console.log(`   Index built with ${usageLookup.size} entries\n`);
  
  // Merge data
  console.log('🔄 Merging datasets...');
  let matchCount = 0;
  let noMatchCount = 0;
  
  const enrichedMedicines = existingData.map(medicine => {
    const normalized = normalizeName(medicine.name);
    const baseName = normalizeName(medicine.baseName);
    
    // Try to find match
    let usageInfo = usageLookup.get(normalized) || usageLookup.get(baseName);
    
    // If no direct match, try partial matching
    if (!usageInfo) {
      for (const [key, value] of usageLookup.entries()) {
        if (key.includes(baseName) || baseName.includes(key)) {
          usageInfo = value;
          break;
        }
      }
    }
    
    if (usageInfo) {
      matchCount++;
      
      // Extract substitutes (non-empty values)
      const substitutes = [];
      for (let i = 0; i <= 4; i++) {
        const sub = usageInfo[`substitute${i}`];
        if (sub && sub.trim()) {
          substitutes.push(sub.trim());
        }
      }
      
      // Extract side effects (non-empty values)
      const sideEffects = [];
      for (let i = 0; i <= 41; i++) {
        const effect = usageInfo[`sideEffect${i}`];
        if (effect && effect.trim()) {
          sideEffects.push(effect.trim());
        }
      }
      
      // Extract uses (non-empty values)
      const uses = [];
      for (let i = 0; i <= 4; i++) {
        const use = usageInfo[`use${i}`];
        if (use && use.trim()) {
          uses.push(use.trim());
        }
      }
      
      return {
        ...medicine,
        uses: uses,
        sideEffects: sideEffects,
        substitutes: substitutes,
        chemicalClass: usageInfo['Chemical Class'] || '',
        habitForming: usageInfo['Habit Forming'] === 'Yes',
        therapeuticClass: usageInfo['Therapeutic Class'] || '',
        actionClass: usageInfo['Action Class'] || '',
      };
    } else {
      noMatchCount++;
      return {
        ...medicine,
        uses: [],
        sideEffects: [],
        substitutes: [],
        chemicalClass: '',
        habitForming: false,
        therapeuticClass: '',
        actionClass: '',
      };
    }
  });
  
  console.log(`   ✅ Matched: ${matchCount}`);
  console.log(`   ❌ No match: ${noMatchCount}\n`);
  
  // Save enriched data
  console.log('💾 Saving enriched database...');
  fs.writeFileSync(outputPath, JSON.stringify(enrichedMedicines, null, 0));
  
  const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`   File size: ${fileSize} MB\n`);
  
  // Replace old file with enriched version
  console.log('🔄 Replacing original database with enriched version...');
  fs.copyFileSync(outputPath, existingPath);
  
  // Update sample file with enriched data for popular medicines
  console.log('📝 Updating sample file with enriched data...');
  const samplePath = path.join(__dirname, '..', 'data', 'indian-medicines-sample.json');
  const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
  
  const enrichedSample = sampleData.map(medicine => {
    const match = enrichedMedicines.find(m => 
      normalizeName(m.name) === normalizeName(medicine.name) ||
      normalizeName(m.baseName) === normalizeName(medicine.baseName)
    );
    
    if (match) {
      return {
        ...medicine,
        uses: match.uses || [],
        sideEffects: match.sideEffects || [],
        substitutes: match.substitutes || [],
        chemicalClass: match.chemicalClass || '',
        habitForming: match.habitForming || false,
        therapeuticClass: match.therapeuticClass || '',
        actionClass: match.actionClass || '',
      };
    }
    return medicine;
  });
  
  fs.writeFileSync(samplePath, JSON.stringify(enrichedSample, null, 2));
  
  console.log('\n✅ Merge complete!');
  console.log(`   Total medicines: ${enrichedMedicines.length}`);
  console.log(`   With usage info: ${matchCount}`);
  
  // Show sample of enriched data
  console.log('\n📋 Sample enriched medicine:');
  const sample = enrichedMedicines.find(m => m.uses.length > 0 && m.sideEffects.length > 0);
  if (sample) {
    console.log(`   Name: ${sample.name}`);
    console.log(`   Uses: ${sample.uses.slice(0, 3).join(', ')}`);
    console.log(`   Side Effects: ${sample.sideEffects.slice(0, 3).join(', ')}`);
    console.log(`   Substitutes: ${sample.substitutes.slice(0, 3).join(', ')}`);
  }
}

main().catch(console.error);
