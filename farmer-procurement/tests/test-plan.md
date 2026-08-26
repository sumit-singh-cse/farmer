# Test Plan - Farmer Procurement Platform

## Overview
This document outlines comprehensive manual testing procedures for the Farmer Procurement Platform. Use this checklist to verify all features work correctly before deployment.

## Pre-Test Setup

### 1. Environment Configuration

```bash
# Clone and setup
git clone <repository-url>
cd farmer-procurement
npm install

# Configure environment variables
# Copy .env and update values
# Must have:
# - MONGODB_URI (cloud or local)
# - JWT_SECRET
# - FAST2SMS_API_KEY (optional, demo mode without)

# Seed Indian states and districts
npm run seed:locations

# Start server
npm start
```

### 2. Browser Requirements
- Chrome/Edge/Firefox (latest version)
- Disable ad blockers for localhost testing
- Enable developer console (F12)

### 3. Test Data Checklist
- [ ] MongoDB connected and seeded with states/districts
- [ ] Admin accounts created (state, district, centre)
- [ ] Test farmer mobile number available
- [ ] Test SMS API working (or demo mode)

---

## Phase 0: UI and Server Foundation

### Server & Connection Checks
- [ ] Run `npm start` and verify server starts on port 5050
- [ ] Check console shows "MongoDB connected successfully"
- [ ] Open http://localhost:5050/api/test - should return success JSON
- [ ] Open http://localhost:5050/ - home page loads correctly

### Home Page UI Checks
- [ ] Navbar renders at top with all links
- [ ] Footer renders at bottom with "Ministry of Consumer Affairs" text
- [ ] Hero section displays with "Book Your Slot" and "Check Status" buttons
- [ ] "How it works" section displays correctly
- [ ] Benefits section displays correctly

### Mobile Responsiveness Check
| Device | Viewport | Check |
|--------|----------|-------|
| Desktop | 1920x1080 | All elements visible, no overflow |
| Tablet | 768x1024 | Grid layouts adjust, no horizontal scroll |
| Mobile | 375x667 | Hamburger menu works, forms readable |
| Small Mobile | 320x568 | Touch targets 44px+, readable text |

---

## Phase 1: Registration and Login

### Farmer Registration Flow
- [ ] Navigate to `farmer/register.html`
- [ ] **OTP Test**: Enter 10-digit mobile, click "Send OTP"
  - [ ] If FAST2SMS configured: Check phone for SMS
  - [ ] If demo mode: OTP shown in toast (default: 123456)
  - [ ] Verify toast message shows "OTP sent successfully"
- [ ] **Field Validation**: Try submitting empty form
  - [ ] Browser HTML5 validation triggers
- [ ] **Password Mismatch**: Enter different passwords
  - [ ] Toast shows "Passwords do not match!"
- [ ] **Successful Registration**:
  - [ ] Enter valid data with correct OTP
  - [ ] Submit form
  - [ ] Success toast appears
  - [ ] Redirects to login page after 1.5s
- [ ] **MongoDB Verification**:
  - [ ] Check `users` collection
  - [ ] User created with `role: "farmer"`
  - [ ] Password is bcrypt hashed
  - [ ] Aadhaar masked (XXXX-XXXX-XXXX)
- [ ] **Duplicate Mobile**: Try registering same number
  - [ ] Error toast: "Mobile number already registered"

### Farmer Login Flow
- [ ] Navigate to `farmer/login.html`
- [ ] **Wrong Credentials**: Enter incorrect mobile or password
  - [ ] Error toast: "Incorrect credentials provided"
- [ ] **Wrong OTP**: Enter wrong OTP
  - [ ] Error toast: "Invalid or expired OTP"
- [ ] **Successful Login**:
  - [ ] Enter correct mobile, password, OTP
  - [ ] Click login
  - [ ] Success toast appears
  - [ ] Redirects to dashboard
  - [ ] Greeting shows "Namaste, [Name]!"
- [ ] **Logout**:
  - [ ] Click logout button
  - [ ] Redirects to home page
  - [ ] Token cleared from localStorage

### Admin Login Flow
- [ ] Navigate to `admin/login.html`
- [ ] **State Admin Login**:
  - [ ] Select "State Level"
  - [ ] ID: `ST-MP-01`, Password: `state123`
  - [ ] OTP: `9999`, Captcha: any value
  - [ ] Redirect to `state-dashboard.html`
- [ ] **District Admin Login**:
  - [ ] ID: `DT-IND-01`, Password: `district123`
  - [ ] Redirect to `district-dashboard.html`
- [ ] **Centre Operator Login**:
  - [ ] ID: `OP-UJN-02`, Password: `operator123`
  - [ ] Redirect to `centre-dashboard.html`

---

## Phase 2: State/District/Centre Data

