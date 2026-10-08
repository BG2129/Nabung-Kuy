/**
 * Financial Reports & Export Module for Nabung Kuy!
 * Generates downloadable PDF statements (jsPDF) and Excel spreadsheets (SheetJS XLSX).
 */

const ExportModule = {
  getFilteredReportData() {
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    const typeFilter = document.getElementById('report-type-filter')?.value || 'all';
    const accFilter = document.getElementById('report-account-filter')?.value || 'all';

    let txs = TransactionsModule.getTransactions();
    const categories = CategoriesModule.getCategories();
    const accounts = AccountsModule.getAccounts();

    if (startDate) {
      txs = txs.filter(t => t.date >= startDate);
    }
    if (endDate) {
      txs = txs.filter(t => t.date <= endDate);
    }
    if (typeFilter !== 'all') {
      txs = txs.filter(t => t.type === typeFilter);
    }
    if (accFilter !== 'all') {
      txs = txs.filter(t => t.accountId === accFilter);
    }

    // Sort by date descending
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Summary
    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const netSavings = totalIncome - totalExpense;

    return { txs, categories, accounts, totalIncome, totalExpense, netSavings, startDate, endDate };
  },

  renderReportPreview() {
    const { txs, categories, accounts, totalIncome, totalExpense, netSavings } = this.getFilteredReportData();

    // Summary Cards in Report Tab
    const sumIncomeEl = document.getElementById('report-sum-income');
    const sumExpenseEl = document.getElementById('report-sum-expense');
    const sumNetEl = document.getElementById('report-sum-net');

    if (sumIncomeEl) sumIncomeEl.textContent = AccountsModule.formatIDR(totalIncome);
    if (sumExpenseEl) sumExpenseEl.textContent = AccountsModule.formatIDR(totalExpense);
    if (sumNetEl) {
      sumNetEl.textContent = AccountsModule.formatIDR(netSavings);
      sumNetEl.style.color = netSavings >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }

    // Table rows
    const tbody = document.getElementById('report-table-body');
    if (!tbody) return;

    if (txs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-secondary);">
            Tidak ada transaksi pada filter yang dipilih.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = txs.map((tx, idx) => {
      let catName = '-';
      let accName = '-';
      let typeLabel = 'Pengeluaran';
      let typeColor = 'var(--expense-red)';
      let sign = '-';

      const cat = categories.find(c => c.id === tx.categoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      catName = cat ? cat.name : '-';
      accName = acc ? acc.name : 'Rekening';

      if (tx.type === 'income') {
        typeLabel = 'Pemasukan';
        typeColor = 'var(--income-green)';
        sign = '+';
      } else {
        typeLabel = 'Pengeluaran';
        typeColor = 'var(--expense-red)';
        sign = '-';
      }

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${tx.date}</td>
          <td><span style="font-weight: 700; color: ${typeColor};">${typeLabel}</span></td>
          <td>${catName}</td>
          <td>${accName}</td>
          <td>${tx.note || '-'}</td>
          <td style="font-weight: 700; color: ${typeColor};">${sign} ${AccountsModule.formatIDR(tx.amount)}</td>
        </tr>
      `;
    }).join('');
  },

  // Export to Excel (SheetJS XLSX)
  exportToExcel() {
    const { txs, categories, accounts, totalIncome, totalExpense, netSavings } = this.getFilteredReportData();
    const user = AuthModule.getCurrentUser();

    if (!window.XLSX) {
      App.showToast('Pustaka Excel sedang disiapkan. Silakan coba sebentar lagi.');
      return;
    }

    const excelData = txs.map((tx, idx) => {
      let catName = '-';
      let accName = '-';
      let typeStr = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

      const cat = categories.find(c => c.id === tx.categoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      catName = cat?.name || '-';
      accName = acc?.name || '-';

      return {
        'No': idx + 1,
        'Tanggal': tx.date,
        'Tipe': typeStr,
        'Kategori': catName,
        'Rekening': accName,
        'Catatan': tx.note || '-',
        'Nominal (Rp)': Number(tx.amount) || 0
      };
    });

    // Add Summary Row
    excelData.push({});
    excelData.push({
      'No': 'RINGKASAN',
      'Tanggal': '',
      'Tipe': `Total Masuk: ${AccountsModule.formatIDR(totalIncome)}`,
      'Kategori': `Total Keluar: ${AccountsModule.formatIDR(totalExpense)}`,
      'Rekening': `Arus Bersih: ${AccountsModule.formatIDR(netSavings)}`
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan');

    const fileName = `Laporan_NabungKuy_${user?.username || 'user'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    App.showToast('Laporan Excel berhasil diunduh!');
  },

  // Export to PDF (jsPDF + autoTable)
  exportToPDF() {
    const { txs, categories, accounts, totalIncome, totalExpense, netSavings, startDate, endDate } = this.getFilteredReportData();
    const user = AuthModule.getCurrentUser();

    if (!window.jspdf || !window.jspdf.jsPDF) {
      App.showToast('Pustaka PDF sedang disiapkan. Silakan coba sebentar lagi.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header styling
    doc.setFillColor(20, 14, 43); // Dark purple header
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NABUNG KUY!', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(171, 123, 255);
    doc.text('Laporan Pencatatan Keuangan Pribadi', 14, 26);

    // Meta Right
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 240);
    doc.text(`Pengguna: ${user?.fullName || user?.username || 'Pengguna'}`, 196, 16, { align: 'right' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 196, 23, { align: 'right' });
    if (startDate || endDate) {
      doc.text(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Kini'}`, 196, 30, { align: 'right' });
    }

    // Summary Boxes
    const startY = 44;
    // Box 1: Pemasukan
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(0, 230, 118);
    doc.roundedRect(14, startY, 56, 20, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('TOTAL PEMASUKAN', 18, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(AccountsModule.formatIDR(totalIncome), 18, startY + 15);

    // Box 2: Pengeluaran
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(255, 51, 102);
    doc.roundedRect(76, startY, 56, 20, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL PENGELUARAN', 80, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(AccountsModule.formatIDR(totalExpense), 80, startY + 15);

    // Box 3: Saldo Bersih
    doc.setFillColor(245, 243, 255);
    doc.setDrawColor(140, 82, 255);
    doc.roundedRect(138, startY, 58, 20, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(88, 28, 135);
    doc.text('ARUS KAS BERSIH', 142, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(AccountsModule.formatIDR(netSavings), 142, startY + 15);

    // AutoTable rows
    const tableRows = txs.map((tx, idx) => {
      let catName = '-';
      let accName = '-';
      let typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

      const cat = categories.find(c => c.id === tx.categoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      catName = cat?.name || '-';
      accName = acc?.name || '-';

      return [
        idx + 1,
        tx.date,
        typeLabel,
        catName,
        accName,
        tx.note || '-',
        AccountsModule.formatIDR(tx.amount)
      ];
    });

    if (doc.autoTable) {
      doc.autoTable({
        head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Rekening', 'Catatan', 'Nominal']],
        body: tableRows,
        startY: 70,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [32, 20, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 252]
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 22 },
          2: { cellWidth: 24 },
          3: { cellWidth: 32 },
          4: { cellWidth: 32 },
          5: { cellWidth: 40 },
          6: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
        }
      });
    }

    const fileName = `Laporan_NabungKuy_${user?.username || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    App.showToast('Laporan PDF berhasil diunduh!');
  }
};

window.ExportModule = ExportModule;
