# Nabung Kuy! 💰🚀
### Aplikasi Web Pencatatan Keuangan Pribadi Modern

Aplikasi pencatatan keuangan pribadi modern dengan tema **deep dark purple fintech** yang terinspirasi dari desain wallet mobile terkini. Dirancang khusus dengan pendekatan **mobile-first** (sangat nyaman dan memukau di smartphone) dan **responsif fluid** di layar laptop/desktop.

---

## ✨ Fitur-Fitur Utama

1. **🔐 Autentikasi Pengguna & Multi-Akun Lokal**
   - Wajib memasukkan username dan password sebelum masuk ke aplikasi.
   - Mendukung pendaftaran akun baru, login multi-user lokal, dan tombol instan **"Coba Langsung (Akun Demo)"**.
   - Setiap akun memiliki data dan riwayat keuangan yang terisolasi.

2. **💳 Multi Rekening (Saldo Terpisah)**
   - Kelola berbagai rekening dan dompet digital (misal: **BCA**, **Mandiri**, **Bank Jago**, **GoPay / OVO**, dan **Dompet Tunai**).
   - Tampilan kartu bergaya kartu ATM/debit horizontal yang elegan (*carousel* di HP & *grid* di laptop).
   - Perhitungan saldo otomatis secara *real-time*.
   - Fitur **Transfer Saldo Antar Rekening** dengan validasi saldo dan pencatatan riwayat.

3. **💸 Pencatatan Uang Keluar & Masuk + Upload Struk**
   - Pencatatan cepat melalui tombol melayang **"+ Catat"**.
   - Kategori transaksi, pilihan rekening, tanggal, dan catatan.
   - **Upload Struk / Bukti Transaksi**: mendukung kamera langsung di HP atau upload file gambar dari galeri/laptop.
   - Kompresi gambar otomatis dan penyimpanan di IndexedDB.
   - Fitur **Lightbox Viewer** untuk melihat foto struk secara penuh.

4. **📊 Grafik Interaktif (Harian, Bulanan, Tahunan)**
   - Menggunakan visualisasi modern **Chart.js**.
   - Tab switcher waktu:
     - **Harian**: Tren arus kas 7 hari terakhir.
     - **Bulanan**: Komparasi pemasukan vs pengeluaran 12 bulan dalam setahun.
     - **Tahunan**: Rekapitulasi perbandingan tahun ke tahun.
   - **Doughnut Breakdown Chart**: Analisis proporsi pengeluaran berdasarkan kategori.

5. **📄 Laporan Keuangan & Download (PDF + Excel)**
   - Filter laporan berdasarkan rentang tanggal, jenis transaksi, dan rekening.
   - Ringkasan otomatis: Total Pemasukan, Total Pengeluaran, dan Arus Kas Bersih.
   - **Unduh Laporan PDF**: Format surat/laporan keuangan rapi siap cetak via *jsPDF*.
   - **Unduh Laporan Excel (.xlsx)**: File spreadsheet multi-kolom yang siap diolah via *SheetJS*.

6. **🎯 Fitur GOALS (Impian Menabung)**
   - Buat impian dengan target nominal, tanggal target, emoji, dan warna aksen.
   - Bar progres persentase capaian dan sisa nominal yang perlu ditabung.
   - Tombol **+ Setor Tabungan** (pencatatan setoran tabungan mandiri beserta catatan).
   - Riwayat setoran untuk setiap impian dan badge selebrasi saat target tercapai.

7. **🏷️ Master Kategori Transaksi**
   - Kategori default lengkap (Gaji, Proyek, Makanan, Belanja, Transportasi, Tagihan, Hiburan, dll).
   - Tambah kategori baru dengan pemilih ikon (*Lucide Icons*) dan palet warna custom.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dibuat sebagai Single Page Application (SPA) berbasis web murni tanpa ketergantungan runtime khusus:

### Opsi 1: Buka Langsung di Browser
Klik dua kali file `index.html` pada File Explorer untuk membukanya langsung di Microsoft Edge, Google Chrome, atau browser favorit Anda.

### Opsi 2: Jalankan via Local Server (PowerShell)
Buka PowerShell di folder project, lalu jalankan:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1 -Port 8080
```
Lalu buka di browser:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🎨 Palet Desain
- **Background Utama**: `#0c0819` (Deep Space Violet)
- **Kartu & Surface**: `#140e2b` & `#1c143d` dengan Glassmorphism
- **Aksen Neon**: `#8c52ff` & `#a855f7`
- **Pemasukan**: `#00e676` (Emerald Neon)
- **Pengeluaran**: `#ff3366` (Rose Neon)
- **Transfer**: `#38bdf8` (Cyan Blue)
