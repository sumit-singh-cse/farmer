// Load environment variables
const dotenvResult = require('dotenv').config({
  path: require('path').resolve(__dirname, '.env'),
  override: true
});
console.log('--- DEBUG: Dotenv load result:', dotenvResult);

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// SMS service (demo OTP mode only - no real SMS)
const { sendOTP, sendBookingConfirmation, sendPaymentNotification, sendRegistrationConfirmation } = require('./services/smsService');

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmer_procurement';

// ========================================
// SECURITY MIDDLEWARE
// ========================================
// Helmet for security headers.
// NOTE: The frontend pages use inline <script> and inline styles/event handlers.
// Helmet's DEFAULT Content-Security-Policy sets `script-src 'self'`, which blocks
// ALL inline JavaScript in the browser. On Render (served over HTTPS) this silently
// broke the register/login pages: the state dropdown never populated and the
// "Send OTP" button did nothing because their inline scripts were never executed.
// We keep Helmet's other protections but relax the CSP to allow inline scripts/styles.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  // Allow images/uploads to be embedded without cross-origin resource policy issues
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting temporarily disabled for demo - will re-enable later
/*
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  }
});

app.use(limiter);
*/

// ========================================
// APP CONFIGURATION
// ========================================

// Create uploads directory if not present
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// --- DATABASE SCHEMAS ---

// User Model
const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['farmer', 'state', 'district', 'centre'] },
  aadhaarRef: { type: String },
  address: { type: String },
  state: { type: String },
  district: { type: String },
  adminId: { type: String, unique: true, sparse: true },
  profileImage: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// State Model
const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const State = mongoose.model('State', stateSchema);

// District Model
const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true }
});
const District = mongoose.model('District', districtSchema);

// Centre Model
const centreSchema = new mongoose.Schema({
  centreId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  storageCapacity: { type: Number, required: true }, // in Quintals
  operatingHours: { type: String, default: '09:00 AM - 05:00 PM' },
  slotsPerHour: { type: Number, default: 15 }
}, { timestamps: true });
const Centre = mongoose.model('Centre', centreSchema);

// Land Model (Phase 3)
const landSchema = new mongoose.Schema({
  khasraNumber: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  area: { type: Number, required: true }, // In Hectares
  cropType: { type: String, required: true }, // 'wheat' | 'rice'
  allowedQuantity: { type: Number, required: true }, // In Quintals
  bookedQuantity: { type: Number, default: 0 },
  status: { type: String, default: 'verified' }
}, { timestamps: true });

const Land = mongoose.model('Land', landSchema);

// Booking Model (Phase 4)
const bookingSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  land: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true },
  produceType: { type: String, required: true },
  quantity: { type: Number, required: true },
  district: { type: String, required: true },
  centre: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  timeWindow: { type: String, required: true },
  tokenNumber: { type: String, unique: true, required: true },
  queuePosition: { type: Number, required: true },
  capacityUnits: { type: Number, required: true },
  status: { type: String, default: 'Booked', enum: ['Booked', 'Arrived', 'Processing', 'Completed', 'Absent'] }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

// Procurement Model (Phase 5)
const procurementSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  expectedQuantity: { type: Number, required: true }, // In Quintals
  actualWeight: { type: Number, required: true }, // In Quintals
  acceptedQuantity: { type: Number, required: true }, // In Quintals
  rejectedQuantity: { type: Number, default: 0 }, // In Quintals
  rejectionReason: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Centre operator
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Procurement = mongoose.model('Procurement', procurementSchema);

// Payment Model (Phase 6)
const paymentSchema = new mongoose.Schema({
  procurement: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedQuantity: { type: Number, required: true }, // In Quintals
  ratePerQuintal: { type: Number, required: true }, // Configurable MSP
  amount: { type: Number, required: true }, // In currency (e.g., INR)
  status: { type: String, enum: ['Pending', 'Released'], default: 'Pending' },
  releasedAt: { type: Date },
  releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

// In-memory OTP Store for demo verification (Expires in 5 minutes)
const otpStore = new Map();

// --- AUTHENTICATION MIDDLEWARE (JWT + Mock for backwards compatibility) ---
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied: Authentication token required' });
  }

  try {
    // Support real JWT tokens (new implementation)
    if (!token.startsWith('mock_')) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(403).json({ error: 'User not found' });
        req.user = user;
        return next();
      } catch (jwtErr) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    }

    // Fallback: Support mock tokens (for existing clients)
    if (token.startsWith('mock_jwt_session_')) {
      const mobile = token.replace('mock_jwt_session_', '');
      const user = await User.findOne({ mobile });
      if (!user) return res.status(403).json({ error: 'Invalid user session' });
      req.user = user;
      return next();
    } else if (token.startsWith('mock_admin_session_')) {
      const adminId = token.replace('mock_admin_session_', '');
      const user = await User.findOne({ adminId });
      if (!user) return res.status(403).json({ error: 'Invalid admin session' });
      req.user = user;
      return next();
    }

    return res.status(403).json({ error: 'Invalid token format' });
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(403).json({ error: 'Forbidden session access' });
  }
}

