// Storage management for Arc Sidebar extension

const STORAGE_KEYS = {
  SPACES: 'spaces',
  CURRENT_SPACE: 'currentSpace',
  PINNED_TABS: 'pinnedTabs',
  FAVORITES: 'favorites',
  FOLDERS: 'folders',
  TAB_SPACE_MAP: 'tabSpaceMap'
};

// Initialize default data structure
async function initializeStorage() {
  const data = await chrome.storage.sync.get([STORAGE_KEYS.SPACES, STORAGE_KEYS.CURRENT_SPACE]);

  // Create default space if none exists
  if (!data[STORAGE_KEYS.SPACES] || data[STORAGE_KEYS.SPACES].length === 0) {
    const defaultSpace = {
      id: generateId(),
      name: 'Personal',
      icon: '🏠',
      order: 0,
      createdAt: Date.now()
    };

    await chrome.storage.sync.set({
      [STORAGE_KEYS.SPACES]: [defaultSpace],
      [STORAGE_KEYS.CURRENT_SPACE]: defaultSpace.id,
      [STORAGE_KEYS.PINNED_TABS]: {},
      [STORAGE_KEYS.FAVORITES]: [],
      [STORAGE_KEYS.FOLDERS]: {},
      [STORAGE_KEYS.TAB_SPACE_MAP]: {}
    });

    return defaultSpace;
  }

  return null;
}

// Spaces operations
async function getSpaces() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS.SPACES);
  return data[STORAGE_KEYS.SPACES] || [];
}

async function getCurrentSpace() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS.CURRENT_SPACE);
  return data[STORAGE_KEYS.CURRENT_SPACE] || null;
}

async function setCurrentSpace(spaceId) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.CURRENT_SPACE]: spaceId });
}

async function createSpace(name, icon) {
  const spaces = await getSpaces();
  const newSpace = {
    id: generateId(),
    name: name,
    icon: icon,
    order: spaces.length,
    createdAt: Date.now()
  };

  spaces.push(newSpace);
  await chrome.storage.sync.set({ [STORAGE_KEYS.SPACES]: spaces });
  return newSpace;
}

async function updateSpace(spaceId, updates) {
  const spaces = await getSpaces();
  const index = spaces.findIndex(s => s.id === spaceId);

  if (index !== -1) {
    spaces[index] = { ...spaces[index], ...updates };
    await chrome.storage.sync.set({ [STORAGE_KEYS.SPACES]: spaces });
    return spaces[index];
  }

  return null;
}

async function deleteSpace(spaceId) {
  const spaces = await getSpaces();
  const currentSpace = await getCurrentSpace();

  // Prevent deleting the last space
  if (spaces.length <= 1) {
    throw new Error('Cannot delete the last space');
  }

  const filteredSpaces = spaces.filter(s => s.id !== spaceId);
  await chrome.storage.sync.set({ [STORAGE_KEYS.SPACES]: filteredSpaces });

  // If deleting current space, switch to first available
  if (currentSpace === spaceId) {
    await setCurrentSpace(filteredSpaces[0].id);
  }

  // Clean up related data (pinned tabs, folders, etc.)
  await cleanupSpaceData(spaceId);

  return filteredSpaces;
}

// Tab-Space mapping
async function getTabSpaceMap() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS.TAB_SPACE_MAP);
  return data[STORAGE_KEYS.TAB_SPACE_MAP] || {};
}

async function setTabSpace(tabId, spaceId) {
  const map = await getTabSpaceMap();
  map[tabId] = spaceId;
  await chrome.storage.sync.set({ [STORAGE_KEYS.TAB_SPACE_MAP]: map });
}

async function removeTabFromMap(tabId) {
  const map = await getTabSpaceMap();
  delete map[tabId];
  await chrome.storage.sync.set({ [STORAGE_KEYS.TAB_SPACE_MAP]: map });
}

async function getTabsForSpace(spaceId) {
  const map = await getTabSpaceMap();
  return Object.entries(map)
    .filter(([_, space]) => space === spaceId)
    .map(([tabId, _]) => parseInt(tabId));
}

// Pinned tabs operations
async function getPinnedTabs() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS.PINNED_TABS);
  return data[STORAGE_KEYS.PINNED_TABS] || {};
}

async function setPinnedTab(tabId, pinnedData) {
  const pinned = await getPinnedTabs();
  pinned[tabId] = pinnedData;
  await chrome.storage.sync.set({ [STORAGE_KEYS.PINNED_TABS]: pinned });
}

async function removePinnedTab(tabId) {
  const pinned = await getPinnedTabs();
  delete pinned[tabId];
  await chrome.storage.sync.set({ [STORAGE_KEYS.PINNED_TABS]: pinned });
}

// Favorites operations
async function getFavorites() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS.FAVORITES);
  return data[STORAGE_KEYS.FAVORITES] || [];
}

async function addFavorite(tabId) {
  const favorites = await getFavorites();
  if (!favorites.includes(tabId)) {
    favorites.push(tabId);
    await chrome.storage.sync.set({ [STORAGE_KEYS.FAVORITES]: favorites });
  }
}

async function removeFavorite(tabId) {
  const favorites = await getFavorites();
  const filtered = favorites.filter(id => id !== tabId);
  await chrome.storage.sync.set({ [STORAGE_KEYS.FAVORITES]: filtered });
}

// Cleanup helpers
async function cleanupSpaceData(spaceId) {
  // Remove pinned tabs for this space
  const pinned = await getPinnedTabs();
  const updatedPinned = {};

  for (const [tabId, data] of Object.entries(pinned)) {
    if (data.spaceId !== spaceId) {
      updatedPinned[tabId] = data;
    }
  }

  await chrome.storage.sync.set({ [STORAGE_KEYS.PINNED_TABS]: updatedPinned });

  // Reassign tabs from deleted space to remaining spaces
  const map = await getTabSpaceMap();
  const spaces = await getSpaces();

  if (spaces.length > 0) {
    const firstSpaceId = spaces[0].id;
    const updatedMap = {};

    for (const [tabId, mappedSpaceId] of Object.entries(map)) {
      // If tab belongs to deleted space, reassign to first available space
      if (mappedSpaceId === spaceId) {
        updatedMap[tabId] = firstSpaceId;
      } else {
        updatedMap[tabId] = mappedSpaceId;
      }
    }

    await chrome.storage.sync.set({ [STORAGE_KEYS.TAB_SPACE_MAP]: updatedMap });
  }

  // TODO: Clean up folders for this space when folders are implemented
}

// Utility functions
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEYS,
    initializeStorage,
    getSpaces,
    getCurrentSpace,
    setCurrentSpace,
    createSpace,
    updateSpace,
    deleteSpace,
    getTabSpaceMap,
    setTabSpace,
    removeTabFromMap,
    getTabsForSpace,
    getPinnedTabs,
    setPinnedTab,
    removePinnedTab,
    getFavorites,
    addFavorite,
    removeFavorite,
    generateId
  };
}
