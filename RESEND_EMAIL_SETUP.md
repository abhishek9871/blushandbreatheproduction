# 📧 Email Setup Instructions - Resend API

**Last Updated:** November 23, 2024

---

## 🚨 Why We Switched from MailChannels

**MailChannels discontinued their free email API for Cloudflare Workers on August 31, 2024.** The service is no longer available, which is why emails weren't being delivered.

We've migrated to **Resend**, which offers:
- ✅ **Free tier**: 100 emails/day, 3,000 emails/month
- ✅ **Simple API**: Easy to use and reliable
- ✅ **Better deliverability**: Modern infrastructure
- ✅ **No domain verification required** for basic use

---

## 📋 Setup Instructions

### Step 1: Create a Resend Account

1. Go to **https://resend.com**
2. Click **"Sign Up"** (top right)
3. Sign up with your email or GitHub account
4. Verify your email address

### Step 2: Get Your API Key

1. Once logged in, you'll be on the dashboard
2. Click on **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "HealthBeauty Hub Production")
5. **Copy the API key** - you won't be able to see it again!
   - It will look like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add API Key to Cloudflare Worker

You need to add the API key as a **secret** to your Cloudflare Worker.

**Option A: Using Wrangler CLI (Recommended)**

```bash
# Navigate to your project directory
cd C:\Users\VASU\Desktop\blushandbreatheproduction

# Set the secret (replace YOUR_API_KEY with your actual Resend API key)
echo "YOUR_API_KEY" | npx wrangler secret put RESEND_API_KEY --config wrangler.backend.toml
```

**Option B: Using Cloudflare Dashboard**

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **jyotilalchandani-backend**
3. Click on **"Settings"** tab
4. Scroll to **"Variables and Secrets"**
5. Click **"Add"** under "Environment Variables"
6. Type: **Variable type**: Secret
7. **Variable name**: `RESEND_API_KEY`
8. **Value**: Paste your Resend API key
9. Click **"Save"**

### Step 4: Verify the Secret is Set

```bash
# List all secrets to verify
npx wrangler secret list --config wrangler.backend.toml
```

You should see `RESEND_API_KEY` in the list.

### Step 5: Deploy the Updated Worker

```bash
# Deploy the backend worker with the new email integration
npx wrangler deploy --config wrangler.backend.toml --env ""
```

---

## 🧪 Testing the Email Functionality

### Test Newsletter Subscription

1. Go to your production website: https://jyotilalchandani.pages.dev/
2. Scroll to the footer
3. Enter an email address in the newsletter field
4. Click **"Subscribe"**
5. You should see "Thanks for subscribing!" message
6. Check your email (`sparshrajput088@gmail.com`) - you should receive a notification

### Test Contact Form

1. Go to: https://jyotilalchandani.pages.dev/#/info/contact
2. Fill out the contact form:
   - Name: Test User
   - Email: test@example.com
   - Subject: Testing contact form
   - Message: This is a test message
3. Click **"Send Message"**
4. You should see "Thanks for reaching out!" message
5. Check your email (`sparshrajput088@gmail.com`) - you should receive the contact form submission

---

## 📊 Monitoring Email Usage

### Check Your Resend Dashboard

1. Log into https://resend.com
2. Go to **"Emails"** in the sidebar
3. You'll see all sent emails with their status
4. Click on any email to see details, delivery status, and logs

### Free Tier Limits

- **Daily limit**: 100 emails
- **Monthly limit**: 3,000 emails
- **Rate limit**: 10 requests/second

If you exceed these limits, you can upgrade to a paid plan (starts at $20/month for 50,000 emails).

---

## 🔍 Troubleshooting

### Issue: "Email not sent" - Check Worker Logs

```bash
# View real-time logs
npx wrangler tail --config wrangler.backend.toml
```

Look for:
- ✅ `Newsletter email sent successfully` or `Contact form email sent successfully`
- ❌ `RESEND_API_KEY not configured - email not sent`
- ❌ `Resend API error: ...`

### Issue: API Key Not Working

1. **Verify the key is correct**: Make sure you copied the full API key including the `re_` prefix
2. **Check it's set as a secret**: Use `npx wrangler secret list --config wrangler.backend.toml`
3. **Regenerate the key**: Go to Resend dashboard → API Keys → Create a new key
4. **Update the secret**: Run the `wrangler secret put` command again

### Issue: Emails Going to Spam

Resend's free tier uses `onboarding@resend.dev` as the sender, which may go to spam. To fix:

1. **Add your own domain** in Resend dashboard:
   - Go to **"Domains"** → **"Add Domain"**
   - Enter your domain (e.g., `jyotilalchandani.pages.dev`)
   - Follow DNS verification steps
2. **Update the worker code** to use your domain:
   - Change `from: 'HealthBeauty Hub <onboarding@resend.dev>'`
   - To `from: 'HealthBeauty Hub <noreply@yourdomain.com>'`

---

## 🚀 Production Deployment Checklist

- [ ] Resend account created
- [ ] API key generated
- [ ] API key added to Cloudflare Worker as `RESEND_API_KEY` secret
- [ ] Backend worker deployed
- [ ] Newsletter subscription tested
- [ ] Contact form tested
- [ ] Emails received at `sparshrajput088@gmail.com`

---

## 📞 Need Help?

- **Resend Documentation**: https://resend.com/docs
- **Resend API Reference**: https://resend.com/docs/api-reference/emails/send-email
- **Resend Support**: support@resend.com

---

## 💡 Alternative Email Services

If you prefer a different service, here are alternatives:

1. **SendGrid** - Free tier: 100 emails/day
   - Docs: https://sendgrid.com/docs/

2. **Amazon SES** - Pay as you go, very cheap
   - Docs: https://aws.amazon.com/ses/

3. **Postmark** - Paid, but excellent deliverability
   - Docs: https://postmarkapp.com/

---

**Remember**: The code is already updated and ready to use. You just need to add the `RESEND_API_KEY` secret to your Cloudflare Worker!
