/**
 * Multi-Rekening (Accounts) Management Module for Nabung Kuy!
 * Handles Accounts CRUD, balance computations, and automatic theme rotation.
 */

const AUTO_CARD_THEMES = [
  'theme-0',
  'theme-1',
  'theme-2',
  'theme-3',
  'theme-4',
  'theme-5',
  'theme-6',
  'theme-7'
];

const AccountsModule = {
  // Format currency helper (Indonesian Rupiah with dots)
  formatIDR(num) {
    const val = Math.round(Number(num) || 0);
    return 'Rp ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  formatNumber(num) {
    const val = Math.round(Number(num) || 0);
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  getAccounts() {
    const user = AuthModule.getCurrentUser();
    if (!user) return [];
    const data = StorageEngine.getUserData(user.username);
    return data.accounts || [];
  },

  // Calculate dynamic balance for a single account
  getAccountBalance(accountId) {
    const user = AuthModule.getCurrentUser();
    if (!user) return 0;
    const data = StorageEngine.getUserData(user.username);
    const account = data.accounts.find(a => a.id === accountId);
    if (!account) return 0;

    let balance = Number(account.initialBalance) || 0;
    const txs = data.transactions || [];

    txs.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income' && tx.accountId === accountId) {
        balance += amount;
      } else if (tx.type === 'expense' && tx.accountId === accountId) {
        balance -= amount;
      }
    });

    return balance;
  },

  // Calculate total combined balance across all accounts
  getTotalBalance() {
    const accounts = this.getAccounts();
    return accounts.reduce((sum, acc) => sum + this.getAccountBalance(acc.id), 0);
  },

  addAccount(name, type, initialBalance) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);
    const accounts = data.accounts || [];

    // Automatically assign a different vibrant theme in rotation
    const theme = AUTO_CARD_THEMES[accounts.length % AUTO_CARD_THEMES.length];

    const newAccount = {
      id: 'acc-' + Date.now(),
      name: name.trim(),
      type: type || 'Bank',
      theme: theme,
      holderName: (user.fullName || user.username).toUpperCase(),
      initialBalance: Number(initialBalance) || 0
    };

    accounts.push(newAccount);
    data.accounts = accounts;
    StorageEngine.saveUserData(user.username, data);
    return newAccount;
  },

  deleteAccount(accountId) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);

    data.accounts = (data.accounts || []).filter(a => a.id !== accountId);
    StorageEngine.saveUserData(user.username, data);
    return true;
  },

  // Render Horizontal Cards (Carousel on mobile / Grid on desktop)
  renderAccountCards(containerId = 'accounts-carousel') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const accounts = this.getAccounts();
    if (accounts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 16px; width: 100%; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary);">Belum ada rekening/dompet terdaftar.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 8px;" onclick="App.openAddAccountModal()">
            <i data-lucide="plus"></i> Tambah Rekening Pertama
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    accounts.forEach(acc => {
      const balance = this.getAccountBalance(acc.id);
      html += `
        <div class="wallet-card ${acc.theme || 'theme-0'}" onclick="App.openAccountDetailModal('${acc.id}')">
          <div class="wallet-card-wave"></div>
          <div class="wallet-card-header">
            <span class="wallet-card-type">${acc.name}</span>
            <div class="wallet-card-chip"></div>
          </div>
          <div class="wallet-card-body">
            <div class="wallet-card-balance-label">Total Saldo</div>
            <div class="wallet-card-balance">${this.formatIDR(balance)}</div>
          </div>
          <div class="wallet-card-footer">
            <span class="wallet-card-holder">${acc.holderName || 'PENGGUNA'}</span>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-pill); background: rgba(255,255,255,0.15); color: #fff; font-weight: 600;">${acc.type}</span>
          </div>
        </div>
      `;
    });

    // Add Account Mini Card at the end
    html += `
      <div class="add-account-card" onclick="App.openAddAccountModal()">
        <div class="add-account-icon">
          <i data-lucide="plus"></i>
        </div>
        <span style="font-size: 12px; font-weight: 700;">+ Tambah Rekening</span>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
};

window.AccountsModule = AccountsModule;
