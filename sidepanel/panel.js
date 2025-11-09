// Side panel JavaScript for Arc Sidebar

// State management
let currentWindowId = null;
let tabs = [];

// Initialize
async function init() {
  try {
    // Get current window
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentWindowId = currentTab.windowId;

    // Load tabs
    await loadTabs();

    // Set up event listeners
    setupEventListeners();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Load all tabs from current window
async function loadTabs() {
  try {
    tabs = await chrome.tabs.query({ windowId: currentWindowId });
    renderTabs();
  } catch (error) {
    console.error('Error loading tabs:', error);
  }
}

// Render tabs in the sidebar
function renderTabs() {
  const unpinnedContainer = document.getElementById('unpinned-tabs');
  unpinnedContainer.innerHTML = '';

  tabs.forEach(tab => {
    const tabElement = createTabElement(tab);
    unpinnedContainer.appendChild(tabElement);
  });
}

// Create a tab element
function createTabElement(tab) {
  const tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  tabItem.dataset.tabId = tab.id;

  if (tab.active) {
    tabItem.classList.add('active');
  }

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'tab-favicon';
  favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e8eaed"/></svg>';
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e8eaed"/></svg>';
  };

  // Title
  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || 'New Tab';
  title.title = tab.title || 'New Tab';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Close tab';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeTab(tab.id);
  };

  tabItem.appendChild(favicon);
  tabItem.appendChild(title);
  tabItem.appendChild(closeBtn);

  // Click to switch to tab
  tabItem.onclick = () => switchToTab(tab.id);

  return tabItem;
}

// Switch to a tab
async function switchToTab(tabId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
  } catch (error) {
    console.error('Error switching to tab:', error);
  }
}

// Close a tab
async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
  } catch (error) {
    console.error('Error closing tab:', error);
  }
}

// Create new tab
async function createNewTab() {
  try {
    await chrome.tabs.create({ windowId: currentWindowId });
  } catch (error) {
    console.error('Error creating new tab:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // New tab button
  document.getElementById('new-tab-btn').addEventListener('click', createNewTab);
}

// Handle messages from background script
function handleBackgroundMessage(message) {
  switch (message.type) {
    case 'TAB_CREATED':
    case 'TAB_REMOVED':
    case 'TAB_UPDATED':
    case 'TAB_ACTIVATED':
    case 'TAB_MOVED':
      loadTabs();
      break;
  }
}

// Start the application
init();