// Helper to determine the assigned centre ID for a centre operator
async function getOperatorCentreId(user) {
  if (user.adminId === 'OP-UJN-02') {
    const centre = await Centre.findOne({ centreId: 'C-UJN-01' });
    return centre ? centre._id : null;
  }
  if (user.district) {
    const centre = await Centre.findOne({ district: user.district });
    return centre ? centre._id : null;
  }
  const defaultCentre = await Centre.findOne({ centreId: 'C-UJN-01' });
  return defaultCentre ? defaultCentre._id : null;
}

// Database Connection & Seeding
let dbStatus = 'disconnected';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    dbStatus = 'connected';
    await seedAdmins();
    await seedLocations();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    dbStatus = 'error: ' + err.message;
  });

// Seed default administrative roles if they do not exist
async function seedAdmins() {
  try {
    const admins = [
      { adminId: 'ST-MP-01', password: 'state123', role: 'state', mobile: '1000000001' },
      { adminId: 'DT-IND-01', password: 'district123', role: 'district', mobile: '1000000002' },
      { adminId: 'OP-UJN-02', password: 'operator123', role: 'centre', mobile: '1000000003' }
    ];

    for (const adm of admins) {
      const existing = await User.findOne({ adminId: adm.adminId });
      if (!existing) {
        const hashedPw = await bcrypt.hash(adm.password, 10);
        await User.create({
          adminId: adm.adminId,
          password: hashedPw,
          role: adm.role,
          mobile: adm.mobile
        });
        console.log(`Seeded admin: ${adm.adminId}`);
      }
    }
    console.log('Administrative credentials check completed.');
  } catch (err) {
    console.error('Failed to seed admin records:', err);
  }
}

// Seed States, Districts, and initial Centres
async function seedLocations() {
  try {
    // 1. States
    const stateCount = await State.countDocuments();
    if (stateCount === 0) {
      await State.insertMany([
        { name: 'Madhya Pradesh' },
        { name: 'Uttar Pradesh' }
      ]);
      console.log('States seeded successfully.');
    }

    // 2. Districts
    const districtCount = await District.countDocuments();
    if (districtCount === 0) {
      const mpDoc = await State.findOne({ name: 'Madhya Pradesh' });
      const upDoc = await State.findOne({ name: 'Uttar Pradesh' });
      if (mpDoc && upDoc) {
        await District.insertMany([
          { name: 'Indore', state: mpDoc._id },
          { name: 'Ujjain', state: mpDoc._id },
          { name: 'Dewas', state: mpDoc._id },
          { name: 'Lucknow', state: upDoc._id },
          { name: 'Kanpur', state: upDoc._id },
          { name: 'Agra', state: upDoc._id }
        ]);
        console.log('Districts seeded successfully.');
      }
    }

    // 3. Default Centres
    const centreCount = await Centre.countDocuments();
    if (centreCount === 0) {
      await Centre.insertMany([
        { centreId: 'C-IND-01', name: 'Indore Main Mandi', state: 'Madhya Pradesh', district: 'Indore', storageCapacity: 5000, operatingHours: '09:00 AM - 05:00 PM', slotsPerHour: 15 },
        { centreId: 'C-IND-02', name: 'Depalpur Sub-centre', state: 'Madhya Pradesh', district: 'Indore', storageCapacity: 2500, operatingHours: '09:00 AM - 05:00 PM', slotsPerHour: 10 },
        { centreId: 'C-UJN-01', name: 'Ujjain Krishi Mandi', state: 'Madhya Pradesh', district: 'Ujjain', storageCapacity: 5000, operatingHours: '09:00 AM - 05:00 PM', slotsPerHour: 15 }
      ]);
      console.log('Initial procurement centres seeded.');
    }
  } catch (err) {
    console.error('Failed to seed location and centre records:', err);
  }
}

// --- API ENDPOINTS ---

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Farmer Procurement API is running smoothly!',
    database: dbStatus
  });
});

