-- ============================================================
-- 卡密商店 Supabase 数据库建表脚本（全新安装）
-- 如果你之前已经运行过旧版 schema 并有数据，
-- 请改用 migration-v2.sql，不要重复运行本文件！
-- ============================================================

-- 1. 商品表
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text,
  image_url   text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 2. 商品规格表（二级商品 / 多种选择）
create table if not exists product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  name        text not null,
  price       numeric(10,2) not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 3. 卡密表
create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  variant_id  uuid references product_variants(id) on delete set null,
  card_code   text not null,
  card_secret text,
  is_sold     boolean default false,
  order_id    uuid,
  sold_at     timestamptz,
  created_at  timestamptz default now()
);

-- 4. 订单表
create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id),
  variant_id  uuid references product_variants(id),
  email       text not null,
  quantity    int not null default 1,
  amount      numeric(10,2) not null,
  status      text not null default 'pending', -- pending | paid | failed
  trade_no    text,
  paid_at     timestamptz,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table products         enable row level security;
alter table product_variants  enable row level security;
alter table cards             enable row level security;
alter table orders            enable row level security;

create policy "products_public_read" on products for select using (true);
create policy "products_admin_write" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "variants_public_read" on product_variants for select using (true);
create policy "variants_admin_write" on product_variants for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "cards_read_by_order" on cards for select using (true);
create policy "cards_admin_write" on cards for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "orders_insert" on orders for insert with check (true);
create policy "orders_read_own" on orders for select using (true);
create policy "orders_admin_write" on orders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- 索引
-- ============================================================
create index if not exists cards_product_unsold on cards(product_id) where is_sold = false;
create index if not exists cards_variant on cards(variant_id);
create index if not exists cards_order_id on cards(order_id);
create index if not exists orders_status on orders(status);
create index if not exists variants_product on product_variants(product_id);

-- ============================================================
-- 商品图片存储桶
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
