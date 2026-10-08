/**
 * Mock Data Initializer for Nabung Kuy!
 * Realistic initial data for Indonesian personal finance.
 */

const DEFAULT_CATEGORIES = [
  // Pemasukan
  { id: 'cat-inc-1', name: 'Gaji Pokok', type: 'income', icon: 'briefcase', color: '#00e676' },
  { id: 'cat-inc-2', name: 'Bonus & THR', type: 'income', icon: 'gift', color: '#10b981' },
  { id: 'cat-inc-3', name: 'Hasil Investasi', type: 'income', icon: 'trending-up', color: '#06b6d4' },
  { id: 'cat-inc-4', name: 'Freelance / Proyek', type: 'income', icon: 'laptop', color: '#3b82f6' },
  { id: 'cat-inc-5', name: 'Lainnya (Masuk)', type: 'income', icon: 'plus-circle', color: '#8b5cf6' },

  // Pengeluaran
  { id: 'cat-exp-1', name: 'Makanan & Minuman', type: 'expense', icon: 'coffee', color: '#ff3366' },
  { id: 'cat-exp-2', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'shopping-cart', color: '#f43f5e' },
  { id: 'cat-exp-3', name: 'Transportasi & Bensin', type: 'expense', icon: 'car', color: '#f59e0b' },
  { id: 'cat-exp-4', name: 'Tagihan & Langganan', type: 'expense', icon: 'zap', color: '#ec4899' },
  { id: 'cat-exp-5', name: 'Hiburan & Liburan', type: 'expense', icon: 'film', color: '#a855f7' },
  { id: 'cat-exp-6', name: 'Kesehatan & Obat', type: 'expense', icon: 'heart-pulse', color: '#ef4444' },
  { id: 'cat-exp-7', name: 'Pendidikan & Kursus', type: 'expense', icon: 'book-open', color: '#6366f1' },
  { id: 'cat-exp-8', name: 'Lainnya (Keluar)', type: 'expense', icon: 'minus-circle', color: '#64748b' }
];

const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-bca',
    name: 'BCA Prioritas',
    type: 'Bank Transfer',
    theme: 'theme-bca',
    accountNumber: '•••• 8821',
    holderName: 'HANIF ALIDIKA',
    initialBalance: 12500000,
    color: '#103783'
  },
  {
    id: 'acc-mandiri',
    name: 'Mandiri Livin',
    type: 'Bank Mandiri',
    theme: 'theme-mandiri',
    accountNumber: '•••• 4109',
    holderName: 'HANIF ALIDIKA',
    initialBalance: 6850000,
    color: '#835205'
  },
  {
    id: 'acc-jago',
    name: 'Bank Jago (Kantong Utama)',
    type: 'Digital Bank',
    theme: 'theme-jago',
    accountNumber: '•••• 1928',
    holderName: 'HANIF ALIDIKA',
    initialBalance: 3400000,
    color: '#7c1a8a'
  },
  {
    id: 'acc-gopay',
    name: 'GoPay / OVO Wallet',
    type: 'E-Wallet',
    theme: 'theme-gopay',
    accountNumber: '0812 •••• 992',
    holderName: 'HANIF ALIDIKA',
    initialBalance: 950000,
    color: '#097063'
  },
  {
    id: 'acc-tunai',
    name: 'Dompet Tunai (Cash)',
    type: 'Tunai',
    theme: 'theme-tunai',
    accountNumber: 'CASH HOLD',
    holderName: 'HANIF ALIDIKA',
    initialBalance: 450000,
    color: '#303749'
  }
];

