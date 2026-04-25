const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { submitKYC, getMyKYC, getKYCStatus } = require('../controllers/kycController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_PATH || './uploads'),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) }
});

const router = express.Router();

router.post('/submit', 
  protect, 
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), 
  submitKYC
);

router.get('/my', protect, getMyKYC);       // ← this is the missing endpoint
router.get('/status', protect, getKYCStatus);

module.exports = router;