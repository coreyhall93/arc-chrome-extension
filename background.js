// Background service worker for Arc Sidebar extension

// Enable side panel on extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Arc Sidebar extension installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for tab events to keep sidebar in sync
chrome.tabs.onCreated.addListener((tab) => {
  notifySidePanel({ type: 'TAB_CREATED', tab });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  notifySidePanel({ type: 'TAB_UPDATED', tabId, changeInfo, tab });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  notifySidePanel({ type: 'TAB_REMOVED', tabId, removeInfo });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  notifySidePanel({ type: 'TAB_ACTIVATED', activeInfo });
});

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  notifySidePanel({ type: 'TAB_MOVED', tabId, moveInfo });
});

// Helper function to send messages to side panel
function notifySidePanel(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open, ignore error
  });
}
