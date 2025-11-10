// Side panel JavaScript for Arc Sidebar

// State management
let currentWindowId = null;
let tabs = [];
let pinnedTabs = [];
let spaces = [];
let currentSpaceId = null;
let tabSpaceMap = {};
let pinnedTabsData = {};
let spaceModal = null;
let contextMenu = null;
let toast = null;

// Initialize
async function init() {
  try {
    // Get current window
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentWindowId = currentTab.windowId;

    // Initialize storage
    await initializeStorage();

    // Initialize UI components
    spaceModal = new SpaceModal();
    spaceModal.init();

    contextMenu = new ContextMenu();
    contextMenu.init();

    toast = new Toast();
    toast.init();

    // Load spaces and current space
    await loadSpaces();

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

// Load spaces from storage
async function loadSpaces() {
  try {
    spaces = await getSpaces();
    currentSpaceId = await getCurrentSpace();

    // If no current space, set to first space
    if (!currentSpaceId && spaces.length > 0) {
      currentSpaceId = spaces[0].id;
      await setCurrentSpace(currentSpaceId);
    }

    renderSpaces();
    updateSpaceName();
  } catch (error) {
    console.error('Error loading spaces:', error);
  }
}

// Render space icons at bottom
function renderSpaces() {
  const spacesList = document.getElementById('spaces-list');
  const addBtn = document.getElementById('add-space-btn');

  // Clear only space icons, keep the add button
  const icons = spacesList.querySelectorAll('.space-icon');
  icons.forEach(icon => icon.remove());

  spaces.forEach(space => {
    const spaceIcon = document.createElement('div');
    spaceIcon.className = 'space-icon';
    spaceIcon.textContent = space.icon;
    spaceIcon.title = space.name;
    spaceIcon.dataset.spaceId = space.id;

    if (space.id === currentSpaceId) {
      spaceIcon.classList.add('active');
    }

    // Click to switch space
    spaceIcon.addEventListener('click', () => switchSpace(space.id));

    // Right-click for context menu
    spaceIcon.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showSpaceContextMenu(e, space);
    });

    // Insert before the add button
    spacesList.insertBefore(spaceIcon, addBtn);
  });
}

// Update space name display
function updateSpaceName() {
  const currentSpace = spaces.find(s => s.id === currentSpaceId);
  const spaceNameEl = document.getElementById('space-name');

  if (currentSpace) {
    spaceNameEl.textContent = currentSpace.name;
  }
}

// Switch to a different space
async function switchSpace(spaceId) {
  try {
    currentSpaceId = spaceId;
    await setCurrentSpace(spaceId);

    // Update UI
    renderSpaces();
    updateSpaceName();
    await loadTabs();
  } catch (error) {
    console.error('Error switching space:', error);
  }
}

// Show space context menu
function showSpaceContextMenu(event, space) {
  const menuItems = [
    { label: 'Edit Space', action: 'edit' },
    { type: 'divider' },
    { label: 'Delete Space', action: 'delete', danger: true }
  ];

  contextMenu.show(event.clientX, event.clientY, menuItems, space, handleSpaceContextAction);
}

// Handle space context menu actions
async function handleSpaceContextAction(action, space) {
  if (action === 'edit') {
    openEditSpaceModal(space);
  } else if (action === 'delete') {
    handleDeleteSpace(space.id, space);
  }
}

// Open edit space modal
function openEditSpaceModal(space) {
  spaceModal.open('edit', space, async (data) => {
    try {
      await updateSpace(data.spaceId, { name: data.name, icon: data.icon });
      await loadSpaces();
      toast.show(`Space renamed to "${data.name}"`);
    } catch (error) {
      console.error('Error updating space:', error);
      alert('Failed to update space');
    }
  });
}

