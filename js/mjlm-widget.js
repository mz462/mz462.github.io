/**
 * MJLM Chat Widget
 * A slide-in sidebar chatbot for MJ's Blog
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    apiUrl: "https://mjlm-api.kelvinzou.workers.dev/api/chat",
    storageKey: "mjlm-history",
    maxHistory: 10,
  };

  // Initial suggested questions
  const INITIAL_QUESTIONS = [
    "What does MJ think about context engineering?",
    "What are MJ's views on AI product management?",
    "Tell me about LLM limitations MJ has written about",
  ];

  // State
  let isOpen = false;
  let isLoading = false;
  let history = [];
  let currentSuggestions = INITIAL_QUESTIONS;

  // Load history from localStorage
  function loadHistory() {
    try {
      const saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) {
        history = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("MJLM: Could not load history", e);
    }
  }

  // Save history to localStorage
  function saveHistory() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(history.slice(-CONFIG.maxHistory)));
    } catch (e) {
      console.warn("MJLM: Could not save history", e);
    }
  }

  // Clear history
  function clearHistory() {
    history = [];
    localStorage.removeItem(CONFIG.storageKey);
    currentSuggestions = INITIAL_QUESTIONS;
    renderMessages();
  }

  // Create DOM structure
  function createWidget() {
    // Toggle button
    const toggle = document.createElement("button");
    toggle.className = "mjlm-toggle";
    toggle.innerHTML = `<span class="mjlm-toggle-icon">✦</span> MJLM`;
    toggle.onclick = toggleSidebar;

    // Sidebar
    const sidebar = document.createElement("div");
    sidebar.className = "mjlm-sidebar";
    sidebar.id = "mjlm-sidebar";
    sidebar.innerHTML = `
      <div class="mjlm-header">
        <div class="mjlm-title">
          <span>✦</span> MJLM
        </div>
        <div class="mjlm-header-actions">
          <button class="mjlm-header-btn" id="mjlm-clear" title="Clear chat">↺</button>
          <button class="mjlm-header-btn" id="mjlm-close" title="Close">×</button>
        </div>
      </div>
      <div class="mjlm-messages" id="mjlm-messages"></div>
      <div class="mjlm-input-area">
        <div class="mjlm-input-wrapper">
          <textarea
            class="mjlm-input"
            id="mjlm-input"
            placeholder="Ask about MJ's posts..."
            rows="1"
          ></textarea>
          <button class="mjlm-send" id="mjlm-send" title="Send">↑</button>
        </div>
      </div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(sidebar);

    // Event listeners
    document.getElementById("mjlm-close").onclick = toggleSidebar;
    document.getElementById("mjlm-clear").onclick = clearHistory;
    document.getElementById("mjlm-send").onclick = sendMessage;

    const input = document.getElementById("mjlm-input");
    const sendBtn = document.getElementById("mjlm-send");

    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    // Auto-resize textarea + send button state + caret tracking
    input.oninput = () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";

      // Toggle send button "has-text" state
      if (input.value.trim()) {
        sendBtn.classList.add("has-text");
      } else {
        sendBtn.classList.remove("has-text");
      }

      // Update fake caret position
      updateCaretPosition();
    };

    // Track caret on selection change
    input.onselect = updateCaretPosition;
    input.onclick = updateCaretPosition;
    input.onkeyup = updateCaretPosition;

    // Focus/blur effects
    input.onfocus = () => {
      const caret = document.getElementById("mjlm-caret");
      if (caret) caret.classList.add("visible");
      updateCaretPosition();
    };

    input.onblur = () => {
      const caret = document.getElementById("mjlm-caret");
      if (caret) caret.classList.remove("visible");
    };

    // Initial render
    renderMessages();

    // Setup fancy caret
    setupFancyCaret();
  }

  // Setup fancy caret with glow effect
  function setupFancyCaret() {
    const inputWrapper = document.querySelector(".mjlm-input-wrapper");

    // Create caret element
    const caret = document.createElement("div");
    caret.className = "mjlm-caret";
    caret.id = "mjlm-caret";
    caret.innerHTML = '<div class="mjlm-caret-glow"></div>';

    // Create mirror element for measuring text
    const mirror = document.createElement("span");
    mirror.className = "mjlm-input-mirror";
    mirror.id = "mjlm-input-mirror";

    inputWrapper.appendChild(caret);
    inputWrapper.appendChild(mirror);
  }

  // Update fake caret position
  function updateCaretPosition() {
    const input = document.getElementById("mjlm-input");
    const mirror = document.getElementById("mjlm-input-mirror");
    const caret = document.getElementById("mjlm-caret");

    if (!input || !mirror || !caret) return;

    // Get text up to cursor
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);

    // Update mirror with text (replace spaces with non-breaking spaces for measurement)
    mirror.textContent = textBeforeCursor.replace(/ /g, "\u00a0") || "\u200b";

    // Get input styles
    const inputStyle = window.getComputedStyle(input);
    mirror.style.font = inputStyle.font;
    mirror.style.letterSpacing = inputStyle.letterSpacing;
    mirror.style.padding = inputStyle.padding;

    // Calculate position
    const inputRect = input.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const wrapperRect = input.parentElement.getBoundingClientRect();

    // Position caret
    let left = mirror.offsetWidth + parseInt(inputStyle.paddingLeft);
    const maxLeft = input.offsetWidth - parseInt(inputStyle.paddingRight) - 2;

    // Clamp to input bounds
    left = Math.min(left, maxLeft);
    left = Math.max(left, parseInt(inputStyle.paddingLeft));

    caret.style.left = left + "px";
    caret.style.top = parseInt(inputStyle.paddingTop) + "px";
    caret.style.height = parseInt(inputStyle.lineHeight) || 20 + "px";
  }

  // Toggle sidebar
  function toggleSidebar() {
    isOpen = !isOpen;
    const sidebar = document.getElementById("mjlm-sidebar");
    if (isOpen) {
      sidebar.classList.add("open");
      document.body.classList.add("mjlm-open");
      document.getElementById("mjlm-input").focus();
    } else {
      sidebar.classList.remove("open");
      document.body.classList.remove("mjlm-open");
    }
  }

  // Render messages
  function renderMessages() {
    const container = document.getElementById("mjlm-messages");

    if (history.length === 0) {
      // Show welcome + suggestions
      container.innerHTML = `
        <div class="mjlm-welcome">
          <h3>Ask me anything.</h3>
          <div class="mjlm-suggestions" id="mjlm-suggestions"></div>
        </div>
      `;
      renderSuggestions(currentSuggestions);
      return;
    }

    // Render conversation
    let html = "";
    for (const msg of history) {
      // Use markdown parsing for assistant messages, plain escape for user messages
      const content = msg.role === "assistant" ? parseMarkdown(msg.content) : escapeHtml(msg.content);
      html += `<div class="mjlm-message ${msg.role}">${content}</div>`;

      // Show sources after assistant messages
      if (msg.role === "assistant" && msg.sources && msg.sources.length > 0) {
        html += `
          <div class="mjlm-sources">
            <div class="mjlm-sources-title">Sources:</div>
            ${msg.sources.map((s) => `<a href="${s.url}" target="_blank" class="mjlm-source-link">${escapeHtml(s.title)}</a>`).join(", ")}
          </div>
        `;
      }
    }

    // Show follow-up suggestions after last assistant message
    if (currentSuggestions.length > 0 && history.length > 0 && history[history.length - 1].role === "assistant") {
      html += `<div class="mjlm-followups" id="mjlm-suggestions"></div>`;
    }

    container.innerHTML = html;

    // Render follow-up suggestions
    if (currentSuggestions.length > 0 && history.length > 0) {
      renderSuggestions(currentSuggestions, true);
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // Render suggestion buttons
  function renderSuggestions(questions, isFollowup = false) {
    const container = document.getElementById("mjlm-suggestions");
    if (!container) return;

    container.innerHTML = questions
      .map(
        (q) => `
        <button class="${isFollowup ? "mjlm-followup" : "mjlm-suggestion"}" onclick="window.mjlmAsk('${escapeHtml(q).replace(/'/g, "\\'")}')">
          ${isFollowup ? "" : '<span class="mjlm-suggestion-icon">↳</span>'}
          ${escapeHtml(q)}
        </button>
      `
      )
      .join("");
  }

  // Show loading state
  function showLoading() {
    const container = document.getElementById("mjlm-messages");
    const loading = document.createElement("div");
    loading.className = "mjlm-loading";
    loading.id = "mjlm-loading";
    loading.innerHTML = `
      <div class="mjlm-loading-dot"></div>
      <div class="mjlm-loading-dot"></div>
      <div class="mjlm-loading-dot"></div>
    `;
    container.appendChild(loading);
    container.scrollTop = container.scrollHeight;
  }

  // Hide loading state
  function hideLoading() {
    const loading = document.getElementById("mjlm-loading");
    if (loading) loading.remove();
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById("mjlm-input");
    const message = input.value.trim();

    if (!message || isLoading) return;

    isLoading = true;
    input.value = "";
    input.style.height = "auto";
    document.getElementById("mjlm-send").disabled = true;

    // Add user message
    history.push({ role: "user", content: message });
    renderMessages();
    showLoading();

    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-CONFIG.maxHistory),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message
      history.push({
        role: "assistant",
        content: data.response,
        sources: data.sources || [],
      });

      // Update suggestions
      currentSuggestions = data.suggestedQuestions || [];

      saveHistory();
    } catch (error) {
      console.error("MJLM error:", error);
      history.push({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    }

    isLoading = false;
    document.getElementById("mjlm-send").disabled = false;
    hideLoading();
    renderMessages();
  }

  // Helper: escape HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper: parse basic markdown to HTML
  function parseMarkdown(text) {
    // First escape HTML to prevent XSS
    let html = escapeHtml(text);

    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert `code` to <code>
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert unordered lists (lines starting with - or *)
    html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convert numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Convert paragraphs (double newlines)
    html = html.replace(/\n\n+/g, '</p><p>');

    // Convert single newlines to <br> (but not inside lists)
    html = html.replace(/(?<!<\/li>)\n(?!<)/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');

    return html;
  }

  // Global function for suggestion clicks
  window.mjlmAsk = function (question) {
    const input = document.getElementById("mjlm-input");
    input.value = question;
    sendMessage();
  };

  // Initialize
  function init() {
    loadHistory();
    createWidget();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
