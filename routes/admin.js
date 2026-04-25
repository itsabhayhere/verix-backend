const express = require('express');
const { protect, admin } = require('../middleware/auth');
const { getAllApplications, getApplicationById, updateApplication, getStats ,getApplicationDocuments} = require('../controllers/adminController');

const router = express.Router();

router.get('/applications', protect, admin, getAllApplications);
router.get('/applications/:id', protect, admin, getApplicationById);
router.put('/applications/:id', protect, admin, updateApplication);
router.get('/stats', protect, admin, getStats);   // ← this is the missing endpoint
router.get(
    "/applications/:id/documents",
    protect,
    admin,
    getApplicationDocuments
  );

module.exports = router;