const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./src/config/config');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const chatRoutes = require('./src/routes/chatRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Initialize app
const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files
app.use('/admin', express.static(path.join(__dirname, 'frontend/admin')));
app.use('/user', express.static(path.join(__dirname, 'frontend/user')));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Modern RAG System API',
    endpoints: {
      admin: '/admin',
      user: '/user',
      api: {
        chat: '/api/chat',
        documents: '/api/documents',
        admin: '/api/admin'
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Modern RAG Backend server running on port ${PORT}`);
  console.log(`📊 Admin interface: http://localhost:${PORT}/admin`);
  console.log(`💬 User interface: http://localhost:${PORT}/user`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
