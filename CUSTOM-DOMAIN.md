# Setting Up talos.fit on Railway

## 1. Add Custom Domain in Railway

1. Go to your Railway project → your web service → **Settings** → **Networking** → **Custom Domain**
2. Click **Add Domain**
3. Enter: `talos.fit`
4. Railway will show you a **CNAME target** (something like `your-service.up.railway.app`)
5. Copy this value

You can also add `www.talos.fit` as a second custom domain if you want.

## 2. Configure DNS at Namecheap

1. Log in to [Namecheap](https://www.namecheap.com) → **Domain List** → click **Manage** next to `talos.fit`
2. Go to **Advanced DNS** tab
3. Delete any existing records (parking page records, etc.)
4. Add these records:

| Type  | Host | Value                          | TTL       |
|-------|------|--------------------------------|-----------|
| CNAME | @    | `your-service.up.railway.app`  | Automatic |
| CNAME | www  | `your-service.up.railway.app`  | Automatic |

> **Note:** Some registrars don't support CNAME on the root (`@`). Namecheap supports it via their "CNAME flattening". If it doesn't work, use an **ALIAS** record instead, or use Cloudflare as your DNS provider (free tier) which handles this natively.

## 3. Wait for Propagation

- DNS changes take 5-30 minutes (sometimes up to 48 hours, but usually fast)
- Railway will automatically provision an SSL certificate once DNS resolves

## 4. Verify

- Visit `https://talos.fit` — should load your app with a valid SSL cert
- Check Railway dashboard — custom domain should show a green checkmark

## 5. Set APP_URL Environment Variable

In Railway → your service → **Variables**, add or update:

```
APP_URL=https://talos.fit
```

This is used for password reset emails so the links point to the right domain.

## 6. Resend Domain Verification (for password reset emails)

To send emails from `noreply@talos.fit`, you need to verify the domain with Resend:

1. Sign up at [resend.com](https://resend.com) (free tier = 100 emails/day)
2. Go to **Domains** → **Add Domain** → enter `talos.fit`
3. Resend will give you DNS records to add (MX, TXT for SPF/DKIM)
4. Add these records in Namecheap's Advanced DNS:

| Type | Host                           | Value                              |
|------|--------------------------------|------------------------------------|
| MX   | `send` (or as specified)       | (Resend provides this)             |
| TXT  | @                              | (SPF record Resend provides)       |
| TXT  | `resend._domainkey`            | (DKIM record Resend provides)      |

5. Click **Verify** in Resend once records are added
6. Get your API key from Resend → **API Keys**
7. Add to Railway environment variables:

```
RESEND_API_KEY=re_xxxxxxxxxx
FROM_EMAIL=TALOS <noreply@talos.fit>
```

> **Quick start without custom domain:** You can use Resend's default `onboarding@resend.dev` sender while verifying your domain. Just set `FROM_EMAIL=TALOS <onboarding@resend.dev>` temporarily.

## Environment Variables Checklist

After domain setup, your Railway variables should include:

| Variable          | Value                          |
|-------------------|--------------------------------|
| `DATABASE_PATH`   | `/data/talos.db`               |
| `JWT_SECRET`      | (your random 32+ char string)  |
| `NODE_ENV`        | `production`                   |
| `ADMIN_EMAIL`     | (your email)                   |
| `APP_URL`         | `https://talos.fit`            |
| `RESEND_API_KEY`  | `re_xxxxxxxxxx`                |
| `FROM_EMAIL`      | `TALOS <noreply@talos.fit>`    |
| `ANTHROPIC_API_KEY` | `sk-ant-...`                 |
