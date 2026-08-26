# Farmer Procurement Platform

An academic demo platform designed to streamline procurement operations at government crop purchasing centers. Enables farmers to register, verify land limits, book delivery slots, and view queue positions in real-time, helping reduce congestion and waiting times.

## Features

- **Farmer Registration & Authentication** - Mobile OTP verification, secure password login
- **Slot Booking** - District/centre selection, date/time slot booking with capacity management
- **Real-time Queue Management** - Token generation, queue position tracking, status updates
- **Procurement Tracking** - Centre operator can record actual weighed quantities
- **Payment Processing** - Automated payment calculation based on accepted quantity
- **Multi-role Admin Panels** - State, District, and Centre level administration
- **SMS Notifications** - Real SMS alerts via Fast2SMS API (OTP, booking, payment)
- **WhatsApp Alerts** - Additional notification channel via Baileys

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (custom CSS design system), Vanilla JavaScript (ES6)
- **Backend**: Node.js with Express
- **Database**: MongoDB (Mongoose ODM)
- **Security**: Helmet.js, Rate Limiting, JWT Authentication, bcrypt password hashing
- **Notifications**: Fast2SMS API, WhatsApp Baileys

## File Structure

```
farmer-procurement/
├── server.js                    # Main Node.js server
├── package.json                 # Dependencies and scripts
├── .env                         # Environment configuration (DO NOT commit)
├── seed-states-districts.js     # Indian states/districts seeder
├── services/
│   ├── smsService.js           # Fast2SMS integration
│   └── whatsapp.js             # WhatsApp Baileys integration
├── public/
│   ├── index.html              # Home page
│   ├── status.html             # Token/booking status lookup
│   ├── support.html            # Support information
│   ├── common/
│   │   ├── style.css           # Shared CSS styles
│   │   ├── common.js           # Shared JavaScript utilities
│   │   └── navbar.js           # Dynamic navigation
│   ├── farmer/
│   │   ├── login.html          # Farmer login
│   │   ├── register.html       # Farmer registration
│   │   ├── dashboard.html      # Farmer dashboard
│   │   ├── profile.html        # Profile management
│   │   ├── booking.html        # Slot booking
│   │   ├── farmer.js           # Farmer JavaScript
│   │   └── farmer.css          # Farmer-specific styles
│   └── admin/
│       ├── login.html          # Admin login
│       ├── state-dashboard.html # State admin dashboard
│       ├── district-dashboard.html # District admin dashboard
│       ├── centre-dashboard.html   # Centre operator dashboard
│       ├── admin.js            # Admin JavaScript
│       └── admin.css           # Admin-specific styles
├── tests/
│   └── test-plan.md            # Manual testing checklist
└── uploads/                    # Uploaded profile images
```

## Installation

### Prerequisites

- Node.js 18.0 or higher
- MongoDB (local or Atlas cloud)
- npm or yarn

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd farmer-procurement
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/farmer_procurement

   # Server Port
   PORT=5050

   # JWT Secret (change this in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Fast2SMS API Key (get from https://www.fast2sms.com)
   FAST2SMS_API_KEY=your-fast2sms-api-key

   # OTP expiry in minutes
   OTP_EXPIRY_MINUTES=5
   ```

4. **Seed Indian States and Districts**

   ```bash
   npm run seed:locations
   ```

5. **Start the server**

   ```bash
   npm start
   ```

6. **Access the application**

   Open your browser and navigate to: `http://localhost:5050`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `PORT` | Server port (default: 5050) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) | No |
| `OTP_EXPIRY_MINUTES` | OTP validity period | No |
| `FAST2SMS_API_KEY` | Fast2SMS API key for SMS | No |
| `MSP_WHEAT` | Wheat MSP per quintal | No |
| `MSP_RICE` | Rice MSP per quintal | No |

## API Endpoints

### Authentication

- `POST /api/send-otp` - Send OTP to mobile number
- `POST /api/register` - Register new farmer
- `POST /api/login` - Farmer login
- `POST /api/admin/login` - Admin login (all roles)

### Locations

- `GET /api/states` - Get all states
- `GET /api/districts/:stateName` - Get districts by state
- `GET /api/centres/:districtName` - Get centres by district

### Farmer

- `GET /api/profile` - Get farmer profile
- `PATCH /api/profile` - Update profile
- `POST /api/profile/upload` - Upload profile image
- `GET /api/lands` - Get farmer's land records
- `POST /api/lands` - Add new land record
- `GET /api/bookings/my` - Get farmer's bookings
- `POST /api/bookings` - Create new booking

### Centre Queue

