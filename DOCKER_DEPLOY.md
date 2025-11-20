# LocalNoteApp Docker 一键部署指南

> 📦 这是一个完整的 Docker 部署方案，适合没有服务器运维经验的测试人员使用。

## 📋 前置条件

### 1. 服务器要求
- **系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **配置**: 1核2G 内存（最低），2核4G 推荐
- **用户数**: 支持 10 人以下

### 2. 需要安装的软件
- Docker
- Docker Compose
- Git（可选，用于克隆代码）

---

## 🚀 快速开始（5 分钟部署）

### 步骤 1: 安装 Docker

```bash
# 一键安装 Docker（适用于 Ubuntu/Debian）
curl -fsSL https://get.docker.com | bash

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（避免每次都要 sudo）
sudo usermod -aG docker $USER

# 重新登录或执行以下命令使权限生效
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2: 上传代码到服务器

**方式一：使用 Git（推荐）**
```bash
# 如果你的代码已经在 GitHub/Gitee 上
git clone https://github.com/your-username/LocalNoteApp.git
cd LocalNoteApp
```

**方式二：手动上传**
```bash
# 在本地压缩整个 LocalNoteApp 文件夹
# 使用 scp 或 FTP 工具上传到服务器
# 然后在服务器上解压

cd /home/your-username
unzip LocalNoteApp.zip
cd LocalNoteApp
```

### 步骤 3: 配置环境变量

```bash
# 编辑 .env 文件
nano .env

# 修改以下内容（非常重要！）:
# 1. 将 DB_PASSWORD 改为强密码
# 2. 将 JWT_SECRET 改为随机字符串（至少 32 字符）
# 3. 将 ALLOWED_ORIGINS 改为你的域名或 IP
```

**示例配置：**
```env
DB_PASSWORD=MyStr0ng_DataBase_P@ssw0rd!2024
JWT_SECRET=a8f3k2jsd93j2kd92kd93kd93jf93jd93kd93kdj3kd
ALLOWED_ORIGINS=http://your-server-ip,http://your-domain.com
API_PORT=3000
WEB_PORT=80
```

### 步骤 4: 一键启动！

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看启动状态
docker-compose ps

# 查看日志（如果有问题）
docker-compose logs -f
```

看到以下输出表示成功：
```
NAME                      STATUS
localnoteapp-nginx        Up (healthy)
localnoteapp-backend      Up (healthy)
localnoteapp-db           Up (healthy)
```

### 步骤 5: 访问应用

打开浏览器访问:
```
http://your-server-ip
```

第一次使用需要注册账号，然后就可以登录使用了！

---

## 📁 项目结构

```
LocalNoteApp/
├── server/                 # 后端代码
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── models/        # 数据库模型
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   └── server.js      # 主服务文件
│   ├── package.json
│   └── Dockerfile
├── public/                 # 前端静态文件（需要创建）
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── ...
├── docker-compose.yml      # Docker 编排配置
├── nginx.conf             # Nginx 配置
├── .env                   # 环境变量
└── README.md
```

---

## 🔧 常用命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 只查看数据库日志
docker-compose logs -f postgres
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend
```

### 停止服务
```bash
# 停止所有服务
docker-compose stop

# 停止并删除容器（数据不会丢失）
docker-compose down

# 停止并删除容器和数据（慎用！）
docker-compose down -v
```

### 更新代码
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

### 备份数据库
```bash
# 导出数据库
docker exec localnoteapp-db pg_dump -U noteapp_user localnoteapp > backup.sql

# 恢复数据库
docker exec -i localnoteapp-db psql -U noteapp_user localnoteapp < backup.sql
```

---

## 🔒 安全建议

### 1. 修改默认密码
✅ **必须做**: 修改 `.env` 中的 `DB_PASSWORD` 和 `JWT_SECRET`

### 2. 配置防火墙
```bash
# 只允许 80 端口（HTTP）
sudo ufw allow 80/tcp

# 如果配置了 HTTPS，开放 443 端口
sudo ufw allow 443/tcp

