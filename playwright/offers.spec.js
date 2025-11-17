import { test, expect } from '@playwright/test';

// Test barcode that should have offers (from Phase 1 evidence)
const TEST_BARCODE = '3017620422003'; // Nutella example

test.describe('Offers Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page
    await page.goto(`http://localhost:3001/product/${TEST_BARCODE}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display best offer card and view offers button', async ({ page }) => {
    // Wait for merged data to load
    await page.waitForSelector('[data-testid="offers-preview"], .text-green-600', { timeout: 10000 });
    
    // Check if offers are available
    const hasOffers = await page.locator('.text-green-600').count() > 0;
    
    if (hasOffers) {
      // Assert best offer card is visible
      await expect(page.locator('text=Best offer')).toBeVisible();
      await expect(page.locator('button:has-text("View offers")')).toBeVisible();
      
      // Check price is displayed
      const priceElement = page.locator('.text-green-600').first();
      await expect(priceElement).toBeVisible();
      const priceText = await priceElement.textContent();
      expect(priceText).toMatch(/[A-Z]{3}\s+[\d.]+/); // Currency format
    } else {
      // Fallback case - check for "Price on request"
      await expect(page.locator('text=Price on request')).toBeVisible();
      console.log('No offers available for test barcode, checking fallback behavior');
    }
  });

  test('should open offers modal and display multiple offers', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="offers-preview"], .text-green-600', { timeout: 10000 });
    
    const viewOffersButton = page.locator('button:has-text("View offers")');
    
    if (await viewOffersButton.count() > 0) {
      // Click View offers button
      await viewOffersButton.click();
      
      // Assert modal opens
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      // Assert affiliate disclosure is present
      await expect(page.locator('text=We may earn commission')).toBeVisible();
      
      // Assert at least one offer is present
      await expect(page.locator('button:has-text("Buy")')).toHaveCount({ min: 1 });
      
      // Check that offers have required elements
      const firstOffer = page.locator('button:has-text("Buy")').first();
      await expect(firstOffer).toBeVisible();
      
      // Check copy link button exists
      await expect(page.locator('[title="Copy link"]')).toHaveCount({ min: 1 });
    } else {
      console.log('No offers available for modal test');
    }
  });

  test('should track affiliate clicks and open new tab', async ({ page, context }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="offers-preview"], .text-green-600', { timeout: 10000 });
    
    const viewOffersButton = page.locator('button:has-text("View offers")');
    
    if (await viewOffersButton.count() > 0) {
      // Open offers modal
      await viewOffersButton.click();
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      // Set up request interception to track affiliate click
      let affiliateClickTracked = false;
      page.on('request', request => {
        if (request.url().includes('/api/affiliate/click') && request.method() === 'POST') {
          affiliateClickTracked = true;
        }
      });
      
      // Set up new page listener for tab opening
      const newPagePromise = context.waitForEvent('page');
      
      // Click first Buy button
      const firstBuyButton = page.locator('button:has-text("Buy")').first();
      await firstBuyButton.click();
      
      // Wait a moment for the request to be sent
      await page.waitForTimeout(1000);
      
      // Assert affiliate click was tracked
      expect(affiliateClickTracked).toBe(true);
      
      // Assert new page was opened (new tab)
      const newPage = await newPagePromise;
      expect(newPage.url()).toContain('ebay.com');
      
      await newPage.close();
    } else {
      console.log('No offers available for affiliate click test');
    }
  });

  test('should copy affiliate link to clipboard', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="offers-preview"], .text-green-600', { timeout: 10000 });
    
    const viewOffersButton = page.locator('button:has-text("View offers")');
    
    if (await viewOffersButton.count() > 0) {
      // Open offers modal
      await viewOffersButton.click();
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      // Click copy link button
      const copyButton = page.locator('[title="Copy link"]').first();
      await copyButton.click();
      
      // Assert toast appears
      await expect(page.locator('text=Link copied')).toBeVisible({ timeout: 3000 });
      
      // Toast should disappear after 2 seconds
      await expect(page.locator('text=Link copied')).toBeHidden({ timeout: 3000 });
    } else {
      console.log('No offers available for copy link test');
    }
  });
});

test.describe('Admin Flow Tests', () => {
  test('should access admin page and apply overrides', async ({ page }) => {
    // Set admin password in localStorage
    await page.goto(`http://localhost:3001`);
    await page.evaluate(() => {
      localStorage.setItem('adminToken', 'Bearer testpassword123');
    });
    
    // Navigate to admin page
    await page.goto(`http://localhost:3003/admin/products/${TEST_BARCODE}/edit`);
    
    // Check if admin content is visible (might need authentication)
    const authVisible = await page.locator('#auth').isVisible();
    const contentVisible = await page.locator('#content').isVisible();
    
    if (authVisible) {
      // Enter admin password
      await page.fill('#password', process.env.ADMIN_PASSWORD || 'testpassword123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('#content')).toBeVisible();
    }
    
    // Fill override form
    await page.fill('#name', 'Test Product Override');
    await page.fill('#ingredients', 'Test ingredients override');
    
    // Save overrides
    await page.click('button:has-text("Save Overrides")');
    
    // Wait for success (alert or other indication)
    await page.waitForTimeout(1000);
    
    // Navigate back to product page to verify override
    await page.goto(`http://localhost:3001/product/${TEST_BARCODE}`);
    await page.waitForLoadState('networkidle');
    
    // Check if overridden data appears
    await expect(page.locator('h1:has-text("Test Product Override")')).toBeVisible({ timeout: 10000 });
  });

  test('should submit and view suggestions', async ({ page }) => {
    // Navigate to product page
    await page.goto(`http://localhost:3001/product/${TEST_BARCODE}`);
    await page.waitForLoadState('networkidle');
    
    // Look for suggest details link
    const suggestLink = page.locator('text=Suggest details');
    
    if (await suggestLink.count() > 0) {
      // Click suggest details
      await suggestLink.click();
      
      // Fill suggestion form
      await page.fill('input[placeholder="Anonymous"]', 'Test User');
      await page.fill('textarea[placeholder*="ingredients"]', 'Test suggestion: Missing allergen information');
      
      // Submit suggestion
      await page.click('button:has-text("Submit")');
      
      // Wait for success toast
      await expect(page.locator('text=Suggestion submitted')).toBeVisible({ timeout: 5000 });
      
      // Now check admin page for the suggestion
      await page.goto(`http://localhost:3003/admin/products/${TEST_BARCODE}/edit`);
      
      // Authenticate if needed
      const authVisible = await page.locator('#auth').isVisible();
      if (authVisible) {
        await page.fill('#password', process.env.ADMIN_PASSWORD || 'testpassword123');
        await page.click('button:has-text("Login")');
      }
      
      // Check suggestions section
      await expect(page.locator('text=Pending Suggestions')).toBeVisible();
      await expect(page.locator('text=Test suggestion')).toBeVisible({ timeout: 5000 });
    } else {
      console.log('No suggest details link found - product may have complete information');
    }
  });
});

test.describe('Modal Accessibility Tests', () => {
  test('should handle keyboard navigation and escape key', async ({ page }) => {
    await page.goto(`http://localhost:3001/product/${TEST_BARCODE}`);
    await page.waitForLoadState('networkidle');
    
    const viewOffersButton = page.locator('button:has-text("View offers")');
    
    if (await viewOffersButton.count() > 0) {
      // Open modal
      await viewOffersButton.click();
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      // Test escape key closes modal
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Compare Offers')).toBeHidden();
      
      // Reopen modal
      await viewOffersButton.click();
      await expect(page.locator('text=Compare Offers')).toBeVisible();
      
      // Test close button
      await page.click('button:has([class*="material-symbols-outlined"]):has-text("close")');
      await expect(page.locator('text=Compare Offers')).toBeHidden();
    } else {
      console.log('No offers available for accessibility test');
    }
  });
});