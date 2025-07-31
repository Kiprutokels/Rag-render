const vectorService = require('../services/vectorService');

class AdminController {
  async getStats(req, res, next) {
    try {
      const stats = await vectorService.getCollectionStats();
      const documents = await vectorService.getAllDocuments();
      
      // Calculate additional stats
      const fileTypes = {};
      const filesByDate = {};
      
      documents.forEach(doc => {
        const type = doc.metadata.type;
        const date = doc.metadata.created_at?.split('T')[0];
        
        fileTypes[type] = (fileTypes[type] || 0) + 1;
        filesByDate[date] = (filesByDate[date] || 0) + 1;
      });

      res.json({
        totalDocuments: stats.count,
        fileTypes,
        uploadsByDate: filesByDate,
        recentUploads: documents
          .sort((a, b) => new Date(b.metadata.created_at) - new Date(a.metadata.created_at))
          .slice(0, 10)
          .map(doc => ({
            filename: doc.metadata.filename,
            type: doc.metadata.type,
            created_at: doc.metadata.created_at
          }))
      });
    } catch (error) {
      next(error);
    }
  }

  async testQuery(req, res, next) {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const results = await vectorService.searchSimilar(query, 5);
      
      res.json({
        query,
        results: results.map(result => ({
          content: result.content.substring(0, 300) + '...',
          filename: result.metadata.filename,
          similarity: result.similarity,
          chunk_index: result.metadata.chunk_index
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
