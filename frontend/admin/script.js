class AdminPanel {
    constructor() {
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadDocuments();
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseLink = uploadArea.querySelector('.browse-link');

        // Click to browse
        browseLink.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Test query
        const testBtn = document.getElementById('testBtn');
        const testQuery = document.getElementById('testQuery');

        testBtn.addEventListener('click', () => {
            const query = testQuery.value.trim();
            if (query) {
                this.testQuery(query);
            }
        });

        testQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = testQuery.value.trim();
                if (query) {
                    this.testQuery(query);
                }
            }
        });
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/stats`);
            const data = await response.json();

            document.getElementById('totalDocs').textContent = data.totalDocuments;
            
            // Calculate today's uploads
            const today = new Date().toISOString().split('T')[0];
            const todayUploads = data.uploadsByDate[today] || 0;
            document.getElementById('todayUploads').textContent = todayUploads;

            // File type counts
            document.getElementById('pdfCount').textContent = data.fileTypes.pdf || 0;
            document.getElementById('docxCount').textContent = data.fileTypes.docx || 0;

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showAlert('Error loading statistics', 'error');
        }
    }

    async loadDocuments() {
        try {
            const response = await fetch(`${this.baseUrl}/api/documents`);
            const documents = await response.json();

            const documentsList = document.getElementById('documentsList');
            
            if (documents.length === 0) {
                documentsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No documents uploaded yet.</p>';
                return;
            }

            documentsList.innerHTML = documents.map(doc => `
                <div class="document-item">
                    <div class="document-info">
                        <i class="document-icon ${this.getFileIcon(doc.type)}"></i>
                        <div class="document-details">
                            <h4>${doc.filename}</h4>
                            <p>${doc.chunks.length} chunks • Uploaded: ${new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn btn-info" onclick="adminPanel.viewDocument('${doc.filename}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-danger" onclick="adminPanel.deleteDocument('${doc.filename}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading documents:', error);
            this.showAlert('Error loading documents', 'error');
        }
    }

    getFileIcon(type) {
        const icons = {
            pdf: 'fas fa-file-pdf',
            docx: 'fas fa-file-word',
            txt: 'fas fa-file-alt',
            xlsx: 'fas fa-file-excel',
            csv: 'fas fa-file-csv'
        };
        return icons[type] || 'fas fa-file';
    }

    async handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['.pdf', '.docx', '.txt', '.xlsx', '.csv'];
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            return validTypes.includes(extension) && file.size <= 10 * 1024 * 1024; // 10MB
        });

        if (validFiles.length === 0) {
            this.showAlert('No valid files selected. Please select PDF, DOCX, TXT, XLSX, or CSV files under 10MB.', 'error');
            return;
        }

        for (const file of validFiles) {
            await this.uploadFile(file);
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('document', file);

        const progressElement = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        try {
            progressElement.style.display = 'block';
            progressText.textContent = `Uploading ${file.name}...`;

            const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                progressFill.style.width = '100%';
                progressText.textContent = `✓ ${file.name} uploaded successfully (${result.chunks} chunks)`;
                
                this.showAlert(`Successfully uploaded ${file.name} with ${result.chunks} chunks`, 'success');
                
                // Reload stats and documents
                setTimeout(() => {
                    this.loadStats();
                    this.loadDocuments();
                    progressElement.style.display = 'none';
                    progressFill.style.width = '0%';
                }, 2000);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            progressText.textContent = `✗ Error uploading ${file.name}`;
            this.showAlert(`Error uploading ${file.name}: ${error.message}`, 'error');
            
            setTimeout(() => {
                progressElement.style.display = 'none';
                progressFill.style.width = '0%';
            }, 3000);
        }
    }

    async testQuery(query) {
        const testBtn = document.getElementById('testBtn');
        const testResults = document.getElementById('testResults');
        
        testBtn.innerHTML = '<div class="loading"></div> Testing...';
        testBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseUrl}/api/admin/test-query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            if (data.results.length === 0) {
                testResults.innerHTML = `
                    <div class="alert alert-info">
                        <strong>Query:</strong> "${query}"<br>
                        <strong>Result:</strong> No relevant documents found.
                    </div>
                `;
            } else {
                testResults.innerHTML = `
                    <div class="alert alert-success">
                        <strong>Query:</strong> "${query}"<br>
                        <strong>Found:</strong> ${data.results.length} relevant documents
                    </div>
                    ${data.results.map((result, index) => `
                        <div class="result-item">
                            <div class="result-header">
                                <strong>${result.filename}</strong>
                                <span class="similarity-score">${(result.similarity * 100).toFixed(1)}% match</span>
                            </div>
                            <p>${result.content}</p>
                        </div>
                    `).join('')}
                `;
            }

            testResults.classList.add('show');

        } catch (error) {
            console.error('Test query error:', error);
            testResults.innerHTML = `
                <div class="alert alert-error">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
            testResults.classList.add('show');
        } finally {
            testBtn.innerHTML = '<i class="fas fa-play"></i> Test';
            testBtn.disabled = false;
        }
    }

    viewDocument(filename) {
        // This could open a modal or navigate to a detailed view
        this.showAlert(`Viewing ${filename} - Feature coming soon!`, 'info');
    }

    async deleteDocument(filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"? This will remove all chunks of this document.`)) {
            return;
        }

        try {
            // Note: This is a simplified deletion - in a real system, you'd need to handle chunk deletion properly
            this.showAlert('Document deletion feature needs to be implemented with chunk management', 'info');
        } catch (error) {
            console.error('Delete error:', error);
            this.showAlert(`Error deleting ${filename}: ${error.message}`, 'error');
        }
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();