const DEFAULT_GOALS = [
  {
    id: 'goal-1',
    title: 'Beli MacBook M3 Pro',
    category: 'Elektronik',
    emoji: '💻',
    targetAmount: 28000000,
    currentAmount: 18500000,
    targetDate: '2026-12-31',
    color: '#8c52ff',
    history: [
      { id: 'h-1', date: '2026-08-01', amount: 5000000, note: 'Setoran Awal Tabungan' },
      { id: 'h-2', date: '2026-09-01', amount: 6500000, note: 'Bonus Freelance' },
      { id: 'h-3', date: '2026-10-01', amount: 7000000, note: 'Sisa Gaji Bulanan' }
    ]
  },
  {
    id: 'goal-2',
    title: 'Dana Darurat 6 Bulan',
    category: 'Keamanan Finansial',
    emoji: '🛡️',
    targetAmount: 36000000,
    currentAmount: 25000000,
    targetDate: '2027-03-31',
    color: '#00e676',
    history: [
      { id: 'h-4', date: '2026-07-15', amount: 15000000, note: 'Dana Awal' },
      { id: 'h-5', date: '2026-09-10', amount: 10000000, note: 'Alokasi Penghematan' }
    ]
  },
  {
    id: 'goal-3',
    title: 'Liburan Akhir Tahun Jepang',
    category: 'Traveling',
    emoji: '✈️',
    targetAmount: 22000000,
    currentAmount: 9800000,
    targetDate: '2026-12-20',
    color: '#ff3366',
    history: [
      { id: 'h-6', date: '2026-08-20', amount: 4800000, note: 'Tabungan Tiket Pesawat' },
      { id: 'h-7', date: '2026-09-25', amount: 5000000, note: 'Tabungan Hotel' }
    ]
  }
];

// Helper to generate recent ISO date strings
function getRecentDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-01',
    type: 'income',
    amount: 14500000,
    accountId: 'acc-bca',
    categoryId: 'cat-inc-1',
    date: getRecentDate(1),
    note: 'Gaji Bulanan PT Teknologi Indonesia',
    receipt: null
  },
  {
    id: 'tx-02',
    type: 'expense',
    amount: 450000,
    accountId: 'acc-gopay',
    categoryId: 'cat-exp-1',
    date: getRecentDate(1),
    note: 'Makan Malam Sushi Tei bareng Tim',
    receipt: null
  },
  {
    id: 'tx-03',
    type: 'expense',
    amount: 850000,
    accountId: 'acc-mandiri',
    categoryId: 'cat-exp-4',
    date: getRecentDate(2),
    note: 'Tagihan Listrik PLN & Internet Indihome',
    receipt: null
  },
  {
    id: 'tx-04',
    type: 'expense',
    amount: 250000,
    accountId: 'acc-tunai',
    categoryId: 'cat-exp-3',
    date: getRecentDate(3),
    note: 'Isi Bensin Pertamax Shell',
    receipt: null
  },
  {
    id: 'tx-05',
    type: 'income',
    amount: 3200000,
    accountId: 'acc-jago',
    categoryId: 'cat-inc-4',
    date: getRecentDate(4),
    note: 'Proyek Desain Web UI/UX Landing Page',
    receipt: null
  },
  {
    id: 'tx-06',
    type: 'expense',
    amount: 620000,
    accountId: 'acc-bca',
    categoryId: 'cat-exp-2',
    date: getRecentDate(5),
    note: 'Belanja Mingguan Supermarket Papaya',
    receipt: null
  },
  {
    id: 'tx-07',
    type: 'transfer',
    amount: 1000000,
    fromAccountId: 'acc-bca',
    toAccountId: 'acc-gopay',
    date: getRecentDate(6),
    note: 'Top Up Saldo E-Wallet GoPay',
    receipt: null
  },
  {
    id: 'tx-08',
    type: 'expense',
    amount: 120000,
    accountId: 'acc-gopay',
    categoryId: 'cat-exp-5',
    date: getRecentDate(7),
    note: 'Tiket Bioskop Cinema XXI 2 Orang',
    receipt: null
  }
];

const EMPTY_USER_DATA = {
  categories: DEFAULT_CATEGORIES,
  accounts: [],
  goals: [],
  transactions: []
};

window.DEFAULT_DATA = EMPTY_USER_DATA;
window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
