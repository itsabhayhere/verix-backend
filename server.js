require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const otpRoutes = require('./routes/otp');
const adminRoutes = require('./routes/admin');
const cookieParser = require("cookie-parser");
const fs = require('fs');
const path = require('path');

const app = express();

connectDB();

// Middleware
app.use(cookieParser());

const cors = require("cors");

app.use(
  cors({
    origin: "https://verix-frontend.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

// Ensure uploads folder exists
const uploadPath = process.env.UPLOAD_PATH || "./uploads";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ✅ Serve uploaded files publicly
app.use("/uploads", express.static(path.resolve(uploadPath)));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/admin', adminRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT} 🚀`)
);