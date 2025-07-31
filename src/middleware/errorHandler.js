const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the maximum limit'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files',
      message: 'Only one file can be uploaded at a time'
    });
  }
  
  if (err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      message: err.message
    });
  }
  
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
