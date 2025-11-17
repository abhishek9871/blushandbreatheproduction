import { chromium } from 'playwright';

async function testAddReview() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting Add Review test...');
    
    // Navigate to beauty page
    await page.goto('http://localhost:3001/#/beauty');
    await page.waitForLoadState('networkidle');
    
    // Click first product
    await page.click('a[href*="/product/"]');
    await page.waitForLoadState('networkidle');
    
    // Wait for product page to load
    await page.waitForSelector('button:has-text("Add review")');
    
    // Clear any existing reviews for this test
    await page.evaluate(() => {
      const productId = window.location.hash.split('/').pop();
      localStorage.removeItem(`beauty_reviews:${productId}`);
    });
    
    // Refresh to see clean state
    await page.reload();
    await page.waitForSelector('button:has-text("Add review")');
    
    console.log('✅ Product page loaded');
    
    // Test 1: Add first review
    await page.click('button:has-text("Add review")');
    await page.waitForSelector('textarea[placeholder*="Share your experience"]');
    
    await page.fill('textarea[placeholder*="Share your experience"]', 'Great foundation! Excellent coverage and long-lasting.');
    
    // Submit first review
    await page.click('button:has-text("Submit")');
    await page.waitForSelector('text=Great foundation! Excellent coverage and long-lasting.');
    
    console.log('✅ First review added successfully');
    
    // Verify first review in UI
    const firstReviewText = await page.textContent('text=Great foundation! Excellent coverage and long-lasting.');
    if (!firstReviewText) throw new Error('First review not found in UI');
    
    // Check rating shows 5 stars and 1 review
    const ratingText = await page.textContent('text=(1 review)');
    if (!ratingText) throw new Error('Review count not updated');
    
    // Test 2: Add second review
    await page.click('button:has-text("Add review")');
    await page.waitForSelector('textarea[placeholder*="Share your experience"]');
    
    // Set 3-star rating
    await page.click('button[class*="star"]:nth-child(3)');
    await page.fill('textarea[placeholder*="Share your experience"]', 'Decent product but could be better.');
    
    // Submit second review
    await page.click('button:has-text("Submit")');
    await page.waitForSelector('text=Decent product but could be better.');
    
    console.log('✅ Second review added successfully');
    
    // Verify both reviews in localStorage
    const localStorageData = await page.evaluate(() => {
      const productId = window.location.hash.split('/').pop();
      const stored = localStorage.getItem(`beauty_reviews:${productId}`);
      return stored ? JSON.parse(stored) : null;
    });
    
    if (!localStorageData || localStorageData.length !== 2) {
      throw new Error(`Expected 2 reviews in localStorage, got ${localStorageData?.length || 0}`);
    }
    
    // Verify average rating calculation
    const expectedAverage = (5 + 3) / 2; // 4
    const actualAverage = localStorageData.reduce((sum, r) => sum + r.rating, 0) / localStorageData.length;
    
    if (actualAverage !== expectedAverage) {
      throw new Error(`Expected average rating ${expectedAverage}, got ${actualAverage}`);
    }
    
    // Check UI shows updated rating
    const reviewCountText = await page.textContent('text=(2 reviews)');
    if (!reviewCountText) throw new Error('Review count not updated to 2');
    
    console.log('✅ All tests passed! Add Review functionality works correctly.');
    console.log(`📊 Reviews in localStorage: ${localStorageData.length}`);
    console.log(`⭐ Average rating: ${actualAverage}`);
    
    return {
      success: true,
      reviewCount: localStorageData.length,
      averageRating: actualAverage,
      reviews: localStorageData
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testAddReview().then(result => {
  console.log('\n📋 Test Results:', result);
  process.exit(result.success ? 0 : 1);
});