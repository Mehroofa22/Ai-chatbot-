// Select DOM Elements
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");
const newChat = document.getElementById("newChat");

let typingIndicator = null;

// Escapes HTML tags to prevent XSS vulnerabilities
function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Parses basic Markdown structures (code blocks, inline code, bold, line breaks)
function parseMarkdown(text) {
    let escaped = escapeHTML(text);

    // 1. Code blocks: ```language \n code ```
    escaped = escaped.replace(/```([\s\S]+?)```/g, function(match, code) {
        const firstLineEnd = code.indexOf('\n');
        let displayCode = code;
        if (firstLineEnd !== -1) {
            const langCandidate = code.substring(0, firstLineEnd).trim();
            // Check if first line is a language tag (no whitespace, letters/numbers only)
            if (/^[a-zA-Z0-9_-]+$/.test(langCandidate)) {
                displayCode = code.substring(firstLineEnd + 1);
            }
        }
        return `<pre><code>${displayCode.trim()}</code></pre>`;
    });

    // 2. Inline code: `code`
    escaped = escaped.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

    // 3. Bold text: **bold**
    escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

    // 4. Line breaks: \n
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

// Appends a user message to the chat
function appendUserMessage(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user";
    wrapper.innerHTML = `
        <div class="avatar">👤</div>
        <div class="message-content">${escapeHTML(message)}</div>
    `;
    chatBox.appendChild(wrapper);
}

// Appends a bot response to the chat
function appendBotMessage(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot";
    wrapper.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">${parseMarkdown(message)}</div>
    `;
    chatBox.appendChild(wrapper);
}

// Appends an error message to the chat
function appendErrorMessage(message) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot error";
    wrapper.innerHTML = `
        <div class="avatar">⚠️</div>
        <div class="message-content"><strong>Connection Error:</strong> ${escapeHTML(message)}</div>
    `;
    chatBox.appendChild(wrapper);
}

// Controls input & send button accessibility during generation
function setInputState(disabled) {
    input.disabled = disabled;
    sendBtn.disabled = disabled;
    if (disabled) {
        sendBtn.style.opacity = "0.5";
        sendBtn.style.cursor = "not-allowed";
    } else {
        sendBtn.style.opacity = "1";
        sendBtn.style.cursor = "pointer";
        input.focus();
    }
}

// Shows the typing animation
function showTypingIndicator() {
    if (typingIndicator) return;
    typingIndicator = document.createElement("div");
    typingIndicator.className = "message-wrapper bot";
    typingIndicator.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Hides the typing animation
function removeTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicator = null;
    }
}

// Main logic for sending message and retrieving reply
async function sendMessage() {
    const message = input.value.trim();
    if (message === "") return;

    // 1. Render user message & clear input
    appendUserMessage(message);
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // 2. Show typing indicator & block input
    setInputState(true);
    showTypingIndicator();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: message })
        });

        removeTypingIndicator();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.reply || `Status Code: ${response.status}`);
        }

        const data = await response.json();
        appendBotMessage(data.reply);

    } catch (error) {
        removeTypingIndicator();
        appendErrorMessage(error.message);
    } finally {
        setInputState(false);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Event Listeners
sendBtn.onclick = sendMessage;

input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

newChat.onclick = function() {
    chatBox.innerHTML = `
        <div class="message-wrapper bot">
            <div class="avatar">🤖</div>
            <div class="message-content">
                👋 Hello! I'm <strong>Nexa AI</strong>, a next-generation assistant powered by Google Gemini. How can I help you today?
            </div>
        </div>
    `;
    input.value = "";
    input.focus();
};

// Focus input on load
window.onload = function() {
    input.focus();
};