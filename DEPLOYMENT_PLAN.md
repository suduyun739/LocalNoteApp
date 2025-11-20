# LocalNoteApp 云端部署方案

## 一、架构设计

### 当前架构（单机版）
- 前端：纯 HTML/CSS/JavaScript
- 存储：浏览器 IndexedDB（本地）
- 认证：简单密码验证（无真实用户系统）

### 目标架构（云端版）
```
前端（静态页面）
    ↓
后端 API 服务（Node.js + Express）
    ↓
数据库（PostgreSQL/MySQL）
```

---

## 二、技术栈选择

### 后端
- **Node.js + Express** - Web 框架
- **JWT (jsonwebtoken)** - 用户认证
- **bcrypt** - 密码加密
- **Sequelize/Prisma** - ORM 数据库操作
- **PostgreSQL/MySQL** - 关系型数据库

### 前端改造
- 移除 IndexedDB，改用 Fetch API 调用后端
- 添加注册/登录界面
- 添加 Token 存储和自动刷新

### 部署
- **服务器：** 阿里云/腾讯云/AWS 等
- **反向代理：** Nginx
- **进程管理：** PM2
- **HTTPS：** Let's Encrypt 免费证书

---

## 三、数据库设计

### 表结构

#### 1. users 表（用户表）
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. notes 表（笔记表）
```sql
CREATE TABLE notes (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('book', 'movie', 'daily')),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    tags TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    INDEX idx_user_type (user_id, type),
    INDEX idx_created_at (created_at)
);
```

#### 3. daily_plans 表（每日计划表）
```sql
CREATE TABLE daily_plans (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    text VARCHAR(200) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    INDEX idx_user_date (user_id, date)
);
```

---

## 四、后端 API 设计

### 认证相关
```
POST   /api/auth/register      # 用户注册
POST   /api/auth/login         # 用户登录
POST   /api/auth/logout        # 用户登出
GET    /api/auth/me            # 获取当前用户信息
```

### 笔记相关
```
GET    /api/notes              # 获取笔记列表（支持分页、筛选）
GET    /api/notes/:id          # 获取单个笔记
POST   /api/notes              # 创建笔记
PUT    /api/notes/:id          # 更新笔记
DELETE /api/notes/:id          # 删除笔记
GET    /api/notes/stats        # 获取统计信息
POST   /api/notes/export       # 导出笔记
POST   /api/notes/import       # 导入笔记
```

### 每日计划相关
```
GET    /api/plans              # 获取所有计划
GET    /api/plans/:date        # 获取指定日期的计划
POST   /api/plans              # 创建任务
PUT    /api/plans/:id          # 更新任务
DELETE /api/plans/:id          # 删除任务
DELETE /api/plans/date/:date   # 删除指定日期的所有任务
```

---

## 五、前端改造要点

### 1. 添加真实的注册/登录页面
```javascript
// 替换当前的简单密码验证
async function login(email, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const { token } = await response.json();
    localStorage.setItem('token', token);
}
```

### 2. 所有数据操作改为 API 调用
```javascript
// 原来：await noteDB.addNote(note)
// 改为：
async function addNote(note) {
    const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(note)
    });
    return await response.json();
}
```

### 3. 添加 Token 自动刷新机制
```javascript
// 拦截器：自动添加 token，处理 401 错误
async function fetchWithAuth(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };

    const response = await fetch(url, options);

    if (response.status === 401) {
        // Token 过期，跳转登录
        window.location.href = '/login.html';
    }

    return response;
}
```

---

## 六、部署步骤

### 1. 服务器准备
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 安装 Nginx
sudo apt-get install nginx

# 安装 PM2
sudo npm install -g pm2
```

### 2. 数据库初始化
```bash
# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE localnoteapp;
CREATE USER noteapp_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE localnoteapp TO noteapp_user;
```

### 3. 部署后端
```bash
# 克隆代码
cd /var/www
git clone your-repo.git localnoteapp
cd localnoteapp/server

# 安装依赖
npm install

# 配置环境变量
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://noteapp_user:your_secure_password@localhost:5432/localnoteapp
JWT_SECRET=your_random_secret_key_here
JWT_EXPIRES_IN=7d
EOF

# 运行数据库迁移
npm run migrate

# 使用 PM2 启动
pm2 start server.js --name localnoteapp
pm2 save
pm2 startup
```

### 4. 配置 Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /var/www/localnoteapp/public;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 配置 HTTPS
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 七、安全考虑

### 1. 密码安全
- 使用 bcrypt 加密（成本因子 ≥ 10）
- 永远不要明文存储密码

### 2. JWT 安全
- 使用强随机密钥（至少 256 位）
- 设置合理的过期时间（建议 7 天）
- 支持刷新 token 机制

### 3. API 安全
- 所有 API 都需要 JWT 验证
- 使用 HTTPS 加密传输
- 添加请求频率限制（rate limiting）
- 验证用户只能访问自己的数据

### 4. SQL 注入防护
- 使用 ORM（Sequelize/Prisma）
- 永远不要直接拼接 SQL 语句

### 5. XSS 防护
- 后端返回数据时进行 HTML 转义
- 前端使用 textContent 而非 innerHTML

---

## 八、成本估算（按月）

### 小规模（10-50 人）
- **阿里云 ECS：** ¥70-100/月（1核2G）
- **数据库：** 包含在 ECS 中
- **域名：** ¥55/年（首年优惠）
- **HTTPS 证书：** 免费（Let's Encrypt）
- **总计：** 约 ¥80-120/月

### 中等规模（50-200 人）
- **阿里云 ECS：** ¥200-300/月（2核4G）
- **RDS 数据库：** ¥150-200/月
- **CDN：** ¥50-100/月
- **总计：** 约 ¥400-600/月

---

## 九、开发时间估算

### 全新开发（从零开始）
- 后端 API 开发：5-7 天
- 前端改造：3-4 天
- 数据库设计与迁移：1-2 天
- 测试与调试：2-3 天
- 部署上线：1 天
- **总计：12-17 天**

### 基于现有代码改造
- 后端 API 开发：3-4 天
- 前端改造：2-3 天
- 数据库迁移：1 天
- 测试与调试：1-2 天
- 部署上线：1 天
- **总计：8-11 天**

---

## 十、下一步行动

### 立即可做
1. **确认需求**：预计用户数量、功能需求
2. **选择方案**：轻量级 vs 标准方案
3. **购买服务器**：根据用户规模选择配置

### 开发阶段
1. **搭建后端框架**
2. **设计并创建数据库**
3. **开发 API 接口**
4. **改造前端代码**
5. **本地测试**

### 部署阶段
1. **服务器环境配置**
2. **部署代码**
3. **配置域名和 HTTPS**
4. **性能测试**
5. **正式上线**

---

## 十一、需要我帮你做什么？

我可以帮你：
1. ✅ **生成完整的后端代码**（Express + JWT + Sequelize）
2. ✅ **改造前端代码**（替换 IndexedDB 为 API 调用）
3. ✅ **生成数据库迁移脚本**
4. ✅ **编写部署文档和脚本**
5. ✅ **提供 Docker 部署方案**（更简单的部署方式）

**请告诉我：**
- 你的技术背景（前端/后端/全栈？）
- 预计用户数量规模
- 偏好的技术栈（Node.js? Python Flask? Go?）
- 是否需要我直接生成代码
