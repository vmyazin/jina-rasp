# Complete Insurance Broker Scraping & Testing Guide

This guide covers the comprehensive scraping and testing pipeline for the Insurance Broker Directory project.

## 🚀 Quick Start - Complete Pipeline

Run the entire scraping and testing pipeline with one command:

```bash
# Run complete pipeline (no limit)
npm run scrape:complete

# Run with result limits (faster for testing)
npm run scrape:complete:10   # Limit to 10 brokers
npm run scrape:complete:25   # Limit to 25 brokers
npm run scrape:complete:50   # Limit to 50 brokers

# Custom limit
node scripts/complete-scrape-and-test.js --limit 15
```

This command will:

1. ✅ **Enhanced Jina AI Scraping** - Exhaustive research of insurance brokers
2. ✅ **Data Validation & Consolidation** - Clean and validate all data
3. ✅ **Database Update** - Insert clean data with security policies
4. ✅ **Comprehensive Playwright Testing** - Test ALL links and functionality
5. ✅ **Quality Assurance Report** - Generate detailed results

## 🔍 Enhanced Jina AI Scraping

### What Makes It "Enhanced"

Our enhanced scraper performs **exhaustive research** using Jina AI APIs:

#### 🔎 **Search Phase (s.jina.ai)**

- **20+ comprehensive search queries** in Portuguese and English
- **Neighborhood-specific searches** (Centro, Aldeota, Meireles, etc.)
- **Company-specific searches** (Porto Seguro, Bradesco, SulAmérica, etc.)
- **Service-specific searches** (auto, vida, residencial, empresarial)

#### 📄 **Scraping Phase (r.jina.ai)**

- **Target URL scraping** from industry directories
- **Individual broker website scraping** for complete information
- **Automatic retry mechanism** for failed scrapes (3 attempts)
- **Rate limiting** to respect API limits

#### 🔬 **Deep Research Phase**

For each broker found, the scraper:

- ✅ **Scrapes their complete website** using r.jina.ai
- ✅ **Searches for additional mentions** across the web
- ✅ **Extracts comprehensive contact information**
- ✅ **Finds services, certifications, business hours**
- ✅ **Analyzes online presence** and credibility
- ✅ **Assigns confidence scores** based on data quality

### Enhanced Scraper Features

```bash
# Run enhanced scraper independently
npm run scrape:enhanced

# Run individual agents with limits
npm run scrape:agent1        # No limit
npm run scrape:agent1:10     # Limit to 10 brokers
node scripts/data/agent1_scraper.js --limit 5  # Custom limit
```

**What it extracts for each broker:**

- 📞 **Multiple phone numbers** (office, mobile, WhatsApp)
- 📧 **All email addresses** found
- 📍 **Complete addresses** with neighborhood detection
- 🏢 **Company information** (founded year, employees, branches)
- 🎯 **Specialties** (auto, vida, residencial, empresarial, saúde)
- ⭐ **Services offered** (cotação, consultoria, sinistros)
- 🕒 **Business hours** extraction
- 📱 **Social media profiles** (Instagram, Facebook, WhatsApp)
- 🏆 **Certifications** (SUSEP, FENACOR)
- 🌐 **Online presence analysis**
- 📊 **Confidence scoring** (0-100%)

## 📊 Data Quality & Validation

The pipeline includes comprehensive data validation:

### ✅ **Validation Steps**

1. **Required Field Validation** - Ensures name, phone, email present
2. **Phone Number Standardization** - Formats to `(85) 99999-9999`
3. **Email Normalization** - Lowercase, format validation
4. **Duplicate Detection** - Removes identical records
5. **Address Standardization** - Consistent formatting
6. **Specialty Validation** - Ensures valid categories

### 📈 **Quality Metrics**

- **Success Rate**: Typically 80-90% of scraped data passes validation
- **Auto-Cleaning**: Phone/email formatting applied automatically
- **Duplicate Removal**: Intelligent matching prevents duplicates
- **Confidence Scoring**: Each broker gets 0-100% confidence score

## 🎭 Comprehensive Playwright Testing

After data collection, the pipeline runs extensive testing:

### 🔗 **Link Validation Tests**

```bash
# Test ALL links independently
npm run test:links:all
```

**What gets tested:**

- ✅ **Navigation links** (header/menu)
- ✅ **Footer links** (all footer sections)
- ✅ **Content links** (main page content)
- ✅ **Broker profile links** (external websites)
- ✅ **Internal links** (site navigation)
- ✅ **Protocol links** (mailto/tel validation)

### ⚙️ **Functionality Tests**

```bash
# Test core functionality
npm run test:functionality
```

**What gets tested:**

- ✅ **Page loading** and title validation
- ✅ **Search functionality** with real queries
- ✅ **Filter functionality** (neighborhood, specialty)
- ✅ **Mobile responsiveness** (375px viewport)
- ✅ **API endpoints** (/api/search, /api/filters, /api/health)
- ✅ **Error handling** (graceful failures)

