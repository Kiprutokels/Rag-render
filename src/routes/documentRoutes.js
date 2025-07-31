const express = require('express');
const documentController = require('../controllers/documentController');
const upload = require('../middleware/upload');
const router = express.Router();

router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getAllDocuments);
router.delete('/:id', documentController.deleteDocument);
router.get('/search', documentController.searchDocuments);

module.exports = router;
