// In‑memory OTP store (use Redis in production)
const otpStore = new Map();

// Simulated OTP sending (replace with Twilio / SMS gateway)
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Generate 6‑digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5‑minute expiry
    otpStore.set(mobile, { otp, expires: Date.now() + 5 * 60 * 1000 });

    // In real production, send OTP via Twilio / SMS gateway
    console.log(`[OTP] Sent to ${mobile}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and clear from store
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
    }

    const record = otpStore.get(mobile);
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found for this mobile' });
    }

    if (record.expires < Date.now()) {
      otpStore.delete(mobile);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP verified – remove from store
    otpStore.delete(mobile);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};