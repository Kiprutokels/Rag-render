class ChatInterface {
    constructor() {
        this.baseUrl = window.location.origin;
        this.messages = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.focusInput();
    }

    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');

        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button click
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Suggestion buttons
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                messageInput.value = query;
                this.sendMessage();
            });
        });

        // Auto-resize input (optional enhancement)
        messageInput.addEventListener('input', () => {
            this.adjustInputHeight();
        });
    }

    focusInput() {
        document.getElementById('messageInput').focus();
    }

    adjustInputHeight() {
        const input = document.getElementById('messageInput');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and disable send button
        messageInput.value = '';
        this.adjustInputHeight();
        this.setLoading(true);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Prepare messages for API
            const apiMessages = [
                ...this.messages,
                { role: 'user', content: message }
            ];

            // Send to API
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            // Add bot response
            this.addMessage(data.message.content, 'bot', data.context);

            // Update messages history
            this.messages.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.message.content }
            );

            // Keep only last 10 messages for context
            if (this.messages.length > 10) {
                this.messages = this.messages.slice(-10);
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                `Sorry, I encountered an error: ${error.message}. Please try again.`,
                'bot',
                null,
                true
            );
        } finally {
            this.setLoading(false);
            this.focusInput();
        }
    }

    addMessage(content, sender, context = null, isError = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        
        let sourcesHtml = '';
        if (context && context.documentsUsed && context.documentsUsed.length > 0) {
            sourcesHtml = `
                <div class="message-sources">
                    <div class="sources-title">📚 Sources used:</div>
                    ${context.documentsUsed.map(doc => `
                        <div class="source-item">
                            ${doc.filename} (${(doc.similarity * 100).toFixed(1)}% relevance)
                        </div>
                    `).join('')}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content ${isError ? 'error-message' : ''}">
                <p>${this.formatMessage(content)}</p>
                ${sourcesHtml}
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Basic formatting for better readability
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'none';
    }

    setLoading(loading) {
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        sendButton.disabled = loading;
        messageInput.disabled = loading;
        
        if (loading) {
            sendButton.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Add loading spinner CSS
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff40;
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize chat interface
const chatInterface = new ChatInterface();
