const config = require('../config/config');

class EmbeddingService {
  constructor() {
    this.apiUrl = 'https://api.jina.ai/v1/embeddings';
    this.headers = {
      'Authorization': `Bearer ${process.env.JINA_API_KEY || config.jinaApiKey}`,
      'Content-Type': 'application/json',
    };
    this.model = 'jina-embeddings-v2-base-en';
  }

  async generateEmbedding(text) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          input: [text]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jina AI API error:', response.status, errorText);
        throw new Error(`Jina AI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.data[0].embedding;
      
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateEmbeddings(texts) {
    try {
      // Process in smaller batches to avoid rate limits
      const batchSize = 5;
      const results = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            model: this.model,
            input: batch
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Jina AI API error:', response.status, errorText);
          throw new Error(`Jina AI API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        results.push(...result.data.map(item => item.embedding));
        
        // Small delay between batches to be respectful
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;

    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  // Utility method to check if the service is working
  async testConnection() {
    try {
      const testEmbedding = await this.generateEmbedding("Hello, this is a test.");
      console.log('Jina AI Embedding Service is working!');
      console.log('Test embedding dimension:', testEmbedding.length);
      return true;
    } catch (error) {
      console.error('Jina AI Embedding Service test failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmbeddingService();