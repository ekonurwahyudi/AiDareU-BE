# Migration Guide: Adding Affiliate and Jasa Product Types

## Overview
This migration adds support for 2 new product types to the existing products table:
- **Affiliate**: Products with affiliate links (requires URL)
- **Jasa**: Service products (no URL, no stock required)

## Database Changes
The migration modifies the `jenis_produk` column constraint to accept 4 values instead of 2:
- Before: `['digital', 'fisik']`
- After: `['digital', 'fisik', 'affiliate', 'jasa']`

## Production Deployment (Easypanel + PostgreSQL)

### Option 1: Using Laravel Migration (Recommended)
```bash
# SSH into your Easypanel backend container
cd /var/www/html  # or your app directory

# Run the migration
php artisan migrate --force

# Verify the migration ran successfully
php artisan migrate:status
```

### Option 2: Manual SQL Execution (If migration fails)
```bash
# Connect to PostgreSQL database
psql -U your_db_user -d your_database_name

# Execute the SQL commands
\i /var/www/html/update_product_types.sql

# Or copy-paste the SQL directly:
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_jenis_produk_check;
ALTER TABLE products ADD CONSTRAINT products_jenis_produk_check
  CHECK (jenis_produk::text = ANY (ARRAY['digital'::character varying, 'fisik'::character varying, 'affiliate'::character varying, 'jasa'::character varying]::text[]));
```

### Option 3: Using Easypanel Web Terminal
1. Open Easypanel dashboard
2. Go to your backend service
3. Click "Terminal" tab
4. Run migration command:
```bash
php artisan migrate --force
```

## Verification
After applying the migration, verify it works:

```bash
# Test creating an affiliate product
php artisan tinker
>>> $product = new \App\Models\Product();
>>> $product->jenis_produk = 'affiliate';
>>> $product->save();  # Should work without errors
```

## Rollback (If Needed)
```bash
# Rollback this specific migration
php artisan migrate:rollback --step=1 --force

# This will revert the constraint back to only 'digital' and 'fisik'
```

## Notes
- **No data loss**: This migration only modifies constraints, existing data remains intact
- **Backward compatible**: Existing 'digital' and 'fisik' products continue to work
- **Zero downtime**: The constraint modification is non-blocking
- **Development**: SQLite users will see table recreation (handled automatically)

## Troubleshooting

### Error: "constraint already exists"
```sql
-- Manually drop the constraint first
ALTER TABLE products DROP CONSTRAINT products_jenis_produk_check CASCADE;
-- Then run the migration again
```

### Error: "permission denied"
- Ensure your database user has ALTER TABLE permissions
- You may need to run as database superuser

### Migration shows as "Pending"
- Check if previous migrations have issues
- Try running: `php artisan migrate --force`
- Check migration table: `SELECT * FROM migrations ORDER BY id DESC LIMIT 10;`

## Support
If you encounter issues, check:
1. Database connection in `.env.production`
2. Migration status: `php artisan migrate:status`
3. Application logs: `tail -f storage/logs/laravel.log`
