# Cloudflare Worker for Scholario APK Upload & Distribution

This Cloudflare Worker handles secure APK uploads from the Scholario Admin Dashboard to Cloudflare R2, maintains `apk/latest.json`, and serves high-speed downloads.

## Root Cause of HTTP 405
The upload was previously directed to a relative path (`/api/admin/apk/upload`) on the site's own origin. Because the web application is served via static hosting, the hosting server immediately returned `HTTP 405 Method Not Allowed`. The upload request must be sent directly to this Cloudflare Worker via `WORKER_UPLOAD_URL` using HTTP `PUT`.

---

## 1. Create Cloudflare R2 Bucket
```bash
npx wrangler r2 bucket create scholario-apk
```

---

## 2. Configure CORS on R2 Bucket
In the Cloudflare Dashboard:
1. Navigate to **R2** > **scholario-apk** > **Settings** > **CORS Policy**.
2. Paste the following CORS configuration:
```json
[
  {
    "AllowedOrigins": [
      "https://ais-dev-sgcnycnbypsftd6quqepds-714222591561.asia-east1.run.app",
      "https://ais-pre-sgcnycnbypsftd6quqepds-714222591561.asia-east1.run.app",
      "https://scholario.app",
      "*"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Disposition", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

---

## 3. Deploy the Cloudflare Worker
From your project directory:
```bash
cd cloudflare-worker
npx wrangler deploy
```

Upon deployment, Wrangler will print your Worker's live URL:
`https://scholario-apk-worker.<account-subdomain>.workers.dev`

---

## 4. Set Environment Variables & Secrets in Cloudflare
```bash
# Set Supabase credentials so the Worker can verify admin privileges
npx wrangler secret put SUPABASE_ANON_KEY

# Optional: If using an optional shared secret for server-to-server auth
npx wrangler secret put ADMIN_SECRET_KEY
```

In `wrangler.toml`, ensure the following are defined:
- `SUPABASE_URL`: Your Supabase project URL (e.g. `https://your-project.supabase.co`)
- `PUBLIC_DOMAIN`: Public CDN URL for downloads (e.g. `https://files.scholario.app` or your worker URL)
- Binding: `APK_BUCKET = "scholario-apk"`

---

## 5. Set Frontend Configuration
Set the following environment variable in your frontend `.env` (or environment settings):
```env
VITE_WORKER_UPLOAD_URL=https://scholario-apk-worker.<account-subdomain>.workers.dev/upload
```
(Replace `<account-subdomain>` with your Cloudflare account's workers.dev subdomain).
