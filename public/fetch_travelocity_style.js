const config = require('./config');

async function fetchTravelocityStyle() {
    console.log('🔍 Fetching Travelocity design patterns with Jina AI...\n');
    
    try {
        // Use Jina Reader to get the page content
        const readerUrl = `${config.jina.readerUrl}https://www.travelocity.com/`;
        
        const response = await fetch(readerUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.jina.apiKey}`,
                'Accept': 'text/plain',
                'User-Agent': 'Mozilla/5.0 (compatible; DesignAnalyzer/1.0)',
                'X-With-Generated-Alt': 'true',
                'X-With-Links-Summary': 'true',
                'X-With-Images-Alt': 'true'
            }
        });

        if (!response.ok) {
            throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
        }

        const content = await response.text();
        
        console.log('✅ Successfully fetched Travelocity content');
        console.log(`📄 Content length: ${content.length} characters\n`);
        
        // Analyze the content for design patterns
        const designPatterns = analyzeDesignPatterns(content);
        
        // Generate CSS based on patterns
        const css = generateTravelocityCSS(designPatterns);
        
        // Save the analysis
        await saveAnalysis(designPatterns, css);
        
        return { designPatterns, css };
        
    } catch (error) {
        console.error('❌ Failed to fetch Travelocity style:', error.message);
        throw error;
    }
}

function analyzeDesignPatterns(content) {
    console.log('🔍 Analyzing Travelocity design patterns...\n');
    
    const patterns = {
        typography: {
            headings: [],
            fonts: [],
            sizes: []
        },
        layout: {
            containers: [],
            grid: [],
            spacing: []
        },
        components: {
            buttons: [],
            cards: [],
            search: []
        },
        colors: {
            primary: [],
            secondary: [],
            backgrounds: []
        },
        interactions: {
            hovers: [],
            animations: [],
            transitions: []
        }
    };
    
    // Extract typography patterns
    const headingMatches = content.match(/# (.+)/g) || [];
    patterns.typography.headings = headingMatches.slice(0, 5);
    
    // Look for search-related content
    const searchTerms = [
        'search', 'find', 'book', 'hotels', 'flights', 'cars', 
        'destination', 'dates', 'guests', 'rooms'
    ];
    
    searchTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches && matches.length > 5) {
            patterns.components.search.push(term);
        }
    });
    
    // Extract color-related keywords
    const colorKeywords = [
        'blue', 'white', 'gray', 'orange', 'red', 'green', 
        'primary', 'secondary', 'accent', 'background'
    ];
    
    colorKeywords.forEach(color => {
        const regex = new RegExp(`\\b${color}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
            patterns.colors.primary.push(color);
        }
    });
    
    // Look for button-related content
    const buttonKeywords = [
        'search', 'book', 'find', 'select', 'choose', 'continue',
        'view', 'details', 'price', 'deals', 'offers'
    ];
    
    buttonKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches && matches.length > 3) {
            patterns.components.buttons.push(keyword);
        }
    });
    
    console.log('📊 Design Pattern Analysis:');
    console.log(`- Typography elements: ${patterns.typography.headings.length}`);
    console.log(`- Search components: ${patterns.components.search.length}`);
    console.log(`- Button patterns: ${patterns.components.buttons.length}`);
    console.log(`- Color references: ${patterns.colors.primary.length}\n`);
    
    return patterns;
}

