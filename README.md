# Input Budgeting Telegram + Web

Project ini berisi web statis GitHub Pages dan Google Apps Script untuk memasukkan transaksi ke Google Sheets budgeting.

## Konfigurasi Saat Ini

Nilai penting sudah ditaruh langsung di kode:

- Spreadsheet ID: `1Ke5JjAZ7jsnYXR07bt13WyTe9zGTBRxa9A-iMnJSf0k`
- Apps Script Web App URL: `https://script.google.com/macros/s/AKfycbwsV7vVI8hRiisJg3kHNMiKBwvuEeycy6sjy9vVgqj66wyHNudJ6CSbqw2AtQ_7VJ9zyQ/exec`
- Web token: sama dengan Spreadsheet ID
- Telegram token: ada di `CONFIG.TELEGRAM_BOT_TOKEN` pada [apps-script/Code.gs](apps-script/Code.gs)

## Kolom Spreadsheet

Transaksi ditulis mulai baris `96`:

- `C`: tanggal otomatis dari waktu kirim
- `D`: jenis transaksi
- `G`: kategori
- `K`: nominal
- `L`: keterangan

## Setup Apps Script

1. Buka spreadsheet Google Sheets.
2. Pilih `Ekstensi` -> `Apps Script`.
3. Salin isi [apps-script/Code.gs](apps-script/Code.gs) ke editor Apps Script.
4. Klik `Save`.
5. Jalankan function `testAppendTransaction()` dari Apps Script.
6. Beri izin akses saat diminta Google.
7. Cek sheet bulan berjalan. Pada 3 Juni 2026, data otomatis masuk ke sheet `Juni`.
8. Deploy ulang sebagai versi baru:
   - `Deploy` -> `Manage deployments`
   - Klik ikon pensil
   - Pilih `New version`
   - Execute as: `Me`
   - Who has access: `Anyone`
   - Klik `Deploy`
9. Jalankan `setTelegramWebhook()` sekali.
10. Jalankan `getTelegramWebhookInfo()` untuk cek webhook aktif.

## Format Chat Telegram

Satu baris:

```text
pengeluaran | Makanan | 42000 | Soto
```

Atau per baris:

```text
pendapatan
Gaji
7500000
Gaji bulanan
```

Jenis yang dikenali:

- `pendapatan` atau `pemasukan`
- `pengeluaran`
- `tabungan` atau `investasi`
- `tagihan`
- `utang`, `hutang`, atau `pembayaran utang`

## Web

Buka [index.html](index.html), isi transaksi, lalu klik `Simpan Transaksi`. URL dan token sudah disimpan di [script.js](script.js), jadi tidak perlu isi pengaturan lagi.

Karena browser memakai mode `no-cors` untuk Apps Script, web tidak bisa membaca respons sukses/gagal secara detail. Kalau data belum masuk, cek `Executions` di Apps Script untuk melihat error sebenarnya.
