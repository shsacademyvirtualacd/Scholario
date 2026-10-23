# Cloudflare Worker for Scholario APK Upload & Distribution

This Cloudflare Worker handles secure APK uploads from the Scholario Admin Dashboard to Cloudflare R2, maintains `apk/latest.json`, and serves high-speed downloads via your custom domain.

## Setup Instructions

### 1. Create R2 Bucket
Run via Wrangler CLI or create in the Cloudflare Dashboard:
```bash
npx wrangler r2 bucket create scholario-apk
```

### 2. Configure Custom Domain on the R2 Bucket
In the Cloudflare Dashboard:
1. Navigate to **R2** > **scholario-apk** > **Settings** > **Custom Domains**.
2. Connect your custom domain (e.g. `files.scholario.app`).
3. Cloudflare will automatically provision SSL and routing.

### 3. Configure CORS on the R2 Bucket
Under **R2** > **scholario-apk** > **Settings** > **CORS Policy**, add:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### 4. Deploy the Worker
```bash
cd cloudflare-worker
npx wrangler deploy
```

### 5. Set Environment Secrets
```bash
npx wrangler secret put SUPABASE_ANON_KEY
```
