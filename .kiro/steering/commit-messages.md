---
inclusion: always
---

# Commit Message Guidelines

Always write commit messages using markdown format. Keep them concise and informative.

## Format Requirements
- Maximum 5 lines total
- Use markdown formatting for clarity
- Include relevant context and impact
- Reference issue numbers when applicable

## Template
```markdown
**[TYPE]**: Brief description of changes

- Key change or improvement made
- Impact or benefit of the change
- Reference: Issue #XXX (if applicable)
```

## Examples
```markdown
**[SECURITY]**: Complete SEC-001 API keys implementation

- Added service role key validation in server.js
- Updated .env with proper Supabase credentials
- Reference: SEC-001 in DEVELOPMENT_PLAN.md
```

```markdown
**[FIX]**: Resolve rate limiting edge case

- Fixed IP tracking for proxied requests
- Added X-Forwarded-For header support
```

```markdown
**[FEATURE]**: Add advanced search filters

- Implemented neighborhood filtering
- Added specialty-based search logic
- Improved user experience for broker discovery
```