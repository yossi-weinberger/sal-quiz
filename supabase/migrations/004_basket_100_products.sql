-- ============================================================
-- Migration 004: 100 basket groups (physical merge in app data)
-- Updates CHECK constraints from 102/107 to 100.
-- Reseed products with data/seed_products.sql if needed (empty or dev DB).
-- ============================================================

ALTER TABLE responses DROP CONSTRAINT IF EXISTS chk_counts_sum;
ALTER TABLE responses
  ADD CONSTRAINT chk_counts_sum
  CHECK (regular_count + sometimes_count + not_buy_count = 100);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_group_id;
ALTER TABLE products
  ADD CONSTRAINT chk_products_group_id CHECK (group_id BETWEEN 1 AND 100);

ALTER TABLE response_items DROP CONSTRAINT IF EXISTS response_items_group_id_check;
ALTER TABLE response_items
  ADD CONSTRAINT response_items_group_id_check CHECK (group_id BETWEEN 1 AND 100);
