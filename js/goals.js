/**
 * Goals (Impian Menabung) Module for Nabung Kuy!
 * Handles Dream targets, savings progress, milestone tracking and deposit records.
 */

const GoalsModule = {
  getGoals() {
    const user = AuthModule.getCurrentUser();
    if (!user) return [];
    const data = StorageEngine.getUserData(user.username);
    return data.goals || [];
  },

  addGoal({ title, category, emoji, targetAmount, targetDate, color }) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);

    const newGoal = {
      id: 'goal-' + Date.now(),
      title: title.trim(),
      category: category ? category.trim() : 'Impian',
      emoji: emoji || '🎯',
      targetAmount: Number(targetAmount) || 0,
      currentAmount: 0,
      targetDate: targetDate || '',
      color: color || '#8c52ff',
      history: []
    };

    data.goals.push(newGoal);
    StorageEngine.saveUserData(user.username, data);
    return newGoal;
  },

  depositToGoal(goalId, amount, note, date) {
    const user = AuthModule.getCurrentUser();
    if (!user) return { success: false, message: 'Harap login terlebih dahulu' };
    const data = StorageEngine.getUserData(user.username);

    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) return { success: false, message: 'Impian tidak ditemukan' };

    const cleanAmount = Number(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return { success: false, message: 'Nominal setoran harus lebih dari 0!' };
    }

    goal.currentAmount = (Number(goal.currentAmount) || 0) + cleanAmount;
    if (!goal.history) goal.history = [];
    goal.history.unshift({
      id: 'h-' + Date.now(),
      date: date || new Date().toISOString().split('T')[0],
      amount: cleanAmount,
      note: note ? note.trim() : 'Setoran Tabungan'
    });

    StorageEngine.saveUserData(user.username, data);
    return { success: true, goal };
  },

  deleteGoal(goalId) {
    const user = AuthModule.getCurrentUser();
    if (!user) return false;
    const data = StorageEngine.getUserData(user.username);
    data.goals = data.goals.filter(g => g.id !== goalId);
    StorageEngine.saveUserData(user.username, data);
    return true;
  },

  renderGoalsGrid(containerId = 'goals-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const goals = this.getGoals();
    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i data-lucide="target"></i></div>
          <h4>Belum Ada Impian Menabung</h4>
          <p>Mulai wujudkan barang atau impian masa depan Anda dengan membuat target tabungan!</p>
          <button class="btn btn-primary" style="margin-top: 14px;" onclick="App.openAddGoalModal()">
            <i data-lucide="plus"></i> Tambah Impian Pertama
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    goals.forEach(g => {
      const target = Number(g.targetAmount) || 1;
      const current = Number(g.currentAmount) || 0;
      const percent = Math.min(Math.round((current / target) * 100), 100);
      const remaining = Math.max(0, target - current);
      const isCompleted = current >= target;

      let daysInfo = '';
      if (g.targetDate) {
        const today = new Date();
        const deadline = new Date(g.targetDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          daysInfo = `• <span>${diffDays} hari lagi</span>`;
        } else if (diffDays === 0) {
          daysInfo = `• <span style="color: var(--warning-amber);">Hari ini</span>`;
        } else {
          daysInfo = `• <span style="color: var(--expense-red);">Terlewat</span>`;
        }
      }

      html += `
        <div class="goal-card" style="border-top: 4px solid ${g.color || '#8c52ff'};">
          <div>
            <div class="goal-card-top">
              <div class="goal-title-wrap">
                <div class="goal-emoji">${g.emoji || '🎯'}</div>
                <div>
                  <h3>${g.title}</h3>
                  <span>${g.category || 'Impian'} ${daysInfo}</span>
                </div>
              </div>
              <span class="goal-percent-badge" style="${isCompleted ? 'background: var(--income-green-bg); color: var(--income-green); border-color: rgba(0, 230, 118, 0.4);' : ''}">
                ${isCompleted ? '🎉 TERCAPAI' : percent + '%'}
              </span>
            </div>

            <div class="goal-progress-bar-bg">
              <div class="goal-progress-bar-fill" style="width: ${percent}%; background: ${g.color || 'var(--grad-btn)'};"></div>
            </div>

            <div class="goal-amount-row" style="margin-bottom: 6px;">
              <span>Terkumpul: <strong>${AccountsModule.formatIDR(current)}</strong></span>
              <span>Target: <strong>${AccountsModule.formatIDR(target)}</strong></span>
            </div>

            <div style="font-size: 11.5px; color: var(--text-secondary);">
              ${isCompleted ? 'Target impian ini telah berhasil dicapai sepenuhnya!' : `Sisa yang dibutuhkan: <strong style="color: var(--accent-purple-light);">${AccountsModule.formatIDR(remaining)}</strong>`}
            </div>
          </div>

          <div class="goal-actions">
            <button class="btn btn-primary btn-sm btn-block" onclick="App.openDepositGoalModal('${g.id}')">
              <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> Setor Tabungan
            </button>
            <button class="icon-btn" style="width: 36px; height: 36px;" title="Riwayat Setoran" onclick="App.openGoalDetailModal('${g.id}')">
              <i data-lucide="history" style="width: 15px; height: 15px;"></i>
            </button>
            <button class="icon-btn" style="width: 36px; height: 36px;" title="Hapus Impian" onclick="GoalsModule.confirmDelete('${g.id}')">
              <i data-lucide="trash-2" style="width: 15px; height: 15px; color: var(--expense-red);"></i>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  confirmDelete(goalId) {
    if (confirm('Apakah Anda yakin ingin menghapus impian ini?')) {
      this.deleteGoal(goalId);
      App.showToast('Impian berhasil dihapus');
      this.renderGoalsGrid();
    }
  }
};

window.GoalsModule = GoalsModule;
