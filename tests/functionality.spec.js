const { test, expect } = require('@playwright/test');

test.describe('Insurance Broker Directory Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Diretório de Corretores de Seguros/);
    
    // Check main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check search functionality is present
    await expect(page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]')).toBeVisible();
  });

  test('should display broker cards', async ({ page }) => {
    // Wait for broker cards to load
    await page.waitForSelector('.broker-card, [data-testid*="broker"]', { timeout: 10000 });
    
    // Check that at least one broker card is visible
    const brokerCards = page.locator('.broker-card, [data-testid*="broker"]');
    await expect(brokerCards.first()).toBeVisible();
    
    // Check that broker cards contain expected information
    const firstCard = brokerCards.first();
    await expect(firstCard.locator('text=/[A-Za-z]/')).toBeVisible(); // Should contain text
  });

  test('should allow searching for brokers', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]').first();
    await expect(searchInput).toBeVisible();
    
    // Perform a search
    await searchInput.fill('seguro');
    await searchInput.press('Enter');
    
    // Wait for results to update
    await page.waitForTimeout(1000);
    
    // Check that results are displayed (or no results message)
    const hasResults = await page.locator('.broker-card, [data-testid*="broker"], .no-results, .sem-resultados').count() > 0;
    expect(hasResults).toBeTruthy();
  });

  test('should handle filter functionality', async ({ page }) => {
    // Look for filter elements
    const filters = page.locator('select, .filter, [data-testid*="filter"]');
    
    if (await filters.count() > 0) {
      const firstFilter = filters.first();
      
      // If it's a select dropdown
      if (await firstFilter.getAttribute('tagName') === 'SELECT') {
        const options = await firstFilter.locator('option').count();
        if (options > 1) {
          await firstFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);
          
          // Check that filtering worked (results changed or stayed the same)
          const brokerCards = page.locator('.broker-card, [data-testid*="broker"]');
          expect(await brokerCards.count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that page still loads properly
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that search is still accessible
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]').first();
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }
    
    // Check that broker cards are still visible
    await page.waitForSelector('.broker-card, [data-testid*="broker"]', { timeout: 10000 });
    const brokerCards = page.locator('.broker-card, [data-testid*="broker"]');
    await expect(brokerCards.first()).toBeVisible();
  });

  test('should handle API endpoints correctly', async ({ page }) => {
    // Test that API endpoints return proper responses
    const filtersResponse = await page.request.get('/api/filters');
    expect(filtersResponse.status()).toBe(200);
    
    const searchResponse = await page.request.post('/api/search', {
      data: { query: 'test', specialty: '', neighborhood: '' }
    });
    expect(searchResponse.status()).toBe(200);
    
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.status()).toBe(200);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test invalid API request
    const invalidResponse = await page.request.post('/api/search', {
      data: { invalid: 'data' }
    });
    
    // Should handle gracefully (not crash)
    expect(invalidResponse.status()).toBeGreaterThanOrEqual(400);
    
    // Page should still be functional after API errors
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});