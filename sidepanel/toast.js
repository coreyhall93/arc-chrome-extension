// Toast Notification System

class Toast {
  constructor() {
    this.toast = null;
    this.currentTimeout = null;
    this.undoCallback = null;
  }

  init() {
    // Create toast element
    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    this.toast.innerHTML = `
      <div class="toast-message"></div>
      <button class="toast-action">Undo</button>
    `;
    document.body.appendChild(this.toast);

    // Set up undo button
    const undoBtn = this.toast.querySelector('.toast-action');
    undoBtn.addEventListener('click', () => {
      if (this.undoCallback) {
        this.undoCallback();
      }
      this.hide();
    });
  }

  show(message, undoCallback = null, duration = 5000) {
    // Clear existing timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    // Set message
    const messageEl = this.toast.querySelector('.toast-message');
    messageEl.textContent = message;

    // Set undo callback
    this.undoCallback = undoCallback;

    // Show/hide undo button
    const undoBtn = this.toast.querySelector('.toast-action');
    if (undoCallback) {
      undoBtn.style.display = 'block';
    } else {
      undoBtn.style.display = 'none';
    }

    // Show toast
    this.toast.classList.add('visible');

    // Auto-hide after duration
    this.currentTimeout = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.toast.classList.remove('visible');
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.undoCallback = null;
  }
}

// Export for use in panel.js
if (typeof window !== 'undefined') {
  window.Toast = Toast;
}
