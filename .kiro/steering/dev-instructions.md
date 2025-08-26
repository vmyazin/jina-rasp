---
inclusion: always
---

# Commit Messages

Always write commit messages after your made changes that I requested (skip if no files are affected), ALWAYS using a markdown format snippet. Keep messages concise and informative.

If the change is a follow up, ammed the commit message.

## Format Requirements

- Maximum 5 lines total
- Use markdown formatting for clarity
- Include relevant context and impact
- Reference issue numbers when applicable

## Template

```markdown
type(): Brief description of changes

- Key change or improvement made
- Impact or benefit of the change
- Reference: Issue #XXX (if applicable)
```

## Examples

```markdown
security(%feature_name%): Complete SEC-001 API keys implementation

- Added service role key validation in server.js
- Updated .env with proper Supabase credentials
- Reference: SEC-001 in DEVELOPMENT_PLAN.md
```

```markdown
fix: Resolve rate limiting edge case

- Fixed IP tracking for proxied requests
- Added X-Forwarded-For header support
```

```markdown
feat(%feature_name%): Add advanced search filters

- Implemented neighborhood filtering
- Added specialty-based search logic
- Improved user experience for broker discovery
```

# Clean Up After Testing

After you create testing scripts (fetch_apt_test.js or similar), clean them up upon getting a successful result.
