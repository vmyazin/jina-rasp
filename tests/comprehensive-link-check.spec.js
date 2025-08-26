const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Link Validation - ALL LINKS', () => {
  let allLinks = [];
  let brokenLinks = [];
  let workingLinks = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Collect ALL links from the page
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = (await link.textContent())?.trim() || '';
      const location = await link.evaluate(el => {
        // Determine where the link is located
        if (el.closest('nav')) return 'navigation';
        if (el.closest('header')) return 'header';
        if (el.closest('footer')) return 'footer';
        if (el.closest('.broker-card')) return 'broker-card';
        if (el.closest('main')) return 'main-content';
        return 'other';
      });
      
      if (href) {
        allLinks.push({
          href,
          text: text.substring(0, 50), // Limit text length for readability
          location,
          element: link
        });
      }
    }
    
    console.log(`Found ${allLinks.length} total links to validate`);
    await page.close();
  });

  test('should validate EVERY single link on the page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== COMPREHENSIVE LINK VALIDATION REPORT ===');
    console.log(`Total links found: ${allLinks.length}\n`);
    
    for (let i = 0; i < allLinks.length; i++) {
      const linkInfo = allLinks[i];
      const { href, text, location } = linkInfo;
      
      console.log(`[${i + 1}/${allLinks.length}] Testing ${location}: "${text}" -> ${href}`);
      
      try {
        if (href.startsWith('#')) {
          // Anchor link - check if target exists
          const targetId = href.substring(1);
          if (targetId) {
            const target = page.locator(`#${targetId}`);
            const exists = await target.count() > 0;
            if (exists) {
              workingLinks.push({ ...linkInfo, status: 'anchor-valid' });
              console.log(`  ✅ Anchor link valid`);
            } else {
              brokenLinks.push({ ...linkInfo, status: 'anchor-missing', error: `Target #${targetId} not found` });
              console.log(`  ❌ Anchor target missing: #${targetId}`);
            }
          }
        } else if (href.startsWith('mailto:') || href.startsWith('tel:')) {
          // Protocol links - validate format
          const isValidEmail = href.startsWith('mailto:') && href.includes('@');
          const isValidTel = href.startsWith('tel:') && href.length > 4;
          
          if (isValidEmail || isValidTel) {
            workingLinks.push({ ...linkInfo, status: 'protocol-valid' });
            console.log(`  ✅ Protocol link valid`);
          } else {
            brokenLinks.push({ ...linkInfo, status: 'protocol-invalid', error: 'Invalid format' });
            console.log(`  ❌ Invalid protocol format`);
          }
        } else if (href.startsWith('http')) {
          // External link - check if reachable
          try {
            const response = await page.request.get(href, { 
              timeout: 10000,
              ignoreHTTPSErrors: true 
            });
            
            if (response.status() < 400) {
              workingLinks.push({ ...linkInfo, status: response.status() });
              console.log(`  ✅ External link working (${response.status()})`);
            } else {
              brokenLinks.push({ ...linkInfo, status: response.status(), error: `HTTP ${response.status()}` });
              console.log(`  ❌ External link broken (${response.status()})`);
            }
          } catch (error) {
            brokenLinks.push({ ...linkInfo, status: 'error', error: error.message });
            console.log(`  ❌ External link error: ${error.message}`);
          }
        } else {
          // Internal link - navigate and check
          try {
            const currentUrl = page.url();
            await page.click(`a[href="${href}"]`);
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            
            const newUrl = page.url();
            const title = await page.title();
            
            // Check for error indicators
            const hasError = title.toLowerCase().includes('404') || 
                           title.toLowerCase().includes('error') ||
                           await page.locator('text=/404|not found|error/i').count() > 0;
            
            if (hasError) {
              brokenLinks.push({ ...linkInfo, status: '404', error: 'Page not found' });
              console.log(`  ❌ Internal link broken (404)`);
            } else {
              workingLinks.push({ ...linkInfo, status: 'internal-valid' });
              console.log(`  ✅ Internal link working`);
            }
            
            // Navigate back to main page
            await page.goto('/');
            await page.waitForLoadState('networkidle');
          } catch (error) {
            brokenLinks.push({ ...linkInfo, status: 'navigation-error', error: error.message });
            console.log(`  ❌ Navigation error: ${error.message}`);
            
            // Ensure we're back on main page
            await page.goto('/');
            await page.waitForLoadState('networkidle');
          }
        }
      } catch (error) {
        brokenLinks.push({ ...linkInfo, status: 'test-error', error: error.message });
        console.log(`  ❌ Test error: ${error.message}`);
      }
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100);
    }
    
    // Generate final report
    console.log('\n=== FINAL LINK VALIDATION REPORT ===');
    console.log(`Total links tested: ${allLinks.length}`);
    console.log(`Working links: ${workingLinks.length}`);
    console.log(`Broken links: ${brokenLinks.length}`);
    console.log(`Success rate: ${((workingLinks.length / allLinks.length) * 100).toFixed(1)}%`);
    
    if (brokenLinks.length > 0) {
      console.log('\n❌ BROKEN LINKS FOUND:');
      brokenLinks.forEach((link, index) => {
        console.log(`${index + 1}. [${link.location}] "${link.text}" -> ${link.href}`);
        console.log(`   Error: ${link.error || link.status}`);
      });
    }
    
    if (workingLinks.length > 0) {
      console.log('\n✅ WORKING LINKS BY LOCATION:');
      const byLocation = workingLinks.reduce((acc, link) => {
        acc[link.location] = (acc[link.location] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byLocation).forEach(([location, count]) => {
        console.log(`${location}: ${count} links`);
      });
    }
    
    // The test should fail if ANY links are broken
    expect(brokenLinks.length, `Found ${brokenLinks.length} broken links. See console output for details.`).toBe(0);
  });
});