app.get('/api/debug-db', async (req, res) => {
  try {
    const states = await State.find();
    const districts = await District.find();
    const centres = await Centre.find();
    res.json({ states, districts, centres });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET States
app.get('/api/states', async (req, res) => {
  try {
    const states = await State.find().sort({ name: 1 });
    return res.status(200).json(states);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve states list' });
  }
});

// GET Districts by State
app.get('/api/districts/:stateName', async (req, res) => {
  try {
    let { stateName } = req.params;
    if (stateName.toLowerCase() === 'up') stateName = 'Uttar Pradesh';
    
    // Find state document matching the name case-insensitively
    const stateDoc = await State.findOne({ name: { $regex: new RegExp('^' + stateName + '$', 'i') } });
    if (!stateDoc) {
      return res.status(200).json([]);
    }
    
    // Find districts referencing the state ObjectId
    const districts = await District.find({ state: stateDoc._id }).sort({ name: 1 });
    return res.status(200).json(districts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve districts list' });
  }
});

// GET Centres by District
app.get('/api/centres/:districtName', async (req, res) => {
  try {
    const { districtName } = req.params;
    const centres = await Centre.find({ district: districtName }).sort({ name: 1 });
    return res.status(200).json(centres);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve centres list' });
  }
});

// POST Create Centre (For District Admin)
app.post('/api/admin/centres', async (req, res) => {
  const { name, storageCapacity, operatingHours, slotsPerHour, state, district } = req.body;

  try {
    if (!name || !storageCapacity || !operatingHours || !slotsPerHour || !state || !district) {
      return res.status(400).json({ error: 'All fields are mandatory to create a centre' });
    }

    // Generate a unique centreId to satisfy the existing index requirement
    const centreId = 'C-' + Math.floor(100000 + Math.random() * 900000).toString();

    const centre = new Centre({
      centreId,
      name,
      state,
      district,
      storageCapacity: Number(storageCapacity),
      operatingHours,
      slotsPerHour: Number(slotsPerHour)
    });

    await centre.save();
    console.log(`[Success] Centre created: ${name} (${district})`);
    return res.status(201).json({
      status: 'success',
      message: 'Centre registered successfully',
      centre
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create centre due to a server error' });
  }
});

// GET Farmer Lands (Phase 3)
app.get('/api/lands', authenticateToken, async (req, res) => {
  try {
    const lands = await Land.find({ ownerMobile: req.user.mobile });
    return res.status(200).json(lands);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve land records' });
  }
});

// POST Create Farmer Land Record (Manual Entry)
app.post('/api/lands', authenticateToken, async (req, res) => {
  const { khasraNumber, area, cropType, allowedQuantity } = req.body;

  try {
    if (!khasraNumber || !area || !cropType || !allowedQuantity) {
      return res.status(400).json({ error: 'All fields are mandatory to register land' });
    }

    const land = new Land({
      khasraNumber,
      ownerName: `${req.user.firstName} ${req.user.lastName}`,
      ownerMobile: req.user.mobile,
      area: Number(area),
      cropType: cropType.toLowerCase(),
      allowedQuantity: Number(allowedQuantity),
      bookedQuantity: 0,
      status: 'verified' // Auto-verified for college demo since Bhulekh is manual now
    });

    await land.save();
    console.log(`[Success] Land record manually added: Khasra ${khasraNumber} by mobile ${req.user.mobile}`);
    return res.status(201).json({
      status: 'success',
      message: 'Land record registered successfully',
      land
    });
  } catch (error) {
    console.error('Failed to save land record:', error);
    return res.status(500).json({ error: 'Failed to save land record' });
  }
});

// GET Farmer Profile (Phase 3)
app.get('/api/profile', authenticateToken, (req, res) => {
  return res.status(200).json({
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    mobile: req.user.mobile,
    address: req.user.address,
    state: req.user.state,
    district: req.user.district,
    aadhaarRef: req.user.aadhaarRef,
    profileImage: req.user.profileImage
  });
});

// PATCH Edit Farmer Profile (Phase 3)
app.patch('/api/profile', authenticateToken, async (req, res) => {
  const { firstName, lastName, address } = req.body;

  try {
    if (firstName) req.user.firstName = firstName;
    if (lastName) req.user.lastName = lastName;
    if (address) req.user.address = address;

    await req.user.save();
    console.log(`[Success] Profile updated for: ${req.user.mobile}`);
    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        mobile: req.user.mobile,
        role: req.user.role,
        state: req.user.state,
        district: req.user.district
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update profile details' });
  }
});

// POST Profile Picture Upload (Phase 3)
app.post('/api/profile/upload', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    req.user.profileImage = relativePath;
    await req.user.save();

    console.log(`[Success] Profile picture uploaded for: ${req.user.mobile}`);
    return res.status(200).json({
      status: 'success',
      message: 'Profile image uploaded successfully',
      imageUrl: relativePath
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Profile image upload failed' });
  }
});

// GET Slot Capacity info (Phase 4)
app.get('/api/centres/:centreId/capacity', async (req, res) => {
  const { centreId } = req.params;
  const { date, timeWindow } = req.query;

  try {
    if (!date || !timeWindow) {
      return res.status(400).json({ error: 'date and timeWindow query parameters are required' });
    }

    const centre = await Centre.findById(centreId);
    if (!centre) {
      return res.status(404).json({ error: 'Centre not found' });
    }

    // Sum capacity units consumed by Bookings for that date & slot
    const activeBookings = await Booking.find({
      centre: centreId,
      date,
      timeWindow,
      status: { $ne: 'Absent' }
    });

    const consumedCapacity = activeBookings.reduce((sum, b) => sum + b.capacityUnits, 0);
    const totalCapacity = centre.slotsPerHour;
    const availableCapacity = Math.max(0, totalCapacity - consumedCapacity);

    return res.status(200).json({
      totalCapacity,
      consumedCapacity,
      availableCapacity
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve capacity details' });
  }
});

// POST Create Booking (Phase 4)
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { landId, cropType, quantity, district, centreId, date, timeWindow } = req.body;

  try {
    if (!landId || !cropType || !quantity || !district || !centreId || !date || !timeWindow) {
      return res.status(400).json({ error: 'All fields are mandatory to make a booking' });
    }

    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      return res.status(400).json({ error: 'Invalid quantity provided' });
    }

    // 1. Fetch Land and check owner & quota limit
    const land = await Land.findById(landId);
    if (!land || land.ownerMobile !== req.user.mobile) {
      return res.status(400).json({ error: 'Selected land record not found or unauthorized' });
    }

    if (land.bookedQuantity + qtyVal > land.allowedQuantity) {
      return res.status(400).json({
        error: `Booking quantity exceeds your remaining allowed limit of ${(land.allowedQuantity - land.bookedQuantity).toFixed(1)} Quintals`
      });
    }

    // 2. Fetch Centre and validate hourly slots capacity
    const centre = await Centre.findById(centreId);
    if (!centre) {
      return res.status(404).json({ error: 'Procurement centre not found' });
    }

    const requestedUnits = Math.ceil(qtyVal / 5);

    const activeBookings = await Booking.find({
      centre: centreId,
      date,
      timeWindow,
      status: { $ne: 'Absent' }
    });
    const consumed = activeBookings.reduce((sum, b) => sum + b.capacityUnits, 0);

    if (consumed + requestedUnits > centre.slotsPerHour) {
      return res.status(400).json({
        error: `Centre hourly slot capacity exceeded! Remaining available: ${centre.slotsPerHour - consumed} units (Requested: ${requestedUnits} units). Please select a different time window.`
      });
    }

    // 3. Generate sequential token number
    const totalBookingsCount = await Booking.countDocuments();
    const tokenNumber = 'T-' + (1000 + totalBookingsCount + 1).toString();

    // 4. Calculate queue position for that date & centre
    const dayBookingsCount = await Booking.countDocuments({
      centre: centreId,
      date
    });
    const queuePosition = dayBookingsCount + 1;

    // 5. Create Booking
    const booking = new Booking({
      farmer: req.user._id,
      land: landId,
      produceType: cropType,
      quantity: qtyVal,
      district,
      centre: centreId,
      date,
      timeWindow,
      tokenNumber,
      queuePosition,
      capacityUnits: requestedUnits
    });

    await booking.save();

    // 6. Update Land bookedQuantity
    land.bookedQuantity += qtyVal;
    await land.save();

    console.log(`[Success] Booking created: Token=${tokenNumber}, Farmer=${req.user.firstName} ${req.user.lastName}, Qty=${qtyVal} Qtl`);

    // Send booking confirmation notification - non-blocking (demo mode)
    sendBookingConfirmation(req.user.mobile, {
      farmerName: req.user.firstName,
      tokenNumber,
      centreName: centre.name,
      date,
      timeWindow,
      queuePosition,
      estimatedTime: requestedUnits * 5
    }).catch(err => console.error('Booking notification failed:', err.message));

    return res.status(201).json({
      status: 'success',
      message: 'Slot booked successfully!',
      booking: {
        id: booking._id,
        tokenNumber: booking.tokenNumber,
        queuePosition: booking.queuePosition,
        capacityUnits: booking.capacityUnits
      }
    });
  } catch (error) {
    console.error('Booking failed:', error);
    return res.status(500).json({ error: 'Booking failed due to a server error' });
  }
});

// GET My Bookings (Phase 4 & 6)
app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ farmer: req.user._id })
      .populate('centre')
      .populate('land')
      .sort({ createdAt: -1 });

    const bookingsWithProcAndPay = [];
    for (const booking of bookings) {
      const bookingObj = booking.toObject();
      if (booking.status === 'Completed') {
        const procurement = await Procurement.findOne({ booking: booking._id });
        if (procurement) {
          bookingObj.procurement = procurement.toObject();
          const payment = await Payment.findOne({ procurement: procurement._id });
          if (payment) {
            bookingObj.payment = payment.toObject();
          }
        }
      }
      bookingsWithProcAndPay.push(bookingObj);
    }

    return res.status(200).json(bookingsWithProcAndPay);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve your bookings list' });
  }
});

