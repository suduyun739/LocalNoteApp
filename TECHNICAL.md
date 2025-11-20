# 🛠️ 技术文档

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────┐
│              用户界面 (UI)                   │
│         index.html + styles.css             │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│          应用逻辑层 (app.js)                 │
│  ┌─────────────────────────────────────┐   │
│  │ 状态管理 (appState)                 │   │
│  ├─────────────────────────────────────┤   │
│  │ 视图控制 (View Management)          │   │
│  ├─────────────────────────────────────┤   │
│  │ 事件处理 (Event Handlers)           │   │
│  ├─────────────────────────────────────┤   │
│  │ UI 渲染 (Rendering Functions)       │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│        数据访问层 (db.js)                    │
│  ┌─────────────────────────────────────┐   │
│  │ NoteDatabase 类                     │   │
│  │ - init()                            │   │
│  │ - addNote()                         │   │
│  │ - updateNote()                      │   │
│  │ - deleteNote()                      │   │
│  │ - getNoteById()                     │   │
│  │ - getAllNotes()                     │   │
│  │ - searchNotes()                     │   │
│  │ - importNotes()                     │   │
│  │ - exportNotes()                     │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│          IndexedDB (浏览器)                  │
│  ┌─────────────────────────────────────┐   │
│  │ Database: NoteAppDB                 │   │
│  │   Object Store: notes               │   │
│  │     - Primary Key: id               │   │
│  │     - Index: type                   │   │
│  │     - Index: date                   │   │
│  │     - Index: lastModified           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 📁 文件说明

### index.html
**职责**：HTML 结构和 DOM 元素

**关键部分**：
```html
<!-- 视图容器 -->
<div id="listView" class="view active">     <!-- 列表视图 -->
<div id="detailView" class="view">          <!-- 详情视图 -->
<div id="formView" class="view">            <!-- 表单视图 -->

<!-- 模态框 -->
<div id="confirmModal" class="modal">       <!-- 确认对话框 -->
<div id="toast" class="toast">              <!-- 通知提示 -->
```

**视图切换机制**：
- 三个主视图通过 `.active` 类控制显示
- 同一时间只有一个视图显示
- 使用 CSS 动画实现平滑过渡

### styles.css
**职责**：样式和布局

**CSS 架构**：
```css
:root {
    /* CSS 变量定义 */
    --primary-color: #2563eb;
    --spacing-md: 1rem;
    /* ... */
}

/* 基础样式 */
* { box-sizing: border-box; }

/* 布局 */
.app-container { /* Grid 布局 */ }
.main-content { /* Flexbox 布局 */ }

/* 组件样式 */
.note-card { /* 笔记卡片 */ }
.modal { /* 模态框 */ }
/* ... */

/* 响应式 */
@media (max-width: 768px) { /* 移动端适配 */ }
```

**关键技术**：
- **CSS Grid**：主布局（侧边栏 + 内容区）
- **Flexbox**：组件内部布局
- **CSS 变量**：主题和颜色管理
- **动画**：过渡效果和微交互

### db.js
**职责**：数据库操作封装

**类结构**：
```javascript
class NoteDatabase {
    constructor() {
        this.db = null;  // IndexedDB 连接
    }

    async init() { /* 初始化数据库 */ }

    // CRUD 操作
    async addNote(note) { /* 添加 */ }
    async updateNote(note) { /* 更新 */ }
    async deleteNote(id) { /* 删除 */ }
    async getNoteById(id) { /* 查询单个 */ }
    async getAllNotes() { /* 查询全部 */ }
    async getNotesByType(type) { /* 按类型查询 */ }

    // 高级功能
    async searchNotes(keyword) { /* 搜索 */ }
    async importNotes(notes) { /* 导入 */ }
    async clearAll() { /* 清空 */ }
    async getStats() { /* 统计 */ }
}
```

**Promise 封装模式**：
```javascript
async addNote(note) {
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(note);

        request.onsuccess = () => resolve(note.id);
        request.onerror = (event) => reject(event.target.error);
    });
}
```

### app.js
**职责**：应用逻辑和 UI 控制

**主要部分**：

1. **状态管理**
```javascript
const appState = {
    currentView: 'list',        // 当前视图
    currentFilter: 'all',       // 筛选条件
    currentNoteId: null,        // 当前笔记 ID
    isEditMode: false,          // 编辑模式
    searchKeyword: '',          // 搜索关键词
    sortBy: 'date-desc'         // 排序方式
};
```

2. **视图切换**
```javascript
function switchView(viewName) {
    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    // 显示目标视图
    document.getElementById(`${viewName}View`).classList.add('active');
    appState.currentView = viewName;
}
```

3. **数据流**
```javascript
加载数据 → 过滤/搜索 → 排序 → 渲染 UI
  ↓
noteDB.getAllNotes()
  ↓
filter by type/search
  ↓
sortNotes()
  ↓
renderNotesList()
```

---

## 🗃️ IndexedDB 详解

### 数据库结构