### Location APIs
- [ ] **States API**: GET `/api/states`
  - [ ] Returns all 28 states + 8 UTs
  - [ ] Sorted alphabetically
- [ ] **Districts API**: GET `/api/districts/:stateName`
  - [ ] Returns districts for state
  - [ ] Case-insensitive state matching
- [ ] **Centres API**: GET `/api/centres/:districtName`
  - [ ] Returns centres for district

### Location Dropdowns (Farmer Registration)
- [ ] Click State dropdown
  - [ ] All 36 states/UTs populated
  - [ ] Sorted alphabetically
- [ ] Select a state (e.g., "Madhya Pradesh")
  - [ ] District dropdown populates with all MP districts
- [ ] Select a district
  - [ ] District stored in user profile

---

## Phase 3: Farmer Profile & Land

### Profile Management
- [ ] Navigate to `farmer/profile.html`
- [ ] **View Profile**:
  - [ ] First/Last name displayed
  - [ ] Mobile number displayed
  - [ ] Masked Aadhaar displayed (XXXX-XXXX-XXXX)
  - [ ] Address displayed
  - [ ] State/District displayed
- [ ] **Edit Profile**:
  - [ ] Change address
  - [ ] Click save
  - [ ] Success toast
  - [ ] Changes reflect on page
- [ ] **Profile Image**:
  - [ ] Click upload button
  - [ ] Select image file
  - [ ] Click save
  - [ ] Image displays on profile
  - [ ] Check `uploads/` folder for saved file

### Land Records
- [ ] Navigate to `farmer/dashboard.html`
- [ ] **Add New Land**:
  - [ ] Enter Khasra number (e.g., "405/2")
  - [ ] Enter area in hectares (e.g., "2.0")
  - [ ] Select crop type (Wheat/Rice)
  - [ ] Enter allowed quantity (e.g., "30")
  - [ ] Click "Register Land Record"
  - [ ] Success toast
  - [ ] Land appears in "My Verified Land Holdings"
- [ ] **API Check**: GET `/api/lands`
  - [ ] Returns farmer's land records
  - [ ] Shows Khasra number, area, allowed quantity

---

## Phase 4: Booking Flow

### Booking Page Load
- [ ] Navigate to `farmer/booking.html` (while logged in)
- [ ] Redirects to login if not authenticated
- [ ] **Land Records**: Select land from dropdown
  - [ ] Limit hint displays: "Permissible limit: X Quintals"
- [ ] **Districts**: Select district
  - [ ] Centres load dynamically
- [ ] **Centres**: Select centre
  - [ ] Booking summary updates

### Capacity Calculation Tests

| Input Qty | Expected Units | Expected Time | Pass |
|-----------|----------------|---------------|------|
| 5 Qtl     | 1 unit         | 5 mins        | [ ]  |
| 10 Qtl    | 2 units        | 10 mins       | [ ]  |
| 12 Qtl    | 3 units        | 15 mins       | [ ]  |
| 25 Qtl    | 5 units        | 25 mins       | [ ]  |
| 1 Qtl     | 1 unit         | 5 mins        | [ ]  |
| 100 Qtl   | 20 units       | 100 mins      | [ ]  |

**Formula Verification**: `capacityUnits = Math.ceil(quantity / 5)`

### Successful Booking
- [ ] Fill all form fields
  - [ ] Land selected
  - [ ] Crop selected
  - [ ] Quantity entered (within land limit)
  - [ ] District selected
  - [ ] Centre selected
  - [ ] Date selected (future date)
  - [ ] Time slot selected
- [ ] Click "Confirm & Generate Token"
- [ ] **Success**: Toast shows "Booking confirmed! Token: T-XXXX"
- [ ] **Redirect**: Redirects to dashboard
- [ ] **MongoDB**:
  - [ ] Booking created in `bookings` collection
  - [ ] Token number format: T-1001, T-1002, etc.
  - [ ] Queue position sequential
  - [ ] Capacity units calculated correctly
  - [ ] Land's `bookedQuantity` updated

### Booking Validation Tests
- [ ] **Quantity Exceeds Limit**: Enter 50 on 40-limit land
  - [ ] Browser validation blocks or backend error shown
- [ ] **Missing Fields**: Submit incomplete form
  - [ ] Toast: "Please fill in all required fields"
- [ ] **No Time Slot**: Submit without selecting slot
  - [ ] Toast: "Please select an available delivery hour slot"
- [ ] **Past Date**: Select yesterday's date
  - [ ] Date picker should prevent past dates

### Dashboard Booking Display
- [ ] Navigate to `farmer/dashboard.html`
- [ ] **Active Booking Card** displays:
  - [ ] Token number (T-XXXX)
  - [ ] Centre name
  - [ ] Date and time window
  - [ ] Queue position
  - [ ] Crop type and quantity
  - [ ] Capacity units and estimated time
