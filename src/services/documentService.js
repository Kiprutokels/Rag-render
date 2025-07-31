const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const textProcessor = require('../utils/textProcessor');

class DocumentService {
  async processDocument(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    let content = '';

    try {
      switch (ext) {
        case '.pdf':
          content = await this.processPDF(filePath);
          break;
        case '.docx':
          content = await this.processDocx(filePath);
          break;
        case '.txt':
          content = await this.processTxt(filePath);
          break;
        case '.xlsx':
        case '.csv':
          content = await this.processExcel(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      // Clean and chunk the content
      const cleanedContent = textProcessor.cleanText(content);
      const chunks = textProcessor.chunkText(cleanedContent);

      // Create document objects
      const documents = chunks.map((chunk, index) => ({
        id: `${uuidv4()}-chunk-${index}`,
        content: chunk,
        filename: originalName,
        type: ext.slice(1), // Remove the dot
        created_at: new Date().toISOString(),
        chunk_index: index,
        source: 'upload'
      }));

      return documents;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    } finally {
      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting uploaded file:', error);
      }
    }
  }

  async processPDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  async processDocx(filePath) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async processTxt(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }

  async processExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    let content = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = xlsx.utils.sheet_to_csv(sheet);
      content += `Sheet: ${sheetName}\n${sheetData}\n\n`;
    });

    return content;
  }
}

module.exports = new DocumentService();