```
Database: NoteAppDB (version 1)
  │
  └─ Object Store: notes
       │
       ├─ Key Path: id (主键)
       │
       ├─ Indexes:
       │    ├─ type (用于类型筛选)
       │    ├─ date (用于日期排序)
       │    └─ lastModified (用于修改时间排序)
       │
       └─ Records:
            ├─ { id, type, title, content, ... }
            ├─ { id, type, title, content, ... }
            └─ ...
```

### 索引的作用

**没有索引的查询**：
```javascript
// 需要遍历所有记录 O(n)
async getNotesByType(type) {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => note.type === type);
}
```

**使用索引的查询**：
```javascript
// 直接定位 O(log n)
async getNotesByType(type) {
    const index = objectStore.index('type');
    return index.getAll(type);  // 更快！
}
```

### 事务机制

```javascript
// 1. 开启事务
const transaction = db.transaction([STORE_NAME], 'readwrite');

// 2. 获取对象存储
const objectStore = transaction.objectStore(STORE_NAME);

// 3. 执行操作
const request = objectStore.add(note);

// 4. 处理结果
request.onsuccess = () => { /* 成功 */ };
request.onerror = () => { /* 失败 */ };
```

**事务类型**：
- `readonly`：只读，可并发
- `readwrite`：读写，互斥
- `versionchange`：升级数据库

---

## 🎨 UI 渲染流程

### 列表渲染

```javascript
async loadNotesList() {
    // 1. 获取数据
    let notes = await noteDB.getAllNotes();

    // 2. 过滤
    if (appState.currentFilter !== 'all') {
        notes = await noteDB.getNotesByType(appState.currentFilter);
    }

    // 3. 搜索
    if (appState.searchKeyword) {
        notes = notes.filter(/* 搜索逻辑 */);
    }

    // 4. 排序
    notes = sortNotes(notes, appState.sortBy);

    // 5. 渲染
    renderNotesList(notes);
}

function renderNotesList(notes) {
    // 6. 生成 HTML
    const html = notes.map(note => `
        <div class="note-card" onclick="viewNoteDetail('${note.id}')">
            <!-- 笔记卡片内容 -->
        </div>
    `).join('');

    // 7. 更新 DOM
    document.getElementById('notesList').innerHTML = html;
}
```

### 动态字段显示

```javascript
function showTypeSpecificFields(type) {
    // 隐藏所有类型特定字段
    document.querySelectorAll('.type-specific-fields').forEach(field => {
        field.style.display = 'none';
    });

    // 显示对应类型的字段
    const fieldsMap = {
        book: 'bookFields',
        movie: 'movieFields',
        daily: 'dailyFields'
    };

    const fieldsId = fieldsMap[type];
    document.getElementById(fieldsId).style.display = 'block';

    // 更新必填字段
    updateRequiredFields(type);
}
```

---

## 🔄 数据流详解

### 添加笔记流程

```
用户填写表单
    ↓
提交表单 (submit event)
    ↓
saveNote(event)
    ↓
构建笔记对象
    ↓
根据类型添加特定字段
    ↓
noteDB.addNote(note)
    ↓
IndexedDB 存储
    ↓
返回成功
    ↓
showToast('添加成功')
    ↓
switchView('list')
    ↓
loadNotesList()
```

### 搜索流程

```
用户输入关键词
    ↓
input event
    ↓
appState.searchKeyword = value
    ↓
loadNotesList()
    ↓
getAllNotes()
    ↓
filter(note => {
    titleMatch || contentMatch || tagsMatch
})
    ↓
renderNotesList(filteredNotes)
```

### 编辑笔记流程

```
用户点击编辑按钮
    ↓
showEditNoteForm()
    ↓
noteDB.getNoteById(id)
    ↓
填充表单数据
    ↓
用户修改内容
    ↓
提交表单
    ↓
noteDB.updateNote(note)
    ↓
更新 lastModified 时间戳
    ↓
IndexedDB 更新
    ↓
返回详情页
```

---

## 🚀 性能优化

### 1. IndexedDB 优化

**使用索引加速查询**：
```javascript
// ❌ 慢：遍历所有数据
const allNotes = await getAllNotes();
const bookNotes = allNotes.filter(n => n.type === 'book');

// ✅ 快：使用索引
const index = objectStore.index('type');
const bookNotes = await index.getAll('book');
```

**批量操作使用事务**：
```javascript
// ✅ 好：一个事务处理多个操作
const transaction = db.transaction([STORE_NAME], 'readwrite');
const objectStore = transaction.objectStore(STORE_NAME);

for (const note of notes) {
    objectStore.add(note);
}

// 等待事务完成
await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = reject;
});
```

### 2. DOM 操作优化

**使用文档片段**（当前实现可改进）：
```javascript
// 当前实现
notesList.innerHTML = notes.map(/* ... */).join('');

// 优化方案（大量数据时）
const fragment = document.createDocumentFragment();
notes.forEach(note => {
    const card = document.createElement('div');
    card.innerHTML = /* ... */;
    fragment.appendChild(card);
});
notesList.appendChild(fragment);
```

**虚拟滚动**（大量笔记时）：
```javascript
// 只渲染可见区域的笔记
// 可以使用 Intersection Observer API
```

### 3. 搜索优化

