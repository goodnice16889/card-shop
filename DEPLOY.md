# 卡密商店部署教程

> 技术栈：React + Vite · Supabase · Netlify · 彩虹易支付  
> 预计完成时间：30 分钟

---

## 目录

1. [准备工作](#1-准备工作)
2. [配置 Supabase](#2-配置-supabase)
3. [配置彩虹易支付](#3-配置彩虹易支付)
4. [上传代码到 GitHub](#4-上传代码到-github)
5. [部署到 Netlify](#5-部署到-netlify)
6. [配置环境变量](#6-配置环境变量)
7. [创建管理员账号](#7-创建管理员账号)
8. [上架第一个商品](#8-上架第一个商品)
9. [常见问题](#9-常见问题)

---

## 1. 准备工作

注册以下账号（全部免费）：

| 平台 | 地址 | 用途 |
|------|------|------|
| Supabase | https://supabase.com | 数据库 + 认证 |
| Netlify | https://netlify.com | 托管前端 + Functions |
| GitHub | https://github.com | 代码仓库 |
| 彩虹易支付 | 找服务商购买 | 支付宝/微信聚合支付 |

本地需要安装：
- **Node.js v18+**：https://nodejs.org
- **Git**：https://git-scm.com

---

## 2. 配置 Supabase

### 2.1 创建项目

1. 登录 https://supabase.com → 点击 **New Project**
2. 填写项目名称（如 `card-shop`）、数据库密码（记下来）
3. 选择离用户最近的地区（推荐 **Southeast Asia - Singapore**）
4. 等待约 1 分钟创建完成

### 2.2 建表

1. 左侧菜单 → **SQL Editor** → **New query**
2. 把 `supabase-schema.sql` 文件的全部内容粘贴进去
3. 点击右上角 **Run**，看到 `Success` 即可

### 2.3 获取 API 密钥

1. 左侧菜单 → **Project Settings** → **API**
2. 记录以下两个值：

```
Project URL:  https://xxxxxxxxxxxxxx.supabase.co
anon key:     eyJhbGci...（公开密钥，前端使用）
service_role key: eyJhbGci...（私密！仅服务端使用）
```

> ⚠️ `service_role key` 拥有完整数据库权限，**绝对不能**暴露在前端代码中。

---

## 3. 配置 YPay

1. 注册/登录你的 YPay 商户后台，获取：
   - **商户 PID**
   - **商户密钥（Key）**
   - **API 域名**（官方节点直接用 `https://ypay.yvdian.cn`，自建节点填自己的域名）

2. 在 YPay 后台设置异步回调地址（部署 Netlify 后填入）：
   ```
   https://你的netlify域名.netlify.app/.netlify/functions/payment-notify
   ```

---

## 4. 上传代码到 GitHub

```bash
# 进入项目目录
cd card-shop

# 安装依赖（本地测试用）
npm install

# 初始化 Git
git init
git add .
git commit -m "init: card shop"

# 在 GitHub 创建新仓库（不要勾选 README）
# 然后推送：
git remote add origin https://github.com/你的用户名/card-shop.git
git branch -M main
git push -u origin main
```

---

## 5. 部署到 Netlify

1. 登录 https://netlify.com → **Add new site** → **Import an existing project**
2. 选择 **GitHub** → 授权并选择 `card-shop` 仓库
3. 构建配置确认（`netlify.toml` 已自动配置好）：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 点击 **Deploy site**，等待约 2 分钟

部署成功后会得到一个域名，如：`https://card-shop-abc123.netlify.app`

---

## 6. 配置环境变量

在 Netlify 后台 → **Site configuration** → **Environment variables** → **Add variable**，依次添加：

| 变量名 | 值 | 说明 |
|--------|----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon key |
| `SUPABASE_URL` | `https://xxx.supabase.co` | 同上，供 Functions 使用 |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` | Supabase service_role key |
| `YPAY_PID` | 你的商户 PID | YPay 商户 ID |
| `YPAY_KEY` | 你的商户密钥 | YPay 商户 Key |
| `YPAY_API_URL` | `https://ypay.yvdian.cn` | YPay 接口域名（自建节点才需要改） |

添加完后，回到 **Deploys** → **Trigger deploy** → **Deploy site** 重新部署一次让变量生效。

---

## 7. 创建管理员账号

1. 打开 Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
2. 填入你的邮箱和密码
3. 访问 `https://你的域名/admin/login`，用刚才的邮箱密码登录

> 只有通过 Supabase Authentication 创建的用户才能登录后台，普通访客无法访问。

---

## 8. 上架第一个商品

1. 登录后台 `/admin/login`
2. 进入 **商品管理** → **添加商品**，填写名称、价格等信息
3. 进入 **卡密管理** → 选择刚才的商品 → 批量导入卡密

   格式（每行一条）：
   ```
   ABCD-1234-EFGH-5678
   XXXX-9999,密码123
   ```
4. 访问首页，商品已经上架！

---

## 9. 常见问题

**Q：支付成功后卡密没有显示？**  
A：检查 Netlify Functions 日志（Netlify 后台 → Functions → `payment-notify`），确认回调 URL 是否正确填入彩虹易支付后台。

**Q：构建失败？**  
A：检查 Netlify 环境变量是否都已填写，特别是 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

**Q：登录后台显示无权限？**  
A：确认已在 Supabase Authentication 中创建了用户，且使用的是该用户的邮箱密码。

**Q：想绑定自己的域名？**  
A：Netlify 后台 → **Domain management** → **Add custom domain**，按提示修改 DNS 记录即可，全程免费 SSL。

**Q：彩虹易支付在哪里购买？**  
A：搜索「彩虹易支付源码」或在相关论坛购买独立部署版，或直接使用别人搭建好的节点（注意选择信誉好的商家）。

---

## 项目文件结构

```
card-shop/
├── netlify.toml                  # Netlify 构建配置
├── supabase-schema.sql           # 数据库建表脚本
├── .env.example                  # 环境变量模板
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── netlify/
│   └── functions/
│       ├── create-payment.js     # 发起支付
│       └── payment-notify.js     # 支付回调（自动发卡）
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   └── supabase.js
    ├── components/
    │   ├── Navbar.jsx
    │   └── ProtectedRoute.jsx
    └── pages/
        ├── StorePage.jsx         # 商品列表
        ├── CheckoutPage.jsx      # 下单页
        ├── OrderPage.jsx         # 订单/卡密展示
        ├── AdminLogin.jsx        # 后台登录
        └── AdminDashboard.jsx    # 后台管理
```
