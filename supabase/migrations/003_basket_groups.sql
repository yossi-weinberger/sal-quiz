-- ============================================================
-- group_id on products + response_items by group (102 answers).
-- No separate basket_groups table — labels come from the app (products.json).
-- Destructive for response_items — OK for unpublished / empty DB.
-- ============================================================

DROP TABLE IF EXISTS response_items CASCADE;
DROP INDEX IF EXISTS idx_response_items_response_product;

DROP TABLE IF EXISTS basket_groups CASCADE;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_group_id_fkey;

ALTER TABLE products ADD COLUMN IF NOT EXISTS group_id INTEGER;

UPDATE products SET group_id = CASE
  WHEN id BETWEEN 35 AND 40 THEN 35
  WHEN id < 35 THEN id
  ELSE id - 5
END
WHERE group_id IS NULL;

ALTER TABLE products ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_group_id;
ALTER TABLE products ADD CONSTRAINT chk_products_group_id CHECK (group_id BETWEEN 1 AND 102);

CREATE INDEX IF NOT EXISTS idx_products_group_id ON products (group_id);

CREATE TABLE response_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id          UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  group_id             INTEGER NOT NULL CHECK (group_id BETWEEN 1 AND 102),
  answer_value         answer_value NOT NULL,
  UNIQUE (response_id, group_id)
);

CREATE INDEX idx_response_items_response ON response_items (response_id);
CREATE INDEX idx_response_items_response_group ON response_items (response_id, group_id);

ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "response_items_public_insert" ON response_items;
CREATE POLICY "response_items_public_insert" ON response_items
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

ALTER TABLE responses DROP CONSTRAINT IF EXISTS chk_counts_sum;
ALTER TABLE responses ADD CONSTRAINT chk_counts_sum
  CHECK (regular_count + sometimes_count + not_buy_count = 102);
