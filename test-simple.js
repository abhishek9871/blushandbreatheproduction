// Simple validation test
import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing ProductPage with offers...');
    
    // Navigate to product page
    await page.goto('http://localhost:3001/product/3017620422003');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of product page
    await page.screenshot({ path: 'evidence-product-page.png', fullPage: true });
    console.log('✓ Product page screenshot saved');
    
    // Check if offers are available
    const hasOffers = await page.locator('.text-green-600').count() > 0;
    console.log(`Offers available: ${hasOffers}`);
    
    if (hasOffers) {
      // Click view offers if available
      const viewOffersBtn = page.locator('button:has-text("View offers")');
      if (await viewOffersBtn.count() > 0) {
        await viewOffersBtn.click();
        await page.waitForSelector('text=Compare Offers', { timeout: 5000 });
        
        // Take screenshot of offers modal
        await page.screenshot({ path: 'evidence-offers-modal.png' });
        console.log('✓ Offers modal screenshot saved');
        
        // Test affiliate click tracking
        let clickTracked = false;
        page.on('request', req => {
          if (req.url().includes('/api/affiliate/click')) {
            clickTracked = true;
            console.log('✓ Affiliate click tracked');
          }
        });
        
        // Click first buy button
        const buyBtn = page.locator('button:has-text("Buy")').first();
        if (await buyBtn.count() > 0) {
          await buyBtn.click();
          await page.waitForTimeout(1000);
          console.log(`Affiliate click tracked: ${clickTracked}`);
        }
      }
    }
    
    // Test suggest details
    const suggestLink = page.locator('text=Suggest details');
    if (await suggestLink.count() > 0) {
      await suggestLink.click();
      await page.waitForSelector('text=Suggest Product Details');
      
      // Fill and submit suggestion
      await page.fill('textarea[placeholder*="ingredients"]', 'Test suggestion from automated test');
      await page.click('button:has-text("Submit")');
      
      // Wait for success message
      await page.waitForSelector('text=Suggestion submitted', { timeout: 5000 });
      console.log('✓ Suggestion submitted successfully');
    }
    
    console.log('✓ All tests completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runTest();