/**
 * Charts Visualization Module for Nabung Kuy!
 * Interactive Daily, Monthly & Yearly financial analysis using Chart.js
 */

let mainCashflowChart = null;
let categoryDoughnutChart = null;

const ChartsModule = {
  currentPeriod: 'monthly', // 'daily', 'monthly', 'yearly'

  init() {
    this.renderCharts(this.currentPeriod);
  },

  setPeriod(period) {
    this.currentPeriod = period;
    // Update active filter pill
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });
    this.renderCharts(period);
  },

  renderCharts(period = 'monthly') {
    const txs = TransactionsModule.getTransactions();
    const categories = CategoriesModule.getCategories();

    this.renderMainChart(period, txs);
    this.renderCategoryBreakdown(txs, categories);
  },

  renderMainChart(period, txs) {
    const canvas = document.getElementById('cashflow-chart-canvas');
    if (!canvas) return;

    if (mainCashflowChart) {
      mainCashflowChart.destroy();
    }

    let labels = [];
    let incomeData = [];
    let expenseData = [];

    const now = new Date();

    if (period === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        labels.push(dayLabel);

        const dayTxs = txs.filter(t => t.date === dateStr);
        const inc = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const exp = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        incomeData.push(inc);
        expenseData.push(exp);
      }
    } else if (period === 'monthly') {
      // 12 months of current year
      const currentYear = now.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let m = 0; m < 12; m++) {
        labels.push(monthNames[m]);
        const mStr = String(m + 1).padStart(2, '0');
        const prefix = `${currentYear}-${mStr}`;

        const monthTxs = txs.filter(t => t.date && t.date.startsWith(prefix));
        const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        incomeData.push(inc);
        expenseData.push(exp);
      }
    } else if (period === 'yearly') {
      // Last 5 years
      const currentYear = now.getFullYear();
      for (let y = currentYear - 3; y <= currentYear + 1; y++) {
        labels.push(String(y));
        const yTxs = txs.filter(t => t.date && t.date.startsWith(String(y)));
        const inc = yTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const exp = yTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
        incomeData.push(inc);
        expenseData.push(exp);
      }
    }

    const ctx = canvas.getContext('2d');
    mainCashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan',
            data: incomeData,
            backgroundColor: 'rgba(0, 230, 118, 0.75)',
            borderColor: '#00e676',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.6
          },
          {
            label: 'Pengeluaran',
            data: expenseData,
            backgroundColor: 'rgba(255, 51, 102, 0.75)',
            borderColor: '#ff3366',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#f1f0f7',
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(20, 14, 43, 0.95)',
            borderColor: 'rgba(140, 82, 255, 0.3)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#f1f0f7',
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${AccountsModule.formatIDR(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(140, 82, 255, 0.08)' },
            ticks: { color: '#9d96b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(140, 82, 255, 0.08)' },
            ticks: {
              color: '#9d96b8',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (val) => {
                if (val >= 1000000) return (val / 1000000).toFixed(0) + ' Jt';
                if (val >= 1000) return (val / 1000).toFixed(0) + ' Rb';
                return val;
              }
            }
          }
        }
      }
    });
  },

  renderCategoryBreakdown(txs, categories) {
    const canvas = document.getElementById('category-doughnut-canvas');
    if (!canvas) return;

    if (categoryDoughnutChart) {
      categoryDoughnutChart.destroy();
    }

    // Expense breakdown by category
    const expenseTxs = txs.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenseTxs.forEach(t => {
      const catId = t.categoryId || 'unknown';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount || 0);
    });

    const labels = [];
    const data = [];
    const bgColors = [];

    Object.keys(categoryTotals).forEach(catId => {
      const cat = categories.find(c => c.id === catId) || { name: 'Lainnya', color: '#8c52ff' };
      labels.push(cat.name);
      data.push(categoryTotals[catId]);
      bgColors.push(cat.color);
    });

    if (labels.length === 0) {
      labels.push('Belum ada pengeluaran');
      data.push(1);
      bgColors.push('#4d466b');
    }

    const ctx = canvas.getContext('2d');
    categoryDoughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#140e2b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f1f0f7',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(20, 14, 43, 0.95)',
            borderColor: 'rgba(140, 82, 255, 0.3)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${AccountsModule.formatIDR(ctx.parsed)}`
            }
          }
        },
        cutout: '70%'
      }
    });
  }
};

window.ChartsModule = ChartsModule;
