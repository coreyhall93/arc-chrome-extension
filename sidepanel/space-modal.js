// Space Modal Management

// Common icon set (emoji-based, inspired by SF Symbols categories)
const SPACE_ICONS = [
  '🏠', '💼', '🎮', '📚', '🎨', '🎵', '📧', '💡',
  '🔧', '⚙️', '🌟', '🎯', '📱', '💻', '🖥️', '⌨️',
  '🎓', '🔬', '💰', '📊', '📈', '📉', '🗂️', '📁',
  '🔒', '🔑', '🌐', '🔍', '📝', '✏️', '📌', '📍',
  '🏆', '🎁', '🎉', '🔔', '⏰', '📅', '🗓️', '⏳',
  '🚀', '✈️', '🚗', '🏡', '🏢', '🏪', '🏥', '🏫',
  '❤️', '💚', '💙', '💛', '🧡', '💜', '🖤', '🤍',
  '⭐', '✨', '🌙', '☀️', '🌈', '☁️', '⚡', '🔥'
];

class SpaceModal {
  constructor() {
    this.modal = null;
    this.nameInput = null;
    this.iconPicker = null;
    this.selectedIconInput = null;
    this.saveBtn = null;
    this.cancelBtn = null;
    this.mode = 'create'; // 'create' or 'edit'
    this.editingSpaceId = null;
    this.onSave = null;
  }

  init() {
    // Inject modal HTML
    this.injectModalHTML();

    this.modal = document.getElementById('space-modal');
    this.nameInput = document.getElementById('space-name-input');
    this.iconPicker = document.getElementById('icon-picker');
    this.selectedIconInput = document.getElementById('selected-icon');
    this.saveBtn = document.getElementById('modal-save-btn');
    this.cancelBtn = document.getElementById('modal-cancel-btn');

    this.setupEventListeners();
    this.renderIconPicker();
  }

  injectModalHTML() {
    const container = document.getElementById('space-modal-container');
    container.innerHTML = `
      <div id="space-modal" class="modal hidden">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h2 id="modal-title">Create New Space</h2>

          <div class="form-group">
            <label for="space-name-input">Space Name</label>
            <input
              type="text"
              id="space-name-input"
              class="text-input"
              placeholder="Enter space name"
              maxlength="50"
            >
          </div>

          <div class="form-group">
            <label>Choose Icon</label>
            <div class="icon-picker" id="icon-picker">
              <!-- Icons will be populated here -->
            </div>
            <input type="hidden" id="selected-icon" value="🏠">
          </div>

          <div class="modal-actions">
            <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
            <button id="modal-save-btn" class="btn btn-primary">Create Space</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Cancel button
    this.cancelBtn.addEventListener('click', () => this.close());

    // Overlay click
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());

    // Save button
    this.saveBtn.addEventListener('click', () => this.handleSave());

    // Name input validation
    this.nameInput.addEventListener('input', () => this.validateForm());

    // Enter key to save
    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.nameInput.value.trim()) {
        this.handleSave();
      }
    });
  }

  renderIconPicker() {
    this.iconPicker.innerHTML = '';

    SPACE_ICONS.forEach(icon => {
      const iconBtn = document.createElement('div');
      iconBtn.className = 'icon-option';
      iconBtn.textContent = icon;
      iconBtn.dataset.icon = icon;

      if (icon === this.selectedIconInput.value) {
        iconBtn.classList.add('selected');
      }

      iconBtn.addEventListener('click', () => this.selectIcon(icon));

      this.iconPicker.appendChild(iconBtn);
    });
  }

  selectIcon(icon) {
    // Remove previous selection
    this.iconPicker.querySelectorAll('.icon-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Add selection to clicked icon
    const selectedOption = this.iconPicker.querySelector(`[data-icon="${icon}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    this.selectedIconInput.value = icon;
  }

  validateForm() {
    const isValid = this.nameInput.value.trim().length > 0;
    this.saveBtn.disabled = !isValid;
  }

  async handleSave() {
    const name = this.nameInput.value.trim();
    const icon = this.selectedIconInput.value;

    if (!name) return;

    if (this.onSave) {
      await this.onSave({
        name,
        icon,
        spaceId: this.editingSpaceId
      });
    }

    this.close();
  }

  open(mode = 'create', spaceData = null, onSave = null) {
    this.mode = mode;
    this.onSave = onSave;

    // Reset form
    this.nameInput.value = '';
    this.selectedIconInput.value = '🏠';

    if (mode === 'edit' && spaceData) {
      this.editingSpaceId = spaceData.id;
      this.nameInput.value = spaceData.name;
      this.selectedIconInput.value = spaceData.icon;
      document.getElementById('modal-title').textContent = 'Edit Space';
      this.saveBtn.textContent = 'Save Changes';
    } else {
      this.editingSpaceId = null;
      document.getElementById('modal-title').textContent = 'Create New Space';
      this.saveBtn.textContent = 'Create Space';
    }

    this.renderIconPicker();
    this.validateForm();
    this.modal.classList.remove('hidden');

    // Focus name input
    setTimeout(() => this.nameInput.focus(), 100);
  }

  close() {
    this.modal.classList.add('hidden');
    this.nameInput.value = '';
    this.editingSpaceId = null;
    this.onSave = null;
  }
}

// Export for use in panel.js
if (typeof window !== 'undefined') {
  window.SpaceModal = SpaceModal;
}