// Handle space deletion
async function handleDeleteSpace(spaceId, spaceData) {
  try {
    // Store backup for undo
    const backupSpace = { ...spaceData };
    const oldSpaces = [...spaces];
    const oldCurrentSpace = currentSpaceId;

    // Delete space
    spaces = await deleteSpace(spaceId);
    currentSpaceId = await getCurrentSpace();

    // Refresh UI
    await loadSpaces();
    await loadTabs();

    // Show undo toast
    toast.show(
      `Deleted space "${backupSpace.name}"`,
      async () => {
        // Undo deletion
        try {
          // Restore the space
          await chrome.storage.sync.set({
            [STORAGE_KEYS.SPACES]: oldSpaces,
            [STORAGE_KEYS.CURRENT_SPACE]: oldCurrentSpace
          });

          // Refresh UI
          await loadSpaces();
          await loadTabs();

          toast.show(`Restored space "${backupSpace.name}"`);
        } catch (error) {
          console.error('Error undoing deletion:', error);
          alert('Failed to undo deletion');
        }
      },
      5000
    );
  } catch (error) {
    toast.show(error.message);
    console.error('Error deleting space:', error);
  }
}

// Load all tabs from current window
async function loadTabs() {
  try {
    // Get all tabs in current window
    const allTabs = await chrome.tabs.query({ windowId: currentWindowId });

    // Get tab-space mapping and pinned tabs data
    tabSpaceMap = await getTabSpaceMap();
    pinnedTabsData = await getPinnedTabs();

    // Get valid space IDs
    const validSpaceIds = spaces.map(s => s.id);

    // Assign tabs to current space if they don't have a space or their space was deleted
    for (const tab of allTabs) {
      const mappedSpace = tabSpaceMap[tab.id];

      // If tab has no space or is mapped to a deleted space, assign to current space
      if (!mappedSpace || !validSpaceIds.includes(mappedSpace)) {
        tabSpaceMap[tab.id] = currentSpaceId;
        await setTabSpace(tab.id, currentSpaceId);
      }
    }

    // Separate pinned and unpinned tabs for current space
    const currentSpaceTabs = allTabs.filter(tab => tabSpaceMap[tab.id] === currentSpaceId);

    // Get pinned tabs for current space (including closed ones)
    const currentSpacePinnedData = Object.entries(pinnedTabsData)
      .filter(([_, data]) => data.spaceId === currentSpaceId)
      .map(([tabId, data]) => ({
        ...data,
        tabId: tabId,
        isOpen: currentSpaceTabs.some(t => t.id.toString() === tabId)
      }));

    // Add open tab data to pinned tabs
    pinnedTabs = currentSpacePinnedData.map(pinData => {
      const openTab = currentSpaceTabs.find(t => t.id.toString() === pinData.tabId);
      return openTab ? { ...openTab, ...pinData, isPinned: true } : { ...pinData, isPinned: true };
    });

    // Unpinned tabs are tabs not in pinnedTabsData
    tabs = currentSpaceTabs.filter(tab => !pinnedTabsData[tab.id]);

    renderTabs();
  } catch (error) {
    console.error('Error loading tabs:', error);
  }
}

// Render tabs in the sidebar
function renderTabs() {
  const pinnedContainer = document.getElementById('pinned-tabs');
  const unpinnedContainer = document.getElementById('unpinned-tabs');

  pinnedContainer.innerHTML = '';
  unpinnedContainer.innerHTML = '';

  // Render pinned tabs
  pinnedTabs.forEach(tab => {
    const tabElement = createTabElement(tab, true);
    pinnedContainer.appendChild(tabElement);
  });

  // Render unpinned tabs
  tabs.forEach(tab => {
    const tabElement = createTabElement(tab, false);
    unpinnedContainer.appendChild(tabElement);
  });
}

