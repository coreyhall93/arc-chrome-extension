# Arc-Inspired Chrome Extension - Complete Specification

## Project Overview

Build a Chrome extension that recreates Arc Browser's core sidebar functionality for Chrome. The extension should feel like a native Chrome feature, matching Chrome's visual design language while providing Arc's powerful tab management capabilities.

## Design Philosophy

- Match Chrome's native UI aesthetic (colors, spacing, interaction patterns)
- Think of this as "what if Chrome had Arc's sidebar built-in"
- Keep interactions subtle and Chrome-like
- Prioritize functionality and usability over custom theming

## Core Features - MVP

### 1. Vertical Sidebar with Tabs

**Layout Structure (top to bottom):**
1. Favorite pins grid (adaptive: 3 across until 7+ favorites, then 4 across)
2. Space name
3. Pinned tabs section (includes folders)
4. Subtle dividing line
5. Unpinned tabs section
6. Subtle "New Tab" button (+ icon)
7. Space icons at bottom

**Tab Display:**
- Show favicon and title for each tab
- Click tab to switch to it
- Hover shows close button (X)
- Active tab has visual indicator
- Match Chrome's native tab styling

**Visual States:**
- Active tab (currently viewing)
- Inactive tab (open but not viewing)
- Closed pinned tab (pinned but not currently open)

### 2. Pinned Tabs Behavior

