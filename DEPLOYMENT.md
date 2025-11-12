# Deployment Guide - Laravel Backend

## Volume Mount Configuration (Easypanel)

Pastikan volume mount di Easypanel sudah dikonfigurasi seperti ini:

```
Volume Mounts:
1. storage-uploads → /var/www/html/storage/app/public
2. bootstrap-cache → /var/www/html/bootstrap/cache
```

### ✅ Mengapa Konfigurasi Ini?

- **storage-uploads**: Menyimpan semua file yang diupload (produk, tema, logo, dll). Volume ini akan **PERSIST** meskipun container di-restart atau deploy ulang.
- **bootstrap-cache**: Menyimpan cache Laravel untuk performa lebih baik.

## Automatic Storage Symlink

Symlink `public/storage → storage/app/public` akan **OTOMATIS** dibuat setiap kali:
- Container restart
- Deploy baru
- Service di-redeploy

### Proses Otomatis (docker-entrypoint.sh):

1. ✅ Remove existing `public/storage` (jika ada)
2. ✅ Create symlink dengan `php artisan storage:link --force`
3. ✅ Fallback ke manual symlink jika artisan gagal
4. ✅ Verify symlink berhasil dibuat
5. ✅ Set proper permissions

### Monitoring Logs

Setelah deploy, cek logs container untuk memastikan symlink berhasil dibuat:

```bash
# Di Easypanel, lihat logs container
# Anda akan melihat output seperti ini:

🔗 Setting up storage symlink...
  → Removing existing public/storage...
  → Creating symlink with php artisan storage:link...
  ✓ Storage symlink created successfully!
    Source: public/storage
    Target: /var/www/html/storage/app/public
    Target directory exists: OK
  ✓ Symlink is accessible
```

## Troubleshooting

### ❌ Problem: File upload tidak terlihat setelah deploy

**Solusi:**
1. Cek volume mount sudah benar (lihat konfigurasi di atas)
2. Cek logs container, pastikan ada pesan "✓ Storage symlink created successfully!"
3. Masuk ke container dan verifikasi manual:
   ```bash
   ls -lah /var/www/html/public/storage
   # Harus menunjukkan symlink: public/storage -> /var/www/html/storage/app/public

   ls -lah /var/www/html/storage/app/public
   # Harus menampilkan folder: theme/, products/, products-digital/, dll
   ```

### ❌ Problem: Symlink creation failed

Jika melihat pesan "✗ CRITICAL: Storage symlink creation FAILED!":
1. Container akan exit dengan error (fail-fast)
2. Cek logs untuk detail error
3. Kemungkinan penyebab:
   - Permission issue
   - Volume mount tidak benar
   - Directory `/var/www/html/storage/app/public` tidak ada

**Manual Fix:**
```bash
# Masuk ke container
docker exec -it <container-id> sh

# Manual create symlink
rm -rf /var/www/html/public/storage
ln -sf /var/www/html/storage/app/public /var/www/html/public/storage

# Set permissions
chown -h www-data:www-data /var/www/html/public/storage
```

### ❌ Problem: Upload folder structure tidak ada

Struktur folder akan otomatis dibuat oleh `docker-entrypoint.sh`:
```
storage/app/public/
├── theme/
│   ├── logos/
│   ├── slides/
│   ├── favicons/
│   └── seo/
├── products/
├── products-digital/
└── editor-images/
```

Jika folder tidak ada, akan dibuat otomatis saat container start.

## Backup & Restore File Upload

### Backup File Upload

```bash
# Dari Easypanel, masuk ke container
docker exec -it <container-id> sh

# Create backup tar file
cd /var/www/html
tar -czf /tmp/storage-backup-$(date +%Y%m%d-%H%M%S).tar.gz storage/app/public/

# Copy backup keluar dari container (dari host/local machine)
docker cp <container-id>:/tmp/storage-backup-*.tar.gz ./
```

### Restore File Upload

```bash
# Copy backup file ke container
docker cp storage-backup-*.tar.gz <container-id>:/tmp/

# Masuk ke container
docker exec -it <container-id> sh

# Restore backup
cd /var/www/html
tar -xzf /tmp/storage-backup-*.tar.gz

# Set permissions
chown -R www-data:www-data storage/app/public
chmod -R 775 storage/app/public
```

## Deployment Checklist

Sebelum deploy, pastikan:
- [ ] Volume mount sudah benar di Easypanel
- [ ] File `.env` sudah dikonfigurasi
- [ ] Database credentials benar
- [ ] `APP_KEY` sudah di-generate

Setelah deploy:
- [ ] Cek logs container, pastikan ada "✓ Storage symlink created successfully!"
- [ ] Test upload file di aplikasi
- [ ] Verifikasi file yang diupload sebelumnya masih terlihat

## Files yang Tidak Di-commit ke Git

File/folder berikut **TIDAK** akan di-commit ke Git (sudah di `.gitignore`):
- `/public/storage` - Symlink (akan dibuat otomatis)
- `/storage/app/public/*` - File upload (akan persist di volume)
- `/storage/framework/cache/*` - Cache files
- `/storage/logs/*` - Log files

Tapi struktur direktori dijaga dengan `.gitkeep` files.

## Summary

✅ **Sekarang Anda TIDAK perlu manual run command lagi!**

Command yang sebelumnya harus manual:
```bash
rm -rf public/storage  # ❌ TIDAK PERLU LAGI
ln -s /var/www/html/storage/app/public /var/www/html/public/storage  # ❌ TIDAK PERLU LAGI
chown -R www-data:www-data storage bootstrap/cache  # ❌ TIDAK PERLU LAGI
chmod -R 775 storage bootstrap/cache  # ❌ TIDAK PERLU LAGI
```

Semua sudah **OTOMATIS** dijalankan oleh `docker-entrypoint.sh` setiap kali deploy! 🎉