// GET Booking status by token (public query)
app.get('/api/status/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const booking = await Booking.findOne({ tokenNumber: token })
      .populate('centre')
      .populate('farmer');

    if (!booking) {
      return res.status(404).json({ error: 'Token not found' });
    }

    return res.status(200).json({
      tokenNumber: booking.tokenNumber,
      farmerName: `${booking.farmer.firstName} ${booking.farmer.lastName}`,
      centre: booking.centre.name,
      dateSlot: `${booking.date} (${booking.timeWindow})`,
      cropQty: `${booking.produceType.toUpperCase()} - ${booking.quantity} Quintals`,
      queuePosition: booking.queuePosition,
      waitUnits: `${booking.capacityUnits} Unit${booking.capacityUnits > 1 ? 's' : ''} (${booking.capacityUnits * 5} mins estimated)`,
      status: booking.status
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to query token status' });
  }
});

// Request Mobile OTP - Demo mode with fixed OTP 123456
app.post('/api/send-otp', async (req, res) => {
  const { mobile } = req.body;

  // Validate mobile number
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number' });
  }

  // Fixed demo OTP for testing
  const otpCode = '123456';

  // Store OTP with expiry (30 minutes for demo)
  otpStore.set(mobile, {
    code: otpCode,
    expiresAt: Date.now() + 30 * 60 * 1000,
    attempts: 0
  });

  console.log(`[OTP-Demo] Generated code ${otpCode} for mobile: ${mobile}`);

  // Always return demo OTP
  return res.status(200).json({
    status: 'success',
    message: `Demo OTP: ${otpCode} (30 min expiry)`,
    code: otpCode,
    demo: true
  });
});

