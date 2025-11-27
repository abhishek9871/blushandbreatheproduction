/**
 * Indian Medicines Dataset Setup Script
 * 
 * This script converts the Kaggle CSV to an optimized JSON format for fast lookups.
 * 
 * INSTRUCTIONS:
 * 1. Download the CSV from: https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india
 * 2. Place the CSV file as: data/A_Z_medicines_dataset_of_India.csv
 * 3. Run: node scripts/setup-indian-medicines.js
 */

const fs = require('fs');
const path = require('path');

// CSV parsing function (simple, no dependencies)
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Handle CSV with quoted fields
    const row = [];
    let current = '';
    let inQuotes = false;
    
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
    
    if (row.length >= headers.length) {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] || '';
      });
      data.push(obj);
    }
  }
  
  return data;
}

// Normalize medicine name for search
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Extract base medicine name (without dosage/form)
function extractBaseName(fullName) {
  // Remove common suffixes like "Tablet", "Syrup", "Injection", dosages
  return fullName
    .replace(/\d+\s*(mg|ml|gm|mcg|iu)/gi, '')
    .replace(/\b(tablet|syrup|injection|capsule|cream|gel|ointment|drops|suspension|powder|solution|lotion|spray|inhaler)\b/gi, '')
    .replace(/\b(strip|bottle|vial|tube|pack|box)\b.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'A_Z_medicines_dataset_of_India.csv');
  const outputPath = path.join(__dirname, '..', 'data', 'indian-medicines.json');
  const indexPath = path.join(__dirname, '..', 'data', 'indian-medicines-index.json');
  
  // Check if CSV exists
  if (!fs.existsSync(csvPath)) {
    console.log('❌ CSV file not found!');
    console.log('');
    console.log('Please download the dataset from:');
    console.log('https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india');
    console.log('');
    console.log('And place it at:');
    console.log(csvPath);
    process.exit(1);
  }
  
  console.log('📖 Reading CSV file...');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  
  console.log('🔄 Parsing CSV data...');
  const rawData = parseCSV(csvText);
  console.log(`   Found ${rawData.length} medicines`);
  
  console.log('🔧 Processing medicines...');
  
  // Create medicine objects with normalized structure
  const medicines = [];
  const searchIndex = {}; // name -> array of medicine IDs
  
  rawData.forEach((row, idx) => {
    if (!row.name) return;
    
    const medicine = {
      id: row.id || String(idx + 1),
      name: row.name,
      baseName: extractBaseName(row.name),
      price: parseFloat(row['price(₹)'] || row.price || '0') || 0,
      manufacturer: row.manufacturer_name || '',
      type: row.type || 'allopathy',
      packSize: row.pack_size_label || '',
      composition1: row.short_composition1 || '',
      composition2: row.short_composition2 || '',
      isDiscontinued: row.Is_discontinued === 'TRUE' || row.Is_discontinued === 'true',
    };
    
    medicines.push(medicine);
    
    // Build search index
    const searchKeys = [
      normalizeName(medicine.name),
      normalizeName(medicine.baseName),
    ];
    
    // Add composition to search
    if (medicine.composition1) {
      const comp = medicine.composition1.replace(/\([^)]+\)/g, '').trim();
      searchKeys.push(normalizeName(comp));
    }
    
    searchKeys.forEach(key => {
      if (key.length > 2) {
        if (!searchIndex[key]) {
          searchIndex[key] = [];
        }
        if (searchIndex[key].length < 50) { // Limit results per key
          searchIndex[key].push(medicine.id);
        }
      }
    });
  });
  
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Save full medicines data
  console.log('💾 Saving medicines data...');
  fs.writeFileSync(outputPath, JSON.stringify(medicines, null, 0)); // Minified
  
  // Save search index
  console.log('💾 Saving search index...');
  fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 0));
  
  // Calculate sizes
  const dataSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  const indexSize = (fs.statSync(indexPath).size / 1024 / 1024).toFixed(2);
  
  console.log('');
  console.log('✅ Setup complete!');
  console.log(`   Medicines: ${medicines.length}`);
  console.log(`   Data file: ${dataSize} MB`);
  console.log(`   Index file: ${indexSize} MB`);
  console.log('');
  console.log('Files created:');
  console.log(`   ${outputPath}`);
  console.log(`   ${indexPath}`);
}

main().catch(console.error);
