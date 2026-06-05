# Helper Script to Rename Outer Workspace Folder
# Running this script while this IDE session is active will fail because the IDE has open file handles in C:\kasrw.
# To safely rename:
# 1. Close this IDE / code editor.
# 2. Open a standard PowerShell terminal as Administrator.
# 3. Run this script or execute the commands below.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "PANDUAN MENGUBAH NAMA FOLDER KASRW MENJADI LELANG BARANG" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Langkah-langkah:"
Write-Host "1. PASTIKAN ANDA TELAH MENUTUP IDE (VS Code / Gemini IDE)."
Write-Host "   (Jika tidak ditutup, Windows akan menolak karena file sedang dikunci/digunakan)"
Write-Host ""
Write-Host "2. Jalankan perintah berikut di PowerShell (sebagai Administrator):" -ForegroundColor White
Write-Host "   Rename-Item -Path 'C:\kasrw' -NewName 'Lelang Barang'" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan

$response = Read-Host "Apakah Anda ingin mencoba mengubah nama folder sekarang? (y/n)"
if ($response -eq 'y') {
    Write-Host "Mencoba mengubah nama folder..." -ForegroundColor Yellow
    try {
        # Go to a safe path before renaming the directory
        Set-Location C:\
        Rename-Item -Path "C:\kasrw" -NewName "Lelang Barang" -ErrorAction Stop
        Write-Host "SUKSES! Folder berhasil diubah menjadi C:\Lelang Barang" -ForegroundColor Green
    } catch {
        Write-Host "GAGAL: Tidak dapat mengubah nama folder karena sedang digunakan oleh proses lain." -ForegroundColor Red
        Write-Host "Silakan TUTUP semua aplikasi editor/terminal yang sedang membuka folder ini, lalu coba lagi." -ForegroundColor Yellow
        # Back to safety
        Set-Location "C:\kasrw\Lelang Barang"
    }
}
