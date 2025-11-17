const testBarcode = 'TESTAFF123';
const baseUrl = 'http://127.0.0.1:8787';

async function testAffiliateClicks() {
  console.log('Testing Affiliate Durable Objects...\n');

  // Test 3 clicks
  for (let i = 1; i <= 3; i++) {
    console.log(`Posting click ${i}...`);
    try {
      const response = await fetch(`${baseUrl}/api/affiliate/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: testBarcode,
          offerItemId: `offer-${i}`,
          affiliateUrl: `https://example.com/affiliate/${i}`,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      console.log(`Click ${i} result:`, result);
    } catch (error) {
      console.error(`Click ${i} failed:`, error.message);
    }
  }

  // Wait a moment then check stats
  console.log('\nWaiting 1 second...\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get admin stats
  console.log('Fetching admin stats...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/products/${testBarcode}/stats`, {
      headers: { 'Authorization': 'Bearer admin123' }
    });

    if (response.ok) {
      const stats = await response.json();
      console.log('Admin stats:', JSON.stringify(stats, null, 2));
      
      if (stats.count === 3) {
        console.log('\n✅ SUCCESS: Count matches expected (3)');
      } else {
        console.log(`\n❌ FAIL: Expected count 3, got ${stats.count}`);
      }
      
      if (stats.lastClicks && stats.lastClicks.length >= 3) {
        console.log('✅ SUCCESS: Last clicks array has >= 3 entries');
      } else {
        console.log(`❌ FAIL: Expected >= 3 clicks, got ${stats.lastClicks?.length || 0}`);
      }
    } else {
      console.error('Failed to fetch stats:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Stats fetch failed:', error.message);
  }
}

testAffiliateClicks().catch(console.error);