// Farmer Registration
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, mobile, otp, aadhaar, address, state, district, password } = req.body;

  try {
    // 1. Mandatory input checks
    if (!firstName || !lastName || !mobile || !otp || !aadhaar || !address || !state || !district || !password) {
      return res.status(400).json({ error: 'All fields are mandatory' });
    }

    // 2. Validate OTP
    const otpRecord = otpStore.get(mobile);
    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired mobile OTP code' });
    }
    otpStore.delete(mobile); // Consume OTP code

    // 3. Check for unique mobile
    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ error: 'This mobile number is already registered' });
    }

    // 4. Encrypt password & Mask Aadhaar (Show only last 4 digits)
    const hashedPw = await bcrypt.hash(password, 10);
    const maskedAadhaar = 'XXXX-XXXX-' + aadhaar.slice(-4);

    // 5. Create farmer account
    const farmer = new User({
      firstName,
      lastName,
      mobile,
      password: hashedPw,
      role: 'farmer',
      aadhaarRef: maskedAadhaar,
      address,
      state,
      district
    });

    await farmer.save();
    console.log(`[Success] Farmer registered: ${firstName} ${lastName} (${mobile})`);

    // Send registration confirmation notification (demo mode)
    await sendRegistrationConfirmation(mobile, `${firstName} ${lastName}`);

    return res.status(201).json({
      status: 'success',
      message: 'Farmer account registered successfully'
    });
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Registration failed due to a server error' });
  }
});

