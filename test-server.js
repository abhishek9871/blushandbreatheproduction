import fetch from 'node-fetch';

// Test server with sample barcodes
const testBarcodes = [
  '3600531349936', // L'Oreal product
  '3274080003685', // Lancome product  
  '3605971186400'  // Yves Saint Laurent product
];

async function testServer() {
  console.log('Testing server endpoints...\n');
  
  for (const barcode of testBarcodes) {
    try {
      console.log(`Testing barcode: ${barcode}`);
      const response = await fetch(`http://localhost:3003/api/products/${barcode}/merged`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Success - Name: ${data.name}`);
        console.log(`  Brand: ${data.brand || 'N/A'}`);
        console.log(`  OBF Available: ${data.source.obf.available}`);
        console.log(`  eBay Available: ${data.source.ebay.available}`);
        console.log(`  Primary Offer: ${data.offers.primary ? 'Yes' : 'No'}`);
        console.log(`  Cache: ${response.headers.get('x-cache') || 'N/A'}`);
      } else {
        console.log(`✗ Failed - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
    console.log('---');
  }
}

testServer();