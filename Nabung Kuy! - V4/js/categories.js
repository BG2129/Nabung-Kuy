/**
 * Master Kategori (Categories) Module for Nabung Kuy!
 * Handles Category CRUD, Icon picker, Color styling and Select list population.
 */

const AVAILABLE_ICONS = [
  'coffee', 'shopping-cart', 'car', 'zap', 'film', 'heart-pulse', 'book-open',
  'briefcase', 'gift', 'trending-up', 'laptop', 'dollar-sign', 'home', 'plane',
  'smile', 'shield', 'award', 'camera', 'music', 'smartphone', 'tag'
];

const AVAILABLE_COLORS = [
  '#00e676', '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#ff3366', '#ef4444', '#f59e0b', '#eab308', '#64748b'
];

const CategoriesModule = {
  getCategories() {
    const user = AuthModule.getCurrentUser();
    if (!user) return [];
    const data = StorageEngine.getUserData(user.username);
    return data.categories || [];
  },

  addCategory(name, type, icon, color) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);

    const newCat = {
      id: 'cat-' + Date.now(),
      name: name.trim(),
      type, // 'income' or 'expense'
      icon: icon || 'tag',
      color: color || '#8c52ff'
    };

    data.categories.push(newCat);
    StorageEngine.saveUserData(user.username, data);
    return newCat;
  },

  deleteCategory(catId) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);
    data.categories = data.categories.filter(c => c.id !== catId);
    StorageEngine.saveUserData(user.username, data);
    return true;
  },

  populateCategorySelect(selectElementId, type = 'expense') {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    const categories = this.getCategories().filter(c => c.type === type);
    select.innerHTML = categories.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');
  },

  renderCategoriesPage(containerId = 'categories-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = this.getCategories();
    const incomeCats = categories.filter(c => c.type === 'income');
    const expenseCats = categories.filter(c => c.type === 'expense');

    const renderCard = (c) => `
      <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 42px; height: 42px; border-radius: var(--radius-md); background: ${c.color}22; color: ${c.color}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            <i data-lucide="${c.icon || 'tag'}"></i>
          </div>
          <div>
            <h4 style="font-size: 15px; font-weight: 700; color: var(--text-white);">${c.name}</h4>
            <span style="font-size: 12px; color: var(--text-secondary); text-transform: capitalize;">${c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
          </div>
        </div>
        <button class="icon-btn" style="width: 32px; height: 32px;" title="Hapus Kategori" onclick="CategoriesModule.confirmDelete('${c.id}')">
          <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--expense-red);"></i>
        </button>
      </div>
    `;

    container.innerHTML = `
      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--income-green); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="trending-up" style="width: 18px; height: 18px;"></i> Kategori Pemasukan (${incomeCats.length})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
          ${incomeCats.map(renderCard).join('')}
        </div>
      </div>

      <div>
        <h3 style="font-size: 16px; font-weight: 700; color: var(--expense-red); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="trending-down" style="width: 18px; height: 18px;"></i> Kategori Pengeluaran (${expenseCats.length})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
          ${expenseCats.map(renderCard).join('')}
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  confirmDelete(catId) {
    if (confirm('Hapus kategori ini? Transaksi yang sudah menggunakan kategori ini akan tetap tersimpan.')) {
      this.deleteCategory(catId);
      App.showToast('Kategori berhasil dihapus');
      this.renderCategoriesPage();
    }
  }
};

window.CategoriesModule = CategoriesModule;
window.AVAILABLE_ICONS = AVAILABLE_ICONS;
window.AVAILABLE_COLORS = AVAILABLE_COLORS;
