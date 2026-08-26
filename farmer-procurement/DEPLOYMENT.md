# 🚀 Deployment Guide - Farmer Procurement Platform

## ⚠️ CRITICAL: Deployment se Pehle Ye Zaroor Karein

### 1. GitHub Par Push Karne Se Pehle

```bash
# Check karein ki .gitignore hai
ls -la .gitignore

# Check karein ki .env ignore ho raha hai
git status

# Agar .env dikhayi de raha hai, toh RUKEIN!
# Pehle .gitignore add karein, phir push karein
```

**⚠️ DANGER**: Agar `.env` GitHub par chala gaya, toh:
- Tumhara MongoDB password **public** ho jayega
- Koi bhi tumhare database ko delete kar sakta hai
- Fast2SMS credits ka misuse ho sakta hai

### 2. Environment Variables Change Karein

#### `.env` mein ye changes ZAROOR karein:

```env
# ❌ WEAK - Aise mat rakho
JWT_SECRET=demo_secret_key_123_abc

# ✅ STRONG - Aise rakho (generate karne ke liye neeche command)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c8c9e9f8b7e5a7c7e5e5f5e5e5e5e5e5e
```

**Strong JWT Secret Generate Karne Ka Command:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Render.com Par Deploy Karna (Recommended - FREE)

### Step 1: GitHub Repository Banao

```bash
# Agar git init nahi kiya hai
git init
git add .
git commit -m "Initial commit: Farmer Procurement Platform"

# GitHub par new repository banao (farmer-procurement)
# Phir push karo:
git remote add origin https://github.com/YOUR_USERNAME/farmer-procurement.git
git branch -M main
git push -u origin main
```

### Step 2: Render Account Setup

1. **Render.com** par jao: https://render.com
2. **Sign Up with GitHub** kar lo
3. **Dashboard** kholo

### Step 3: Web Service Create Karo

1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: `farmer-procurement` select karo
3. **Configure Build Settings**:

```yaml
Name: farmer-procurement
Region: Singapore (for India, fastest)
Branch: main
Root Directory: (leave blank)
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Step 4: Environment Variables Add Karo

**Render Dashboard** mein **Environment** section:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/farmer_procurement
JWT_SECRET=<strong-random-secret-32-chars>
NODE_ENV=production
PORT=5050
FAST2SMS_API_KEY=<optional-your-api-key>
MSP_WHEAT=2275
MSP_RICE=2183
```

**💡 Pro Tip**: Render **automatically** `PORT` environment variable set karta hai, toh `process.env.PORT` use karna zaroori hai (already done in code).

### Step 5: Deploy Karo

1. Click **"Create Web Service"**
2. **Wait for build** (3-5 minutes)
3. Build logs dekho — errors check karo
4. Deploy hone ke baad URL milega: `https://farmer-procurement-xxxx.onrender.com`

### Step 6: Database Seed Karo

**Render Shell** mein jao (Dashboard → Shell tab):

```bash
npm run seed:locations
```

Ya **local se** seed karo (agar MongoDB Atlas hai):

