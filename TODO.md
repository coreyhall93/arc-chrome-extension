# Arc Chrome Extension - MVP Todo List

## Phase 1: Foundation

- [x] 1. Set up basic Chrome extension structure (manifest.json, folders, permissions)
- [x] 2. Create side panel UI framework (HTML, CSS, JS entry points)
- [x] 3. Implement basic tab listing in sidebar (read-only)
- [x] 4. Style sidebar to match Chrome's native UI aesthetic

## Phase 2: Core Tab Management

- [x] 5. Implement click to switch tabs functionality
- [x] 6. Add close button on hover for tabs
- [x] 7. Add New Tab button at bottom of sidebar
- [x] 8. Implement active/inactive tab visual states

## Phase 3: Spaces System

- [x] 9. Create Spaces data model and storage structure
- [x] 10. Implement Space creation flow with name and icon picker (SF Symbols)
- [x] 11. Add Space icons display at bottom of sidebar
- [x] 12. Implement Space switching functionality
- [x] 13. Filter tabs by current Space
- [x] 14. Display Space name in sidebar
- [x] 15. Implement Space deletion with confirmation

## Phase 4: Pinned Tabs

- [ ] 16. Implement pin/unpin tab functionality
- [ ] 17. Create pinned tabs section above unpinned tabs with divider
- [ ] 18. Implement closed pin state (tab closed but icon remains visible)
- [ ] 19. Implement reopen closed pinned tabs on click
- [ ] 20. Add drag and drop for reordering pinned tabs
- [ ] 21. Implement right-click context menus for pinned tabs
- [ ] 22. Add Copy Link functionality
- [ ] 23. Implement Edit URL for pinned tabs
- [ ] 24. Implement Update URL for pinned tabs
- [ ] 25. Add Move to Space submenu functionality

## Phase 5: Unpinned Tabs Context Menu

- [ ] 26. Implement context menu for unpinned tabs

## Phase 6: Favorites

- [ ] 27. Create favorites data model and storage
- [ ] 28. Implement Add/Remove from Favorites functionality
- [ ] 29. Create favorites grid at top of sidebar (adaptive 3/4 columns)
- [ ] 30. Ensure favorites persist across all Spaces
- [ ] 31. Implement clicking favorite to open/switch to tab

## Phase 7: Basic Folders

- [ ] 32. Create folders data model with parent/child relationships
- [ ] 33. Implement multi-select for tabs (Cmd+Click, Shift+Click)
- [ ] 34. Implement Create Folder from selected tabs
- [ ] 35. Add inline rename for folders with 'Untitled' default
- [ ] 36. Implement folder collapse/expand functionality
- [ ] 37. Add drag and drop for reordering tabs within folders
- [ ] 38. Implement drag tabs between folders to reorganize
- [ ] 39. Add folder context menu (Rename, Delete, Move to Space)
- [ ] 40. Ensure folder collapsed state persists in storage

## Phase 8: Nested Folders

- [ ] 41. Implement nested folder support (drag folder into folder)
- [ ] 42. Add 'New Nested Folder' context menu option
- [ ] 43. Implement recursive folder rendering for unlimited nesting
- [ ] 44. Add 'Copy All Links' for folders (flattened nested structure)
- [ ] 45. Ensure folder collapsed state persists in storage
- [ ] 46. Test deeply nested folder structures (5+ levels)

## Phase 9: Multi-select Operations

- [ ] 47. Implement batch operations for multi-selected tabs

## Phase 10: Polish

- [ ] 48. Add visual hover effects for all interactive elements
- [ ] 49. Implement smooth animations for collapse/expand
- [ ] 50. Add loading states for async operations
- [ ] 51. Create empty state messages for sections

## Phase 11: Data Persistence

- [ ] 52. Implement chrome.storage.sync for all state persistence
- [ ] 53. Ensure Spaces configuration saves and restores
- [ ] 54. Ensure pinned tabs metadata persists across restarts
- [ ] 55. Ensure folders and nesting structure persists
- [ ] 56. Ensure favorites persist across restarts
- [ ] 57. Restore last active Space on browser restart

## Phase 12: Incognito & Edge Cases

- [ ] 58. Implement incognito mode isolation (separate state)
- [ ] 59. Ensure incognito data doesn't persist after window close
- [ ] 60. Add error handling for all async operations
- [ ] 61. Test edge case: deleting last Space (should prevent)
- [ ] 62. Test performance with 100+ tabs

## Phase 13: Import/Export & Documentation

- [ ] 63. Implement export configuration to JSON
- [ ] 64. Implement import configuration from JSON
- [ ] 65. Add README.md with installation and usage instructions
- [ ] 66. Create installation guide for chrome://flags/#hide-tab-strip

---

**Total Tasks: 66**

**Progress: 15/66 (23%)**