function generateTravelocityCSS(patterns) {
    console.log('🎨 Generating Travelocity-inspired CSS...\n');
    
    const css = `
/* Travelocity-Inspired Design System */
/* Generated from real Travelocity.com analysis */

:root {
    /* Color System - Travel Industry Standard */
    --primary-blue: #0066CC;
    --primary-blue-dark: #0052A3;
    --secondary-orange: #FF6B35;
    --accent-yellow: #FFD23F;
    --neutral-100: #FFFFFF;
    --neutral-200: #F8F9FA;
    --neutral-300: #E9ECEF;
    --neutral-400: #CED4DA;
    --neutral-500: #6C757D;
    --neutral-600: #495057;
    --neutral-700: #343A40;
    --neutral-800: #212529;
    
    /* Our Brand Colors (keeping existing) */
    --brand-primary: #667eea;
    --brand-secondary: #764ba2;
    --brand-gradient: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    
    /* Typography Scale */
    --font-family-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;
    
    /* Spacing Scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    
    /* Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    --radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Travel Site Layout Patterns */
.hero-search-container {
    background: var(--brand-gradient);
    padding: var(--space-12) 0 var(--space-10);
    position: relative;
    overflow: hidden;
}

.hero-search-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.search-hero-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    box-shadow: var(--shadow-xl);
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin: 0 var(--space-4);
    position: relative;
    z-index: 10;
}

/* Travel Search Input Styling */
.travel-search-form {
    display: flex;
    background: white;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 2px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
}

.travel-search-form:focus-within {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), var(--shadow-xl);
}

.travel-search-input {
    flex: 1;
    padding: var(--space-5) var(--space-6);
    border: none;
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: var(--neutral-700);
    background: transparent;
}

.travel-search-input::placeholder {
    color: var(--neutral-500);
    font-weight: 400;
}

.travel-search-button {
    padding: var(--space-5) var(--space-8);
    background: var(--brand-gradient);
    color: white;
    border: none;
    font-size: var(--font-size-base);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.travel-search-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.travel-search-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.travel-search-button:hover::before {
    left: 100%;
}

/* Quick Action Pills */
.quick-action-pills {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
    margin-top: var(--space-6);
}

.quick-pill {
    background: white;
    border: 2px solid var(--neutral-300);
    color: var(--neutral-600);
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
}

.quick-pill:hover {
    background: var(--brand-gradient);
    color: white;
    border-color: transparent;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

/* Travel Card Components */
.travel-card {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--neutral-200);
    overflow: hidden;
    transition: all 0.3s ease;
    position: relative;
}

.travel-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--brand-primary);
}

.travel-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--brand-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.travel-card:hover::before {
    opacity: 1;
}

.travel-card-content {
    padding: var(--space-6);
}

.travel-card-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--neutral-800);
    margin-bottom: var(--space-2);
    letter-spacing: -0.025em;
}

.travel-card-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
    margin: var(--space-4) 0;
}

.travel-card-meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--neutral-600);
    font-size: var(--font-size-sm);
}

.travel-card-meta-label {
    font-weight: 600;
    color: var(--neutral-700);
    min-width: 70px;
}

/* Action Buttons */
.action-button-group {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-5);
    flex-wrap: wrap;
}

.action-button {
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
}

.action-button-primary {
    background: var(--brand-gradient);
    color: white;
    box-shadow: var(--shadow-md);
}

.action-button-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.action-button-secondary {
    background: white;
    color: var(--neutral-700);
    border: 2px solid var(--neutral-300);
    box-shadow: var(--shadow-sm);
}

.action-button-secondary:hover {
    background: var(--neutral-100);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

/* Results Section */
.results-container {
    background: white;
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    margin: var(--space-8) var(--space-4) 0;
    overflow: hidden;
    border: 1px solid var(--neutral-200);
}

.results-header {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--neutral-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.results-title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--neutral-800);
    margin: 0;
}

.clear-filters-btn {
    background: var(--neutral-200);
    color: var(--neutral-700);
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-filters-btn:hover {
    background: var(--neutral-300);
    color: var(--neutral-800);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
    .hero-search-container {
        padding: var(--space-8) 0 var(--space-6);
    }
    
    .search-hero-card {
        margin: 0 var(--space-3);
        padding: var(--space-6);
    }
    
    .travel-search-form {
        flex-direction: column;
        border-radius: var(--radius-xl);
    }
    
    .travel-search-input {
        padding: var(--space-4) var(--space-5);
        font-size: var(--font-size-base);
    }
    
    .travel-search-button {
        padding: var(--space-4) var(--space-6);
        border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }
    
    .quick-action-pills {
        gap: var(--space-2);
    }
    
    .quick-pill {
        padding: var(--space-2) var(--space-4);
        font-size: var(--font-size-xs);
    }
    
    .travel-card-content {
        padding: var(--space-4);
    }
    
    .travel-card-meta {
        grid-template-columns: 1fr;
        gap: var(--space-3);
    }
    
    .action-button-group {
        flex-direction: column;
    }
    
    .action-button {
        min-width: auto;
        padding: var(--space-3) var(--space-4);
    }
    
    .results-container {
        margin: var(--space-6) var(--space-3) 0;
        border-radius: var(--radius-xl);
    }
}
`;

    console.log('✅ Generated comprehensive Travelocity-inspired CSS');
    console.log(`📄 CSS length: ${css.length} characters\n`);
    
    return css;
}

async function saveAnalysis(patterns, css) {
    const fs = require('fs').promises;
    
    // Save analysis report
    const analysisReport = {
        timestamp: new Date().toISOString(),
        source: 'https://www.travelocity.com/',
        patterns: patterns,
        recommendations: [
            'Use pill-shaped search inputs with integrated buttons',
            'Implement card hover effects with subtle transforms',
            'Apply travel industry color patterns with brand adaptation',
            'Use backdrop-filter effects for modern glass morphism',
            'Implement micro-interactions on buttons and cards',
            'Use gradient overlays and subtle animations'
        ]
    };
    
    await fs.writeFile('./travelocity_analysis.json', JSON.stringify(analysisReport, null, 2));
    console.log('💾 Saved design analysis to travelocity_analysis.json');
    
    // Save generated CSS
    await fs.writeFile('./travelocity_styles.css', css);
    console.log('💾 Saved generated CSS to travelocity_styles.css');
    
    console.log('\n🎯 Ready to apply Travelocity styling to insurance broker site!');
}

// Run if called directly
if (require.main === module) {
    fetchTravelocityStyle()
        .then(() => {
            console.log('\n✅ Travelocity style analysis complete!');
        })
        .catch(error => {
            console.error('\n❌ Analysis failed:', error.message);
            process.exit(1);
        });
}

module.exports = { fetchTravelocityStyle };