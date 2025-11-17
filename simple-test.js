import { chromium } from 'playwright';

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing Add Review functionality...');
    
    // Navigate to beauty page
    await page.goto('http://localhost:3001/#/beauty');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.click('a[href*="/product/"]');
    await page.waitForLoadState('networkidle');
    
    // Wait for product page to load
    await page.waitForSelector('button:has-text("Add review")');
    
    console.log('✅ Product page loaded');
    
    // Add a review
    await page.click('button:has-text("Add review")');
    await page.waitForSelector('textarea[placeholder*="Share your experience"]');
    
    await page.fill('textarea[placeholder*="Share your experience"]', 'Test review from automated script');
    
    // Submit review
    await page.click('button:has-text("Submit")');
    await page.waitForSelector('text=Test review from automated script');
    
    console.log('✅ Review added successfully');
    
    // Verify localStorage
    const localStorageData = await page.evaluate(() => {
      const productId = window.location.hash.split('/').pop();
      const stored = localStorage.getItem(`beauty_reviews:${productId}`);
      return stored ? JSON.parse(stored) : null;
    });
    
    console.log('📊 Reviews in localStorage:', localStorageData?.length || 0);
    
    return { success: true, reviewCount: localStorageData?.length || 0 };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

simpleTest().then(result => {
  console.log('\n📋 Final Result:', result);
  process.exit(result.success ? 0 : 1);
});