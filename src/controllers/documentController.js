const documentService = require('../services/documentService');
const vectorService = require('../services/vectorService');

class DocumentController {
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Processing document:', req.file.originalname);

      // Process the document
      const documents = await documentService.processDocument(
        req.file.path,
        req.file.originalname
      );

      // Add to vector database
      const result = await vectorService.addDocuments(documents);

      res.json({
        message: 'Document uploaded and processed successfully',
        filename: req.file.originalname,
        chunks: result.count,
        documents: documents.map(doc => ({
          id: doc.id,
          preview: doc.content.substring(0, 200) + '...',
          chunk_index: doc.chunk_index
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllDocuments(req, res, next) {
    try {
      const documents = await vectorService.getAllDocuments();
      
      // Group by filename
      const groupedDocs = documents.reduce((acc, doc) => {
        const filename = doc.metadata.filename;
        if (!acc[filename]) {
          acc[filename] = {
            filename,
            type: doc.metadata.type,
            created_at: doc.metadata.created_at,
            chunks: []
          };
        }
        acc[filename].chunks.push({
          id: doc.id,
          content: doc.content,
          chunk_index: doc.metadata.chunk_index
        });
        return acc;
      }, {});

      res.json(Object.values(groupedDocs));
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      await vectorService.deleteDocument(id);
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async searchDocuments(req, res, next) {
    try {
      const { query, limit = 5 } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await vectorService.searchSimilar(query, parseInt(limit));
      
      res.json({
        query,
        results: results.map(result => ({
          content: result.content,
          filename: result.metadata.filename,
          type: result.metadata.type,
          similarity: result.similarity,
          chunk_index: result.metadata.chunk_index
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
