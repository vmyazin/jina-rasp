# AGENTS.md

This file provides guidance to AI coding agents (e.g., Claude Code, OpenAI GPT-based tools, Copilot Chat, Cursor) when working with code in this repository.

## Project Overview

This is an insurance broker directory for Fortaleza, Brazil, built as a modern web application. The project uses Jina AI for automated data collection, Supabase as the database, and Lit web components with TypeScript for the frontend. It features a modern, search-first UX inspired by travel booking sites like Travelocity.

## Tech Stack

- **Frontend**: Lit web components + TypeScript (component-based architecture)
- **Build Tool**: Vite with hot reload and optimized production builds
- **Styling**: Open Props + custom CSS with glass morphism effects
- **Database**: Supabase (PostgreSQL) with GIN indexes + custom search functions
- **Data Collection**: Jina AI APIs (Search + Reader) with multi-agent scrapers
- **Server**: Express.js proxy with rate limiting + CORS
- **Deployment**: Static files + Node.js backend

### Key Implementation Details:

- **Search**: Custom PostgreSQL search_brokers() function with Portuguese full-text search
- **Performance**: 300ms debouncing, AbortController for request cancellation, 5-min caching
- **Security**: Row Level Security (RLS) policies, server-side API proxying, no exposed credentials
- **Data Flow**: Individual scrapers → consolidation → bulk DB insert via Supabase client
- **UI Pattern**: Search-first (no initial results), glass morphism with backdrop-filter
- **Responsive**: CSS Grid + Flexbox, mobile-first with 768px breakpoint
- **APIs**: Jina Search (s.jina.ai) + Reader (r.jina.ai) for web scraping
- **State**: Lit reactive properties with component-based state management
- **Components**: Modular architecture with broker-app, broker-search, broker-list, broker-card

### Critical Config:

Environment variables for all API keys, Supabase connection via service role key for data operations.

## Architecture

### Frontend Architecture

- **Component-Based Architecture**: Uses Lit web components with TypeScript
- **Development Stack**: Vite + TypeScript + Lit for modern development experience
- **Production Files**:
  - `src/main.ts` - TypeScript entry point with Lit component initialization
  - `src/components/` - Modular Lit components (broker-app, broker-search, broker-list, broker-card)
  - `public/index.html` - Simplified HTML entry point
  - `styles.css` - Travel industry design system with CSS custom properties (legacy)
- **Component Architecture**:
  - `broker-app.ts` - Main app wrapper with data fetching and state management
  - `broker-search.ts` - Search form with filters and debounced input
  - `broker-list.ts` - Results container with loading states
  - `broker-card.ts` - Individual broker display with Google Maps integration
- **Search Strategy**: On-demand database queries (no preloading), with caching and debouncing

### Database Integration

- **Database**: Supabase (PostgreSQL) with the `insurance_brokers` table
- **Schema**: See `schema.sql` for complete table structure with GIN indexes for array search
- **Production Config**: Uses live Supabase instance with credentials in `.env`
- **Search Function**: Custom PostgreSQL function `search_brokers()` with full-text search

### Data Collection System

- **Multi-Agent Architecture**: Three specialized scrapers using Jina AI APIs
  - `agent1_scraper.js` - General brokers (Centro, Aldeota, Meireles)
  - `agent2_scraper.js` - Specialized brokers (Cocó, Papicu, Varjota, Dionísio Torres)
  - `agent3_scraper.js` - Corporate representatives (major insurers)
- **Data Flow**: Individual scrapers → `consolidate_data.js` → `setup_prod_db.js` → Supabase
- **APIs Used**: Jina Search API (`s.jina.ai`) and Reader API (`r.jina.ai`)

## Development Commands

### Environment Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys (see .env for required variables)
```

### Data Collection

```bash
# Run individual scrapers
node agent1_scraper.js
node agent2_scraper.js
node agent3_scraper.js

# Consolidate all scraped data
node consolidate_data.js

# Load data into production database
node setup_prod_db.js
```

### Local Development

```bash
# Serve website locally
python -m http.server 8000
# Visit: http://localhost:8000

# Test database connection
npm run config:test
```

### Database Operations

```bash
# Connect to Supabase locally (if using local instance)
supabase start
supabase db push

# Apply RLS security policies
npm run security:apply-rls

# Test RLS policies
npm run security:test-rls

