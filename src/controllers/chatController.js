const OpenAI = require('openai');
const axios = require('axios');
const vectorService = require('../services/vectorService');
const config = require('../config/config');

class ChatController {
  constructor() {
    // Initialize OpenAI client- backup
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey
      });
    }
    
    // Set up chat provider
    this.chatProvider = config.chatProvider || 'openrouter';
    this.chatModel = config.chatModel || 'meta-llama/llama-3.2-3b-instruct:free';
  }

  async processChat(req, res, next) {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }
      
      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        return res.status(400).json({ error: 'Latest message must be from user' });
      }

      const relevantDocs = await vectorService.searchSimilar(userMessage.content, 3);
      
      const context = this.buildContext(relevantDocs);
      
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare messages for API call
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-5)
      ];

      let response;

      // Use different chat providers
      if (this.chatProvider === 'openrouter') {
        response = await this.callOpenRouter(apiMessages);
      } else {
        response = await this.callOpenAI(apiMessages);
      }

      if (response && response.content) {
        res.json({
          message: { role: 'assistant', content: response.content },
          context: {
            documentsUsed: relevantDocs.map(doc => ({
              filename: doc.metadata.filename,
              similarity: doc.similarity,
              chunk_index: doc.metadata.chunk_index
            })),
            contextUsed: relevantDocs.length > 0
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ error: 'Invalid response from AI service' });
      }
      
    } catch (error) {
      next(error);
    }
  }

  async callOpenRouter(messages) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.chatModel,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openrouterApiKey}`,
            'HTTP-Referer': 'http://localhost',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('OpenRouter error:', error?.response?.data || error.message);
      throw new Error('Failed to get response from OpenRouter');
    }
  }

  async callOpenAI(messages) {
    const response = await this.openai.chat.completions.create({
      model: this.chatModel,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      content: response.choices[0].message.content
    };
  }

  buildContext(relevantDocs) {
    if (relevantDocs.length === 0) {
      return "No specific company documents found for this query.";
    }

    return relevantDocs
      .map((doc, index) => `Document ${index + 1} (${doc.metadata.filename}):\n${doc.content}`)
      .join('\n\n');
  }

  buildSystemPrompt(context) {
    return `You are a helpful company assistant with access to company documents and policies. Use the following context to answer questions accurately.

CONTEXT:
${context}

INSTRUCTIONS:
- Use the provided context to answer questions whenever possible
- If the context contains relevant information, reference it in your response
- If the question is not covered in the available context, say "I don't have specific information about that in the company documents"
- Be concise, helpful, and professional
- Always maintain a professional tone appropriate for workplace communication
- If referencing specific documents, mention the source when helpful

Remember: You are representing the company, so ensure all responses are appropriate and accurate based on the available information.`;
  }
}

const chatController = new ChatController();

module.exports = {
  processChat: chatController.processChat.bind(chatController)
};