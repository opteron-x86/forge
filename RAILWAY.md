# Deploying TALOS to Railway

## Quick Start

1. **Create a Railway project** at [railway.app](https://railway.app)
2. **Connect your GitHub repo** (`opteron-x86/forge`)
3. **Add a persistent volume:**
   - Go to your service → Settings → Volumes
   - Mount path: `/data`
   - This is where your SQLite database lives — without it, data is lost on every deploy
4. **Set environment variables** (Settings → Variables):

   | Variable | Value | Required |
   |----------|-------|----------|
   | `DATABASE_PATH` | `/data/talos.db` | **Yes** |
   | `JWT_SECRET` | Random 32+ char string | **Yes** |
   | `NODE_ENV` | `production` | **Yes** |
   | `ADMIN_EMAIL` | Your email (first to register gets admin) | Recommended |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI coach |
   | `PORT` | Set automatically by Railway | No |

5. **Deploy** — Railway auto-detects the `railway.toml` config, runs `npm install && npm run build`, then `npm start`

## Generating a JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Verifying the Deploy

- Health check: `https://your-app.up.railway.app/api/health`
- Should return `{"status":"ok","db":"connected"}`
- Open the app URL, register with your `ADMIN_EMAIL`, and you'll have admin access

## Volume Backup

Railway volumes persist across deploys but aren't backed up automatically. To back up your SQLite database:

```bash
# From your local machine with Railway CLI
railway run cat /data/talos.db > talos-backup-$(date +%Y%m%d).db
```

## Costs

- **Hobby plan:** $5/month base includes enough for a small beta
- **Volume storage:** $0.25/GB/month (SQLite DB will be tiny, well under 1GB)
- Estimated total: ~$5-7/month for beta testing

## Troubleshooting

- **"Session expired" after deploy:** If you didn't set `JWT_SECRET`, the server generates a random one on startup. Every deploy/restart invalidates all tokens. Set a persistent `JWT_SECRET`.
- **Data missing after deploy:** Volume not mounted. Check Settings → Volumes shows `/data` mount.
- **Build fails on better-sqlite3:** Railway's nixpacks builder includes build tools (python3, make, gcc) needed for native modules. If it fails, check Railway build logs for missing system dependencies.
