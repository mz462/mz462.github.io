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
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    // Auto-resize textarea
    input.oninput = () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    };

    // Initial render
    renderMessages();
  }

  // Toggle sidebar
  function toggleSidebar() {
    isOpen = !isOpen;
    const sidebar = document.getElementById("mjlm-sidebar");
    if (isOpen) {
      sidebar.classList.add("open");
      document.getElementById("mjlm-input").focus();
    } else {
      sidebar.classList.remove("open");
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
      html += `<div class="mjlm-message ${msg.role}">${escapeHtml(msg.content)}</div>`;

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
