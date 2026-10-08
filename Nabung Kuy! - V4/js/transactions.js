/**
 * Transactions Module for Nabung Kuy!
 * Handles Income & Expense records, Receipt uploads & Lightbox viewing.
 */

const TransactionsModule = {
  getTransactions() {
    const user = AuthModule.getCurrentUser();
    if (!user) return [];
    const data = StorageEngine.getUserData(user.username);
    return data.transactions || [];
  },

  addTransactionRaw(tx) {
    const user = AuthModule.getCurrentUser();
    if (!user) return;
    const data = StorageEngine.getUserData(user.username);
    if (!data.transactions) data.transactions = [];
    data.transactions.unshift(tx);
    StorageEngine.saveUserData(user.username, data);
  },

  async addTransaction({ type, amount, accountId, categoryId, date, note, receiptDataUrl }) {
    const user = AuthModule.getCurrentUser();
    if (!user) return { success: false, message: 'Harap login terlebih dahulu' };

    const txId = 'tx-' + Date.now();
    const cleanAmount = Number(amount);

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return { success: false, message: 'Nominal transaksi harus lebih dari 0!' };
    }

    if (!accountId) {
      return { success: false, message: 'Pilih rekening terlebih dahulu!' };
    }

    let hasReceipt = false;
    if (receiptDataUrl) {
      await StorageEngine.saveReceipt(txId, receiptDataUrl);
      hasReceipt = true;
    }

    const tx = {
      id: txId,
      type: type || 'expense', // 'income' or 'expense'
      amount: cleanAmount,
      accountId,
      categoryId,
      date: date || new Date().toISOString().split('T')[0],
      note: note ? note.trim() : '',
      receipt: hasReceipt ? true : null
    };

    this.addTransactionRaw(tx);
    return { success: true, transaction: tx };
  },

  async deleteTransaction(txId) {
    const user = AuthModule.getCurrentUser();
    if (!user) return;
    const data = StorageEngine.getUserData(user.username);
    data.transactions = (data.transactions || []).filter(t => t.id !== txId);
    StorageEngine.saveUserData(user.username, data);
    await StorageEngine.deleteReceipt(txId);
  },

  // Helper to compress image before saving
  compressImage(file, maxWidth = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const elem = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(elem.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  },

  // Render Transaction List
  renderList(containerId = 'transaction-list', limit = null, filterOptions = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let txs = this.getTransactions();
    const categories = CategoriesModule.getCategories();
    const accounts = AccountsModule.getAccounts();

    // Apply Filters if any
    if (filterOptions.type && filterOptions.type !== 'all') {
      txs = txs.filter(t => t.type === filterOptions.type);
    }
    if (filterOptions.accountId && filterOptions.accountId !== 'all') {
      txs = txs.filter(t => t.accountId === filterOptions.accountId);
    }
    if (filterOptions.categoryId && filterOptions.categoryId !== 'all') {
      txs = txs.filter(t => t.categoryId === filterOptions.categoryId);
    }
    if (filterOptions.search) {
      const q = filterOptions.search.toLowerCase();
      txs = txs.filter(t => (t.note && t.note.toLowerCase().includes(q)));
    }

    if (limit) {
      txs = txs.slice(0, limit);
    }

    if (txs.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px 10px;">
          <div class="empty-state-icon"><i data-lucide="receipt"></i></div>
          <h4 style="font-size: 14px; font-weight: 700; color: #fff;">Belum Ada Transaksi</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Catat transaksi pemasukan atau pengeluaran pertama Anda sekarang!</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    txs.forEach(tx => {
      let iconName = 'trending-down';
      let iconBg = 'var(--expense-red-bg)';
      let iconColor = 'var(--expense-red)';
      let title = 'Pengeluaran';
      let amountClass = 'expense';
      let amountPrefix = '- ';

      const cat = categories.find(c => c.id === tx.categoryId);
      const acc = accounts.find(a => a.id === tx.accountId) || { name: 'Rekening' };

      if (tx.type === 'income') {
        iconName = cat?.icon || 'trending-up';
        iconBg = 'var(--income-green-bg)';
        iconColor = 'var(--income-green)';
        title = cat?.name || 'Pemasukan';
        amountClass = 'income';
        amountPrefix = '+ ';
      } else {
        iconName = cat?.icon || 'trending-down';
        iconBg = 'var(--expense-red-bg)';
        iconColor = 'var(--expense-red)';
        title = cat?.name || 'Pengeluaran';
        amountClass = 'expense';
        amountPrefix = '- ';
      }

      let metaInfo = `<span class="tx-account-badge">${acc.name}</span> <span>${tx.date}</span>`;
      if (tx.note) metaInfo += ` • <span>${tx.note}</span>`;

      html += `
        <div class="tx-item" data-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-icon-wrapper" style="background: ${iconBg}; color: ${iconColor};">
              <i data-lucide="${iconName}"></i>
            </div>
            <div class="tx-details">
              <h4>${title}</h4>
              <div class="tx-meta">${metaInfo}</div>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount ${amountClass}">${amountPrefix}${AccountsModule.formatIDR(tx.amount)}</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
              ${tx.receipt ? `
                <button class="tx-receipt-btn" onclick="TransactionsModule.viewReceipt('${tx.id}', event)">
                  <i data-lucide="image" style="width: 11px; height: 11px;"></i> Struk
                </button>
              ` : ''}
              <button class="icon-btn" style="width: 26px; height: 26px;" title="Hapus Transaksi" onclick="TransactionsModule.confirmDelete('${tx.id}', event)">
                <i data-lucide="trash-2" style="width: 12px; height: 12px; color: var(--expense-red);"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  async viewReceipt(txId, event) {
    if (event) event.stopPropagation();
    const receiptDataUrl = await StorageEngine.getReceipt(txId);
    if (!receiptDataUrl) {
      App.showToast('Gambar struk tidak ditemukan!');
      return;
    }

    const lightboxModal = document.getElementById('receipt-lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    if (lightboxModal && lightboxImg) {
      lightboxImg.src = receiptDataUrl;
      lightboxModal.classList.add('active');
    }
  },

  async confirmDelete(txId, event) {
    if (event) event.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      await this.deleteTransaction(txId);
      App.showToast('Transaksi berhasil dihapus');
      App.refreshAllData();
      if (App.activeView === 'transaksi') {
        TransactionsModule.renderList('all-transaction-list');
      } else if (App.activeView === 'grafik') {
        ChartsModule.renderCharts(ChartsModule.currentPeriod);
      }
    }
  }
};

window.TransactionsModule = TransactionsModule;
