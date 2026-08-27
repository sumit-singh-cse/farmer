# URGENT: MongoDB Credentials Exposed on GitHub

## Immediate Action Required:

### 1. Rotate MongoDB Password (Priority 1)
1. Login to MongoDB Atlas: https://cloud.mongodb.com
2. Go to Database Access
3. Find user "singhkhushbu8127_db_user"
4. Click "Edit"
5. Generate NEW password (click Generate or enter custom)
6. Save

### 2. Update Render Environment Variables (Priority 2)
1. Go to Render dashboard: https://dashboard.render.com
2. Select "farmer-procurement" service
3. Go to "Environment" tab
4. Add/Update: `MONGODB_URI=mongodb+srv://singhkhushbu8127_db_user:NEW_PASSWORD@cluster0.rurxuuk.mongodb.net/farmer_procurement?retryWrites=true&w=majority`

### 3. Temporary Workaround (Applied)
- Code reverted to use .env file
- Credentials removed from source code
- .env file should be in gitignore

### 4. Production Credentials Security
Never hardcode credentials in source code. Always use:
1. Environment variables (.env file)
2. .gitignore for .env files
3. CI/CD secrets management
4. Regular credential rotation

### 5. Test After Fix
1. Restart Render deployment
2. Test OTP flow (123456)
3. Test states/districts loading

**Time-sensitive: Rotate within 24 hours for security.**
