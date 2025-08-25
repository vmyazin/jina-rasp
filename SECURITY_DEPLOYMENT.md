# Security Deployment Guide

## Overview

This guide documents the security improvements implemented to fix the critical vulnerability where API keys were exposed in client-side code. The solution implements a secure server-side API proxy with proper authentication, input validation, and rate limiting.

## Security Issues Fixed

### 🔴 Critical: API Keys Exposed in Client Code
- **Before**: Supabase credentials hardcoded in `app_production.js`
- **After**: Server-side proxy with secure credential management
- **Impact**: Eliminated public exposure of database credentials

### 🔴 Critical: No Input Sanitization  
- **Before**: User input passed directly to database
- **After**: Server-side validation and sanitization
- **Impact**: Prevents SQL injection and XSS attacks

### 🔴 Critical: No Rate Limiting
- **Before**: Unlimited API calls possible
- **After**: 30 requests per minute per IP
- **Impact**: Prevents DoS attacks and API abuse

## Architecture Changes

### Before (Insecure)
```
Browser → Supabase (direct connection with exposed keys)
```

### After (Secure)  
```
Browser → Express Server → Supabase (with service role key)
```

## New Components

### 1. Express Server (`server.js`)
- **Purpose**: Secure API proxy with authentication
- **Features**:
  - Input validation and sanitization
  - Rate limiting (30 req/min per IP)
  - CORS security
  - Error handling with Portuguese messages
  - Health check endpoint

### 2. Row Level Security (`rls_policies.sql`)
- **Purpose**: Database-level security policies
- **Features**:
  - Public read access to broker data only
  - Restricted write access to authenticated users
  - Secure search function with input validation
  - Audit logging capabilities

### 3. Updated Client Code (`app_production.js`)
- **Purpose**: Secure frontend without exposed credentials
- **Changes**:
  - Removed direct Supabase connection
  - Uses fetch API to call secure endpoints
  - Improved error handling with rate limit messages

## Deployment Steps

### 1. Install Dependencies
```bash
npm install express cors @supabase/supabase-js
```

### 2. Update Environment Variables
Add to `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> ⚠️ **Important**: Get your service role key from Supabase Dashboard → Settings → API → service_role key

### 3. Apply Database Security Policies
Execute in Supabase SQL Editor:
```bash
# Apply Row Level Security policies
psql -f rls_policies.sql
```

### 4. Start Secure Server
```bash
# Development
npm run dev

# Production  
npm start
```

### 5. Update DNS/Proxy Configuration
Point your domain to the Express server (port 3000) instead of serving static files directly.

## API Endpoints

### GET `/api/health`
Health check endpoint
- **Response**: `{ status: 'ok', timestamp: '...', version: '1.0.0' }`

### GET `/api/filters`
Get filter options (specialties and neighborhoods)
- **Rate Limit**: 30/minute per IP
- **Response**: `{ specialties: [...], neighborhoods: [...] }`

### POST `/api/search`
Search insurance brokers
- **Rate Limit**: 30/minute per IP  
- **Body**: `{ searchTerm: string, specialty: string, region: string }`
- **Response**: `{ data: [...], count: number }`

## Security Features

### Input Validation
- Search terms limited to 100 characters
- Special characters removed: `<>"'%;()&+`
- Specialty values restricted to predefined list
- Neighborhood names sanitized

### Rate Limiting
- 30 requests per minute per IP address
- Automatic IP tracking and reset
- 429 status code for exceeded limits

### CORS Protection
```javascript
// Development
origin: ['http://localhost:8000', 'http://127.0.0.1:8000']

// Production  
origin: ['https://your-domain.com']
```

### Database Security
- Row Level Security enabled
- Public read access only to broker data
- Service role required for write operations
- Secure search function with built-in validation

## Environment Configuration

### Development (.env)
```bash
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Production (.env)
```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Error Handling

### Client-Side Errors
- Network failures: "Erro de conexão"
- Rate limiting: "Muitas solicitações. Tente novamente em um minuto."
- Server errors: "Erro interno do servidor"

### Server-Side Logging
```javascript
console.error('Search endpoint error:', error);
```

## Performance Impact

### Before
- Direct client → database connection
- No caching or optimization
- Unlimited concurrent requests

### After  
- Server-side request processing
- Input validation overhead (~5ms)
- Rate limiting protection
- Better error handling

## Monitoring & Alerts

### Health Monitoring
```bash
curl https://your-domain.com/api/health
```

### Rate Limit Monitoring
Monitor 429 status codes in server logs to identify potential attacks.

### Error Tracking
Implement error reporting service (Sentry, LogRocket) for production monitoring.

## Rollback Plan

If issues occur, you can temporarily rollback by:

1. **Disable RLS**: `ALTER TABLE insurance_brokers DISABLE ROW LEVEL SECURITY;`
2. **Revert client code**: Use previous version with direct Supabase connection
3. **Update environment**: Switch back to anon key (not recommended for production)

## Next Security Steps

1. **SSL/TLS**: Ensure HTTPS in production
2. **API Keys Rotation**: Regular rotation of service role keys  
3. **Audit Logging**: Enable search audit for compliance
4. **Intrusion Detection**: Monitor for suspicious patterns
5. **Backup Security**: Encrypt database backups

## Testing

### Security Testing
```bash
# Test rate limiting
for i in {1..35}; do curl -X POST http://localhost:3000/api/search -d '{}'; done

# Test input validation
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "<script>alert(1)</script>"}'
```

### Functionality Testing
```bash
# Test search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "seguro auto"}'

# Test filters
curl http://localhost:3000/api/filters
```

## Compliance

This implementation addresses:
- **OWASP Top 10**: Injection prevention, security misconfigurations
- **GDPR**: Data access controls, audit logging capability
- **Brazilian LGPD**: Personal data protection measures

---

**🔒 Security is now significantly improved with no exposed credentials, input validation, and rate limiting protection.**