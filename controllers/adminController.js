const KYC = require('../models/KYC');
const User = require('../models/User');

// Mask Aadhaar to show only last 4 digits
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '';
  return 'XXXX XXXX ' + aadhaar.slice(-4);
};

// GET /api/admin/applications – paginated, with optional status filter
exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status && ['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (search) {
      // Search by reference number or applicant name
      query.$or = [
        { referenceNumber: { $regex: search, $options: 'i' } },
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.mobile': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await KYC.countDocuments(query);
    const applications = await KYC.find(query)
      .populate('userId', 'name mobile email')
      .populate('reviewedBy', 'name')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Mask sensitive data
    const maskedApplications = applications.map((app) => ({
      ...app,
      documents: {
        ...app.documents,
        aadhaarNumber: maskAadhaar(app.documents?.aadhaarNumber),
      },
    }));

    res.json({
      success: true,
      data: {
        applications: maskedApplications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/applications/:id – single application detail
exports.getApplicationById = async (req, res) => {
  try {
    const application = await KYC.findById(req.params.id)
      .populate('userId', 'name mobile email')
      .populate('reviewedBy', 'name')
      .lean();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Mask Aadhaar
    application.documents.aadhaarNumber = maskAadhaar(application.documents?.aadhaarNumber);

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/applications/:id – approve or reject
exports.updateApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (
      !status ||
      !["approved", "rejected", "under_review", "pending"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid status required (approved / rejected / under_review / pending)",
      });
    }

    const application = await KYC.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    application.adminNotes = notes || "";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    // Timeline entry
    application.timeline.push({
      event:
        status === "approved"
          ? "Application Approved"
          : status === "rejected"
          ? "Application Rejected"
          : status === "under_review"
          ? "Application Under Review"
          : status === "pending"
          ? "Application Pending"
          : "Status Updated",

      detail: notes || `Status changed to ${status}`,
      timestamp: new Date(),
    });

    await application.save();

    const updated = application.toObject();

    if (updated.documents?.aadhaarNumber) {
      updated.documents.aadhaarNumber = maskAadhaar(
        updated.documents.aadhaarNumber
      );
    }

    res.json({
      success: true,
      data: updated,
      message: `Application ${status}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/admin/stats – aggregated counts
exports.getStats = async (req, res) => {
  try {
    const [total, approved, rejected, under_review, pending] = await Promise.all([
      KYC.countDocuments(),
      KYC.countDocuments({ status: 'approved' }),
      KYC.countDocuments({ status: 'rejected' }),
      KYC.countDocuments({ status: 'under_review' }),
      KYC.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      success: true,
      data: { total, approved, rejected, under_review, pending },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/applications/:id/documents
exports.getApplicationDocuments = async (req, res) => {
  try {
    const application = await KYC.findById(req.params.id).select("documents");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: application.documents,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};