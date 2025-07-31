const express = require('express');
const knowledgeBase = require('../data/knowledgeBase');
const router = express.Router();

/**
 * @route GET /api/faqs
 * @description Get all FAQs
 * @access Public
 */
router.get('/', (req, res) => {
  res.json(knowledgeBase.faqs);
});

/**
 * @route GET /api/faqs/:id
 * @description Get a specific FAQ by ID
 * @access Public
 */
router.get('/:id', (req, res) => {
  const faqId = parseInt(req.params.id);
  const faq = knowledgeBase.faqs.find(item => item.id === faqId);
  
  if (!faq) {
    return res.status(404).json({ error: 'FAQ not found' });
  }
  
  res.json(faq);
});

/**
 * @route GET /api/faqs/search
 * @description Search FAQs by query
 * @access Public
 */
router.get('/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchResults = knowledgeBase.faqs.filter(faq => {
    const lowerQuery = query.toLowerCase();
    const lowerQuestion = faq.question.toLowerCase();
    const lowerAnswer = faq.answer.toLowerCase();
    
    return lowerQuestion.includes(lowerQuery) || 
           lowerAnswer.includes(lowerQuery) ||
           faq.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery));
  });
  
  res.json({
    query,
    results: searchResults,
    count: searchResults.length
  });
});

module.exports = router;