- `GET /api/centre/queue` - Get today's queue (centre operator)
- `PATCH /api/centre/bookings/:id` - Update booking status
- `POST /api/procurements` - Record procurement (weighing)

### Admin Reports

- `GET /api/admin/reports/state` - State admin report
- `GET /api/admin/reports/district` - District admin report
- `GET /api/admin/payments/pending` - Get pending payments
- `POST /api/admin/payments/:id/release` - Release payment
- `POST /api/admin/centres` - Create new centre
- `PATCH /api/admin/centres/:id` - Update centre

### Public

- `GET /api/status/:token` - Check booking status by token

## Deployment

### 1. MongoDB Atlas (Cloud)

1. Create a free MongoDB Atlas account
2. Create a cluster and database
3. Whitelist your IP address
4. Create a database user
5. Get the connection string
6. Add to `.env`:

   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/farmer_procurement
   ```

### 2. Railway (Recommended for quick deployment)

1. Push your code to GitHub
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy

### 3. Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### 4. DigitalOcean App Platform

1. Create a new app from GitHub
2. Configure build and start commands
3. Add environment variables
4. Deploy

### 5. Heroku

```bash
# Create Heroku app
heroku create farmer-procurement

# Add MongoDB addon
heroku addons:create mongodbatlas

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set FAST2SMS_API_KEY=your-api-key

# Deploy
git push heroku main
```

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Configure `NODE_ENV=production`
- [ ] Add your Fast2SMS API key
- [ ] Set up HTTPS/SSL (handled by hosting platform)
- [ ] Seed all Indian states/districts with `npm run seed:locations`
- [ ] Test all features in staging environment
- [ ] Set up monitoring/logging

## Testing

### Manual Testing

Follow the test plan in `tests/test-plan.md`:

```bash
# Start the server
npm start

# Open browser and test:
# 1. http://localhost:5050 - Home page
# 2. http://localhost:5050/farmer/register.html - Registration
# 3. http://localhost:5050/farmer/login.html - Login
# 4. http://localhost:5050/farmer/booking.html - Booking
# 5. http://localhost:5050/admin/login.html - Admin login
```

### Demo Accounts

**State Admin:**
- ID: `ST-MP-01`
- Password: `state123`

**District Admin:**
- ID: `DT-IND-01`
- Password: `district123`

**Centre Operator:**
- ID: `OP-UJN-02`
- Password: `operator123`

**Farmer:**
Register a new account or use test mobile: `9876543210`

## Fast2SMS Setup

1. Create account at [Fast2SMS](https://www.fast2sms.com)
2. Go to Dashboard > Developer API
3. Copy your API key
4. Add to `.env`:

   ```env
   FAST2SMS_API_KEY=your-api-key-here
   ```

5. The system will automatically use Fast2SMS for OTP and notifications
6. Without API key, the system runs in demo mode (OTP shown on screen)

## Capacity Calculation

The platform uses a capacity-based slot system:

- **Base Unit**: 5 quintals = 1 unit = 5 minutes processing time
- **Formula**: `capacityUnits = Math.ceil(quantity / 5)`

Examples:
| Quantity | Capacity Units | Est. Time |
|----------|----------------|-----------|
| 5 Qtl    | 1              | 5 mins    |
| 10 Qtl   | 2              | 10 mins   |
| 12 Qtl   | 3              | 15 mins   |
| 25 Qtl   | 5              | 25 mins   |

## Security Notes

- Passwords are hashed using bcrypt (cost factor 10)
- JWT tokens expire after 7 days (configurable)
- OTP expires after 5 minutes
- Rate limiting: 10 requests per 15 minutes per IP
- OTP limit: 5 requests per hour per mobile number
- All API routes require authentication except public endpoints

## Troubleshooting

### MongoDB Connection Failed

- Check if MongoDB is running locally
- Verify connection string in `.env`
- For Atlas, ensure IP is whitelisted

### SMS Not Sending

- Check `FAST2SMS_API_KEY` is set in `.env`
- Verify API key is valid
- Check Fast2SMS account has sufficient credits

### JWT Errors

- Clear browser localStorage and relogin
- Ensure `JWT_SECRET` matches between server and any client storage

### Port Already in Use

```bash
# Find process using port 5050
lsof -i :5050  # Linux/Mac
netstat -ano | findstr :5050  # Windows

# Kill the process
kill -9 <PID>
```

## License

This project is for educational purposes as an academic demo.

## Support

- Check `tests/test-plan.md` for feature testing
- Review console logs for debugging
- All API responses include error messages for debugging

## Development

```bash
# Install dev dependencies
npm install

# Run in development mode
npm run dev

# Seed states and districts
npm run seed:locations
```