- [ ] **Previous Bookings**: Table shows history
  - [ ] Sort by date (newest first)
  - [ ] Status badges (Booked, Completed, etc.)

### Status Page
- [ ] Navigate to `status.html`
- [ ] Enter token number
- [ ] Click "Check Status"
- [ ] Displays:
  - [ ] Token number
  - [ ] Farmer name (partially masked)
  - [ ] Centre name
  - [ ] Date and time
  - [ ] Queue position
  - [ ] Estimated wait time
  - [ ] Current status

---

## Phase 5: Queue and Procurement

### Centre Operator Queue
- [ ] Login as Centre Operator (`OP-UJN-02`)
- [ ] Navigate to `centre-dashboard.html`
- [ ] **Header Info** displays:
  - [ ] Centre name ("Ujjain Krishi Mandi")
  - [ ] Date
  - [ ] Storage usage (0 / 5,000 Qtl)
- [ ] **Queue Table** shows bookings
- [ ] **Booking Status Flow**:

  1. **Check-In (Booked → Arrived)**
     - [ ] Click "Check-In" button
     - [ ] Status changes to "Arrived"
     - [ ] Button changes to "Start Processing"

  2. **Start Processing (Arrived → Processing)**
     - [ ] Click "Start Processing"
     - [ ] Status changes to "Processing"
     - [ ] Button changes to "Weigh & Procure"

  3. **Weigh & Procure (Modal)**
     - [ ] Click "Weigh & Procure"
     - [ ] Modal opens with booking details
     - [ ] Enter expected, actual, accepted quantities
     - [ ] Click "Save Weighing"
     - [ ] Modal closes
     - [ ] Status changes to "Completed"

### Procurement Modal Tests

| Test Case | Expected Qty | Actual Qty | Accepted | Rejected | Reason |
|-----------|--------------|------------|----------|----------|--------|
| Full Accepted | 20 | 20 | 20 | 0 | (optional) |
| Partial Rejected | 20 | 18.7 | 18.5 | 0.2 | Quality check |
| Quality Rejected | 20 | 20 | 17 | 3 | Moisture content |

**Validations**:
- [ ] Accepted + Rejected cannot exceed Actual
- [ ] Reason required if rejected > 0

### MongoDB Procurement Check
- [ ] Check `procurements` collection
- [ ] Record created with correct quantities
- [ ] Farmer reference correct
- [ ] Recorded by operator

### Payment Auto-Creation
- [ ] Check `payments` collection
- [ ] Payment created automatically
- [ ] Rate applied (Wheat: ₹2,275/Qtl, Rice: ₹2,183/Qtl)
- [ ] Amount = Accepted Quantity × Rate
- [ ] Status = "Pending"

---

## Phase 6: Payments and Reports

### Farmer Dashboard Payment Display
- [ ] Login as farmer with completed booking
- [ ] Navigate to `dashboard.html`
- [ ] **Previous Bookings Table** shows:
  - [ ] Booked Qty column
  - [ ] Accepted Qty column
  - [ ] Total Payout column
  - [ ] Payment Status badge (Pending = yellow, Released = green)

### District Admin Payment Approval
- [ ] Login as District Admin (`DT-IND-01`)
- [ ] Navigate to `district-dashboard.html`
- [ ] **Pending Payout Clearances** table:
  - [ ] Shows pending payments for district
  - [ ] Farmer name, mobile, token number
  - [ ] Amount, date
- [ ] **Approve & Release**:
  - [ ] Click button
  - [ ] Confirm dialog appears
  - [ ] Click "OK"
  - [ ] Toast: "Payment released successfully"
  - [ ] Row removed from pending table
- [ ] **MongoDB Check**:
  - [ ] Payment status = "Released"
  - [ ] `releasedAt` timestamp set
  - [ ] `releasedBy` set to admin

### Farmer Payment Status Update
- [ ] Login as farmer
- [ ] Check dashboard
- [ ] Payment status badge now "Released" (green)

### State Admin Reports
- [ ] Login as State Admin (`ST-MP-01`)
- [ ] Navigate to `state-dashboard.html`
- [ ] **Stats Cards** display:
  - [ ] Total storage capacity
  - [ ] Total procured
  - [ ] Total payments released
  - [ ] Total payments pending
- [ ] **District Wise Operations** table:
  - [ ] Shows all districts
  - [ ] Centres count per district
  - [ ] Procurement totals
  - [ ] Payment totals
- [ ] **Export Report**:
  - [ ] Click "Export State Report"
  - [ ] CSV file downloads
  - [ ] Filename: `state_report_Madhya_Pradesh.csv`
  - [ ] Contains all district data

---

## Phase 7: SMS Notifications (Fast2SMS)

