#!/bin/bash

echo "======================================"
echo "LocalNoteApp 部署检查脚本"
echo "======================================"
echo ""

echo "1. 检查当前分支和提交："
git branch
git log --oneline -3

echo ""
echo "2. 检查 public 目录文件："
ls -la public/ | grep -E "\.(js|html)$"

echo ""
echo "3. 检查 api.js 是否存在："
if [ -f "public/api.js" ]; then
    echo "✅ api.js 存在"
    echo "文件大小: $(wc -c < public/api.js) bytes"
else
    echo "❌ api.js 不存在！"
fi

echo ""
echo "4. 检查 login.html 是否存在："
if [ -f "public/login.html" ]; then
    echo "✅ login.html 存在"
else
    echo "❌ login.html 不存在！"
fi

echo ""
echo "5. 检查 Docker 容器："
docker-compose ps

echo ""
echo "6. 检查 nginx 容器中的文件："
echo "nginx 容器中的 public 目录："
docker exec localnoteapp-nginx ls -la /usr/share/nginx/html/ | grep -E "\.(js|html)$"

echo ""
echo "======================================"
echo "检查完成！"
echo "======================================"
