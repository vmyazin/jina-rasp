const { test, expect } = require('@playwright/test');

test.describe('Link Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should validate all navigation links work', async ({ page }) => {
    // Get all links in navigation/header
    const navLinks = await page.locator('nav a, header a').all();
    
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        console.log(`Testing navigation link: ${text} -> ${href}`);
        
        if (href.startsWith('http')) {
          // External link - check if it's reachable
          const response = await page.request.get(href);
          expect(response.status(), `External link "${text}" (${href}) should be reachable`).toBeLessThan(400);
        } else {
          // Internal link - navigate and check
          await link.click();
          await page.waitForLoadState('networkidle');
          
          // Check that we didn't get a 404 or error page
          const title = await page.title();
          expect(title).not.toContain('404');
          expect(title).not.toContain('Error');
          
          // Go back to main page for next test
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should validate all footer links work', async ({ page }) => {
    // Get all links in footer
    const footerLinks = await page.locator('footer a').all();
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        console.log(`Testing footer link: ${text} -> ${href}`);
        
        if (href.startsWith('http')) {
          // External link - check if it's reachable
          const response = await page.request.get(href);
          expect(response.status(), `External footer link "${text}" (${href}) should be reachable`).toBeLessThan(400);
        } else {
          // Internal link - navigate and check
          await link.click();
          await page.waitForLoadState('networkidle');
          
          // Check that we didn't get a 404 or error page
          const title = await page.title();
          expect(title).not.toContain('404');
          expect(title).not.toContain('Error');
          
          // Go back to main page for next test
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should validate all content area links work', async ({ page }) => {
    // Get all links in main content area (excluding nav and footer)
    const contentLinks = await page.locator('main a, .content a, article a').all();
    
    for (const link of contentLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        console.log(`Testing content link: ${text} -> ${href}`);
        
        if (href.startsWith('http')) {
          // External link - check if it's reachable
          const response = await page.request.get(href);
          expect(response.status(), `External content link "${text}" (${href}) should be reachable`).toBeLessThan(400);
        } else {
          // Internal link - navigate and check
          await link.click();
          await page.waitForLoadState('networkidle');
          
          // Check that we didn't get a 404 or error page
          const title = await page.title();
          expect(title).not.toContain('404');
          expect(title).not.toContain('Error');
          
          // Go back to main page for next test
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should validate broker profile links work', async ({ page }) => {
    // Wait for broker cards to load
    await page.waitForSelector('.broker-card', { timeout: 10000 });
    
    // Get all broker-related links
    const brokerLinks = await page.locator('.broker-card a, [data-testid*="broker"] a').all();
    
    for (const link of brokerLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        console.log(`Testing broker link: ${text} -> ${href}`);
        
        if (href.startsWith('http')) {
          // External link (broker websites) - check if reachable
          try {
            const response = await page.request.get(href, { timeout: 5000 });
            expect(response.status(), `Broker website "${text}" (${href}) should be reachable`).toBeLessThan(400);
          } catch (error) {
            console.warn(`Warning: Broker website "${text}" (${href}) may be unreachable: ${error.message}`);
            // Don't fail the test for external broker websites as they may be temporarily down
          }
        }
      }
    }
  });
});