### OTP via SMS
- [ ] Register new farmer
- [ ] Check phone for SMS with OTP code
- [ ] Verify OTP code matches backend
- [ ] Use OTP to complete registration

### Booking Confirmation SMS
- [ ] Farmer books slot
- [ ] SMS received with:
  - [ ] Token number
  - [ ] Centre name
  - [ ] Date and time
  - [ ] Queue position
  - [ ] Estimated processing time

### Payment Notification SMS
- [ ] Admin releases payment
- [ ] Farmer receives SMS with:
  - [ ] Amount
  - [ ] Token number
  - [ ] Payment status

---

## Security Testing

### Authentication Security
- [ ] **Token Expiration**: Login, wait 7+ days, try API call
  - [ ] Should return 403/401 error
- [ ] **Token Tampering**: Modify token in localStorage
  - [ ] Should return 403 error
- [ ] **Missing Token**: Call API without token
  - [ ] Returns 401 error

### Password Security
- [ ] **Hash Verification**: Check MongoDB
  - [ ] Password not stored in plain text
- [ ] **Login Attempts**: Multiple wrong passwords
  - [ ] Rate limiting applies (10 req/15min)

### Input Validation
- [ ] **Mobile Number**: Enter invalid format
  - [ ] Error: "Please provide a valid 10-digit mobile number"
- [ ] **Quantity**: Enter negative or zero
  - [ ] Validation error
- [ ] **SQL Injection**: Try special characters in inputs
  - [ ] Should be sanitized

### CORS/Security Headers
- [ ] Check response headers
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection`

---

## Mobile Responsiveness Testing

### Responsive Layout Tests

| Page | Desktop (1920px) | Tablet (768px) | Mobile (375px) |
|------|------------------|----------------|----------------|
| Home | [ ] No horizontal scroll | [ ] No horizontal scroll | [ ] No horizontal scroll |
| Login | [ ] Form centered | [ ] Form centered | [ ] Full width |
| Register | [ ] Two columns | [ ] Two columns | [ ] Single column |
| Dashboard | [ ] Cards grid | [ ] Cards stack | [ ] Cards stack |
| Booking | [ ] Grid layout | [ ] Stacked | [ ] Full width |
| Admin | [ ] Full table | [ ] Scrollable table | [ ] Scrollable table |
| Status | [ ] Centered card | [ ] Centered card | [ ] Full width |

### Touch Interaction Tests
- [ ] Buttons minimum 44x44px touch target
- [ ] Forms easy to tap
- [ ] No hover-only interactions
- [ ] Hamburger menu works on mobile

---

## Performance Testing

### Load Time Tests
- [ ] Home page loads < 2 seconds
- [ ] API calls respond < 500ms
- [ ] Images load properly
- [ ] No broken links

### Concurrent Users Test
- [ ] 10 users registering simultaneously
- [ ] No token collisions
- [ ] Queue positions accurate

---

## Bug Reporting Template

When finding bugs, document:

```markdown
## Bug: [Short Title]

### Description
[Clear description of the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[Attach screenshots if applicable]

### Browser/OS
[Browser name and version, OS]

### Severity
[Critical/High/Medium/Low]
```

---

## Test Sign-Off Checklist

Before deployment, verify:

### Core Features
- [ ] Farmer registration works
- [ ] Login/logout works
- [ ] Slot booking works
- [ ] Queue management works
- [ ] Procurement recording works
- [ ] Payment calculation works
- [ ] Admin dashboards work

### Notifications
- [ ] OTP via SMS works (or demo mode)
- [ ] Booking SMS sent
- [ ] Payment SMS sent

### Data
- [ ] All 28 states + 8 UTs seeded
- [ ] Districts linked to states
- [ ] Centres linked to districts
- [ ] Bookings saved correctly
- [ ] Payments calculated correctly

### Security
- [ ] Passwords hashed
- [ ] JWT authentication works
- [ ] Rate limiting active
- [ ] Input validation working

### Mobile
- [ ] All pages responsive
- [ ] Hamburger menu works
- [ ] Forms usable on mobile
- [ ] Tables scrollable on mobile

---

## Deployment Readiness

### Pre-Deployment Checks
- [ ] All environment variables set
- [ ] MongoDB Atlas connected and seeded
- [ ] Fast2SMS API key configured (for production)
- [ ] JWT_SECRET changed from default
- [ ] No debug/log statements in production
- [ ] Error messages user-friendly

### Production Checklist
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (platform handles this)
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place
- [ ] CDN configured for static files (optional)

---

## Test Completion

**Test Date**: _______________
**Tested By**: _______________
**Environment**: _______________
**Version**: _______________

### Summary
- Total Test Cases: _____
- Passed: _____
- Failed: _____
- Blocked: _____
- Notes: _______________