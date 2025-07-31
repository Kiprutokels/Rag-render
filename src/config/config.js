require('dotenv').config();

const port = process.env.PORT || 3000;
const chromaHost = process.env.CHROMA_HOST || 'localhost';
const chromaPort = process.env.CHROMA_PORT || 8000;

module.exports = {
  // Server
  port,

  // Vector DB (Chroma)
  chromaHost,
  chromaPort,
  chromaBaseUrl: `${chromaPort == 443 ? 'https' : 'http'}://${chromaHost}:${chromaPort}`,

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY,
  jinaApiKey: process.env.JINA_API_KEY,

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',

  // File Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['.pdf', '.docx', '.txt', '.xlsx', '.csv'],

  // Embeddings
  embeddingModel: 'jina-embeddings-v2-base-en', // Change to 'text-embedding-3-small' for OpenAI
  embeddingProvider: 'jinaai', // or 'openai'

  // Chat Model
  chatModel: 'gpt-3.5-turbo',

  // Vector Collection
  collectionName: 'company_knowledge',
};

// Optional warning if a required API key is missing
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('⚠️  Missing OPENROUTER_API_KEY in .env');
}
