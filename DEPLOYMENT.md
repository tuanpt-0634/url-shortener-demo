# Cloudflare Workers Deployment Guide

This guide covers deploying your Next.js URL Shortener to Cloudflare Workers using the OpenNext adapter.

For detailed documentation, visit the [OpenNext Cloudflare documentation](https://opennext.js.org/cloudflare).

## Prerequisites

- Cloudflare account (free tier works)
- Node.js v20.0.0 or higher
- Wrangler CLI installed as dev dependency (already in package.json)

## Initial Setup

### 1. Verify Dependencies

Your project should already have these installed:

```bash
# Check package.json for these dependencies
@opennextjs/cloudflare  # OpenNext adapter for Cloudflare
wrangler                # Cloudflare CLI (as devDependency)
```

### 2. Configure wrangler.toml

Your project already has `wrangler.toml` configured for Workers deployment. See [wrangler.toml](wrangler.toml) for the current configuration.

**Key configuration points:**
- `main = ".open-next/worker.js"` - Entry point for Workers deployment
- `[assets]` - Static assets configuration
- `compatibility_flags = ["nodejs_compat"]` - Required for Next.js
- `compatibility_date >= "2024-09-23"` - Minimum required version
- `[[d1_databases]]` - D1 database binding with `migrations_dir`
- `[vars]` - Environment variables (including `RUNTIME_PLATFORM = "cloudflare"`)
- `[env.preview]` - Preview environment configuration

**Important:** You must enable the `nodejs_compat` compatibility flag and set `compatibility_date` to `2024-09-23` or later.

### 3. OpenNext Configuration

Your project already has `open-next.config.ts` configured. See [open-next.config.ts](open-next.config.ts) for the current configuration.

For custom caching configuration, refer to the [OpenNext caching documentation](https://opennext.js.org/cloudflare/caching).

### 4. Verify package.json Scripts

Your [package.json](package.json) should have these scripts:

- `build`: Build with OpenNext adapter
- `preview`: Test with Cloudflare Workers runtime locally
- `deploy`: Deploy to Cloudflare Workers
- `cf-typegen`: Generate TypeScript types for Cloudflare bindings

### 5. Create D1 Databases

Create production database:
```bash
npm run db:d1:create
```

Create development database:
```bash
npm run db:d1:create:dev
```

Copy the database IDs from the output and update them in `wrangler.toml`.

### 6. Run Database Migrations

Generate migration files from schema:
```bash
npm run db:generate
```

Apply migrations to production:
```bash
npm run db:d1:migrate
```

Apply migrations to development:
```bash
npm run db:d1:migrate:dev
```

## Development Workflow

### Local Development

Use Next.js development server for the best developer experience:

```bash
npm run dev
```

This provides fast refresh and instant updates during development.

### Test with Cloudflare Adapter

Before deploying, test your app with the Cloudflare adapter locally:

```bash
npm run preview
```

This builds and runs your app using the actual Cloudflare Workers runtime, letting you verify everything works correctly.
### Configuration Methods

**Option 1: wrangler.toml** (Recommended for non-sensitive values)

Add to the `[vars]` section in `wrangler.toml`:

```toml
[vars]
NODE_ENV = "production"
RUNTIME_PLATFORM = "cloudflare"
BASE_URL = "https://your-app.workers.dev"
MAX_REQUESTS_PER_WINDOW = "60"
```

**Option 2: Cloudflare Dashboard** (For sensitive values)

1. Go to Workers & Pages → Your Project → Settings → Variables
2. Add environment variables (these are encrypted)
3. Add secrets for sensitive data (API keys, tokens)

**Option 3: wrangler secret** (For secrets via CLI)

```bash
echo "your-api-key" | wrangler secret put GOOGLE_SAFE_BROWSING_API_KEY
```

### Required Environment Variables

**Build-time variables:**
- Set these in both wrangler.toml `[vars]` AND in Workers Builds "Build Variables"
- Next.js needs access during build for SSG pages and inlining

**Runtime variables:**
- `NODE_ENV`: Environment (`production`, `preview`, `development`)
- `RUNTIME_PLATFORM`: Runtime platform (`cloudflare`, `local`, etc.)
- `BASE_URL`: Your app's URL
- `CORS_ORIGIN`: Allowed CORS origins
- `MAX_REQUESTS_PER_WINDOW`: Rate limiting threshold

**Secrets (use wrangler secret or Dashboard):**
- `GOOGLE_SAFE_BROWSING_API_KEY`: For malicious URL detection (optional)

### Workers Builds Configuration

If using Workers Builds for CI/CD:

1. Go to Workers & Pages → Your Project → Settings → Builds & deployments
2. Add **both** `NEXT_PUBLIC_*` and non-public variables to "Build Variables and secrets"
3. This ensures the build has access to all necessary environment variables

Learn more: [OpenNext Environment Variables Guide](https://opennext.js.org/cloudflare/howtos/env-vars#workers-builds)

This will:
1. Build your Next.js app with the OpenNext adapter
2. Deploy to Cloudflare Workers
3. Make it available at `*.workers.dev` subdomain

### Deploy to Custom Domain

After initial deployment:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages
2. Select your project
3. Go to Settings → Domains & Routes
4. Click "Add" and enter your custom domain
5. Cloudflare will automatically configure DNS and SSL

### Automatic Deployments (CI/CD)

You can set up automatic deployments using:

- **Workers Builds**: Native Cloudflare CI/CD
- **GitHub Actions**: Custom workflow (see CI/CD section below)
- **GitLab CI**: Custom pipeline

## Environment Variables

Configure in Cloudflare Dashboard → Pages → Settings → Environment Variables:
Real-time Logs

Stream live logs from your Worker:

```bash
wrangler tail
```

Filter logs:
```bash
wrangler tail --format=pretty --status=error
```

### Analytics

### Add a Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages → Your Project
2. Click Settings → Domains & Routes
3. Click "Add" under Custom Domains
4. Enter your domain (e.g., `short.example.com`)
5. Cloudflare automatically:
   - Creates DNS records
   - Provisions SSL certificate
   - Routes traffic to your Worker

### DNS Configuration

If your domain is not on Cloudflare:

1. Add a CNAME record pointing to `your-worker.workers.dev`
2. Or use [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/) for custom
   - Request volume
   - Error rates
   - CPU time
   - Duration (p50, p99)
   - Bandwidth usage

### Distributed Tracing

For advanced debugging, enable [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) for custom metrics and tracing.
- Same variables as production but with preview values

## Database Management

### View Database Schema
```bash
npm run db:studio
```

### Execute Custom SQL (Production)
```bash
npm run db:d1:execute -- --command="SELECT * FROM short_urls LIMIT 10;"
```

### Backup Database
```bash
wrangler d1 backup create url-shortener-db
wrangler d1 backup list url-shortener-db
**Check build logs:**
```bash
wrangler deployments list
wrangler deployments view <deployment-id>
```

**Common issues:**

1. **Node.js compatibility errors**
   - Ensure `nodejs_compat` flag is set in `wrangler.toml`
   - Verify `compatibility_date >= 2024-09-23`

2. **Module not found**
   - Run `npm install` locally
   - Check that `@opennextjs/cloudflare` is installed
   - Verify `wrangler` is in devDependencies

3. **TypeScript errors**
   - Run `npm run lint` locally
   - Generate types: `npm run cf-typegen`

### Database Connection Issues

**Verify D1 binding:**
```bash
# List D1 databases
wrangler d1 list

# Check specific database
wrangler d1 info url-shortener-db
```

**Common fixes:**
- Verify `database_id` matches in `wrangler.toml`
- Ensure `binding = "DB"` matches your code
- Check migrations have been applied: `wrangler d1 migrations list url-shortener-db`

**Via Dashboard:**
1. Go to Workers & Pages → Your Project → Deployments
2. Find the previous working deployment
3. Click "..." → "Rollback to this deployment"

**Via CLI:**
```bash
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --message "Rollback due to bug"
```

### Rollback Database Migration

D1 doesn't support automatic migration rollback. Best practices:

**Backup before migrating:**
```bash
# Create backup
wrangler d1 backup create url-shortener-db

# List backups
wrangler d1 backup list url-shortener-db

# Download backup
wrangler d1 backup download url-shortener-db --backup-id=<id>
```

**Restore from backup:**
```bash
# Restore from SQL file
wranOption 1: Workers Builds (Recommended)

Cloudflare's native CI/CD for automatic deployments:

1. Connect your GitHub/GitLab repository
2. Configure build settings:
   - **Build command**: `npm run deploy`
   - **Root directory**: `/`
3. Add environment variables in "Build Variables and secrets"
4. Automatic deployments on every push

**Important:** Add ALL environment variables (both `NEXT_PUBLIC_*` and private vars) to Build Variables for Next.js SSG to work.

Learn more: [Workers Builds Documentation](https://developers.cloudflare.com/workers/ci-cd/builds/)

### Option 2: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
   Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Builds (CI/CD)](https://developers.cloudflare.com/workers/ci-cd/builds/)

## Next.js Feature Support

The OpenNext adapter supports most Next.js features on Cloudflare Workers:

✅ **Fully Supported:**
- App Router & Pages Router
- Server Components (RSC)
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Incremental Static Regeneration (ISR)
- Server Actions
- API Routes & Route Handlers
- Middleware
- Image Optimization (via Cloudflare Images)
- Response streaming
- Partial Prerendering (PPR)

❌ **Not Yet Supported:**
- Node.js middleware in Next.js 15.2+

For the latest compatibility information, see the [official documentation](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/#next-js-supported-features).
        run: npm run deploy
```

**Required secrets:**
- `CLOUDFLARE_API_TOKEN`: Create at Cloudflare Dashboard → My Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID`: Found in Workers & Pages overview

### Option 3: GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deploy:
  image: node:20
  script:
    - npm ci
    - npm run deploy
  only:
    - main
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
    CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID
Optimize if needed:
- Enable caching for static assets
- Review database indexes
- Check for slow queries

## Rollback

### Rollback to Previous Deployment

1. Go to Cloudflare Dashboard → Pages → Your Project → Deployments
2. Find the previous working deployment
3. Click "..." → "Rollback to this deployment"

### Rollback Database Migration

```bash
# List migrations
wrangler d1 migrations list url-shortener-db

# There's no automatic rollback, so restore from backup
wrangler d1 backup list url-shortener-db
wrangler d1 execute url-shortener-db --file=backup.sql
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: url-shortener
          directory: .open-next/worker-cloudflare
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
