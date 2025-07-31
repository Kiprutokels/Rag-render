const express = require('express');
const knowledgeBase = require('../data/knowledgeBase');
const router = express.Router();

/**
 * @route GET /api/health
 * @description Health check endpoint
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    knowledgeBase: {
      totalFAQs: knowledgeBase.faqs.length
    },
    uptime: process.uptime()
  });
});

module.exports = router;