// Create a tab element
function createTabElement(tab, isPinned = false) {
  const tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  tabItem.dataset.tabId = tab.id || tab.tabId;

  // Check if tab is closed (for pinned tabs)
  const isClosed = isPinned && !tab.isOpen;

  if (isClosed) {
    tabItem.classList.add('closed');
  }

  if (tab.active && !isClosed) {
    tabItem.classList.add('active');
  }

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'tab-favicon';
  const iconUrl = tab.favIconUrl || tab.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e8eaed"/></svg>';
  favicon.src = iconUrl;
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e8eaed"/></svg>';
  };

  // Title
  const title = document.createElement('div');
  title.className = 'tab-title';
  title.textContent = tab.title || tab.url || 'New Tab';
  title.title = tab.title || tab.url || 'New Tab';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.textContent = '×';
  closeBtn.title = isClosed ? 'Unpin tab' : 'Close tab';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    if (isPinned && isClosed) {
      unpinTab(tab.tabId);
    } else {
      closeTab(tab.id);
    }
  };

  tabItem.appendChild(favicon);
  tabItem.appendChild(title);
  tabItem.appendChild(closeBtn);

  // Click to switch to tab (or reopen if closed pinned tab)
  tabItem.onclick = () => {
    if (isClosed) {
      reopenPinnedTab(tab);
    } else {
      switchToTab(tab.id);
    }
  };

  // Right-click for context menu
  tabItem.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isPinned) {
      showPinnedTabContextMenu(e, tab);
    } else {
      showTabContextMenu(e, tab);
    }
  });

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
    await removeTabFromMap(tabId);
  } catch (error) {
    console.error('Error closing tab:', error);
  }
}

// Create new tab
async function createNewTab() {
  try {
    const newTab = await chrome.tabs.create({ windowId: currentWindowId });
    await setTabSpace(newTab.id, currentSpaceId);
  } catch (error) {
    console.error('Error creating new tab:', error);
  }
}

// Show tab context menu
function showTabContextMenu(event, tab) {
  const menuItems = [
    { label: 'Copy Link', action: 'copy' }
  ];

  // Add "Move to Space" submenu if there are other spaces
  const otherSpaces = spaces.filter(s => s.id !== currentSpaceId);
  if (otherSpaces.length > 0) {
    menuItems.push({ type: 'divider' });
    menuItems.push({ label: 'Move to Space ›', action: 'move-space-menu' });
  }

  menuItems.push({ type: 'divider' });
  menuItems.push({ label: 'Pin Tab', action: 'pin' });
  menuItems.push({ type: 'divider' });
  menuItems.push({ label: 'Close Tab', action: 'close', danger: true });

  contextMenu.show(event.clientX, event.clientY, menuItems, tab, handleTabContextAction);
}

// Handle tab context menu actions
async function handleTabContextAction(action, tab) {
  if (action === 'copy') {
    await copyTabLink(tab);
  } else if (action === 'move-space-menu') {
    showMoveToSpaceMenu(tab);
  } else if (action === 'pin') {
    await pinTab(tab);
  } else if (action === 'close') {
    await closeTab(tab.id);
  }
}

// Pin a tab
async function pinTab(tab) {
  try {
    await setPinnedTab(tab.id.toString(), {
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl,
      spaceId: currentSpaceId,
      order: pinnedTabs.length,
      createdAt: Date.now()
    });
    await loadTabs();
    toast.show('Tab pinned');
  } catch (error) {
    console.error('Error pinning tab:', error);
    toast.show('Failed to pin tab');
  }
}

// Unpin a tab
async function unpinTab(tabId) {
  try {
    await removePinnedTab(tabId);
    await loadTabs();
    toast.show('Tab unpinned');
  } catch (error) {
    console.error('Error unpinning tab:', error);
    toast.show('Failed to unpin tab');
  }
}

// Reopen a closed pinned tab
async function reopenPinnedTab(tab) {
  try {
    const newTab = await chrome.tabs.create({
      windowId: currentWindowId,
      url: tab.url
    });
    await setTabSpace(newTab.id, currentSpaceId);
    // Update pinned tab data with new tab ID
    await removePinnedTab(tab.tabId);
    await setPinnedTab(newTab.id.toString(), {
      url: tab.url,
      title: tab.title,
      favicon: tab.favicon,
      spaceId: currentSpaceId,
      order: tab.order,
      createdAt: tab.createdAt
    });
    await loadTabs();
  } catch (error) {
    console.error('Error reopening pinned tab:', error);
    toast.show('Failed to reopen tab');
  }
}