# 开放 SSH 端口（别锁住自己！）
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable
```

### 3. 配置 HTTPS（可选但推荐）

如果有域名，强烈建议配置 HTTPS：

```bash
# 安装 Certbot
sudo apt-get install certbot

# 生成证书
sudo certbot certonly --standalone -d your-domain.com

# 修改 nginx.conf 添加 SSL 配置
# 重启 nginx
docker-compose restart nginx
```

### 4. 定期备份
```bash
# 创建每日备份脚本
cat > ~/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec localnoteapp-db pg_dump -U noteapp_user localnoteapp > /backup/db_$DATE.sql
# 只保留最近 7 天的备份
find /backup -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup.sh

# 添加到 crontab（每天凌晨 2 点执行）
crontab -e
# 添加这一行:
0 2 * * * /home/your-username/backup.sh
```

---

## 🐛 故障排查

### 问题 1: 容器无法启动
```bash
# 查看详细错误信息
docker-compose logs -f

# 检查端口是否被占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
```

### 问题 2: 无法连接数据库
```bash
# 检查数据库容器状态
docker-compose ps postgres

# 进入数据库容器
docker exec -it localnoteapp-db psql -U noteapp_user -d localnoteapp

# 检查数据库连接
\l
\dt
\q
```

### 问题 3: 前端无法访问后端 API
```bash
# 检查 CORS 配置
cat .env | grep ALLOWED_ORIGINS

# 查看后端日志
docker-compose logs -f backend
```

### 问题 4: 内存不足
```bash
# 查看容器资源使用
docker stats

# 如果内存不足，可以限制资源
# 编辑 docker-compose.yml，添加:
# resources:
#   limits:
#     memory: 512M
```

---

## 📊 性能优化

### 1. 数据库优化
```bash
# 进入数据库容器
docker exec -it localnoteapp-db psql -U noteapp_user -d localnoteapp

# 创建索引（如果还没有）
CREATE INDEX IF NOT EXISTS idx_notes_user_type ON notes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_plans_user_date ON daily_plans(user_id, date);
```

### 2. Nginx 缓存优化
已在 `nginx.conf` 中配置了静态资源缓存和 Gzip 压缩

### 3. 定期清理
```bash
# 清理无用的 Docker 镜像和容器
docker system prune -a

# 清理日志
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

---

## 🆙 升级指南

### 从单机版迁移到云端版

1. **导出本地数据**
   - 在浏览器中进入原应用
   - 点击 "导出笔记"，保存 JSON 文件

2. **注册云端账号**
   - 访问云端部署的应用
   - 注册新账号并登录

3. **导入数据**
   - 在云端应用中点击 "导入"
   - 选择之前导出的 JSON 文件
   - 等待导入完成

---

## 📞 技术支持

### 常见问题解答

**Q: 可以修改默认端口吗？**
A: 可以！编辑 `.env` 文件中的 `WEB_PORT` 和 `API_PORT`

**Q: 如何添加更多用户？**
A: 用户可以自行注册，管理员可以在数据库中直接管理

**Q: 数据存储在哪里？**
A: 数据存储在 Docker Volume `postgres_data` 中，即使删除容器数据也不会丢失

**Q: 如何恢复出厂设置？**
A: `docker-compose down -v` 会删除所有数据，慎用！

**Q: 支持多服务器部署吗？**
A: 当前配置适合单服务器，如需多服务器需要额外配置

---

## ✅ 部署检查清单

部署完成后，请检查以下项目：

- [ ] 修改了 `.env` 中的所有默认密码和密钥
- [ ] 配置了防火墙，只开放必要端口
- [ ] 设置了数据库自动备份
- [ ] 测试了用户注册和登录功能
- [ ] 测试了笔记的创建、编辑、删除
- [ ] 测试了每日计划功能
- [ ] 配置了 HTTPS（如有域名）
- [ ] 设置了服务器开机自启动（Docker）

---

## 🎉 完成！

恭喜你成功部署了 LocalNoteApp！现在你和你的朋友可以随时随地访问自己的笔记了。

如有问题，请查看日志或联系技术支持。