### 🌐 **Multi-Browser Testing**

Tests run automatically on:

- **Desktop Chrome** (primary)
- **Desktop Firefox**
- **Desktop Safari**
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

## 📋 Pipeline Results & Reports

### 📊 **Execution Report**

After completion, you'll find detailed reports in:

- `reports/pipeline-report.json` - Complete execution details
- `reports/pipeline-summary.md` - Human-readable summary
- `playwright-report/` - Interactive test results
- `test-results/` - Screenshots and traces

### 📈 **Typical Results**

```
🎯 Pipeline Results:
├── Scraping: ✅ SUCCESS (100+ brokers collected)
├── Validation: ✅ SUCCESS (85% valid records)
├── Database: ✅ SUCCESS (100 records inserted)
└── Testing: ✅ SUCCESS (45/45 tests passed)

📊 Summary Statistics:
├── Total Execution Time: 180 seconds
├── Success Rate: 100%
├── Final Broker Count: 100
└── Quality Assurance: All links validated
```

## 🔧 Manual Operations

### Individual Components

```bash
# Run just the enhanced scraper
npm run scrape:enhanced

# Run individual agents with limits
npm run scrape:agent1:10     # Agent 1 with 10 broker limit
node scripts/data/agent1_scraper.js --limit 5  # Custom limit

# Run just data consolidation
npm run data:consolidate

# Run just database setup
npm run data:setup

# Run just link testing
npm run test:links:all

# View test reports
npm run test:report
```

### 🔢 **Result Limiting Options**

Control the number of brokers scraped for faster testing:

```bash
# Quick testing (10 brokers)
npm run scrape:complete:10

# Medium testing (25 brokers)
npm run scrape:complete:25

# Larger sample (50 brokers)
npm run scrape:complete:50

# Custom limits
node scripts/complete-scrape-and-test.js --limit 15
node scripts/data/agent1_scraper.js --limit 5

# No limit (find all available brokers)
npm run scrape:complete
```

**Benefits of using limits:**

- ⚡ **Faster execution** for testing and development
- 💰 **Reduced API costs** (fewer Jina AI calls)
- 🎯 **Focused testing** with manageable datasets
- 🔄 **Quicker iteration** during development

### Debugging & Troubleshooting

```bash
# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI (interactive)
npm run test:ui

# Debug specific test
npx playwright test --debug tests/comprehensive-link-check.spec.js
```

## 🎯 Quality Assurance Standards

### ✅ **Data Quality Requirements**

- **Minimum 80% validation success rate**
- **All phone numbers in standard format**
- **No duplicate records in final database**
- **All addresses include Fortaleza, CE**
- **Confidence scores calculated for reliability**

### ✅ **Link Quality Requirements**

- **100% of navigation links must work**
- **100% of footer links must work**
- **External broker websites checked (with warnings for failures)**
- **All internal links must return valid pages**
- **No 404 errors allowed in production**

### ✅ **Testing Requirements**

- **All Playwright tests must pass before deployment**
- **Multi-browser compatibility verified**
- **Mobile responsiveness confirmed**
- **API endpoints functioning correctly**
- **Error handling working properly**

## 🚀 Deployment Workflow

### Recommended Process

```bash
# 1. Run complete pipeline
npm run scrape:complete

# 2. Review results
cat reports/pipeline-summary.md

# 3. Check for any issues
npm run test:report

# 4. Deploy only if all tests pass
# (Your deployment command here)
```

### Pre-Deployment Checklist

- [ ] Complete pipeline executed successfully
- [ ] All Playwright tests passing
- [ ] No broken links found
- [ ] Data validation success rate > 80%
- [ ] Database updated with clean data
- [ ] Security policies applied and tested

## 📚 Additional Resources

- **Playwright Testing Guide**: `PLAYWRIGHT_TESTING.md`
- **Data Quality Dashboard**: `DATA_QUALITY_DASHBOARD.md`
- **Development Plan**: `DEVELOPMENT_PLAN.md`
- **Security Checklist**: `SECURITY_CHECKLIST.md`

## 🆘 Support & Troubleshooting

### Common Issues

**1. Jina API Rate Limiting**

- The scraper includes automatic delays and retry logic
- If you hit limits, wait 1 hour and retry

**2. Playwright Tests Failing**

- Check if server is running on port 2999
- Ensure all dependencies installed: `npm install`
- Try running tests in headed mode: `npm run test:headed`

**3. Database Connection Issues**

- Verify `.env` file has correct Supabase credentials
- Check if service role key is properly configured
- Run `npm run security:test-rls` to verify connection

**4. Link Validation Failures**

- External broker websites may be temporarily down (warnings only)
- Internal link failures indicate real issues that need fixing
- Check `playwright-report/` for detailed failure information

---

_This comprehensive pipeline ensures professional-quality data collection and testing for the Insurance Broker Directory._
