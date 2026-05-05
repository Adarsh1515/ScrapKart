// Scrapkart Chatbot Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Chatbot HTML
    const chatbotHTML = `
        <!-- Floating Button -->
        <div class="chatbot-fab" id="chatbot-fab">
            <i class="fas fa-comment-dots"></i>
            <i class="fas fa-times"></i>
        </div>

        <!-- Chat Window -->
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-header-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="chatbot-header-info">
                    <h3>Scrapkart Assistant</h3>
                    <p><span class="status-dot"></span> Online</p>
                </div>
            </div>
            
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- Messages will be injected here -->
            </div>
            
            <div class="chatbot-input-area">
                <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type a message..." autocomplete="off">
                <button id="chatbot-send-btn" class="chatbot-send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // 2. DOM Elements
    const fab = document.getElementById('chatbot-fab');
    const window = document.getElementById('chatbot-window');
    const messagesContainer = document.getElementById('chatbot-messages');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');

    // 3. Gemini API Setup
    // IMPORTANT: Replace this with your actual Google Gemini API key
    const GEMINI_API_KEY = 'AIzaSyDQ2ubCzT99kCXNvCYiu9kxp8bWhxi1KCg';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let chatHistory = [
        {
            role: "user",
            parts: [{ text: "You are the Scrapkart Assistant, an AI chatbot for a platform called Scrapkart. Scrapkart is a platform where users can sell their scrap (Paper, Plastic, Metal, E-Waste), get paid in a wallet, and buy recycled handicraft products. Be helpful, concise, and friendly. Answer questions about how to use the platform. Use emojis occasionally." }]
        },
        {
            role: "model",
            parts: [{ text: "I understand! I am the Scrapkart Assistant and will help users with the platform." }]
        }
    ];

    // 4. Toggle Chat Window
    let isChatOpen = false;
    let isFirstOpen = true;

    fab.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            fab.classList.add('active');
            window.classList.add('active');
            inputField.focus();

            // Show welcome message on first open
            if (isFirstOpen) {
                setTimeout(() => {
                    addBotMessage("Hi! I'm the Scrapkart Assistant. How can I help you today?", [
                        "How to sell scrap?",
                        "How to buy products?",
                        "What is Scrapkart Wallet?"
                    ]);
                }, 300);
                isFirstOpen = false;
            }
        } else {
            fab.classList.remove('active');
            window.classList.remove('active');
        }
    });

    // 5. Message Handling Logic
    function addUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg user';
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function addBotMessage(text, options = []) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg bot';

        // Format basic markdown (bold, italics, newlines)
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedText = formattedText.replace(/\n/g, '<br>');
        msgDiv.innerHTML = formattedText;

        // Add options if provided
        if (options.length > 0) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'chat-options';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'chat-option-btn';
                btn.textContent = opt;
                btn.onclick = () => {
                    handleUserInput(opt);
                };
                optionsDiv.appendChild(btn);
            });
            msgDiv.appendChild(optionsDiv);
        }

        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
        return indicator;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function getGeminiResponse(text) {
        if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return "Please configure your Gemini API key in `chatbot.js` to enable AI features.";
        }

        chatHistory.push({ role: "user", parts: [{ text: text }] });

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ contents: chatHistory })
            });

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const botReply = data.candidates[0].content.parts[0].text;
                chatHistory.push({ role: "model", parts: [{ text: botReply }] });
                return botReply;
            } else if (data.error) {
                console.error("Gemini API Error Details:", data.error);
                return `API Error: ${data.error.message || 'Unknown API Error'}`;
            } else {
                console.error("Gemini API Error:", data);
                return "I'm sorry, I encountered an error processing your request.";
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            return "Network error. Please check your connection.";
        }
    }

    async function handleUserInput(text) {
        if (!text.trim()) return;

        // Clear input field if it was typed
        inputField.value = '';

        // Show user message
        addUserMessage(text);

        // Show typing indicator
        showTypingIndicator();

        // Call Gemini API
        const response = await getGeminiResponse(text);

        removeTypingIndicator();
        addBotMessage(response);
    }

    // 6. Event Listeners for sending
    sendBtn.addEventListener('click', () => {
        handleUserInput(inputField.value);
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput(inputField.value);
        }
    });
});
