# Deploying INTERIOSYNC to Railway

Railway gives you a permanent public URL with free PostgreSQL included.
The whole setup takes about 10 minutes.

---

## Prerequisites

- A free account at [railway.app](https://railway.app)
- Git installed on your Mac
- Your project pushed to a GitHub repository

---

## Step 1 — Push to GitHub

If you haven't already:

```bash
cd /Users/siri/Desktop/ucf-vera/interior-designer-platform

git init
git add .
git commit -m "initial commit"
```

Then create a new repo on [github.com/new](https://github.com/new) (name it `interiosync` or similar) and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/interiosync.git
git push -u origin main
```

---

## Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select the `interiosync` repository
4. Railway will detect `railway.json` and use `Dockerfile.railway` automatically

---

## Step 3 — Add PostgreSQL

1. Inside your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically creates a `DATABASE_URL` environment variable and links it to your service

---

## Step 4 — Set environment variables

In your Railway service → **Variables** tab, add:

| Variable | Value | Notes |
|---|---|---|
| `SECRET_KEY` | any long random string | e.g. `openssl rand -hex 32` |
| `ALLOW_ALL_ORIGINS` | `1` | allows your Railway URL through CORS |
| `SEED_DB` | `1` | seeds sample data on **first deploy only** — remove after first deploy |

`DATABASE_URL` is set automatically by the PostgreSQL plugin — do not touch it.

---

## Step 5 — Deploy

Railway deploys automatically whenever you push to GitHub.

To trigger the first deploy manually: in Railway → your service → **Deploy** button.

Watch the build logs — it takes ~3 minutes (installs Node, builds React, installs Python packages).

---

## Step 6 — Get your public URL

Railway → your service → **Settings** → **Domains** → **Generate Domain**

You'll get a URL like:  
`https://interiosync-production.up.railway.app`

Share this with your client. That's it.

---

## After first deploy — remove SEED_DB

Once the sample data is seeded, remove (or set to `0`) the `SEED_DB` variable so it doesn't re-seed on every restart.

---

## Updating the app

Every time you push to GitHub, Railway redeploys automatically:

```bash
git add .
git commit -m "your changes"
git push
```

---

## Environment variable reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Set automatically by Railway PostgreSQL |
| `SECRET_KEY` | Yes | weak default | JWT signing key — use a strong random value |
| `ALLOW_ALL_ORIGINS` | Yes | `0` | Set to `1` on Railway so CORS passes |
| `SEED_DB` | No | `0` | Set to `1` on first deploy to load sample data |
| `DEFAULT_GST_RATE` | No | `18` | Default GST percentage for new quotes |
| `MAIL_USERNAME` | No | — | Gmail address for sending client credentials |
| `MAIL_PASSWORD` | No | — | Gmail App Password (not your login password) |
| `MAIL_FROM` | No | — | Sender address shown in emails |

---

## Setting up email (optional)

To automatically email login credentials when you convert a lead:

1. Enable **2-Step Verification** on your Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → create an app password
3. Add to Railway Variables:
   - `MAIL_USERNAME` = your Gmail address
   - `MAIL_PASSWORD` = the 16-char app password
   - `MAIL_FROM` = your Gmail address
   - `MAIL_SERVER` = `smtp.gmail.com` (default)
   - `MAIL_PORT` = `587` (default)

If not configured, the temporary password will appear in the Convert modal for manual sharing via WhatsApp.
