# 🚀 NavaFlow - Production Deployment Guide

## Prerequisites

1. **Vercel Account** - For hosting
2. **Neon PostgreSQL** - For database
3. **GitHub Repository** - For CI/CD
4. **OAuth Apps** - Google & GitHub

## Step 1: Database Setup (Neon PostgreSQL)

1. Create a Neon account: https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update `.env.production` with `DATABASE_URL`

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

5. Run Prisma migrations:

```bash
# Use PostgreSQL schema
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

6. (Optional) Migrate data from SQLite:

```bash
# Set both database URLs
export DATABASE_URL_SQLITE="file:./db/custom.db"
export DATABASE_URL_POSTGRES="postgresql://..."

# Run migration script
bun run scripts/migrate-to-postgres.ts
```

## Step 2: Vercel Deployment

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Link Project:**

```bash
vercel link
```

4. **Set Environment Variables:**

```bash
# Set all variables from .env.production.example
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add OPENAI_API_KEY
# ... (add all required variables)
```

Or use Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add all variables from `.env.production.example`

5. **Deploy:**

```bash
vercel --prod
```

## Step 3: OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Secret to Vercel environment variables

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. Copy Client ID and Secret to Vercel environment variables

## Step 4: Vercel Services Setup

### Vercel KV (Redis)

1. Go to Vercel Dashboard → Storage → KV
2. Create a new KV database
3. Copy REST API URL and Token
4. Add to environment variables:
   - `VERCEL_KV_REST_API_URL`
   - `VERCEL_KV_REST_API_TOKEN`

### Vercel Blob

1. Go to Vercel Dashboard → Storage → Blob
2. Create a new Blob store
3. Copy Store ID and Token
4. Add to environment variables:
   - `VERCEL_BLOB_STORE_ID`
   - `VERCEL_BLOB_READ_WRITE_TOKEN`

## Step 5: WebSocket Server

**Option 1: Separate Service (Recommended)**

Deploy WebSocket server separately (e.g., Railway, Render):

```bash
# Deploy server.ts as a separate service
# Update NEXT_PUBLIC_WS_URL in environment variables
```

**Option 2: Vercel (Limited)**

Vercel doesn't support persistent WebSocket connections. Consider:
- Using Server-Sent Events (SSE) instead
- Using a separate WebSocket service
- Using Vercel's Edge Functions for real-time features

## Step 6: Monitoring Setup

### Vercel Analytics

Automatically enabled when deployed to Vercel.

### Sentry (Optional)

1. Create Sentry account
2. Install Sentry SDK:

```bash
bun add @sentry/nextjs
```

3. Initialize Sentry in `sentry.client.config.ts` and `sentry.server.config.ts`
4. Add `SENTRY_DSN` to environment variables

## Step 7: Post-Deployment

1. **Verify Database Connection:**
   - Check Vercel logs for database connection errors
   - Test API endpoints

2. **Test Authentication:**
   - Try signing in with Google/GitHub
   - Verify session creation

3. **Test Core Features:**
   - Create channels/threads
   - Send messages
   - Test AI features
   - Verify WebSocket connections

4. **Monitor Performance:**
   - Check Vercel Analytics
   - Monitor API response times
   - Check error rates

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check SSL mode (should be `require` for Neon)
- Verify database is accessible from Vercel IPs

### Authentication Issues

- Verify OAuth redirect URIs match exactly
- Check `NEXTAUTH_URL` matches your domain
- Verify `NEXTAUTH_SECRET` is set

### WebSocket Issues

- Vercel doesn't support persistent WebSocket connections
- Consider using SSE or a separate WebSocket service
- Update `NEXT_PUBLIC_WS_URL` if using separate service

### Build Errors

- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check Prisma schema compatibility

## Environment Variables Checklist

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your production domain
- [ ] `NEXTAUTH_SECRET` - Random secret (32+ characters)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `FINETUNED_MODEL_ID` - Fine-tuned model ID
- [ ] `VERCEL_KV_REST_API_URL` - Vercel KV URL
- [ ] `VERCEL_KV_REST_API_TOKEN` - Vercel KV token
- [ ] `VERCEL_BLOB_STORE_ID` - Vercel Blob store ID
- [ ] `VERCEL_BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- [ ] `ARCJET_PROJECT_ID` - ArcJet project ID
- [ ] `ARCJET_SECRET_KEY` - ArcJet secret key
- [ ] `GITHUB_TOKEN` - GitHub personal access token (for integrations)

## Next Steps

1. Set up CI/CD pipeline
2. Configure custom domain
3. Set up staging environment
4. Configure monitoring and alerts
5. Set up backup strategy

---

**Last Updated:** 2024-12-30