// Show pinned tab context menu
function showPinnedTabContextMenu(event, tab) {
  const menuItems = [
    { label: 'Copy Link', action: 'copy' }
  ];

  // Add "Move to Space" submenu if there are other spaces
  const otherSpaces = spaces.filter(s => s.id !== currentSpaceId);
  if (otherSpaces.length > 0) {
    menuItems.push({ type: 'divider' });
    menuItems.push({ label: 'Move to Space ›', action: 'move-space-menu' });
  }

  menuItems.push({ type: 'divider' });
  menuItems.push({ label: 'Edit URL', action: 'edit-url' });
  menuItems.push({ label: 'Update URL', action: 'update-url' });
  menuItems.push({ type: 'divider' });
  menuItems.push({ label: 'Unpin Tab', action: 'unpin' });
  if (tab.isOpen) {
    menuItems.push({ label: 'Close Tab', action: 'close', danger: true });
  }

  contextMenu.show(event.clientX, event.clientY, menuItems, tab, handlePinnedTabContextAction);
}

// Handle pinned tab context menu actions
async function handlePinnedTabContextAction(action, tab) {
  if (action === 'copy') {
    await copyTabLink(tab);
  } else if (action === 'move-space-menu') {
    showMoveToSpaceMenu(tab);
  } else if (action === 'edit-url') {
    toast.show('Edit URL coming soon');
  } else if (action === 'update-url') {
    toast.show('Update URL coming soon');
  } else if (action === 'unpin') {
    await unpinTab(tab.tabId);
  } else if (action === 'close') {
    await closeTab(tab.id);
  }
}

// Copy tab link to clipboard
async function copyTabLink(tab) {
  try {
    await navigator.clipboard.writeText(tab.url);
    toast.show('Link copied to clipboard');
  } catch (error) {
    console.error('Error copying link:', error);
    toast.show('Failed to copy link');
  }
}

// Show "Move to Space" submenu
function showMoveToSpaceMenu(tab) {
  const otherSpaces = spaces.filter(s => s.id !== currentSpaceId);
  const spaceItems = otherSpaces.map(space => ({
    label: `${space.icon} ${space.name}`,
    action: `move-to-${space.id}`
  }));

  // Calculate position for submenu (to the right of the main menu)
  const mainMenu = document.getElementById('context-menu');
  const rect = mainMenu.getBoundingClientRect();

  contextMenu.show(
    rect.right + 5,
    rect.top,
    spaceItems,
    tab,
    async (action, tabData) => {
      // Extract space ID from action string
      if (action.startsWith('move-to-')) {
        const spaceId = action.replace('move-to-', '');
        await moveTabToSpace(tabData.id, spaceId);
      }
    }
  );
}

// Move tab to different space
async function moveTabToSpace(tabId, targetSpaceId) {
  try {
    await setTabSpace(tabId, targetSpaceId);
    await loadTabs();

    const targetSpace = spaces.find(s => s.id === targetSpaceId);
    toast.show(`Moved tab to "${targetSpace.name}"`);
  } catch (error) {
    console.error('Error moving tab:', error);
    toast.show('Failed to move tab');
  }
}

// Open space creation modal
function openCreateSpaceModal() {
  spaceModal.open('create', null, async (data) => {
    try {
      const newSpace = await createSpace(data.name, data.icon);
      await loadSpaces();
    } catch (error) {
      console.error('Error creating space:', error);
      alert('Failed to create space');
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // New tab button
  document.getElementById('new-tab-btn').addEventListener('click', createNewTab);

  // Add space button
  document.getElementById('add-space-btn').addEventListener('click', openCreateSpaceModal);
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