**防抖处理**（减少搜索频率）：
```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        appState.searchKeyword = e.target.value;
        loadNotesList();
    }, 300);  // 300ms 防抖
});
```

---

## 🔒 安全考虑

### XSS 防护

**HTML 转义**：
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 使用
`<h3>${escapeHtml(note.title)}</h3>`
```

**为什么需要转义**：
```javascript
// 恶意输入
const title = '<img src=x onerror=alert("XSS")>';

// ❌ 不转义：会执行脚本
innerHTML = `<h3>${title}</h3>`;

// ✅ 转义：显示为文本
innerHTML = `<h3>${escapeHtml(title)}</h3>`;
// 结果：<h3>&lt;img src=x onerror=alert("XSS")&gt;</h3>
```

### 数据验证

**表单验证**：
```html
<!-- HTML5 原生验证 -->
<input type="text" required>
<input type="number" min="1" max="5">
<input type="date">
```

```javascript
// JavaScript 额外验证
function saveNote(event) {
    event.preventDefault();

    if (title.trim().length === 0) {
        showToast('标题不能为空', 'error');
        return;
    }

    // ...
}
```

---

## 🧩 扩展指南

### 添加新的笔记类型

**1. 定义类型配置**（app.js）：
```javascript
const NOTE_TYPES = {
    book: { /* ... */ },
    movie: { /* ... */ },
    daily: { /* ... */ },
    travel: {  // 新增
        name: '旅行笔记',
        icon: '✈️',
        color: '#8B5CF6'
    }
};
```

**2. 添加表单字段**（index.html）：
```html
<div id="travelFields" class="type-specific-fields" style="display: none;">
    <div class="form-group">
        <label>目的地</label>
        <input type="text" id="destination">
    </div>
    <!-- 更多字段 -->
</div>
```

**3. 更新字段显示逻辑**（app.js）：
```javascript
const fieldsMap = {
    book: 'bookFields',
    movie: 'movieFields',
    daily: 'dailyFields',
    travel: 'travelFields'  // 新增
};
```

### 添加标签管理功能

**数据库设计**：
```javascript
// 创建标签表
const tagStore = db.createObjectStore('tags', { keyPath: 'id' });

// 创建关联表
const noteTagStore = db.createObjectStore('note_tags', {
    keyPath: ['noteId', 'tagId']
});
```

**标签建议**：
```javascript
async getTagSuggestions() {
    const allNotes = await getAllNotes();
    const allTags = allNotes.flatMap(note => note.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
}
```

### 添加导出为 Markdown

```javascript
async exportAsMarkdown() {
    const notes = await noteDB.getAllNotes();

    const markdown = notes.map(note => {
        const typeConfig = NOTE_TYPES[note.type];
        return `
# ${note.title}

**类型**: ${typeConfig.icon} ${typeConfig.name}
**日期**: ${note.date}
${note.tags ? `**标签**: ${note.tags.join(', ')}` : ''}

## 内容

${note.content}

---
        `.trim();
    }).join('\n\n');

    // 下载
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
}
```

---

## 🐛 调试技巧

### Chrome DevTools

**查看 IndexedDB**：
1. 打开 DevTools（F12）
2. Application 标签
3. Storage → IndexedDB → NoteAppDB
4. 查看所有数据

**查看控制台日志**：
```javascript
// 添加调试日志
console.log('✅ 笔记添加成功:', note);
console.error('❌ 错误:', error);
```

**断点调试**：
```javascript
function saveNote(event) {
    debugger;  // 断点
    // ...
}
```

### 常见错误

**1. QuotaExceededError**
```javascript
// 原因：存储空间不足
// 解决：清理旧数据或增加配额

try {
    await noteDB.addNote(note);
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        alert('存储空间不足，请删除一些笔记');
    }
}
```

**2. InvalidStateError**
```javascript
// 原因：在错误的事务状态下操作
// 解决：确保在事务激活时操作

const transaction = db.transaction([STORE_NAME], 'readwrite');
const objectStore = transaction.objectStore(STORE_NAME);
// 必须立即使用 objectStore，不能 await 后再用
```

**3. NotFoundError**
```javascript
// 原因：数据不存在
// 解决：检查 ID 是否正确

const note = await noteDB.getNoteById(id);
if (!note) {
    console.warn('笔记不存在:', id);
    return;
}
```

---

## 📊 性能指标

### 推荐性能目标

- **初始加载**: < 500ms
- **列表渲染**: < 100ms (100 条笔记)
- **搜索响应**: < 50ms
- **笔记保存**: < 100ms
- **视图切换**: < 200ms

### 性能测试

```javascript
// 测试加载性能
console.time('loadNotes');
await loadNotesList();
console.timeEnd('loadNotes');

// 测试数据库操作
console.time('addNote');
await noteDB.addNote(note);
console.timeEnd('addNote');
```

---

## 🎓 学习资源

### 推荐阅读

1. **IndexedDB**
   - [MDN: IndexedDB API](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
   - [Using IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API/Using_IndexedDB)

2. **JavaScript**
   - [Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
   - [async/await](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)

3. **CSS**
   - [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
   - [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

---

**希望这份技术文档能帮助你深入理解项目！** 🚀
