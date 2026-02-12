# Quickstart Guide: URL Shortener with Analytics

**Feature**: 001-url-shortener
**Last Updated**: 2026-02-12

## Overview

This guide helps you set up and run the URL shortener locally for development. Follow the steps below to get started quickly.

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **Google Safe Browsing API Key**: For malicious URL detection (free tier)

### Check Prerequisites

```bash
node --version  # Should be v20.0.0+
npm --version   # Should be v10.0.0+
git --version
```

---

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd url-shortener

# Checkout the feature branch
git checkout 001-url-shortener

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# .env.local
DATABASE_URL="file:./local.db"
GOOGLE_SAFE_BROWSING_API_KEY="your-api-key-here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Getting Google Safe Browsing API Key**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Safe Browsing API"
4. Create credentials → API Key
5. Copy the API key to `.env.local`

### 3. Database Setup

```bash
# Generate database schema
npm run db:generate

# Create local SQLite database
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
# Start Next.js dev server
npm run dev
```

The application will be available at:
- **Home**: http://localhost:3000
- **API**: http://localhost:3000/api/*
- **Analytics**: http://localhost:3000/analytics/:token

---

## Development Workflow

### Project Structure

```
url-shortener/
├── src/
│   ├── app/              # Next.js App Router (pages & API)
│   ├── components/       # React components
│   ├── lib/              # Business logic, DB, utils
│   └── middleware.ts     # Edge middleware
├── tests/                # Test files
├── public/               # Static assets
├── specs/                # Feature specifications
└── package.json
```

### Key Commands

```bash
# Development
npm run dev                # Start dev server (localhost:3000)
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:generate        # Generate Drizzle migrations
npm run db:migrate         # Apply migrations
npm run db:studio          # Open Drizzle Studio (DB UI)

# Testing
npm run test               # Run all tests (Vitest + Playwright)
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run tests with coverage report

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
npm run type-check         # TypeScript type checking

# Cloudflare Workers (Local Testing)
npm run wrangler:dev       # Test with Miniflare locally
npm run wrangler:deploy    # Deploy to Cloudflare Pages
```

---

## Usage Examples

### 1. Create a Short URL

**Via Web UI**:
1. Navigate to http://localhost:3000
2. Enter a long URL in the form
3. Click "Shorten URL"
4. Copy the short URL and analytics token

**Via API (curl)**:
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/url"}'
```

**Response**:
```json
{
  "shortUrl": "http://localhost:3000/abc123",
  "slug": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "analyticsToken": "k7Jx9pQm2wR5nY8tL3vB1zC6fH4sD0gA",
  "analyticsUrl": "http://localhost:3000/analytics/k7Jx9pQm2wR5nY8tL3vB1zC6fH4sD0gA",
  "createdAt": "2026-02-12T10:30:00.000Z"
}
```

### 2. Test Redirect

```bash
# Visit the short URL (in browser or curl)
curl -L http://localhost:3000/abc123
# Should redirect to https://example.com/very/long/url
```

### 3. View Analytics

**Via Web UI**:
1. Navigate to http://localhost:3000/analytics/k7Jx9pQm2wR5nY8tL3vB1zC6fH4sD0gA
2. View click statistics, charts, and breakdowns

**Via API**:
```bash
curl http://localhost:3000/api/analytics/k7Jx9pQm2wR5nY8tL3vB1zC6fH4sD0gA?period=day
```

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Unit tests only (Vitest)
npm run test:unit

# Integration tests (Playwright)
npm run test:integration

# With coverage
npm run test:coverage
```

### Writing Tests (TDD Approach)

1. **Write failing test first**:
```typescript
// tests/unit/services/url-shortener.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/utils/slug-generator';

describe('Slug Generator', () => {
  it('should generate 6-character slug by default', () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(6);
    expect(slug).toMatch(/^[A-Za-z0-9]{6}$/);
  });
});
```

2. **Implement minimal code to pass**:
```typescript
// src/lib/utils/slug-generator.ts
export function generateSlug(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
```

3. **Run tests and verify passing**:
```bash
npm run test:unit
```

---

## Deployment

### Deploy to Cloudflare Pages

1. **Setup Cloudflare account**:
   - Sign up at https://dash.cloudflare.com/
   - Create a new Cloudflare Pages project
   - Connect your Git repository

2. **Create D1 database**:
```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create url-shortener-db

# Copy the database ID from output, add to wrangler.toml
```

3. **Update `wrangler.toml`**:
```toml
name = "url-shortener"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "url-shortener-db"
database_id = "your-database-id-here"
```

4. **Run migrations on D1**:
```bash
npx wrangler d1 migrations apply url-shortener-db --remote
```

5. **Set environment variables**:
```bash
# In Cloudflare Pages dashboard, add:
# GOOGLE_SAFE_BROWSING_API_KEY=your-api-key
# NEXT_PUBLIC_BASE_URL=https://your-app.pages.dev
```

6. **Deploy**:
```bash
npm run build
npx wrangler pages deploy
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/lib/...`**
- **Solution**: Check `tsconfig.json` has correct path mappings:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

**Issue**: Database connection errors
- **Solution**: Run `npm run db:migrate` to create tables
- Check `.env.local` has correct `DATABASE_URL`

**Issue**: Google Safe Browsing API errors
- **Solution**: Verify API key is correct in `.env.local`
- Check API is enabled in Google Cloud Console
- Free tier limit is 10,000 requests/day

**Issue**: Tests failing
- **Solution**: Run `npm run db:migrate` to setup test database
- Check all dependencies installed: `npm install`
- Clear cache: `npm run test -- --clearCache`

**Issue**: TypeScript errors
- **Solution**: Run `npm run type-check` to see all errors
- Update type definitions: `npm install --save-dev @types/node`

---

## Development Tips

### Hot Reload

Next.js supports hot reload out of the box. Changes to files in `src/` will automatically refresh the browser.

### Database Inspection

```bash
# Open Drizzle Studio to view/edit database
npm run db:studio
# Opens at http://localhost:4983
```

### API Testing

Use tools like:
- **Postman**: Import OpenAPI spec from `specs/001-url-shortener/contracts/openapi.yaml`
- **Thunder Client** (VS Code extension)
- **curl** (command line)

### Debugging

```bash
# Run Next.js in debug mode
NODE_OPTIONS='--inspect' npm run dev

# Then attach VS Code debugger or Chrome DevTools
```

---

## Next Steps

1. **Read the Spec**: Review [spec.md](spec.md) for feature requirements
2. **Explore Plan**: Check [plan.md](plan.md) for architecture details
3. **Review Data Model**: Study [data-model.md](data-model.md) for database schema
4. **API Contracts**: Reference [contracts/openapi.yaml](contracts/openapi.yaml) for API details
5. **Run Tests**: Follow TDD approach by writing tests first
6. **Contribute**: Check [tasks.md](tasks.md) for implementation tasks

---

## Support

- **Documentation**: See `specs/001-url-shortener/` directory
- **API Reference**: `specs/001-url-shortener/contracts/openapi.yaml`
- **Issues**: Create an issue in the repository
- **Questions**: Contact the development team

---

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

---

**Happy Coding! 🚀**