// Farmer Login
app.post('/api/login', async (req, res) => {
  const { mobile, password, otp } = req.body;

  try {
    if (!mobile || !password || !otp) {
      return res.status(400).json({ error: 'Mobile, Password, and OTP are required' });
    }

    // 1. Verify user exists
    const user = await User.findOne({ mobile, role: 'farmer' });
    if (!user) {
      return res.status(400).json({ error: 'Farmer account does not exist' });
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect credentials provided' });
    }

    // 3. Verify OTP code
    const otpRecord = otpStore.get(mobile);
    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired mobile OTP code' });
    }
    otpStore.delete(mobile); // Consume OTP

    // 4. Return Session Token & User Metadata
    console.log(`[Success] Farmer login: ${user.firstName} ${user.lastName}`);
    return res.status(200).json({
      status: 'success',
      token: 'mock_jwt_session_' + user.mobile,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        district: user.district
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login process failed on the server' });
  }
});

// Admin Multi-Role Login
app.post('/api/admin/login', async (req, res) => {
  const { role, adminId, password, otp, captcha } = req.body;

  try {
    if (!role || !adminId || !password || !otp || !captcha) {
      return res.status(400).json({ error: 'All administrative login fields are mandatory' });
    }

    // 1. Find Admin
    const admin = await User.findOne({ adminId, role });
    if (!admin) {
      return res.status(400).json({ error: `No administrative account found for ID: ${adminId}` });
    }

    // 2. Compare password
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect admin credentials' });
    }

    // 3. Validate Demo OTP
    if (otp !== '9999') {
      return res.status(400).json({ error: 'Invalid security key / OTP' });
    }

    console.log(`[Success] Admin login: Role=${role}, ID=${adminId}`);
    return res.status(200).json({
      status: 'success',
      token: 'mock_admin_session_' + admin.adminId,
      user: {
        id: admin._id,
        role: admin.role,
        adminId: admin.adminId,
        state: admin.state || 'Madhya Pradesh', // Fallback for demo admins
        district: admin.district || 'Indore' // Fallback for Indore admin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Admin authentication failed due to a server error' });
  }
});

// ===== PHASE 5: CENTRE QUEUE & PROCUREMENT APIs =====

// GET Centre Queue - For Centre Operator dashboard
// Returns today's bookings for the operator's assigned centre
app.get('/api/centre/queue', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'centre') {
      return res.status(403).json({ error: 'Only centre operators can access queue' });
    }

    const centreId = await getOperatorCentreId(req.user);
    if (!centreId) {
      return res.status(404).json({ error: 'Assigned centre not found for operator' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find all bookings for this centre for today (not Absent)
    const bookings = await Booking.find({
      centre: centreId,
      date: today,
      status: { $ne: 'Absent' }
    })
    .populate('farmer', 'firstName lastName mobile')
    .populate('land', 'khasraNumber')
    .sort({ queuePosition: 1 });

    // Format response for UI
    const queue = bookings.map((b, index) => ({
      id: b._id,
      tokenNumber: b.tokenNumber,
      farmerName: `${b.farmer.firstName} ${b.farmer.lastName}`,
      farmerMobile: b.farmer.mobile,
      cropType: b.produceType,
      quantity: b.quantity,
      timeWindow: b.timeWindow,
      queuePosition: b.queuePosition,
      status: b.status,
      capacityUnits: b.capacityUnits,
      landKhasra: b.land?.khasraNumber || 'N/A'
    }));

    // Get centre info
    const centre = await Centre.findById(centreId);

    return res.status(200).json({
      centre: {
        id: centre._id,
        centreId: centre.centreId,
        name: centre.name,
        storageCapacity: centre.storageCapacity
      },
      date: today,
      queue
    });
  } catch (error) {
    console.error('Centre queue error:', error);
    return res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// PATCH Update Booking Status (Check-In, Start Processing, Mark Absent)
app.patch('/api/centre/bookings/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'centre') {
      return res.status(403).json({ error: 'Only centre operators can update bookings' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Booked', 'Arrived', 'Processing', 'Completed', 'Absent'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const booking = await Booking.findById(id).populate('centre');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify this booking belongs to the operator's centre
    const operatorCentreId = await getOperatorCentreId(req.user);
    if (!operatorCentreId || !booking.centre._id.equals(operatorCentreId)) {
      return res.status(403).json({ error: 'Booking does not belong to your assigned centre' });
    }

    // Status transition validation
    const validTransitions = {
      'Booked': ['Arrived', 'Absent'],
      'Arrived': ['Processing', 'Absent'],
      'Processing': ['Completed'],
      'Completed': [],
      'Absent': []
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    booking.status = status;
    await booking.save();

    console.log(`[Success] Booking ${booking.tokenNumber} status updated to ${status} by ${req.user.adminId}`);
    return res.status(200).json({
      status: 'success',
      message: `Booking status updated to ${status}`,
      booking: {
        id: booking._id,
        tokenNumber: booking.tokenNumber,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// POST Record Procurement (Weighing)
app.post('/api/procurements', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'centre') {
      return res.status(403).json({ error: 'Only centre operators can record procurement' });
    }

    const { bookingId, expectedQuantity, actualWeight, acceptedQuantity, rejectedQuantity, rejectionReason } = req.body;

    if (!bookingId || expectedQuantity === undefined || actualWeight === undefined || acceptedQuantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify booking exists and belongs to this operator's centre
    const booking = await Booking.findById(bookingId).populate('centre');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const operatorCentreId = await getOperatorCentreId(req.user);
    if (!operatorCentreId || !booking.centre._id.equals(operatorCentreId)) {
      return res.status(403).json({ error: 'Booking does not belong to your assigned centre' });
    }

    if (booking.status !== 'Processing' && booking.status !== 'Arrived') {
      return res.status(400).json({ error: 'Booking must be in Arrived or Processing status to record procurement' });
    }

    // Validate quantities
    if (actualWeight < 0 || acceptedQuantity < 0 || rejectedQuantity < 0) {
      return res.status(400).json({ error: 'Quantities cannot be negative' });
    }

    if (acceptedQuantity + rejectedQuantity > actualWeight + 0.1) { // small float tolerance
      return res.status(400).json({ error: 'Accepted + Rejected cannot exceed actual weight' });
    }

    // Create procurement record
    const procurement = new Procurement({
      booking: bookingId,
      expectedQuantity: parseFloat(expectedQuantity),
      actualWeight: parseFloat(actualWeight),
      acceptedQuantity: parseFloat(acceptedQuantity),
      rejectedQuantity: parseFloat(rejectedQuantity) || 0,
      rejectionReason: rejectionReason || '',
      recordedBy: req.user._id
    });

    await procurement.save();

    // Calculate dynamic rate and amount for Payment
    const crop = (booking.produceType || '').toLowerCase();
    const ratePerQuintal = crop === 'rice' ? 2183 : crop === 'wheat' ? 2275 : 2000;
    const acceptedQtyVal = parseFloat(acceptedQuantity);
    const amount = Math.round(acceptedQtyVal * ratePerQuintal * 100) / 100;

    const payment = new Payment({
      procurement: procurement._id,
      farmer: booking.farmer,
      acceptedQuantity: acceptedQtyVal,
      ratePerQuintal,
      amount,
      status: 'Pending'
    });

    await payment.save();

    // Update booking status to Completed
    booking.status = 'Completed';
    await booking.save();

    console.log(`[Success] Procurement recorded: Token=${booking.tokenNumber}, Expected=${expectedQuantity}, Actual=${actualWeight}, Accepted=${acceptedQuantity}. Payment generated: Amount=₹${amount} (Pending)`);
    return res.status(201).json({
      status: 'success',
      message: 'Procurement recorded successfully',
      procurement: {
        id: procurement._id,
        tokenNumber: booking.tokenNumber,
        expectedQuantity: procurement.expectedQuantity,
        actualWeight: procurement.actualWeight,
        acceptedQuantity: procurement.acceptedQuantity,
        rejectedQuantity: procurement.rejectedQuantity
      }
    });
  } catch (error) {
    console.error('Procurement recording error:', error);
    return res.status(500).json({ error: 'Failed to record procurement' });
  }
});

// ===== PHASE 6: ADMIN REPORTS, PAYMENTS AND CENTRE MANAGEMENT =====

// State Admin Report
app.get('/api/admin/reports/state', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'state') {
      return res.status(403).json({ error: 'Only state admins can access state reports' });
    }
    const stateName = req.user.state || 'Madhya Pradesh';
    const centres = await Centre.find({ state: stateName });
    const centreIds = centres.map(c => c._id);

    const bookings = await Booking.find({ centre: { $in: centreIds } });
    const bookingIds = bookings.map(b => b._id);

    const procurements = await Procurement.find({ booking: { $in: bookingIds } });
    const procIds = procurements.map(p => p._id);

    const payments = await Payment.find({ procurement: { $in: procIds } });

    // Calculate totals
    const totalStorage = centres.reduce((sum, c) => sum + c.storageCapacity, 0);
    const totalProcured = procurements.reduce((sum, p) => sum + p.acceptedQuantity, 0);
    const totalReleased = payments.filter(p => p.status === 'Released').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

    // District-wise grouping
    const districtData = {};
    centres.forEach(c => {
      if (!districtData[c.district]) {
        districtData[c.district] = { centresCount: 0, storageCapacity: 0, procured: 0, released: 0, pending: 0 };
      }
      districtData[c.district].centresCount++;
      districtData[c.district].storageCapacity += c.storageCapacity;
    });

    for (const b of bookings) {
      const centre = centres.find(c => c._id.equals(b.centre));
      if (!centre) continue;
      const proc = procurements.find(p => p.booking.equals(b._id));
      if (proc) {
        districtData[centre.district].procured += proc.acceptedQuantity;
        const pay = payments.find(p => p.procurement.equals(proc._id));
        if (pay) {
          if (pay.status === 'Released') {
            districtData[centre.district].released += pay.amount;
          } else {
            districtData[centre.district].pending += pay.amount;
          }
        }
      }
    }

    const districtList = Object.keys(districtData).map(name => ({
      name,
      ...districtData[name]
    }));

    return res.status(200).json({
      state: stateName,
      totalStorage,
      totalProcured,
      totalReleased,
      totalPending,
      districts: districtList,
      centresCount: centres.length
    });
  } catch (error) {
    console.error('State report error:', error);
    return res.status(500).json({ error: 'Failed to generate state report' });
  }
});

// District Admin Report
app.get('/api/admin/reports/district', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'district') {
      return res.status(403).json({ error: 'Only district admins can access district reports' });
    }
    const districtName = req.user.district || 'Indore';
    const centres = await Centre.find({ district: districtName });
    const centreIds = centres.map(c => c._id);

    const bookings = await Booking.find({ centre: { $in: centreIds } });
    const bookingIds = bookings.map(b => b._id);

    const procurements = await Procurement.find({ booking: { $in: bookingIds } });
    const procIds = procurements.map(p => p._id);

    const payments = await Payment.find({ procurement: { $in: procIds } }).populate('farmer', 'firstName lastName mobile');

    const centreReports = centres.map(c => {
      const cBookings = bookings.filter(b => b.centre.equals(c._id));
      const cBookingIds = cBookings.map(b => b._id);
      const cProcurements = procurements.filter(p => cBookingIds.some(bid => bid.equals(p.booking)));
      const cProcIds = cProcurements.map(p => p._id);
      const cPayments = payments.filter(p => cProcIds.some(pid => pid.equals(p.procurement)));

      const procured = cProcurements.reduce((sum, p) => sum + p.acceptedQuantity, 0);
      const released = cPayments.filter(p => p.status === 'Released').reduce((sum, p) => sum + p.amount, 0);
      const pending = cPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

      return {
        id: c._id,
        centreId: c.centreId,
        name: c.name,
        storageCapacity: c.storageCapacity,
        operatingHours: c.operatingHours,
        slotsPerHour: c.slotsPerHour,
        procured,
        released,
        pending
      };
    });

    const totalProcured = centreReports.reduce((sum, cr) => sum + cr.procured, 0);
    const totalReleased = centreReports.reduce((sum, cr) => sum + cr.released, 0);
    const totalPending = centreReports.reduce((sum, cr) => sum + cr.pending, 0);

    return res.status(200).json({
      district: districtName,
      totalProcured,
      totalReleased,
      totalPending,
      centres: centreReports
    });
  } catch (error) {
    console.error('District report error:', error);
    return res.status(500).json({ error: 'Failed to generate district report' });
  }
});

// GET Pending Payments List (For District/State Admins)
app.get('/api/admin/payments/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'district' && req.user.role !== 'state') {
      return res.status(403).json({ error: 'Only administrators can view pending payments' });
    }

    let centres;
    if (req.user.role === 'district') {
      centres = await Centre.find({ district: req.user.district });
    } else {
      centres = await Centre.find({ state: req.user.state });
    }
    const centreIds = centres.map(c => c._id);

    const bookings = await Booking.find({ centre: { $in: centreIds } });
    const bookingIds = bookings.map(b => b._id);

    const procurements = await Procurement.find({ booking: { $in: bookingIds } });
    const procIds = procurements.map(p => p._id);

    const pendingPayments = await Payment.find({ procurement: { $in: procIds }, status: 'Pending' })
      .populate('farmer', 'firstName lastName mobile')
      .populate({
        path: 'procurement',
        populate: { path: 'booking', populate: { path: 'centre' } }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(pendingPayments);
  } catch (error) {
    console.error('Retrieve pending payments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve pending payments' });
  }
});

// POST Release Pending Payment
app.post('/api/admin/payments/:id/release', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'district' && req.user.role !== 'state') {
      return res.status(403).json({ error: 'Only administrators can release payments' });
    }

    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('farmer')
      .populate({
        path: 'procurement',
        populate: { path: 'booking' }
      });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'Released') {
      return res.status(400).json({ error: 'Payment has already been released' });
    }

    payment.status = 'Released';
    payment.releasedAt = new Date();
    payment.releasedBy = req.user._id;
    await payment.save();

    console.log(`[Success] Payment ${payment._id} released by admin ${req.user.adminId || req.user.mobile}`);

    // Send payment notification - non-blocking (demo mode)
    if (payment.farmer && payment.farmer.mobile) {
      sendPaymentNotification(payment.farmer.mobile, {
        farmerName: payment.farmer.firstName,
        amount: payment.amount,
        tokenNumber: payment.procurement?.booking?.tokenNumber || 'N/A',
        paymentMethod: 'Released'
      }).catch(err => console.error('Payment notification failed:', err.message));
    }

    return res.status(200).json({
      status: 'success',
      message: 'Payment released successfully',
      payment
    });
  } catch (error) {
    console.error('Release payment error:', error);
    return res.status(500).json({ error: 'Failed to release payment' });
  }
});

// PATCH Edit Centre configurations
app.patch('/api/admin/centres/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'district') {
      return res.status(403).json({ error: 'Only district admins can modify centres' });
    }

    const { id } = req.params;
    const { name, storageCapacity, operatingHours, slotsPerHour } = req.body;

    const centre = await Centre.findById(id);
    if (!centre) {
      return res.status(404).json({ error: 'Centre not found' });
    }

    if (centre.district !== req.user.district) {
      return res.status(403).json({ error: 'You can only edit centres within your assigned district' });
    }

    if (name) centre.name = name;
    if (storageCapacity !== undefined) centre.storageCapacity = Number(storageCapacity);
    if (operatingHours !== undefined) centre.operatingHours = operatingHours;
    if (slotsPerHour !== undefined) centre.slotsPerHour = Number(slotsPerHour);

    await centre.save();
    console.log(`[Success] Centre ${centre.centreId} updated by district admin ${req.user.adminId}`);
    return res.status(200).json({
      status: 'success',
      message: 'Centre details updated successfully',
      centre
    });
  } catch (error) {
    console.error('Update centre error:', error);
    return res.status(500).json({ error: 'Failed to update centre details' });
  }
});

// Fallback to index.html for undefined routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser`);
});
