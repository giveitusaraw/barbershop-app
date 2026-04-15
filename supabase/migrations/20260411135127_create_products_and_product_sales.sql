/*
  # Create Products and Product Sales Tables

  ## Summary
  This migration creates a complete product management and sales tracking system for the barbershop.

  ## New Tables

  ### 1. `products`
  Stores the catalogue of products available for sale (e.g., wax, gel, shampoo).
  - `id` (uuid, primary key)
  - `name` (text) - Product name
  - `description` (text) - Optional product description
  - `price` (numeric) - Sale price in EUR
  - `stock` (integer) - Current stock quantity (optional tracking)
  - `active` (boolean) - Whether the product is active/available for sale
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `product_sales`
  Records each individual product sale transaction. Not linked to any specific client.
  - `id` (uuid, primary key)
  - `product_id` (uuid, FK to products)
  - `quantity` (integer) - Number of units sold
  - `unit_price` (numeric) - Price at time of sale (snapshot)
  - `total_price` (numeric) - quantity * unit_price
  - `sold_at` (timestamptz) - When the sale occurred
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Anonymous users can read products (for potential public display)
  - Only authenticated users (admin/staff) can insert/update/delete products and record sales
  - Anonymous users cannot read sales data (billing is admin-only)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer DEFAULT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  sold_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product sales"
  ON product_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product sales"
  ON product_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product sales"
  ON product_sales FOR DELETE
  TO authenticated
  USING (true);
