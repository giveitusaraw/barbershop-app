/*
  # Fix products and product_sales RLS policies for anon access

  ## Summary
  This app uses a custom authentication system (not Supabase Auth), so users
  operate as the `anon` role. The existing policies were restricted to
  `authenticated` only, blocking all write operations.

  ## Changes
  - Drop existing insert/update/delete policies on `products` that require `authenticated`
  - Add equivalent policies for `anon` role
  - Drop existing insert/select/delete policies on `product_sales` that require `authenticated`
  - Add equivalent policies for `anon` role
*/

DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

CREATE POLICY "Anon users can insert products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read product sales" ON product_sales;
DROP POLICY IF EXISTS "Authenticated users can insert product sales" ON product_sales;
DROP POLICY IF EXISTS "Authenticated users can delete product sales" ON product_sales;

CREATE POLICY "Anon users can read product sales"
  ON product_sales FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert product sales"
  ON product_sales FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can delete product sales"
  ON product_sales FOR DELETE
  TO anon
  USING (true);
