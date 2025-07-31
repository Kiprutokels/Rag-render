require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY,
  chromaHost: process.env.CHROMA_HOST || 'localhost',
  chromaPort: process.env.CHROMA_PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['.pdf', '.docx', '.txt', '.xlsx', '.csv'],
  
  // Jina AI Embeddings
  embeddingModel: 'jina-embeddings-v2-base-en',
  embeddingProvider: 'jinaai',
  jinaApiKey: process.env.JINA_API_KEY,

  // OpenAI embeddings
  // embeddingModel: 'text-embedding-3-small',
  // embeddingProvider: 'openai',

  chatModel: 'gpt-3.5-turbo',
  collectionName: 'company_knowledge'
};