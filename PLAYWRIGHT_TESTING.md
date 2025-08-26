# Playwright Testing Guide

This project uses Playwright for comprehensive end-to-end testing and link validation.

## Quick Start

```bash
# Run all tests
npm test

# Run comprehensive link validation (validates EVERY link)
npm run test:links:all

# Run tests with browser UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# View test report
npm run test:report
```

## Test Suites

### 1. Comprehensive Link Validation (`test:links:all`)
**This is the main link validation test that checks EVERY link on the site.**

- ✅ Validates ALL navigation links
- ✅ Validates ALL footer links  
- ✅ Validates ALL content links
- ✅ Validates ALL broker profile links
- ✅ Checks external links are reachable
- ✅ Checks internal links don't 404
- ✅ Validates anchor links have targets
- ✅ Validates mailto/tel links have proper format

**Usage:**
```bash
npm run test:links:all
```

### 2. Functionality Tests (`test:functionality`)
Tests core application functionality:
- Page loading
- Search functionality
- Filter functionality
- Mobile responsiveness
- API endpoints
- Error handling

### 3. Individual Link Tests (`test:links`)
Separate tests for different link categories if you need granular testing.

## Test Configuration

The tests are configured in `playwright.config.js` with:
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Automatic server startup
- Trace collection on failures
- HTML reporting

## CI/CD Integration

For continuous integration, the tests will:
- Start the server automatically
- Run in headless mode
- Generate HTML reports
- Fail the build if any links are broken

## Link Validation Rules

The comprehensive link validator follows these rules:

1. **External Links (http/https)**: Must return status < 400
2. **Internal Links**: Must not show 404 or error pages
3. **Anchor Links (#)**: Target element must exist on page
4. **Protocol Links (mailto/tel)**: Must have valid format
5. **All Links**: Must be reachable and functional

## Debugging Failed Tests

If tests fail:

1. **View the HTML report**: `npm run test:report`
2. **Run in headed mode**: `npm run test:headed`
3. **Use debug mode**: `npx playwright test --debug`
4. **Check console output** for specific broken links

## Best Practices

1. **Always run link validation before deployment**
2. **Fix broken links immediately** - they hurt SEO and UX
3. **Test on multiple browsers** using the full test suite
4. **Check mobile responsiveness** with mobile test configurations

## Example Output

```
=== COMPREHENSIVE LINK VALIDATION REPORT ===
Total links found: 47

[1/47] Testing navigation: "Home" -> /
  ✅ Internal link working
[2/47] Testing footer: "Contact" -> mailto:contact@example.com
  ✅ Protocol link valid
[3/47] Testing broker-card: "Broker Website" -> https://example.com
  ✅ External link working (200)

=== FINAL LINK VALIDATION REPORT ===
Total links tested: 47
Working links: 46
Broken links: 1
Success rate: 97.9%

❌ BROKEN LINKS FOUND:
1. [footer] "Privacy Policy" -> /privacy
   Error: Page not found
```

This ensures **every single link** on your site works before deployment!