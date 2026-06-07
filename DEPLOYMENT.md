# 🚀 Vercel Deployment Guide for Project Goalie

> Complete guide to deploy Project Goalie to production on Vercel

## Quick Summary

**~20 minutes** to go from local to live production app.

- **Cost**: Free (Gemini AI has free tier)
- **Platform**: Vercel (auto-scales, CDN included)
- **Database**: Supabase PostgreSQL (included in .env.local)
- **AI**: Google Gemini (recommended) or OpenAI (backup)

---

## 📋 Pre-Deployment Checklist

### 1️⃣ Choose & Set Up AI Provider

#### **Option A: Google Gemini (RECOMMENDED ⭐)**

- **Cost**: FREE tier (15 req/min, 1.5M tokens/day) + $0.075/$0.30 per 1M tokens if exceeded
- **Speed**: Very fast
- **Quality**: Excellent (latest model)

**Setup:**

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key
4. Paste into `.env.local`:
   ```
   GOOGLE_API_KEY="paste-key-here"
   ```

#### **Option B: OpenAI (Backup)**

- **Cost**: Pay-as-you-go ($0.15/$0.60 per 1M tokens)
- **Speed**: Fast
- **Quality**: Excellent

**Setup:**

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy the key
4. Paste into `.env.local`:
   ```
   OPENAI_API_KEY="sk-paste-key-here"
   ```

### 2️⃣ Generate New Secret for Production

```bash
# PowerShell
$bytes = New-Object Byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)

# Or use this online: https://generate-secret.vercel.app/32
```

Update `.env.local`:

```
NEXTAUTH_SECRET="your-new-secret-here"
```

### 3️⃣ Test Build Locally

```bash
npm run build
```

If this passes, you're ready to deploy! If it fails, fix errors before proceeding.

---

## 🌍 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: complete onboarding, AI abstraction, production-ready"
git push origin master
```

### Step 2: Import to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Search for **"goalie"** repo and select it
4. Click **"Import"**

**Configuration (should auto-detect):**

- **Framework Preset**: Next.js ✓
- **Build Command**: `npm run build` ✓
- **Output Directory**: `.next` ✓

### Step 3: Add Environment Variables

In Vercel Dashboard, go to **Settings → Environment Variables** and add:

#### **Database (Copy from .env.local)**

```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

#### **Authentication**

```
NEXTAUTH_SECRET="your-new-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

#### **AI Provider (Choose ONE)**

```
# If using Gemini:
GOOGLE_API_KEY="your-gemini-key"

# If using OpenAI:
OPENAI_API_KEY="sk-your-openai-key"
```

#### **Cron (Optional)**

```
CRON_SECRET="random-secret-string"
```

### Step 4: Deploy

Click **"Deploy"** button in Vercel dashboard.

**Wait for:**

- ✓ Build completes
- ✓ Deployment succeeds
- ✓ Production URL shows

---

## ✅ Post-Deployment Verification

### Test Your App

1. **Visit your domain:**
   - Go to `https://your-app.vercel.app` (replace with your domain)

2. **Test Login:**
   - Email: `demo@projectgoalie.com`
   - Password: `demo1234`

3. **Test Onboarding (new account):**
   - Sign up new account
   - Should see currency/budget wizard
   - Should redirect to dashboard after

4. **Test AI Feature:**
   - Click "Goals" in sidebar
   - Click "Analyze" button
   - Should generate alignment scores (uses Gemini/OpenAI)

5. **Check Notifications:**
   - Should see bell icon in top-right
   - Can mark as read

### Monitor Performance

In Vercel Dashboard:

- **Analytics** tab → see request rates, response times
- **Logs** tab → view any errors in real-time

---

## 🔄 Cron Jobs (Optional - For Daily Renewal Alerts)

Skip this if you don't need daily reminder emails.

### Setup Renewal Checker

The cron endpoint already exists at `/api/cron/daily`.

**For Vercel Cron:**

1. Create `vercel.json` in root:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/daily",
         "schedule": "0 9 * * *"
       }
     ]
   }
   ```

2. Commit and push:

   ```bash
   git add vercel.json
   git commit -m "feat: add cron job for daily renewals"
   git push
   ```

3. Redeploy in Vercel

**For External Service (Easier):**

- Use: https://cron-job.org or https://easycron.com
- Call daily: `https://your-app.vercel.app/api/cron/daily?secret=YOUR_CRON_SECRET`

---

## 💰 Cost Breakdown

| Service         | Cost              | Notes                          |
| --------------- | ----------------- | ------------------------------ |
| **Vercel**      | **Free**          | Hobby tier, auto-scaling       |
| **Supabase**    | **Free**          | Up to 2GB, included in setup   |
| **Gemini API**  | **Free**          | 15 req/min free, +$0.075 input |
| **OpenAI API**  | **Pay-as-you-go** | ~$0.02 per alignment check     |
| **Vercel Cron** | **Included**      | With deployment                |
| **Total**       | **$0/month**      | (Unless API usage spikes)      |

---

## 🐛 Troubleshooting

### Build Failed

```bash
# Run locally to see same error:
npm run build

# Common fixes:
npm install
npm run db:generate
```

### AI Not Working

- Check API key is set in Vercel env vars
- Test key on provider dashboard
- Check error logs: Vercel Dashboard → Logs

### Database Connection Errors

- Verify `DATABASE_URL` and `DIRECT_URL` in Vercel
- Test locally: `npm run db:push`
- Check Supabase dashboard for quota limits

### "NEXTAUTH_URL" Redirect Issues

- Update `NEXTAUTH_URL` to your Vercel domain
- Redeploy after changing
- Clear browser cache

### Landing on 404 on non-root paths

- This is likely a Next.js routing issue
- Check: Vercel → Logs for build errors
- Try: `npm run build` locally

---

## 📱 Next Steps After Deployment

1. ✅ **Get a domain**
   - Use Vercel Domains ($12/yr) or connect custom domain
   - Update `NEXTAUTH_URL` to use your domain
   - Redeploy

2. 📧 **Set up email (optional)**
   - Current setup uses in-app notifications
   - For email alerts, integrate SendGrid/Resend in `/api/cron/daily`

3. 🔐 **Enable 2FA (optional)**
   - Enhance security by adding 2-factor authentication

4. 📊 **Analytics Dashboard**
   - Set up Vercel Analytics
   - Monitor user signups, feature usage

---

## 📞 Support

**Common Questions:**

**Q: Will I be charged?**
A: Not unless you exceed free tier limits. Gemini has free tier for ~400 analyses/month.

**Q: Can I switch AI providers later?**
A: Yes! Just change `GOOGLE_API_KEY` / `OPENAI_API_KEY` in Vercel env vars.

**Q: How do I debug issues?**
A: Check Vercel → Logs tab for real-time errors during requests.

**Q: Can I run locally for testing?**
A: Yes: `npm run dev` (uses local .env.local)

---

## 🎉 You're Deployed!

Congratulations! Your Project Goalie app is now live. Share the link and start managing subscriptions! 🚀
