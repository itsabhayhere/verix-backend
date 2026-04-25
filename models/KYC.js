const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  event: String,
  detail: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referenceNumber: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  personalInfo: {
    name: String,
    dob: String,
    mobile: String,
    email: String,
    gender: String,
    address: String
  },
  documents: {
    aadhaarNumber: String,
    panNumber: String,
    aadhaarFront: String,
    aadhaarBack: String,
    panCard: String,
    selfie: String
  },
  verification: {
    mobileVerified: { type: Boolean, default: false },
    documentsVerified: { type: Boolean, default: false },
    livenessVerified: { type: Boolean, default: false }
  },
  timeline: [timelineSchema],
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: Date,
  reviewedAt: Date
});

module.exports = mongoose.model('KYC', kycSchema);