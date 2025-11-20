#!/bin/bash

echo "======================================"
echo "   LocalNoteApp 一键部署脚本"
echo "======================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 未检测到 Docker，正在安装..."
    curl -fsSL https://get.docker.com | bash
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker 安装完成！请重新登录后再运行此脚本"
    exit 0
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 未检测到 Docker Compose，正在安装..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成！"
fi

echo ""
echo "📋 步骤 1/4: 检查环境变量配置"
echo ""

if [ ! -f .env ]; then
    echo "❌ 未找到 .env 文件！"
    echo "请确保 .env 文件存在并已配置密码和密钥"
    exit 1
fi

# 检查是否修改了默认密码
if grep -q "change_this_password" .env; then
    echo "⚠️  警告: 检测到默认密码，强烈建议修改！"
    echo "请编辑 .env 文件，修改 DB_PASSWORD 和 JWT_SECRET"
    read -p "是否继续？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ 环境变量检查完成"
echo ""
echo "📋 步骤 2/4: 创建必要的目录"
echo ""

# 创建 public 目录（如果不存在）
if [ ! -d "public" ]; then
    mkdir -p public
    echo "✅ 创建 public 目录"
fi

# 复制前端文件到 public 目录
if [ -f "index.html" ]; then
    cp index.html styles.css app.js db.js public/ 2>/dev/null || true
    echo "✅ 复制前端文件到 public 目录"
fi

echo ""
echo "📋 步骤 3/4: 构建 Docker 镜像"
echo ""

docker-compose build

echo ""
echo "📋 步骤 4/4: 启动服务"
echo ""

docker-compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 10

echo ""
echo "📊 服务状态:"
echo ""
docker-compose ps

echo ""
echo "======================================"
echo "   ✅ 部署完成！"
echo "======================================"
echo ""
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📝 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose stop"
echo ""
echo "📖 详细文档: 请查看 DOCKER_DEPLOY.md"
echo ""
