import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://jyotilalchandani.pages.dev';
const TEST_BARCODE = '3017620422003'; // L'Oréal product

test.describe('Production Deployment Tests', () => {
  
  test('should load homepage successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/Blush and Breathe/);
    await expect(page.locator('h1')).toContainText('Blush and Breathe');
  });

  test('should navigate to beauty section', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.click('text=Beauty');
    await expect(page.url()).toContain('/beauty');
    await expect(page.locator('h1')).toContainText('Beauty Products');
  });

  test('should load product page with merged data', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/beauty/product/${TEST_BARCODE}`);
    
    // Wait for product to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check basic product info is displayed
    const productName = await page.locator('h1').textContent();
    expect(productName).toBeTruthy();
    expect(productName.length).toBeGreaterThan(3);
    
    // Check if offers section exists (may or may not have offers)
    const offersSection = page.locator('text=Best offer, text=Price on request').first();
    await expect(offersSection).toBeVisible();
  });

  test('should fetch merged JSON from Worker endpoint', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/products/${TEST_BARCODE}/merged`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('id', TEST_BARCODE);
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('source');
    expect(data.source).toHaveProperty('obf');
    expect(data.source).toHaveProperty('ebay');
    
    // Check cache header
    const cacheHeader = response.headers()['x-cache'];
    expect(['HIT', 'MISS']).toContain(cacheHeader);
    
    console.log('Merged data response:', {
      name: data.name,
      brand: data.brand,
      offersCount: data.offers.primary ? 1 + data.offers.others.length : 0,
      obfAvailable: data.source.obf.available,
      ebayAvailable: data.source.ebay.available,
      cacheStatus: cacheHeader
    });
  });

  test('should submit product suggestion', async ({ request }) => {
    const suggestionData = {
      name: 'Test User',
      info: 'This is a test suggestion for ingredients information'
    };
    
    const response = await request.post(`${PRODUCTION_URL}/api/products/${TEST_BARCODE}/suggestions`, {
      data: suggestionData
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('success', true);
    
    console.log('Suggestion submitted successfully');
  });

  test('should track affiliate click with DO', async ({ request }) => {
    const clickData = {
      barcode: TEST_BARCODE,
      offerItemId: 'test-item-123',
      affiliateUrl: 'https://www.ebay.com/itm/test-item-123?campid=test',
      timestamp: new Date().toISOString()
    };
    
    const response = await request.post(`${PRODUCTION_URL}/api/affiliate/click`, {
      data: clickData
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('newCount');
    expect(typeof result.newCount).toBe('number');
    
    console.log('Affiliate click tracked with DO:', result);
    
    // Test admin stats endpoint
    const adminPassword = process.env.ADMIN_PASSWORD || 'test-admin-password';
    const statsResponse = await request.get(`${PRODUCTION_URL}/admin/products/${TEST_BARCODE}/stats`, {
      headers: { 'Authorization': `Bearer ${adminPassword}` }
    });
    
    if (statsResponse.status() === 200) {
      const stats = await statsResponse.json();
      expect(stats).toHaveProperty('count');
      expect(stats.count).toBeGreaterThan(0);
      expect(stats).toHaveProperty('lastClicks');
      
      if (stats.lastClicks.length > 0) {
        expect(stats.lastClicks[0]).toHaveProperty('offerItemId');
      }
      
      console.log('Admin stats verified:', { count: stats.count, clicksCount: stats.lastClicks.length });
    }
  });
  
  test('should handle DO fallback to KV', async ({ request }) => {
    const clickData = {
      barcode: 'FALLBACK_TEST',
      offerItemId: 'fallback-item-123',
      affiliateUrl: 'https://example.com/fallback',
      timestamp: new Date().toISOString()
    };
    
    const response = await request.post(`${PRODUCTION_URL}/api/affiliate/click`, {
      data: clickData
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('newCount');
    
    // May have fallback flag if DO is unavailable
    if (result.fallback) {
      console.log('KV fallback used successfully');
    } else {
      console.log('DO used successfully');
    }
  });

  test('should handle invalid barcode gracefully', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/products/invalid-barcode/merged`);
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid barcode format');
  });

  test('should test admin endpoint authentication', async ({ request }) => {
    // Test without auth - should fail
    const unauthorizedResponse = await request.get(`${PRODUCTION_URL}/admin/products/${TEST_BARCODE}/override`);
    expect(unauthorizedResponse.status()).toBe(401);
    
    // Test with invalid auth - should fail
    const invalidAuthResponse = await request.get(`${PRODUCTION_URL}/admin/products/${TEST_BARCODE}/override`, {
      headers: {
        'Authorization': 'Bearer invalid-password'
      }
    });
    expect(invalidAuthResponse.status()).toBe(401);
    
    console.log('Admin authentication working correctly');
  });

  test('should load admin edit page', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/admin/products/${TEST_BARCODE}/edit`);
    
    // Should show login form initially
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    console.log('Admin edit page loaded with authentication');
  });

  test('should validate eBay integration availability', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/products/${TEST_BARCODE}/merged`);
    const data = await response.json();
    
    if (data.source.ebay.available) {
      expect(data.offers.primary).toBeTruthy();
      expect(data.offers.primary.affiliateUrl).toContain('ebay.com');
      console.log('eBay integration working - offers available');
    } else {
      console.log('eBay integration not available:', data.source.ebay.note || 'No offers found');
    }
    
    // Should always have OBF data for this test product
    expect(data.source.obf.available).toBe(true);
  });

  test('should test affiliate link click flow with tracking', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/beauty/product/${TEST_BARCODE}`);
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Intercept affiliate click API call
    let affiliateClickCalled = false;
    let clickPayload = null;
    
    page.route('**/api/affiliate/click', async (route, request) => {
      affiliateClickCalled = true;
      clickPayload = JSON.parse(request.postData());
      await route.continue();
    });
    
    // Look for buy button or offers
    const buyButton = page.locator('button:has-text("Buy now")').first();
    const viewOffersButton = page.locator('button:has-text("View")').first();
    
    if (await buyButton.isVisible()) {
      // Test direct buy button click
      const [newPage] = await Promise.all([
        page.waitForEvent('popup'),
        buyButton.click()
      ]);
      
      // Should open eBay in new tab
      expect(newPage.url()).toContain('ebay.com');
      await newPage.close();
      
      // Wait for API call
      await page.waitForTimeout(1000);
      
      // Verify affiliate click was tracked
      expect(affiliateClickCalled).toBe(true);
      expect(clickPayload).toBeTruthy();
      expect(clickPayload.barcode).toBe(TEST_BARCODE);
      expect(clickPayload.offerItemId).toBeTruthy();
      expect(clickPayload.affiliateUrl).toBeTruthy();
      
      console.log('Direct affiliate link click with tracking working');
    } else if (await viewOffersButton.isVisible()) {
      // Test offers modal
      await viewOffersButton.click();
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      console.log('Offers modal working');
    } else {
      console.log('No offers available for this product');
    }
  });

  test('should validate CORS headers', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/products/${TEST_BARCODE}/merged`);
    
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBe('*');
    
    console.log('CORS headers configured correctly');
  });

});

test.describe('Performance Tests', () => {
  
  test('should load product page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${PRODUCTION_URL}/beauty/product/${TEST_BARCODE}`);
    await page.waitForSelector('h1');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    console.log(`Product page loaded in ${loadTime}ms`);
  });

  test('should have fast API response times', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get(`${PRODUCTION_URL}/api/products/${TEST_BARCODE}/merged`);
    
    const responseTime = Date.now() - startTime;
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    
    console.log(`API responded in ${responseTime}ms`);
  });

});

test.describe('Error Handling Tests', () => {
  
  test('should handle non-existent product gracefully', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/beauty/product/9999999999999`);
    
    // Should show error message or fallback content
    const errorMessage = page.locator('text=not found, text=error').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    console.log('Non-existent product handled gracefully');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Test with invalid endpoint
    const response = await page.request.get(`${PRODUCTION_URL}/api/invalid-endpoint`);
    expect([404, 405]).toContain(response.status());
    
    console.log('Invalid endpoints handled correctly');
  });

});