# Run SQL migrations manually in Supabase dashboard
# Execute: database/schema.sql and database/rls_policies.sql
```

## Configuration

### Environment Variables (.env)

```bash
# Essential variables (always required)
JINA_API_KEY=your_jina_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
NODE_ENV=production
PORT=2999
```

### Search Implementation Details

- **Search Fields**: name, email, address, neighborhood + smart specialty detection
- **Specialty Mapping**: Automatically detects keywords like "auto", "vida", "casa" and maps to database specialties
- **Performance**: 300ms debouncing, request cancellation, 5-minute result caching
- **Pagination**: Limited to 50 results per query for performance

## Key Technical Patterns

### Search Query Construction

The app builds Supabase queries dynamically:

```javascript
// Text search across multiple fields
query = query.or(
  `name.ilike.%${term}%,email.ilike.%${term}%,address.ilike.%${term}%,neighborhood.ilike.%${term}%`
);

// Array search for specialties
query = query.contains("specialties", [specialty]);
```

### Data Caching Strategy

- **Search Cache**: 5-minute TTL with automatic cleanup
- **Filter Options**: Loaded once on initialization
- **Request Deduplication**: AbortController cancels previous requests

### UI State Management

- **Search-First**: No results shown on page load
- **Loading States**: Spinner during API calls
- **Error Handling**: User-friendly Portuguese error messages

## File Structure Context

```
├── public/                     # Frontend assets (served by Express)
│   ├── index_production.html   # Main website
│   ├── app_production.js       # Search & Supabase integration
│   └── styles.css             # Travel-inspired design system
├── scripts/
│   ├── data/                  # Data collection & processing
│   │   ├── agent*_scraper.js  # Jina AI scrapers
│   │   ├── consolidate_data.js # Data merging
│   │   └── setup_prod_db.js   # Database loading
│   └── security/              # Security & testing scripts
│       ├── apply_rls_policies.js # Apply RLS policies
│       └── test_rls_policies.js  # Test security policies
├── database/                  # Database schemas & policies
│   ├── schema.sql            # PostgreSQL schema & functions
│   └── rls_policies.sql      # Row Level Security policies
├── config/                   # Configuration files
│   └── config.js            # Config loader
├── docs/                     # Documentation
│   ├── AGENTS.md            # Project documentation for AI agents
│   ├── README.md            # User documentation
│   └── DEVELOPMENT_PLAN.md   # Development roadmap
├── server.js                # Express server & API endpoints
└── .env                     # Environment variables
```

## Important Implementation Notes

### Search Performance

- Uses PostgreSQL GIN indexes on `specialties` array field
- Implements full-text search with Portuguese language support
- Database function `search_brokers()` handles complex queries efficiently

### UI Design System

- CSS custom properties for consistent theming
- Travelocity-inspired components (glass morphism, backdrop filters)
- Mobile-responsive with CSS Grid and Flexbox
- Footer spans full viewport width using negative margins

### Data Quality

- 100 insurance brokers across 15 neighborhoods
- Complete contact information (phone + email for all)
- Specialties mapped to 6 main categories
- Ratings and review counts included

## Common Development Tasks

When updating search functionality, test with Portuguese terms like "seguro auto", "vida", "Aldeota", etc. The search should handle specialty keywords intelligently and provide results across multiple fields.

For UI changes, maintain the travel industry aesthetic while ensuring the footer structure remains intact (4-column layout with full-width copyright section).

When adding new data, use the scraper → consolidate → database flow rather than manual insertion to maintain data consistency.

## Documentation Update Requirements

**CRITICAL**: After implementing major changes (architecture modifications, new features, security fixes), you MUST update the following documentation files:

### Always Update After Major Changes:

1. **AGENTS.md** (this file) - Update architecture notes, commands, and technical patterns
2. **DEVELOPMENT_PLAN.md** - Mark completed items, update priorities, adjust timelines
3. **README.md** - Update project overview, installation steps, and feature descriptions

### Update Rules:

- **Architecture Changes**: Update both AGENTS.md and README.md with new components, file structure changes
- **Security Implementation**: Update DEVELOPMENT_PLAN.md to mark SEC-* items as completed, add new security notes to README.md
- **New Features**: Update README.md features section, DEVELOPMENT_PLAN.md to mark FEAT-* items complete
- **API Changes**: Update AGENTS.md technical patterns and README.md API usage examples
- **Environment Variables**: Update both AGENTS.md and README.md environment configuration sections

### Recent Major Changes Applied:

- **Security Fix (2025-08-25)**: Implemented server-side API proxy, removed exposed credentials, added RLS policies
  - ✅ Added `server.js` with Express proxy and rate limiting
  - ✅ Updated `app_production.js` to use secure API endpoints
  - ✅ Created `rls_policies.sql` with Row Level Security
  - ✅ Added `SECURITY_DEPLOYMENT.md` documentation
  - ✅ Updated README.md deployment section and security features
  - ✅ Updated DEVELOPMENT_PLAN.md to mark SEC-001, SEC-002, SEC-003 as completed

This ensures documentation stays current and helps future developers and agents understand the system architecture and recent changes.

