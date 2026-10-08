/**
 * Main Application Orchestrator for Nabung Kuy!
 * View Routing, Modal Management, Event Listeners and State Coordination.
 */

const App = {
  activeView: 'home',
  uploadedReceiptDataUrl: null,

  init() {
    AuthModule.init();
    this.bindEvents();
    this.setupMoneyInputs();
    this.checkAuth();
  },

  checkAuth() {
    const user = AuthModule.getCurrentUser();
    const authWrapper = document.getElementById('auth-wrapper');
    const appShell = document.getElementById('app-shell');

    if (!user) {
      if (authWrapper) authWrapper.style.display = 'flex';
      if (appShell) appShell.style.display = 'none';
    } else {
      if (authWrapper) authWrapper.style.display = 'none';
      if (appShell) appShell.style.display = 'flex';
      this.updateUserProfile(user);
      this.refreshAllData();
      this.switchView('home');
    }
  },

  updateUserProfile(user) {
    const avatarEls = document.querySelectorAll('.user-avatar-text');
    const nameEls = document.querySelectorAll('.user-fullname-text');

    avatarEls.forEach(el => el.textContent = user.avatar || user.username.substring(0, 2).toUpperCase());
    nameEls.forEach(el => el.textContent = user.fullName || user.username);
  },

  // Helper for dot formatted money inputs
  formatNumberWithDots(val) {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  parseNumberFromDots(val) {
    if (!val) return 0;
    const clean = val.toString().replace(/\./g, '').trim();
    return Number(clean) || 0;
  },

  setupMoneyInputs() {
    const inputIds = ['tx-amount', 'acc-initial-balance', 'goal-target-amount', 'deposit-amount'];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      // Switch to text so dots are allowed
      el.type = 'text';
      el.inputMode = 'numeric';

      el.addEventListener('input', (e) => {
        const cursorPosition = el.selectionStart;
        const originalLength = el.value.length;
        const formatted = this.formatNumberWithDots(el.value);
        el.value = formatted;
        
        // Adjust cursor position gracefully
        const newLength = formatted.length;
        el.setSelectionRange(cursorPosition + (newLength - originalLength), cursorPosition + (newLength - originalLength));
      });
    });
  },

  // View Navigation
  switchView(viewName) {
    this.activeView = viewName;

    // Toggle active view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) targetSec.classList.add('active');

    // Toggle active nav links (sidebar & bottom nav)
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewName);
    });

    // Special initializations based on view
    if (viewName === 'grafik') {
      setTimeout(() => ChartsModule.renderCharts(ChartsModule.currentPeriod), 100);
    } else if (viewName === 'laporan') {
      ExportModule.renderReportPreview();
    } else if (viewName === 'kategori') {
      CategoriesModule.renderCategoriesPage();
    } else if (viewName === 'goals') {
      GoalsModule.renderGoalsGrid();
    } else if (viewName === 'transaksi') {
      TransactionsModule.renderList('all-transaction-list');
    } else if (viewName === 'wallet') {
      this.renderWalletView();
    } else if (viewName === 'home') {
      this.refreshHomeView();
    }

    if (window.lucide) lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshAllData() {
    this.refreshHomeView();
    AccountsModule.renderAccountCards('accounts-carousel');
    TransactionsModule.renderList('recent-tx-list', 5);
    GoalsModule.renderGoalsGrid();
    this.populateAccountSelects();
    this.populateCategorySelects();
  },

  refreshHomeView() {
    const totalBalance = AccountsModule.getTotalBalance();
    const balanceEl = document.getElementById('hero-total-balance');
    if (balanceEl) balanceEl.textContent = AccountsModule.formatIDR(totalBalance);

    // Calculate this month's cashflow
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const txs = TransactionsModule.getTransactions();
    const monthTxs = txs.filter(t => t.date && t.date.startsWith(currentMonthPrefix));

    const inc = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

    const incEl = document.getElementById('hero-income-amount');
    const expEl = document.getElementById('hero-expense-amount');
    if (incEl) incEl.textContent = AccountsModule.formatIDR(inc);
    if (expEl) expEl.textContent = AccountsModule.formatIDR(exp);

    AccountsModule.renderAccountCards('accounts-carousel');
    TransactionsModule.renderList('recent-tx-list', 5);
  },

  renderWalletView() {
    const container = document.getElementById('wallet-accounts-list');
    if (!container) return;

    const accounts = AccountsModule.getAccounts();
    const totalBalance = AccountsModule.getTotalBalance();

    const totalEl = document.getElementById('wallet-total-balance');
    if (totalEl) totalEl.textContent = AccountsModule.formatIDR(totalBalance);

    if (accounts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 28px 10px;">
          <div class="empty-state-icon"><i data-lucide="wallet"></i></div>
          <h4 style="font-size: 15px; font-weight: 700; color: #fff;">Belum Ada Rekening / Dompet</h4>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Tambahkan rekening bank atau dompet tunai Anda sekarang!</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="App.openAddAccountModal()">
            <i data-lucide="plus"></i> Tambah Rekening Pertama
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    accounts.forEach(acc => {
      const balance = AccountsModule.getAccountBalance(acc.id);
      html += `
        <div class="card" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; cursor: pointer; gap: 10px;" onclick="App.openAccountDetailModal('${acc.id}')">
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(140, 82, 255, 0.15); border: 1px solid var(--accent-purple); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--accent-purple-light); flex-shrink: 0;">
              <i data-lucide="credit-card"></i>
            </div>
            <div style="min-width: 0; flex: 1;">
              <h4 style="font-size: 15px; font-weight: 700; color: var(--text-white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${acc.name}</h4>
              <span style="font-size: 12px; color: var(--text-secondary);">${acc.type}</span>
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 15px; font-weight: 800; color: var(--text-white);">${AccountsModule.formatIDR(balance)}</div>
            <span style="font-size: 11px; color: var(--accent-purple-light);">Lihat Rincian →</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  populateAccountSelects() {
    const accounts = AccountsModule.getAccounts();
    const selects = ['tx-account-select', 'report-account-filter', 'tx-filter-account'];

    selects.forEach(selId => {
      const el = document.getElementById(selId);
      if (!el) return;

      const isFilter = selId.includes('filter');
      let options = isFilter ? '<option value="all">Semua Rekening</option>' : '';

      options += accounts.map(a => `
        <option value="${a.id}">${a.name} (${AccountsModule.formatIDR(AccountsModule.getAccountBalance(a.id))})</option>
      `).join('');

      el.innerHTML = options;
    });
  },

  populateCategorySelects() {
    CategoriesModule.populateCategorySelect('tx-category-select', 'expense');

    const reportCatEl = document.getElementById('tx-filter-category');
    if (reportCatEl) {
      const cats = CategoriesModule.getCategories();
      reportCatEl.innerHTML = '<option value="all">Semua Kategori</option>' + cats.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  },

  // Toast Notification
  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3200);
  },

  // Modals Management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  },

  // Catat Transaksi Modal
  openAddTransactionModal(defaultType = 'expense') {
    const accounts = AccountsModule.getAccounts();
    if (accounts.length === 0) {
      this.showToast('Harap tambahkan rekening/dompet terlebih dahulu!');
      this.openAddAccountModal();
      return;
    }

    this.setTransactionType(defaultType);
    this.uploadedReceiptDataUrl = null;
    this.resetReceiptPreview();
    const dateInput = document.getElementById('tx-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    const amountInput = document.getElementById('tx-amount');
    if (amountInput) amountInput.value = '';
    const noteInput = document.getElementById('tx-note');
    if (noteInput) noteInput.value = '';

    this.populateAccountSelects();
    this.openModal('add-transaction-modal');
  },

  setTransactionType(type) {
    document.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    CategoriesModule.populateCategorySelect('tx-category-select', type);
  },

  resetReceiptPreview() {
    const previewWrap = document.getElementById('receipt-preview-wrap');
    const previewImg = document.getElementById('receipt-preview-img');
    const dropzoneText = document.getElementById('receipt-dropzone-text');
    if (previewWrap) previewWrap.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (dropzoneText) dropzoneText.style.display = 'block';
  },

  // Add Account Modal
  openAddAccountModal() {
    const form = document.getElementById('add-account-form');
    if (form) form.reset();
    this.openModal('add-account-modal');
  },

  // Account Detail Modal
  openAccountDetailModal(accountId) {
    const accounts = AccountsModule.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    const balance = AccountsModule.getAccountBalance(acc.id);
    const modal = document.getElementById('account-detail-modal');
    if (!modal) return;

    document.getElementById('acc-detail-name').textContent = acc.name;
    document.getElementById('acc-detail-type').textContent = acc.type;
    document.getElementById('acc-detail-balance').textContent = AccountsModule.formatIDR(balance);

    const deleteBtn = document.getElementById('acc-detail-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        if (confirm(`Hapus rekening "${acc.name}"?`)) {
          AccountsModule.deleteAccount(acc.id);
          App.showToast('Rekening berhasil dihapus');
          App.closeModal('account-detail-modal');
          App.refreshAllData();
          if (App.activeView === 'wallet') App.renderWalletView();
        }
      };
    }

    // Render account transactions with strict overflow prevention
    TransactionsModule.renderList('acc-detail-tx-list', 15, { accountId: acc.id });
    this.openModal('account-detail-modal');
  },

  // Add Goal Modal
  openAddGoalModal() {
    const form = document.getElementById('add-goal-form');
    if (form) form.reset();
    this.openModal('add-goal-modal');
  },

  // Deposit to Goal Modal
  openDepositGoalModal(goalId) {
    const goals = GoalsModule.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('deposit-goal-id').value = goal.id;
    document.getElementById('deposit-goal-title').textContent = `${goal.emoji || '🎯'} ${goal.title}`;
    const dateInput = document.getElementById('deposit-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    document.getElementById('deposit-amount').value = '';
    document.getElementById('deposit-note').value = '';

    this.openModal('deposit-goal-modal');
  },

  // Goal Detail & Deposit History Modal
  openGoalDetailModal(goalId) {
    const goals = GoalsModule.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('goal-detail-title').textContent = `${goal.emoji || '🎯'} ${goal.title}`;
    document.getElementById('goal-detail-target').textContent = AccountsModule.formatIDR(goal.targetAmount);
    document.getElementById('goal-detail-current').textContent = AccountsModule.formatIDR(goal.currentAmount);

    const percent = Math.min(Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100), 100);
    document.getElementById('goal-detail-percent').textContent = percent + '%';

    const historyContainer = document.getElementById('goal-history-list');
    if (historyContainer) {
      if (!goal.history || goal.history.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 16px;">Belum ada riwayat setoran</p>';
      } else {
        historyContainer.innerHTML = goal.history.map(h => `
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <strong style="color: var(--text-white); font-size: 13.5px;">${AccountsModule.formatIDR(h.amount)}</strong>
              <div style="font-size: 11.5px; color: var(--text-secondary);">${h.note || 'Setoran'}</div>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">${h.date}</div>
          </div>
        `).join('');
      }
    }

    this.openModal('goal-detail-modal');
  },

  // Add Category Modal
  openAddCategoryModal() {
    const form = document.getElementById('add-category-form');
    if (form) form.reset();
    this.renderCategoryIconSelector();
    this.renderCategoryColorSelector();
    this.openModal('add-category-modal');
  },

  renderCategoryIconSelector() {
    const container = document.getElementById('cat-icon-selector');
    if (!container) return;

    container.innerHTML = AVAILABLE_ICONS.map((icon, idx) => `
      <label style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: var(--bg-surface);">
        <input type="radio" name="cat-icon-radio" value="${icon}" ${idx === 0 ? 'checked' : ''} style="display: none;">
        <i data-lucide="${icon}"></i>
      </label>
    `).join('');

    container.querySelectorAll('label').forEach(label => {
      label.onclick = () => {
        container.querySelectorAll('label').forEach(l => l.style.borderColor = 'var(--border-subtle)');
        label.style.borderColor = 'var(--accent-purple)';
      };
    });

    if (window.lucide) lucide.createIcons();
  },

  renderCategoryColorSelector() {
    const container = document.getElementById('cat-color-selector');
    if (!container) return;

    container.innerHTML = AVAILABLE_COLORS.map((col, idx) => `
      <label style="cursor: pointer; width: 26px; height: 26px; border-radius: 50%; background: ${col}; display: inline-block; border: 2px solid ${idx === 0 ? '#fff' : 'transparent'};">
        <input type="radio" name="cat-color-radio" value="${col}" ${idx === 0 ? 'checked' : ''} style="display: none;">
      </label>
    `).join('');

    container.querySelectorAll('label').forEach(label => {
      label.onclick = () => {
        container.querySelectorAll('label').forEach(l => l.style.borderColor = 'transparent');
        label.style.borderColor = '#ffffff';
      };
    });
  },

  // Event Listeners Binding
  bindEvents() {
    // Auth Form Switcher (Login vs Register)
    const toRegisterBtn = document.getElementById('switch-to-register');
    const toLoginBtn = document.getElementById('switch-to-login');
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');

    if (toRegisterBtn) {
      toRegisterBtn.onclick = (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      };
    }
    if (toLoginBtn) {
      toLoginBtn.onclick = (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
      };
    }

    // Login Submit (Username & Password only)
    const loginFormEl = document.getElementById('login-form');
    if (loginFormEl) {
      loginFormEl.onsubmit = (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;
        const res = AuthModule.login(u, p);
        if (res.success) {
          App.showToast(`Selamat datang, ${res.user.fullName}!`);
          App.checkAuth();
        } else {
          App.showToast(res.message);
        }
      };
    }

    // Register Submit (Username & Password only)
    const regFormEl = document.getElementById('register-form');
    if (regFormEl) {
      regFormEl.onsubmit = (e) => {
        e.preventDefault();
        const u = document.getElementById('reg-username').value;
        const p = document.getElementById('reg-password').value;
        const res = AuthModule.register(u, p);
        if (res.success) {
          App.showToast(`Akun "${res.user.username}" berhasil dibuat!`);
          App.checkAuth();
        } else {
          App.showToast(res.message);
        }
      };
    }

    // Logout
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Keluar dari Nabung Kuy?')) {
          AuthModule.logout();
          App.showToast('Sampai jumpa kembali!');
          App.checkAuth();
        }
      };
    });

    // Navigation Click Handlers (Sidebar & Bottom Nav)
    document.querySelectorAll('[data-view]').forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        App.switchView(view);
      };
    });

    // Transaction Form Segmented Buttons
    document.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.onclick = () => {
        App.setTransactionType(btn.dataset.type);
      };
    });

    // Receipt File Input & Drag/Drop
    const receiptInput = document.getElementById('tx-receipt-file');
    const receiptDropzone = document.getElementById('receipt-dropzone');
    const removeReceiptBtn = document.getElementById('remove-receipt-btn');

    if (receiptDropzone && receiptInput) {
      receiptDropzone.onclick = () => receiptInput.click();

      receiptInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            App.uploadedReceiptDataUrl = await TransactionsModule.compressImage(file);
            document.getElementById('receipt-preview-img').src = App.uploadedReceiptDataUrl;
            document.getElementById('receipt-preview-wrap').style.display = 'inline-block';
            document.getElementById('receipt-dropzone-text').style.display = 'none';
          } catch (err) {
            App.showToast('Gagal memuat gambar struk');
          }
        }
      };
    }

    if (removeReceiptBtn) {
      removeReceiptBtn.onclick = (e) => {
        e.stopPropagation();
        App.uploadedReceiptDataUrl = null;
        App.resetReceiptPreview();
        if (receiptInput) receiptInput.value = '';
      };
    }

    // Add Transaction Form Submit
    const addTxForm = document.getElementById('add-transaction-form');
    if (addTxForm) {
      addTxForm.onsubmit = async (e) => {
        e.preventDefault();
        const activeTypeBtn = document.querySelector('.segmented-btn.active');
        const type = activeTypeBtn ? activeTypeBtn.dataset.type : 'expense';
        const rawAmountStr = document.getElementById('tx-amount').value;
        const amount = App.parseNumberFromDots(rawAmountStr);
        const date = document.getElementById('tx-date').value;
        const note = document.getElementById('tx-note').value;
        const accountId = document.getElementById('tx-account-select')?.value;
        const categoryId = document.getElementById('tx-category-select')?.value;

        const res = await TransactionsModule.addTransaction({
          type,
          amount,
          accountId,
          categoryId,
          date,
          note,
          receiptDataUrl: App.uploadedReceiptDataUrl
        });

        if (res.success) {
          App.showToast('Transaksi berhasil disimpan!');
          App.closeModal('add-transaction-modal');
          App.refreshAllData();
          if (App.activeView === 'transaksi') {
            TransactionsModule.renderList('all-transaction-list');
          } else if (App.activeView === 'grafik') {
            ChartsModule.renderCharts(ChartsModule.currentPeriod);
          }
        } else {
          App.showToast(res.message);
        }
      };
    }

    // Add Account Form Submit (Auto Theme, No Account Number)
    const addAccForm = document.getElementById('add-account-form');
    if (addAccForm) {
      addAccForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('acc-name').value;
        const type = document.getElementById('acc-type').value;
        const rawBalStr = document.getElementById('acc-initial-balance').value;
        const initBal = App.parseNumberFromDots(rawBalStr);

        const acc = AccountsModule.addAccount(name, type, initBal);
        if (acc) {
          App.showToast(`Rekening "${name}" berhasil ditambahkan!`);
          App.closeModal('add-account-modal');
          App.refreshAllData();
          if (App.activeView === 'wallet') App.renderWalletView();
        }
      };
    }

    // Add Goal Form Submit
    const addGoalForm = document.getElementById('add-goal-form');
    if (addGoalForm) {
      addGoalForm.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('goal-title').value;
        const category = document.getElementById('goal-category').value;
        const emoji = document.getElementById('goal-emoji').value;
        const rawTargetStr = document.getElementById('goal-target-amount').value;
        const targetAmount = App.parseNumberFromDots(rawTargetStr);
        const targetDate = document.getElementById('goal-target-date').value;
        const color = document.getElementById('goal-color').value;

        const goal = GoalsModule.addGoal({ title, category, emoji, targetAmount, targetDate, color });
        if (goal) {
          App.showToast(`Impian "${title}" berhasil dibuat! Semangat menabung!`);
          App.closeModal('add-goal-modal');
          GoalsModule.renderGoalsGrid();
        }
      };
    }

    // Deposit to Goal Form Submit
    const depositForm = document.getElementById('deposit-goal-form');
    if (depositForm) {
      depositForm.onsubmit = (e) => {
        e.preventDefault();
        const goalId = document.getElementById('deposit-goal-id').value;
        const rawAmtStr = document.getElementById('deposit-amount').value;
        const amount = App.parseNumberFromDots(rawAmtStr);
        const date = document.getElementById('deposit-date').value;
        const note = document.getElementById('deposit-note').value;

        const res = GoalsModule.depositToGoal(goalId, amount, note, date);
        if (res.success) {
          App.showToast('Setoran tabungan berhasil dicatat!');
          App.closeModal('deposit-goal-modal');
          GoalsModule.renderGoalsGrid();
        } else {
          App.showToast(res.message);
        }
      };
    }

    // Add Category Form Submit
    const addCatForm = document.getElementById('add-category-form');
    if (addCatForm) {
      addCatForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        const type = document.getElementById('cat-type').value;
        const selectedIcon = document.querySelector('input[name="cat-icon-radio"]:checked')?.value || 'tag';
        const selectedColor = document.querySelector('input[name="cat-color-radio"]:checked')?.value || '#8c52ff';

        const cat = CategoriesModule.addCategory(name, type, selectedIcon, selectedColor);
        if (cat) {
          App.showToast(`Kategori "${name}" berhasil ditambahkan!`);
          App.closeModal('add-category-modal');
          CategoriesModule.renderCategoriesPage();
          App.populateCategorySelects();
        }
      };
    }

    // Charts Filter Pill Clicks
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.onclick = () => {
        ChartsModule.setPeriod(btn.dataset.period);
      };
    });

    // Transaction List Filters (in Transaksi View)
    const txFilterType = document.getElementById('tx-filter-type');
    const txFilterAccount = document.getElementById('tx-filter-account');
    const txFilterCategory = document.getElementById('tx-filter-category');
    const txSearchInput = document.getElementById('tx-search-input');

    const handleTxFilterChange = () => {
      TransactionsModule.renderList('all-transaction-list', null, {
        type: txFilterType?.value,
        accountId: txFilterAccount?.value,
        categoryId: txFilterCategory?.value,
        search: txSearchInput?.value
      });
    };

    if (txFilterType) txFilterType.onchange = handleTxFilterChange;
    if (txFilterAccount) txFilterAccount.onchange = handleTxFilterChange;
    if (txFilterCategory) txFilterCategory.onchange = handleTxFilterChange;
    if (txSearchInput) txSearchInput.oninput = handleTxFilterChange;

    // Report Filter Listeners
    const reportInputs = ['report-start-date', 'report-end-date', 'report-type-filter', 'report-account-filter'];
    reportInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.onchange = () => ExportModule.renderReportPreview();
    });

    // Report Export Buttons (Bind all buttons with classes or IDs)
    document.querySelectorAll('.trigger-export-excel').forEach(btn => {
      btn.onclick = () => ExportModule.exportToExcel();
    });
    document.querySelectorAll('.trigger-export-pdf').forEach(btn => {
      btn.onclick = () => ExportModule.exportToPDF();
    });

    const exportExcelBtn = document.getElementById('export-excel-btn');
    if (exportExcelBtn) exportExcelBtn.onclick = () => ExportModule.exportToExcel();

    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) exportPdfBtn.onclick = () => ExportModule.exportToPDF();

    // Modal Close Buttons & Backdrop Clicks
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.onclick = () => App.closeAllModals();
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.onclick = (e) => {
        if (e.target === overlay) App.closeAllModals();
      };
    });

    // ESC Key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') App.closeAllModals();
    });
  }
};

window.App = App;

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
