// Side panel JavaScript for Arc Sidebar

// State management
let currentWindowId = null;
let tabs = [];
let spaces = [];
let currentSpaceId = null;
let tabSpaceMap = {};
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

    // Get tab-space mapping
    tabSpaceMap = await getTabSpaceMap();

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

    // Filter tabs for current space
    tabs = allTabs.filter(tab => tabSpaceMap[tab.id] === currentSpaceId);

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