**Core Functionality:**
- Users can pin any tab
- When pinned tab is closed (Cmd/Ctrl+W), the tab closes BUT remains visible in sidebar
- Clicking a closed pinned tab reopens it at the same URL
- Session/login state persists (Chrome's native cookie behavior)
- Pinned tabs appear in their own section above unpinned tabs

**Interaction:**
- Right-click on pinned tab:
  - "Copy Link"
  - "Edit URL" - allows manual URL editing
  - "Update URL" - replaces pinned tab URL with currently active page
  - "Add to Favorites" (if not a favorite) / "Remove from Favorites" (if it is a favorite)
  - "Move to Folder" → [submenu of existing folders + "New Folder"]
  - "Unpin Tab"
  - "Close Tab"

**Sorting:**
- Click and drag to manually reorder pinned tabs
- When tab is first pinned, it goes to bottom of pinned section
- User can then drag to desired position

### 3. Favorite Pins

**Display:**
- Grid of favicons at top of sidebar
- Adaptive grid: 3 across (for 1-7 favorites), then 4 across (for 8+ favorites)
- Just favicons, no titles
- Always visible regardless of which Space you're in

**Behavior:**
- Favorites are pinned tabs marked as favorites
- Persistent across ALL Spaces
- When you switch Spaces, favorites remain visible while other pins change
- Clicking a favorite in any Space opens/switches to it
- If closed, clicking reopens it

**Management:**
- Right-click on favorite → "Remove from Favorites"
- When removed from favorites, becomes a regular unpinned tab in current Space
- If it was open, stays open but unpinned

### 4. Folders

**Purpose:**
Organize pinned tabs into collapsible groups (think project folders)

**Behavior:**
- Folders ONLY exist in the pinned section
- Folders can ONLY contain pinned tabs (and other folders)
- When tab is added to folder, it automatically becomes pinned
- Cannot add unpinned tabs to folders
- Folders can be collapsed/expanded
- Folders remember collapsed/expanded state after browser restart
- **Nested folders:** Folders can contain other folders with unlimited nesting depth
- When folder is collapsed, nested folders and all tabs inside are hidden

**Creation:**
- Select multiple tabs (Cmd+Click or Shift+Click)
- Right-click → "Create Folder"
- New folder appears in pinned section with selected tabs inside
- Folder automatically titled "Untitled" with immediate rename prompt
- User can name it right away

**Nested Folder Creation:**
- Right-click on existing folder → "New Nested Folder"
- Creates a new folder inside the parent folder
- Can nest folders infinitely (no depth limit)
- Folders can be dragged into other folders to create nesting

**Management:**
- Click folder name to expand/collapse
- Click and drag to reorder folders within pinned section
- Click and drag tabs within folders to reorder
- Drag folders into other folders to nest them
- Drag tabs between folders to reorganize
- Right-click on folder:
  - "Copy All Links" - copies URLs of all tabs in folder, including all nested folders (flattened into a single list)
  - "New Nested Folder" - creates a new folder inside this folder
  - "Rename Folder"
  - "Move to" → [submenu of Spaces] - moves entire folder with all contents to another Space
  - "Delete Folder" - closes all tabs inside, including nested folders and their contents

### 5. Spaces (Workspaces)

**Concept:**
Separate tab contexts for different workflows (e.g., "Personal", "Work", "Project X")

**Visual Design:**
- Space icons displayed at bottom of sidebar
- Each Space has a customizable icon (SF Symbols) and name
- Currently active Space is highlighted
- "+" button to create new Space

**Behavior:**
- Each Space contains its own set of pinned tabs (except favorites) and unpinned tabs
- Switching Spaces shows only that Space's tabs
- Favorites remain visible across all Spaces
- New tabs automatically open in current Space
- Unlimited number of Spaces allowed
- Folders can be moved between Spaces

**Creation:**
- Click "+" button in Space icons area
- Modal appears prompting for:
  - Space name
  - Icon selection (SF Symbols picker)
- New Space is created and immediately switched to

**Switching:**
- Click Space icon to switch to that Space
- (Future feature: keyboard shortcuts like Cmd+1, Cmd+2, Cmd+Shift+[ and ])

**Management:**
- Right-click on Space icon:
  - "Rename Space"
  - "Delete Space"

**Deletion:**
- Right-click on Space icon → "Delete Space"
- All tabs in that Space are closed (including folders and nested contents)
- If deleting current Space, switches to first remaining Space
- Cannot delete the last remaining Space

**Moving Tabs Between Spaces:**
- Right-click on tab → "Move to Space" → [submenu listing all Spaces]
- Tab is removed from source Space and added to destination Space
- Right-click on folder → "Move to" → [submenu of Spaces]
- Entire folder with all contents moves to destination Space
- (Future feature: drag tab and swipe left/right to adjacent Space)

### 6. Unpinned Tabs

**Behavior:**
- All regular open tabs appear in unpinned section
- New tabs automatically appear at bottom of unpinned list
- Cannot be organized into folders
- Can be dragged to reorder manually

**Context Menu (right-click):**
- Copy Link
- Pin Tab
- Move to Space → [submenu of Spaces]
- Close Tab

**Multi-select:**
- Cmd+Click to select multiple individual tabs
- Shift+Click to select range
- Selected tabs can be moved together or added to folder together (which pins them)

### 7. New Tab Behavior

**Opening Tabs:**
- Cmd+T opens new tab (standard Chrome behavior)
- Clicking subtle "New Tab" button in sidebar opens new tab
- New tabs automatically belong to current Space
- New tabs appear at bottom of unpinned section

**Command+T (MVP):**
- Standard Chrome behavior - just opens a new blank tab
- (Future feature: search bar overlay with tab suggestions)

## Data Persistence

**On Browser Restart:**
- All Spaces restored with their names and icons
- All pinned tabs restored (both open and closed states)
- All folders restored with their tabs and collapsed/expanded state
- All nested folder structures preserved
- All favorites restored
- All unpinned tabs restored in their respective Spaces
- Last active Space is the one shown on restart

**Storage:**
- Use `chrome.storage.sync` for cross-device sync
- Store Space configurations (name, icon, order)
- Store pinned tab metadata (URL, Space assignment, favorite status, folder assignment, nesting structure)
- Store folder configurations (name, parent folder, collapsed state, nesting hierarchy)
- Store tab states and positions

## Incognito Mode

**Behavior:**
- Extension works in incognito windows
- Incognito has completely separate, isolated state
- NO Space/pin data from regular browsing
- User can create Spaces and pins within incognito session
- Incognito data does not persist after window is closed

## Technical Requirements

**Chrome Extension:**
- Manifest V3
- Side Panel API for sidebar interface
- Tabs API for tab management
- Storage API (chrome.storage.sync)
- Context Menus API for right-click menus
- Commands API for future keyboard shortcuts

**Key Interactions:**
- Drag and drop for organizing tabs, folders, and nesting
- Context menus (right-click) for all major actions
- Multi-select (Cmd+Click, Shift+Click)
- Inline editing for URLs and folder names
- Recursive folder structures with unlimited nesting

**Performance Considerations:**
- Efficient handling of 100+ tabs
- Efficient rendering of deeply nested folder structures
- Lazy loading where appropriate
- Debounce/throttle frequent operations
- Minimal performance impact on browsing

## User Setup

**Installation Instructions:**
Users must enable one Chrome flag for optimal experience:
- Navigate to `chrome://flags/#hide-tab-strip`
- Enable the flag
- Restart Chrome
- This hides the native horizontal tab bar

## Import/Export

**Configuration Backup:**
- Export current configuration (Spaces, pins, folders, nesting structure) to JSON file
- Import configuration from JSON file
- Useful for backup, sharing setups, or migrating to new machine

## Future Features (Post-MVP)

These features are noted but NOT included in initial build:

1. **Command+T Search Bar:**
   - Overlay with search/filter
   - Shows matching tabs across all Spaces
   - Can search by title, URL, or content
   - Clicking result switches to that Space and tab

2. **Drag-to-Switch Spaces:**
   - Drag tab toward edge of sidebar
   - Automatically switches to adjacent Space
   - Drop tab in new Space

3. **Keyboard Shortcuts:**
   - Cmd+1, Cmd+2, etc. for direct Space access
   - Cmd+Shift+[ and ] for Space navigation
   - Custom shortcuts for pin/unpin, favorite, etc.

4. **Browser Theming:**
   - Custom colors for sidebar
   - Custom Space icons beyond SF Symbols
   - Dark/light mode support

5. **Additional Context Menu Items:**
   - Share (for tabs/folders)
   - Duplicate
   - Change Icon
   - Rename (for tabs)
   - Split View capabilities

## Visual Reference

Arc Browser screenshots provided show:
- Empty Space creation flow
- Space icons layout at bottom with + button
- Favorite pins grid at top (3-4 across)
- Pinned tabs (active and inactive states)
- Folder structure with nested folders
- Unpinned tabs section
- Overall visual hierarchy
- Context menu patterns

## Development Approach

**Recommended Build Order:**

1. **Foundation:**
   - Basic extension structure (manifest, permissions)
   - Side panel UI framework
   - Tab listing in sidebar (read-only)
   - Basic styling matching Chrome's UI

2. **Core Tab Management:**
   - Click to switch tabs
   - Close tabs from sidebar
   - New tab button
   - Show active/inactive states

3. **Spaces:**
   - Create/delete Spaces
   - Switch between Spaces
   - Space-specific tab filtering
   - Space icons with SF Symbols picker
   - Space name display

4. **Pinned Tabs:**
   - Pin/unpin functionality
   - Closed pin state (icon remains)
   - Reopen closed pins
   - Manual reordering via drag and drop

5. **Context Menus:**
   - Implement all right-click menus
   - Copy Link functionality
   - Edit/Update URL for pins
   - Move to Space
   - Pin/Unpin actions

6. **Favorites:**
   - Mark pins as favorites
   - Favorites grid at top (adaptive 3/4 across)
   - Persistence across Spaces
   - Add/Remove from favorites

7. **Folders:**
   - Create folders from selected tabs
   - Add tabs to folders (auto-pins)
   - Collapse/expand folders
   - Reorder within folders
   - Inline rename with "Untitled" default

8. **Nested Folders:**
   - Drag folders into folders
   - "New Nested Folder" option
   - Recursive rendering
   - Unlimited nesting depth
   - Copy All Links (flattened)

9. **Multi-select:**
   - Cmd+Click for multiple selection
   - Shift+Click for range selection
   - Batch operations (move, folder creation)

10. **Polish:**
    - Visual states and hover effects
    - Chrome-like styling refinement
    - Smooth animations for collapse/expand
    - Loading states
    - Empty states

11. **Persistence:**
    - Save state to chrome.storage.sync
    - Restore on browser restart
    - Handle folder nesting in storage
    - Sync across devices

12. **Incognito & Edge Cases:**
    - Incognito isolation
    - Error handling
    - Edge case testing (last Space, empty folders, deep nesting)
    - Performance testing with many tabs/folders

13. **Import/Export:**
    - Configuration backup to JSON
    - Configuration restore from JSON

## Success Criteria

The extension is successful when:

1. A user can manage 50+ tabs across multiple Spaces without confusion
2. Pinned tabs behave exactly like Arc (close but stay visible, reopen on click)
3. Favorites persist across all Spaces seamlessly
4. Folders provide clear project organization with unlimited nesting
5. Copy All Links from folders works perfectly, flattening nested structures
6. The UI feels native to Chrome (not like a third-party extension)
7. Performance is smooth even with 100+ tabs and deeply nested folders
8. State perfectly restores after browser restart, preserving all nesting
9. User can export/import their configuration including full folder structures
10. Context menus provide quick access to all major actions
11. Drag and drop feels natural for organizing tabs and folders

## Notes

- This is an MVP focused on core functionality
- Visual design should match Chrome's existing patterns
- Avoid over-engineering - start simple and iterate
- Test frequently with real-world usage patterns
- Prioritize data integrity (don't lose user's tabs/organization)
- Nested folders add complexity - ensure recursive operations are performant
- Copy All Links must flatten nested structures into a simple list