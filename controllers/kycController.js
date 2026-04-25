const KYC = require("../models/KYC");

// Generate reference number: VRX-YYYY-XXXXX
const generateRef = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `VRX-${year}-${random}`;
};

// Mask Aadhaar – show only last 4 digits
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return "";
  return "XXXX XXXX " + aadhaar.slice(-4);
};

// Normalize file path for browser access
const normalizePath = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, "/"); // Fix Windows path issue
};

// OPTIONAL: store absolute URLs instead of relative paths
const buildFileUrl = (req, filePath) => {
  if (!filePath) return null;

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return `${baseUrl}/${normalizePath(filePath)}`;
};

exports.submitKYC = async (req, res) => {
  try {
    const userId = req.user._id;

    // Prevent duplicate submissions
    const existing = await KYC.findOne({ userId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "KYC already submitted",
      });
    }

    const {
      name,
      dob,
      mobile,
      email,
      gender,
      address,
      aadhaarNumber,
      panNumber,
    } = req.body;

    // Choose ONE approach below:

    // OPTION 1 (Recommended): store absolute URLs
    const aadhaarFront = buildFileUrl(
      req,
      req.files?.aadhaarFront?.[0]?.path
    );

    const aadhaarBack = buildFileUrl(
      req,
      req.files?.aadhaarBack?.[0]?.path
    );

    const panCard = buildFileUrl(
      req,
      req.files?.panCard?.[0]?.path
    );

    const selfie = buildFileUrl(
      req,
      req.files?.selfie?.[0]?.path
    );

    /*
    OPTION 2 (Alternative): store relative paths instead

    const aadhaarFront = normalizePath(req.files?.aadhaarFront?.[0]?.path);
    const aadhaarBack = normalizePath(req.files?.aadhaarBack?.[0]?.path);
    const panCard = normalizePath(req.files?.panCard?.[0]?.path);
    const selfie = normalizePath(req.files?.selfie?.[0]?.path);
    */

    const kyc = await KYC.create({
      userId,

      referenceNumber: generateRef(),

      personalInfo: {
        name,
        dob,
        mobile,
        email,
        gender,
        address,
      },

      documents: {
        aadhaarNumber,
        panNumber,
        aadhaarFront,
        aadhaarBack,
        panCard,
        selfie,
      },

      verification: {
        mobileVerified: true,
        documentsVerified:
          !!aadhaarFront &&
          !!aadhaarBack &&
          !!panCard,

        livenessVerified: !!selfie,
      },

      status: "under_review",

      timeline: [
        {
          event: "Application Submitted",
          detail:
            "Documents and biometric selfie captured successfully",
          timestamp: new Date(),
        },
      ],

      submittedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: {
        kycId: kyc._id,
        referenceNumber: kyc.referenceNumber,
        status: kyc.status,
      },
      message: "KYC submitted successfully ✅",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyKYC = async (req, res) => {
  try {
    const kyc = await KYC.findOne({
      userId: req.user._id,
    }).populate("reviewedBy", "name");

    if (!kyc) {
      return res.json({
        success: true,
        data: null,
        message: "No KYC application yet",
      });
    }

    const data = kyc.toObject();

    if (data.documents?.aadhaarNumber) {
      data.documents.aadhaarNumber = maskAadhaar(
        data.documents.aadhaarNumber
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getKYCStatus = async (req, res) => {
  try {
    const kyc = await KYC.findOne({
      userId: req.user._id,
    }).select("referenceNumber status timeline");

    if (!kyc) {
      return res.json({
        success: true,
        data: null,
        message: "No KYC application",
      });
    }

    res.json({
      success: true,
      data: kyc,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};