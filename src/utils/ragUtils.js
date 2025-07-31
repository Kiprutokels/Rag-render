// RAG utility functions
const knowledgeBase = require('../data/knowledgeBase');

/**
 * Calculate similarity between two text strings
 * @param {string} text1 - First text string
 * @param {string} text2 - Second text string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

/**
 * Retrieve relevant FAQs based on user query
 * @param {string} query - User query text
 * @param {number} topK - Number of FAQs to retrieve
 * @returns {Array} Relevant FAQs with scores
 */
function retrieveRelevantFAQs(query, topK = 3) {
  const queryLower = query.toLowerCase();
  
  // Score each FAQ based on keyword matches and similarity
  const scoredFAQs = knowledgeBase.faqs.map(faq => {
    let score = 0;
    
    // Check keyword matches
    const keywordMatches = faq.keywords.filter(keyword => 
      queryLower.includes(keyword.toLowerCase())
    ).length;
    score += keywordMatches * 2;
    
    // Check question similarity
    const questionSimilarity = calculateSimilarity(queryLower, faq.question.toLowerCase());
    score += questionSimilarity * 3;
    
    // Check answer similarity
    const answerSimilarity = calculateSimilarity(queryLower, faq.answer.toLowerCase());
    score += answerSimilarity * 1;
    
    return { ...faq, score };
  });
  
  // Sort by score and return top K
  return scoredFAQs
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(faq => faq.score > 0);
}

/**
 * Build enhanced system prompt with retrieved context
 * @param {Array} retrievedFAQs - Retrieved FAQ items
 * @returns {string} Enhanced system prompt
 */
function buildSystemPrompt(retrievedFAQs) {
  let contextText = "You are a helpful company assistant. Use the following company information to answer questions:\n\n";
  
  if (retrievedFAQs.length > 0) {
    contextText += "COMPANY FAQ:\n";
    retrievedFAQs.forEach((faq, index) => {
      contextText += `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n\n`;
    });
  }
  
  contextText += `
IMPORTANT RULES:
- Always answer based on the company FAQ information provided above
- If the question is not covered in the FAQ, politely say you don't have that information
- Be brief, helpful, and professional
- If asking about office hours: 8am–5pm
- If asking about leave: use the Aqua app
- If asking about clock-in: must be within 100 meters of office
`;
  
  return contextText;
}

module.exports = {
  retrieveRelevantFAQs,
  buildSystemPrompt
};
