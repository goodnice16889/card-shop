-- ============================================================
-- 卡密商店 Supabase 数据库建表脚本
-- 在 Supabase Dashboard → SQL Editor 中运行此文件
-- ============================================================

-- 1. 商品表
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null,
  category    text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- 2. 卡密表
create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  card_code   text not null,
  card_secret text,
  is_sold     boolean default false,
  order_id    uuid,
  sold_at     timestamptz,
  created_at  timestamptz default now()
);

-- 3. 订单表
create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id),
  email       text not null,
  quantity    int not null default 1,
  amount      numeric(10,2) not null,
  status      text not null default 'pending', -- pending | paid | failed
  trade_no    text,        -- 支付平台流水号
  paid_at     timestamptz,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS) 配置
-- ============================================================

alter table products enable row level security;
alter table cards     enable row level security;
alter table orders    enable row level security;

-- 商品：任何人可读（前端展示用）
create policy "products_public_read" on products
  for select using (true);

-- 商品：仅管理员（已登录用户）可写
create policy "products_admin_write" on products
  for all using (auth.role() = 'authenticated');

-- 卡密：前端只允许读取已绑定自己订单的卡（通过 order_id 查询）
-- 写入仅服务端 Service Role Key（Netlify Function）
create policy "cards_read_by_order" on cards
  for select using (true);  -- 前端按 order_id 过滤，此处允许读

create policy "cards_admin_write" on cards
  for all using (auth.role() = 'authenticated');

-- 订单：前端可插入（下单），可按 id 读取自己的订单
create policy "orders_insert" on orders
  for insert with check (true);

create policy "orders_read_own" on orders
  for select using (true);  -- 前端按 id 精确查询，此处允许读

create policy "orders_admin_write" on orders
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- 索引（提升查询性能）
-- ============================================================
create index if not exists cards_product_unsold on cards(product_id) where is_sold = false;
create index if not exists cards_order_id on cards(order_id);
create index if not exists orders_status on orders(status);
