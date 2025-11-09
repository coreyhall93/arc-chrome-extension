// Context Menu System

class ContextMenu {
  constructor() {
    this.menu = null;
    this.currentData = null;
    this.currentCallback = null;
  }

  init() {
    // Create menu element
    this.menu = document.createElement('div');
    this.menu.className = 'context-menu';
    this.menu.id = 'context-menu';
    document.body.appendChild(this.menu);

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (!this.menu.contains(e.target)) {
        this.hide();
      }
    });

    // Close menu on scroll
    document.addEventListener('scroll', () => {
      this.hide();
    }, true);
  }

  show(x, y, items, data, callback) {
    this.currentData = data;
    this.currentCallback = callback;

    // Clear existing items
    this.menu.innerHTML = '';

    // Add menu items
    items.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        this.menu.appendChild(divider);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        if (item.danger) {
          menuItem.classList.add('danger');
        }
        menuItem.textContent = item.label;
        menuItem.onclick = () => {
          this.hide();
          if (callback) {
            callback(item.action, data);
          }
        };
        this.menu.appendChild(menuItem);
      }
    });

    // Position menu
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    // Show menu
    this.menu.classList.add('visible');

    // Adjust position if off-screen
    const rect = this.menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.menu.style.top = `${y - rect.height}px`;
    }
  }

  hide() {
    this.menu.classList.remove('visible');
    this.currentData = null;
    this.currentCallback = null;
  }
}

// Export for use in panel.js
if (typeof window !== 'undefined') {
  window.ContextMenu = ContextMenu;
}