```bash
# Local terminal mein
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/farmer_procurement" node seed-states-districts.js
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Build Failed — `MODULE_NOT_FOUND`

**Solution**: `package.json` mein dependencies check karo:
```bash
# Local test karo
npm install
npm start
```

### Issue 2: App Crash — "Cannot connect to MongoDB"

**Check List**:
- [ ] MongoDB Atlas cluster **running** hai?
- [ ] IP Whitelist mein **0.0.0.0/0** (allow all) added hai?
- [ ] Connection string mein password **correct** hai?
- [ ] Database name **farmer_procurement** hai?

**Fix**: MongoDB Atlas → Network Access → Add IP Address → **Allow Access from Anywhere (0.0.0.0/0)**

### Issue 3: OTP/SMS Not Working

Yeh **normal** hai agar `FAST2SMS_API_KEY` nahi hai. App **demo mode** mein chalta hai:
- OTP screen par hi dikhayi dega
- SMS send nahi hoga, but app work karega

**Solution**: Fast2SMS account banao aur API key add karo.

### Issue 4: WhatsApp QR Code Terminal Mein Nahi Dikha

**Normal Behavior**: Production mein WhatsApp **disabled** hai (by design).
- SMS notifications use karo
- WhatsApp optional hai, required nahi

### Issue 5: JWT Token Invalid/Expired

**Reason**: `JWT_SECRET` change ho gaya deployment ke baad.

**Solution**: 
- Sabhi users ko **logout** kar do
- Browser localStorage clear kar do
- Re-login karo

---

## 📱 Fast2SMS Setup (Optional)

### Free Account Setup

1. **Signup**: https://www.fast2sms.com/register
2. **Mobile Verify** karo
3. **Dashboard** → **Developer API**
4. **API Key** copy karo
5. Render environment variables mein add karo:

```env
FAST2SMS_API_KEY=your_actual_api_key_here
```

**Free Plan Limits**:
- 50 SMS/day free
- ₹10 recharge se 100+ SMS

---

## ✅ Post-Deployment Checklist

### Functional Testing

- [ ] Home page load ho raha hai
- [ ] Farmer registration work kar raha hai
- [ ] OTP receive ho raha hai (ya demo mode dikha raha hai)
- [ ] Login successful hai
- [ ] States/Districts dropdown populate ho raha hai
- [ ] Booking create ho rahi hai
- [ ] Admin login work kar raha hai
- [ ] Mobile responsive hai

### Security Checks

- [ ] `.env` file GitHub par **nahi** hai
- [ ] `JWT_SECRET` production secret hai (not `demo_secret_key`)
- [ ] MongoDB IP whitelist set hai
- [ ] HTTPS enabled hai (Render automatically karta hai)
- [ ] Rate limiting active hai (test: 10+ OTP requests — block hona chahiye)

### Database Verification

```bash
# MongoDB Atlas Dashboard
# Collections → farmer_procurement
# Check:
- states: 36 documents
- districts: 750 documents
- centres: 3+ documents (seeded)
```

---

## 🔄 Update/Redeploy Kaise Karein

```bash
# Code changes karo
git add .
git commit -m "Fix: Updated booking logic"
git push origin main

# Render automatically detect karega aur redeploy karega
# Dashboard mein logs check karo
```

---

## 📊 Monitoring & Logs

### Render Dashboard

1. **Logs** tab → Real-time server logs
2. **Metrics** tab → CPU, Memory usage
3. **Events** tab → Deploy history

### Important Logs to Monitor

```bash
# MongoDB connection
✅ MongoDB connected successfully

# Server start
✅ Server running on port 5050

# Seeding (first time)
✅ States seeded successfully
✅ Districts seeded successfully
```

---

## 💰 Cost Estimate

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Free | ₹0 |
| MongoDB Atlas | Free (512MB) | ₹0 |
| Fast2SMS | Free (50 SMS/day) | ₹0 |
| **Total** | | **₹0/month** |

**Free Tier Limits**:
- Render: App sleeps after 15 mins inactivity (wakes up in 30s)
- MongoDB: 512MB storage (enough for 10K+ users)
- Fast2SMS: 50 SMS/day

**Paid Upgrade** (optional):
- Render Starter: $7/month (no sleep)
- MongoDB M2: $9/month (2GB)
- Fast2SMS: ₹10 recharge (100 SMS)

---

## 🚨 Emergency Rollback

Agar kuch galat ho gaya:

```bash
# Render Dashboard → Manual Deploy
# Select previous commit
# Click "Deploy"

# Ya local se:
git revert HEAD
git push origin main
```

---

## 📞 Support & Troubleshooting

### Common Error Messages

**Error**: `ECONNREFUSED`
- **Meaning**: MongoDB connection failed
- **Fix**: Check MongoDB URI aur network access

**Error**: `JWT malformed`
- **Meaning**: Invalid token format
- **Fix**: Logout aur re-login

**Error**: `Rate limit exceeded`
- **Meaning**: Too many requests
- **Fix**: 15 minutes wait karo

### Get Help

1. **Render Logs** dekho (Dashboard → Logs)
2. **MongoDB Atlas Logs** dekho (Metrics → Logs)
3. **Browser Console** check karo (F12 → Console tab)

---

## 🎯 Production Optimization (Optional)

### Performance

```javascript
// server.js mein add karo (if needed)
app.use(compression()); // npm install compression
```

### Caching

```javascript
// States/Districts API ko cache karo
// Redis add kar sakte ho (Render Redis free)
```

### CDN for Static Files

```javascript
// Cloudflare/CloudFront use karo for public/
```

---

## ✨ Success Indicators

Jab ye sab dikh jaye, toh deploy successful hai:

✅ URL access ho raha hai  
✅ Home page load without errors  
✅ Registration/Login working  
✅ Mobile responsive (phone par check karo)  
✅ Admin dashboards accessible  
✅ OTP/SMS working (ya demo mode)  
✅ No errors in Render logs  

---

**🎉 Congratulations! Tumhara platform live hai!**

Share karo: `https://farmer-procurement-xxxx.onrender.com`
