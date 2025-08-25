---
inclusion: always
---

# Insurance Broker Directory - Project Context

This steering file provides essential context about the Insurance Broker Directory project for all development tasks.

## Project Overview

This is a comprehensive web directory of insurance brokers in Fortaleza, Brazil, featuring:
- 100+ insurance brokers across 15 neighborhoods
- Advanced search & filtering by specialty and location
- Real-time statistics dashboard
- Mobile-responsive design
- Multi-agent data collection using Jina AI APIs

## Current Architecture

### Frontend
- `index_production.html` - Main website (production)
- `app_production.js` - Secure JavaScript application (no direct DB credentials)
- `styles.css` - Responsive styling

### Backend Security Layer
- `server.js` - Express API proxy with security features
- All database operations go through secure server endpoints
- Input validation, rate limiting, CORS protection implemented

### Database
- Supabase PostgreSQL with Row Level Security (RLS)
- `insurance_brokers` table with comprehensive broker data
- Secure search functions and audit logging

## Security Status (SEC-001)

**Current Status**: ⚠️ 95% COMPLETE - Critical issue remaining

### ✅ Implemented Security Features
- Server-side API proxy (no client-side credentials)
- Input sanitization (removes `<>"'%;()&+`)
- Rate limiting (30 req/min per IP)
- CORS protection
- Row Level Security policies
- Error handling with generic messages

### 🔴 Critical Issue
- **SUPABASE_SERVICE_ROLE_KEY** in `.env` needs real key from Supabase dashboard
- Currently using placeholder value, server falls back to anon key

## Key Files Reference

#[[file:CLAUDE.md]] - Developer guidance and project context
#[[file:DEVELOPMENT_PLAN.md]] - Complete roadmap with priorities and phases
#[[file:README.md]] - Project documentation and setup instructions

## Development Priorities

### Phase 1: Security & Stability (IN PROGRESS)
- ✅ SEC-001: API Keys Security (95% complete - needs service role key)
- ✅ SEC-002: Row Level Security policies
- ✅ SEC-003: Rate limiting
- 🔄 DATA-001: Data validation pipeline

### Next Priorities
- PERF-001: Database query optimization
- UX-001: Search result relevance
- ARCH-001: Frontend architecture refactor

## Environment Configuration

Required environment variables:
```env
SUPABASE_URL=https://uumwnszvdcrjqnobopax.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here  # ⚠️ NEEDS REAL KEY
JINA_API_KEY=jina_7b751a85dace4ad48b218524fba93e50NjFfx-SWhltU-u80Vjh4Eht35jo5
NODE_ENV=production
PORT=2999
```

## Database Schema

Main table: `insurance_brokers`
- Core fields: id, name, email, phone, website, address, neighborhood
- Specialties: TEXT[] array with values like 'auto', 'vida', 'residencial'
- Ratings: rating (DECIMAL), review_count (INTEGER)
- Security: created_at, updated_at, verified (BOOLEAN)

## API Endpoints

All through secure proxy at `/api/`:
- `GET /api/filters` - Get specialty and neighborhood options
- `POST /api/search` - Search brokers with validation
- `GET /api/health` - Health check

## Security Tools Available

- `setup_security.js` - Automated security configuration validator
- `SECURITY_CHECKLIST.md` - Complete security audit checklist
- Server includes startup validation and warnings

## Common Development Tasks

### Adding New Features
1. Update server.js for new API endpoints
2. Add input validation for new parameters
3. Update client-side app_production.js
4. Test security implications

### Database Changes
1. Create migration in Supabase dashboard
2. Update RLS policies if needed
3. Test with both anon and service role keys
4. Update API endpoints accordingly

### Security Updates
1. Run `node setup_security.js` to check current status
2. Review SECURITY_CHECKLIST.md for compliance
3. Test rate limiting and input validation
4. Verify no credentials in client-side code

## Performance Considerations

- Search results cached for 5 minutes
- Rate limiting prevents abuse
- Database queries limited to 50 results
- Input validation prevents expensive operations

## Error Handling

- Generic error messages for users (Portuguese)
- Detailed logging server-side only
- Proper HTTP status codes
- Graceful fallbacks for missing data

This context should inform all development decisions and help maintain the security and architecture standards established in the project.