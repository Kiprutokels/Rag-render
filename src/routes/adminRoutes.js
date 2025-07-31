const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

router.get('/stats', adminController.getStats);
router.post('/test-query', adminController.testQuery);

module.exports = router;
