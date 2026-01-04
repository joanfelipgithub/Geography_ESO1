# 🚀 Cloudflare Pages Deployment Guide

## ☁️ Why Cloudflare Pages?

- ✅ **Unlimited bandwidth** (perfect for many students)
- ✅ **500 builds/month** (free tier)
- ✅ **Fastest global network** (300+ data centers)
- ✅ **Free forever** for personal projects
- ✅ **Automatic HTTPS**
- ✅ **Server-side expiration** (students can't hack)

---

## 📋 What You Need

1. ✅ GitHub account (you have this)
2. ✅ Cloudflare account (you have this)
3. ⏱️ 10 minutes

---

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Repository Structure

Your repository should look like this:

```
Geography_ESO1/
├── functions/
│   └── _middleware.js       ← Server-side logic with expiration
├── public/
│   ├── study.html
│   ├── study-style.css
│   └── study-client.js
├── questions/
│   ├── manifest.json        ← Auto-generated file list
│   ├── 02.txt
│   ├── 04 05.txt
│   └── ...
├── generate-manifest.js     ← Script to create manifest
└── package.json
```

### Step 2: Add Cloudflare Files to Your Repository

```bash
cd C:\Users\dodec\Desktop\test

# Create the functions directory
mkdir functions

# Copy the files (download them first from the outputs)
# Then add them:
git add functions/_middleware.js
git add generate-manifest.js
git add package.json

git commit -m "Add Cloudflare Pages support"
git push
```

### Step 3: Generate the Quiz Manifest

Before deploying, you need to create a manifest of all quiz files:

```bash
# Generate manifest.json
node generate-manifest.js

# Commit it
git add questions/manifest.json
git commit -m "Add quiz manifest"
git push
```

### Step 4: Set Your Expiration Date

Edit `functions/_middleware.js` and change line 7:

```javascript
const EXPIRATION_DATE = new Date('2026-06-30T23:59:59Z'); // Change this date
```

To your desired date:

```javascript
const EXPIRATION_DATE = new Date('2026-12-31T23:59:59Z'); // Example: Dec 31, 2026
```

Then commit and push:

```bash
git add functions/_middleware.js
git commit -m "Set expiration date"
git push
```

### Step 5: Deploy to Cloudflare Pages

1. **Log in to Cloudflare**: https://dash.cloudflare.com/

2. **Go to Pages**:
   - Click on "Workers & Pages" in the left sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Connect to Git"

3. **Connect GitHub**:
   - Click "Connect GitHub"
   - Authorize Cloudflare
   - Select your repository: `Geography_ESO1`

4. **Configure Build Settings**:
   - **Project name**: `geography-eso1-quiz` (or whatever you want)
   - **Production branch**: `main`
   - **Build command**: Leave empty (or `node generate-manifest.js`)
   - **Build output directory**: `/`
   - **Root directory**: Leave as `/`

5. **Advanced Settings** (Click "Environment variables"):
   - You don't need to add anything here for now

6. **Save and Deploy**:
   - Click "Save and Deploy"
   - Wait 1-2 minutes ⏱️

### Step 6: Get Your URL

After deployment, you'll see:

```
✅ Success! Your site is live at:
https://geography-eso1-quiz.pages.dev
```

Or with custom domain:
```
https://quiz.yourschool.com
```

---

## 📤 Share with Students

Give students the URL:
```
https://geography-eso1-quiz.pages.dev
```

They can access it from:
- ✅ Chromebooks
- ✅ Windows PCs
- ✅ Macs
- ✅ iPads
- ✅ Phones

**No installation needed!** 🎉

---

## 🔒 Security Features

### Why Students Can't Hack This:

1. **Server-side expiration**: 
   - Checked in `functions/_middleware.js` on Cloudflare's edge servers
   - Students only see HTML/CSS/JS - not the server code

2. **Every request is validated**:
   - All API calls (`/api/quizzes`, `/api/quiz/:filename`) check expiration
   - Even if they bypass client code, server rejects them

3. **No local code access**:
   - Code runs on Cloudflare's network, not their computer
   - They can't modify the expiration date

4. **Protected repository**:
   - Your GitHub repo can be private
   - Only you can modify the code

---

## 🔄 Updating the App

### To Change Expiration Date:

```bash
# 1. Edit functions/_middleware.js
# 2. Change the EXPIRATION_DATE
# 3. Commit and push
git add functions/_middleware.js
git commit -m "Update expiration date"
git push

# Cloudflare auto-deploys in ~30 seconds!
```

### To Add New Quizzes:

```bash
# 1. Add .txt files to questions/ folder
# 2. Regenerate manifest
node generate-manifest.js

# 3. Commit and push
git add questions/
git commit -m "Add new quizzes"
git push

# Auto-deploys!
```

---

## 🎨 Optional: Custom Domain

Want `quiz.yourschool.com` instead of `.pages.dev`?

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain: `quiz.yourschool.com`
5. Follow DNS instructions (if domain is on Cloudflare, it's automatic!)

---

## 📊 Monitoring

### View Analytics:

1. Go to your Pages project dashboard
2. Click "Analytics" tab
3. See:
   - Total requests
   - Bandwidth used
   - Visitor countries
   - Popular pages

### View Deployment Logs:

1. Go to "Deployments" tab
2. Click on any deployment
3. View build and function logs

---

## 🆘 Troubleshooting

### Problem: "manifest.json not found"

**Solution:**
```bash
node generate-manifest.js
git add questions/manifest.json
git commit -m "Add manifest"
git push
```

### Problem: "Questions not loading"

**Check:**
1. Does `questions/manifest.json` exist?
2. Are all .txt files in `questions/` folder?
3. Check deployment logs for errors

### Problem: "Function error"

**Check the logs:**
1. Cloudflare dashboard → Your project
2. Functions tab → View logs
3. Look for JavaScript errors

### Problem: Need to update quickly

Use **Cloudflare Environment Variables:**

1. Go to Settings → Environment Variables
2. Add: `EXPIRATION_DATE` = `2026-12-31T23:59:59Z`
3. Update code to use it:

```javascript
const EXPIRATION_DATE = new Date(
    typeof EXPIRATION_DATE !== 'undefined' 
        ? EXPIRATION_DATE 
        : '2026-06-30T23:59:59Z'
);
```

4. Click "Redeploy"

---

## 🔍 Testing Before Sharing

### Test Locally:

```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Login
wrangler login

# Test locally
wrangler pages dev public --compatibility-date=2024-01-01
```

Then visit: `http://localhost:8788`

### Test Expiration:

Temporarily set expiration to past date:
```javascript
const EXPIRATION_DATE = new Date('2020-01-01T00:00:00Z'); // Past date
```

Visit your site - should show "Expired" page.

---

## 💡 Pro Tips

### Automatic Manifest Generation

Add to `package.json`:

```json
{
  "scripts": {
    "prebuild": "node generate-manifest.js",
    "build": "echo 'Ready to deploy'"
  }
}
```

Then set Cloudflare build command to: `npm run build`

### Preview Deployments

Every git push to a branch creates a preview:
```
https://abc123.geography-eso1-quiz.pages.dev
```

Test changes before merging to main!

### Rollback Bad Deployments

1. Go to "Deployments" tab
2. Find a good previous deployment
3. Click "..." → "Rollback to this deployment"

---

## 📊 Comparison: Cloudflare vs Vercel

| Feature | Cloudflare Pages | Vercel |
|---------|-----------------|--------|
| Free Bandwidth | ✅ Unlimited | 100 GB/month |
| Global Edge | ✅ 300+ locations | ~100 locations |
| Build Time | ~1-2 min | ~1-2 min |
| Ease of Setup | Good | ✅ Slightly easier |
| Functions | ✅ Edge (faster) | Serverless |
| Our Use Case | ✅ **Perfect** | ✅ Perfect |

**Both are excellent!** Cloudflare wins on unlimited bandwidth.

---

## ✅ Summary

### What You Did:
1. ✅ Created Cloudflare Pages Function with expiration
2. ✅ Set up automatic deployment from GitHub
3. ✅ Got a secure, fast, global URL
4. ✅ Unlimited bandwidth for students

### What Students Get:
- 🌐 A URL that works everywhere
- 🚀 Fast loading (global CDN)
- 🔒 Secure (can't hack expiration)
- 📱 Works on all devices

### What You Control:
- ⏳ Expiration date (server-side)
- 📝 Which quizzes are available
- 🔄 Easy updates (just git push)

---

## 📧 Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Cloudflare Community: https://community.cloudflare.com/
- Your GitHub repo issues

---

**Enjoy your unlimited, secure, fast quiz platform! 🎉📚**
