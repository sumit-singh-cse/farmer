/**
 * Demo SMS Service (No real SMS provider)
 * Logs all SMS-like messages to console. In demo mode, all notifications are
 * simulated and no external SMS service (Fast2SMS, Twilio, etc.) is contacted.
 */

require('dotenv').config();

// Demo mode is always enabled (no real SMS provider is used)
const DEMO_MODE = true;

/**
 * Send SMS (DEMO MODE - logs only, no real SMS sent)
 * @param {string} mobile - 10-digit mobile number
 * @param {string} message - Message content
 * @param {string} route - Route type (otp, promotional, transactional)
 * @returns {Object} Response with demo status
 */
async function sendSMS(mobile, message, route = 'otp') {
  console.log(`[SMS-Demo] [${route}] To: ${mobile} | Message: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
  return {
    success: true,
    demo: true,
    message: 'SMS simulated in demo mode (no real SMS sent)',
    to: mobile
  };
}

/**
 * Send OTP via Fast2SMS (uses route 4 for transactional/OTP)
 * @param {string} mobile - 10-digit mobile number
 * @param {string} otp - 6-digit OTP code
 * @returns {Object} Result with success status
 */
async function sendOTP(mobile, otp) {
  const message = `Your verification code for ProcureHub is ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;

  console.log(`[OTP-SMS] Sending OTP ${otp} to ${mobile}`);

  const result = await sendSMS(mobile, message, 'otp');

  // Store in cache for delivery tracking (optional)
  if (result.success) {
    templateCache.set(`otp_${mobile}`, {
      sentAt: Date.now(),
      otp: otp.substring(0, 2) + '****' // Only store partial for logging
    });
  }

  return result;
}

/**
 * Send Booking Confirmation SMS
 * @param {Object} bookingDetails - Booking information
 * @returns {Object} Result with success status
 */
async function sendBookingConfirmation(mobile, bookingDetails) {
  const {
    farmerName,
    tokenNumber,
    centreName,
    date,
    timeWindow,
    queuePosition,
    estimatedTime
  } = bookingDetails;

  const message = `Namaste ${farmerName}! Your procurement booking is confirmed. Token: ${tokenNumber}, Centre: ${centreName}, Date: ${date} (${timeWindow}), Queue: #${queuePosition}, Est. Time: ${estimatedTime} mins. Please arrive on time.`;

  return sendSMS(mobile, message, 'transactional');
}

/**
 * Send Booking Reminder SMS (1 day before)
 * @param {Object} bookingDetails - Booking information
 * @returns {Object} Result with success status
 */
async function sendBookingReminder(mobile, bookingDetails) {
  const { farmerName, tokenNumber, centreName, date, timeWindow } = bookingDetails;

  const message = `Reminder: ${farmerName}, your procurement slot is tomorrow! Token: ${tokenNumber}, Centre: ${centreName}, Date: ${date} (${timeWindow}). Please bring all required documents.`;

  return sendSMS(mobile, message, 'transactional');
}

/**
 * Send Queue Update SMS
 * @param {string} mobile - Farmer's mobile number
 * @param {Object} queueDetails - Queue update information
 * @returns {Object} Result with success status
 */
async function sendQueueUpdate(mobile, queueDetails) {
  const { farmerName, tokenNumber, queuePosition, status } = queueDetails;

  let message;
  if (status === 'Arrived') {
    message = `${farmerName}, your token ${tokenNumber} has been called. Please proceed to the weighing area.`;
  } else if (status === 'Processing') {
    message = `${farmerName}, token ${tokenNumber} is now being processed. Estimated wait: ${queueDetails.estimatedWait || 5} mins.`;
  } else if (status === 'Completed') {
    message = `${farmerName}, token ${tokenNumber} procurement complete. Your payment of ₹${queueDetails.amount || 'TBD'} will be processed shortly.`;
  } else {
    message = `${farmerName}, update for token ${tokenNumber}: Your status is now ${status}.`;
  }

  return sendSMS(mobile, message, 'transactional');
}

/**
 * Send Payment Notification SMS
 * @param {string} mobile - Farmer's mobile number
 * @param {Object} paymentDetails - Payment information
 * @returns {Object} Result with success status
 */
async function sendPaymentNotification(mobile, paymentDetails) {
  const { farmerName, amount, tokenNumber, paymentMethod } = paymentDetails;

  const message = `Congratulations ${farmerName}! Payment of ₹${amount.toLocaleString('en-IN')} has been ${paymentMethod === 'Released' ? 'released' : 'processed'} for your token ${tokenNumber}. Amount will be credited to your registered bank account within 2-3 working days.`;

  return sendSMS(mobile, message, 'transactional');
}

/**
 * Send Registration Confirmation SMS
 * @param {string} mobile - Farmer's mobile number
 * @param {string} farmerName - Farmer's name
 * @returns {Object} Result with success status
 */
async function sendRegistrationConfirmation(mobile, farmerName) {
  const message = `Welcome to ProcureHub, ${farmerName}! Your farmer account has been successfully registered. You can now book procurement slots at your nearest centre.`;

  return sendSMS(mobile, message, 'transactional');
}

/**
 * Send Cancellation/Reschedule Notification
 * @param {string} mobile - Farmer's mobile number
 * @param {Object} details - Cancellation/reschedule details
 * @returns {Object} Result with success status
 */
async function sendCancellationNotification(mobile, details) {
  const { farmerName, tokenNumber, reason, newDate } = details;

  let message;
  if (newDate) {
    message = `${farmerName}, your booking ${tokenNumber} has been rescheduled to ${newDate} due to: ${reason}.`;
  } else {
    message = `${farmerName}, your booking ${tokenNumber} has been cancelled. Reason: ${reason}. Please rebook for another slot.`;
  }

  return sendSMS(mobile, message, 'transactional');
}

// Export all functions
module.exports = {
  sendSMS,
  sendOTP,
  sendBookingConfirmation,
  sendBookingReminder,
  sendQueueUpdate,
  sendPaymentNotification,
  sendRegistrationConfirmation,
  sendCancellationNotification
};