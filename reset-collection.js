const { ChromaClient } = require('chromadb');
const config = require('./src/config/config');

async function resetCollection() {
  try {
    const client = new ChromaClient({
      path: `http://${config.chromaHost}:${config.chromaPort}`
    });

    console.log('Connecting to ChromaDB...');
    
    // Delete the existing collection if it exists
    try {
      await client.deleteCollection({ name: config.collectionName });
      console.log(`✅ Deleted existing collection: ${config.collectionName}`);
    } catch (error) {
      console.log('Collection does not exist or already deleted');
    }

    const collection = await client.createCollection({ 
      name: config.collectionName,
      metadata: { "hnsw:space": "cosine" }
    });
    
    console.log(`✅ Created new collection: ${config.collectionName}`);
    console.log('✅ Ready for 768-dimensional embeddings from Jina AI');
    
  } catch (error) {
    console.error('❌ Error resetting collection:', error.message);
  }
}

resetCollection();