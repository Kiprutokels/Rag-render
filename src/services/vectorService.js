const { ChromaClient } = require('chromadb');
const config = require('../config/config');
const embeddingService = require('./embeddingService');

class VectorService {
  constructor() {
    this.client = new ChromaClient();
    this.collection = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Try to get existing collection
      try {
        this.collection = await this.client.getCollection({
          name: config.collectionName
        });
        console.log('Connected to existing collection:', config.collectionName);
      } catch (error) {
        // Create new collection if it doesn't exist
        this.collection = await this.client.createCollection({
          name: config.collectionName,
          metadata: { 
            description: "Company knowledge base documents and FAQs",
            created_at: new Date().toISOString()
          }
        });
        console.log('Created new collection:', config.collectionName);
      }
    } catch (error) {
      console.error('Error initializing vector service:', error);
      throw error;
    }
  }

  // Rest of the methods remain the same...
  async addDocuments(documents) {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      const texts = documents.map(doc => doc.content);
      const embeddings = await embeddingService.generateEmbeddings(texts);

      await this.collection.add({
        ids: documents.map(doc => doc.id),
        embeddings: embeddings,
        documents: texts,
        metadatas: documents.map(doc => ({
          filename: doc.filename,
          type: doc.type,
          created_at: doc.created_at,
          chunk_index: doc.chunk_index || 0,
          source: doc.source || 'upload'
        }))
      });

      return { success: true, count: documents.length };
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  async searchSimilar(query, nResults = 5) {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults,
        include: ['documents', 'metadatas', 'distances']
      });

      if (!results.documents[0] || results.documents[0].length === 0) {
        return [];
      }

      return results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: 1 - results.distances[0][index] // Convert distance to similarity
      }));
    } catch (error) {
      console.error('Error searching similar documents:', error);
      throw error;
    }
  }

  async getAllDocuments() {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      const results = await this.collection.get({
        include: ['documents', 'metadatas']
      });

      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      return results.documents.map((doc, index) => ({
        id: results.ids[index],
        content: doc,
        metadata: results.metadatas[index]
      }));
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      await this.collection.delete({
        ids: [id]
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      if (!this.collection) {
        await this.initialize();
      }

      const count = await this.collection.count();
      return { count };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return { count: 0 };
    }
  }
}

module.exports = new VectorService();
