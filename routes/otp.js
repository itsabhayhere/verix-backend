const express = require('express');
const router = express.Router();

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

router.post('/send', (req, res) => {
  const mobile = req.body.mobile;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(mobile, { otp, expires: Date.now() + 5 * 60 * 1000 });
  console.log(`OTP for ${mobile}: ${otp}`); // simulate SMS
  res.json({ success: true, message: 'OTP sent successfully' });
});

router.post('/verify', (req, res) => {
  const { mobile, otp } = req.body;
  const record = otpStore.get(mobile);
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
  otpStore.delete(mobile);
  res.json({ success: true, message: 'OTP verified' });
});

module.exports = router;