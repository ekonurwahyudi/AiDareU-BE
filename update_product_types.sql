-- Update products table to support 4 product types: digital, fisik, affiliate, jasa
-- For PostgreSQL production database

-- Drop existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_jenis_produk_check;

-- Add new constraint with all 4 values
ALTER TABLE products ADD CONSTRAINT products_jenis_produk_check CHECK (jenis_produk::text = ANY (ARRAY['digital'::character varying, 'fisik'::character varying, 'affiliate'::character varying, 'jasa'::character varying]::text[]));

-- Verify the constraint is added
SELECT conname, consrc
FROM pg_constraint
WHERE conname = 'products_jenis_produk_check';
