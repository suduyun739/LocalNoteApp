# GitHub 推送指南

> 📦 这是一份详细的 GitHub 推送操作指南，适合初次使用 Git 的用户。

---

## 📋 前置准备

### 1. 安装 Git

**Windows:**
```bash
# 下载并安装 Git for Windows
# https://git-scm.com/download/win
```

**验证安装:**
```bash
git --version
# 应该显示: git version 2.x.x
```

### 2. 配置 Git

```bash
# 设置你的用户名（GitHub 用户名）
git config --global user.name "你的用户名"

# 设置你的邮箱（GitHub 注册邮箱）
git config --global user.email "your-email@example.com"

# 验证配置
git config --list
```

### 3. 创建 GitHub 仓库

1. 登录 [GitHub.com](https://github.com)
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `LocalNoteApp`
   - **Description**: `一个功能强大的本地笔记管理系统`
   - **Public** 或 **Private**（选择公开或私有）
   - **不要勾选** "Add a README file"（我们已经有了）
   - **不要勾选** "Add .gitignore"（我们已经有了）
4. 点击 **"Create repository"**

记下仓库 URL，格式类似：
```
https://github.com/你的用户名/LocalNoteApp.git
```

---

## 🚀 推送步骤（完整版）

### 方法一：HTTPS 方式（推荐新手）

```bash
# 1. 打开命令行，进入项目目录
cd c:\Users\sfx\.claude\LocalNoteApp

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件到暂存区
git add .

# 4. 查看状态（可选）
git status

# 5. 创建第一个提交
git commit -m "Initial commit: LocalNoteApp 本地笔记应用"

# 6. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/LocalNoteApp.git

# 7. 推送到 GitHub
git push -u origin master
# 或者如果默认分支是 main:
# git push -u origin main
```

**如果推送时需要登录：**
- 输入 GitHub 用户名
- 输入密码（现在需要使用 Personal Access Token，见下方）

### 方法二：SSH 方式（更安全，推荐长期使用）

**第一步：生成 SSH 密钥**
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 按回车使用默认路径
# 可以设置密码或直接回车（不设密码）

# 查看公钥
cat ~/.ssh/id_ed25519.pub
# Windows: type %USERPROFILE%\.ssh\id_ed25519.pub
```

**第二步：添加 SSH 密钥到 GitHub**
1. 复制公钥内容
2. 访问 GitHub → **Settings** → **SSH and GPG keys**
3. 点击 **"New SSH key"**
4. 粘贴公钥，点击 **"Add SSH key"**

**第三步：使用 SSH 推送**
```bash
# 添加远程仓库（SSH 地址）
git remote add origin git@github.com:你的用户名/LocalNoteApp.git

# 推送
git push -u origin master
```

---

## 🔑 获取 Personal Access Token（HTTPS 必需）

如果使用 HTTPS，现在 GitHub 不再支持密码登录，需要使用 Token：

1. 登录 GitHub
2. 点击头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. 点击 **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token** → **Generate new token (classic)**
6. 填写信息：
   - **Note**: `LocalNoteApp Token`
   - **Expiration**: 选择过期时间（建议 90 days）
   - **Select scopes**: 勾选 **repo**（全部权限）
7. 点击 **Generate token**
8. **复制 Token**（只显示一次！请保存好）

**使用 Token 推送：**
```bash
git push -u origin master

# 用户名: 你的 GitHub 用户名
# 密码: 粘贴刚才复制的 Token
```

---

## 📝 常用 Git 命令

### 日常提交

```bash
# 1. 查看修改
git status

# 2. 添加修改的文件
git add .                 # 添加所有文件
git add index.html        # 添加单个文件

# 3. 提交
git commit -m "添加历史计划导出导入功能"

# 4. 推送到 GitHub
git push
```

### 查看历史

```bash
# 查看提交历史
git log

# 简洁模式
git log --oneline

# 查看最近 5 条
git log -5
```

### 分支操作

```bash
# 查看分支
git branch

# 创建新分支
git branch feature-name

# 切换分支
git checkout feature-name

# 创建并切换（推荐）
git checkout -b feature-name

# 合并分支
git checkout master
git merge feature-name

# 删除分支
git branch -d feature-name
```

### 远程操作

```bash
# 查看远程仓库
git remote -v

# 拉取最新代码
git pull

# 克隆仓库
git clone https://github.com/你的用户名/LocalNoteApp.git
```

---

## 🚨 常见问题

### 问题 1: 推送被拒绝

```
! [rejected] master -> master (fetch first)
```

**解决方案：**
```bash
# 先拉取远程代码
git pull origin master --allow-unrelated-histories

# 再推送
git push origin master
```

### 问题 2: 认证失败

```
remote: Support for password authentication was removed
```

**解决方案：**
- 使用 Personal Access Token 代替密码（见上方）
- 或者改用 SSH 方式

### 问题 3: 忘记添加 .gitignore

```bash
# 如果已经提交了不该提交的文件（如 node_modules）

# 1. 创建或更新 .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore

# 2. 从 Git 中移除（但保留本地文件）
git rm -r --cached node_modules
git rm --cached .env

# 3. 提交
git add .gitignore
git commit -m "更新 .gitignore"
git push
```

### 问题 4: 需要修改上一次提交信息

```bash
# 修改最后一次提交的信息
git commit --amend -m "新的提交信息"

# 如果已经推送，需要强制推送（慎用！）
git push -f origin master
```

### 问题 5: 想撤销某个文件的修改

```bash
# 撤销工作区的修改（未 add）
git checkout -- index.html

# 撤销暂存区的修改（已 add，未 commit）
git reset HEAD index.html
git checkout -- index.html

# 撤销最后一次提交（已 commit，未 push）
git reset --soft HEAD~1
```

---

## 📦 推送检查清单

推送前请确认：

- [ ] `.gitignore` 文件已创建
- [ ] `.env` 等敏感文件已排除
- [ ] `node_modules` 已排除
- [ ] 代码可以正常运行
- [ ] 提交信息清晰明确
- [ ] README.md 内容完整

---

## 🎯 推送后的操作

### 1. 查看仓库

访问: `https://github.com/你的用户名/LocalNoteApp`

### 2. 设置仓库描述

在仓库页面点击 ⚙️ **Settings**：
- 添加 Description
- 添加 Website（如果有部署链接）
- 添加 Topics（标签，如 `notes`, `indexeddb`, `spa`）

### 3. 启用 GitHub Pages（可选）

如果想让别人直接访问你的应用：

1. 进入仓库 **Settings**
2. 左侧菜单找到 **Pages**
3. **Source** 选择 `master` 或 `main` 分支
4. 点击 **Save**
5. 等待几分钟，访问: `https://你的用户名.github.io/LocalNoteApp`

### 4. 添加 README 徽章（可选）

在 README.md 顶部添加：

```markdown
![GitHub stars](https://img.shields.io/github/stars/你的用户名/LocalNoteApp)
![GitHub forks](https://img.shields.io/github/forks/你的用户名/LocalNoteApp)
![GitHub issues](https://img.shields.io/github/issues/你的用户名/LocalNoteApp)
![License](https://img.shields.io/github/license/你的用户名/LocalNoteApp)
```

---

## 📚 学习资源

### Git 基础
- [Git 官方文档（中文）](https://git-scm.com/book/zh/v2)
- [猴子都能懂的 Git 入门](https://backlog.com/git-tutorial/cn/)
- [Git 可视化学习](https://learngitbranching.js.org/?locale=zh_CN)

### GitHub 使用
- [GitHub 官方指南](https://docs.github.com/cn)
- [GitHub 中文社区](https://github.com/topics/chinese)

---

## 🎉 完成！

恭喜！你的项目已经成功推送到 GitHub。

**下一步可以做什么？**
- 📝 完善 README 文档
- 🐛 使用 Issues 跟踪 Bug
- 🌟 邀请朋友 Star 你的项目
- 🔄 持续开发和更新
- 🚀 部署到云端

---

**Happy Coding! 💻✨**
